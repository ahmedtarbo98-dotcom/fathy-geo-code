import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function buildEmptyDailySeriesUtc(): { date: string; count: number }[] {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const series: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayUtc - i * 86_400_000);
    series.push({
      date: d.toISOString().slice(0, 10),
      count: 0,
    });
  }
  return series;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const now = new Date();
    const nowIso = now.toISOString();
    const sevenDaysAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 86_400_000).toISOString();

    // Run parallel server-side aggregate & targeted queries
    const [
      totalStudentsRes,
      blockedStudentsRes,
      signups7dRes,
      signups30dRowsRes,
      activeEnrollmentsRes,
      totalEnrollmentsRes,
      totalCoursesRes,
      publishedCoursesRes,
      totalLessonsRes,
      pendingRequestsCountRes,
      unreadMessagesCountRes,
      recentSignupsRes,
      pendingRequestsListRes,
      recentMessagesRes,
      allCoursesRes,
      allLessonsRes,
      allEnrollmentsRes,
      allProgressRes,
      recentVideoLogsRes,
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")
        .eq("is_blocked", true),
      adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student")
        .gte("created_at", sevenDaysAgoIso),
      adminClient
        .from("profiles")
        .select("created_at")
        .eq("role", "student")
        .gte("created_at", thirtyDaysAgoIso),
      adminClient
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
      adminClient.from("enrollments").select("*", { count: "exact", head: true }),
      adminClient.from("courses").select("*", { count: "exact", head: true }),
      adminClient
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
      adminClient.from("lessons").select("*", { count: "exact", head: true }),
      adminClient
        .from("enrollment_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      adminClient
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false),
      adminClient
        .from("profiles")
        .select("id, full_name, email, created_at, is_blocked")
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .limit(5),
      adminClient
        .from("enrollment_requests")
        .select(
          `id, status, created_at, profiles:user_id (full_name, email), courses:course_id (title_ar, title_en)`
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5),
      adminClient
        .from("contact_messages")
        .select("id, name, email, subject, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      adminClient.from("courses").select("id, title_ar, title_en, slug, status"),
      adminClient.from("lessons").select("id, course_id, title_ar, title_en"),
      adminClient.from("enrollments").select("id, user_id, course_id, status"),
      adminClient
        .from("lesson_progress")
        .select("id, user_id, course_id, lesson_id, completed, watched_seconds, completed_at, updated_at"),
      adminClient
        .from("video_access_logs")
        .select("id, user_id, lesson_id, ip_address, accessed_at")
        .order("accessed_at", { ascending: false })
        .limit(250),
    ]);

    // 1. 30-day UTC daily signup series (zero-filled)
    const dailySignups = buildEmptyDailySeriesUtc();
    const dailyCountMap = new Map<string, number>();
    for (const day of dailySignups) {
      dailyCountMap.set(day.date, 0);
    }
    for (const row of signups30dRowsRes.data || []) {
      const utcDay = new Date(row.created_at).toISOString().slice(0, 10);
      if (dailyCountMap.has(utcDay)) {
        dailyCountMap.set(utcDay, (dailyCountMap.get(utcDay) || 0) + 1);
      }
    }
    const dailySignups30d = dailySignups.map((d) => ({
      date: d.date,
      count: dailyCountMap.get(d.date) || 0,
    }));

    // 2. Completion rate = 100%-completed course enrollments / total enrollments
    const courseLessonsCountMap = new Map<string, number>();
    for (const l of allLessonsRes.data || []) {
      courseLessonsCountMap.set(l.course_id, (courseLessonsCountMap.get(l.course_id) || 0) + 1);
    }

    const userCourseCompletedCount = new Map<string, number>();
    for (const p of allProgressRes.data || []) {
      if (p.completed) {
        const key = `${p.user_id}:${p.course_id}`;
        userCourseCompletedCount.set(key, (userCourseCompletedCount.get(key) || 0) + 1);
      }
    }

    const totalEnrollments = totalEnrollmentsRes.count ?? 0;
    let completedEnrollments = 0;
    for (const e of allEnrollmentsRes.data || []) {
      const lessonTotal = courseLessonsCountMap.get(e.course_id) || 0;
      const done = userCourseCompletedCount.get(`${e.user_id}:${e.course_id}`) || 0;
      if (lessonTotal > 0 && done >= lessonTotal) {
        completedEnrollments += 1;
      }
    }

    const completionRate =
      totalEnrollments === 0
        ? 0
        : Math.round((completedEnrollments / totalEnrollments) * 1000) / 10;

    // 3. Most-watched courses & lessons from lesson_progress + video_access_logs
    const lessonMap = new Map<string, { id: string; course_id: string; title_ar: string; title_en: string }>();
    for (const l of allLessonsRes.data || []) {
      lessonMap.set(l.id, l);
    }
    const courseMap = new Map<string, { id: string; title_ar: string; title_en: string; slug: string }>();
    for (const c of allCoursesRes.data || []) {
      courseMap.set(c.id, c);
    }

    const courseStatsMap = new Map<
      string,
      { views: number; learners: Set<string>; completions: number }
    >();
    const lessonStatsMap = new Map<
      string,
      { accessViews: number; progressViews: number; completions: number; learners: Set<string> }
    >();

    for (const p of allProgressRes.data || []) {
      if ((p.watched_seconds || 0) <= 0 && !p.completed) continue;

      if (!lessonStatsMap.has(p.lesson_id)) {
        lessonStatsMap.set(p.lesson_id, {
          accessViews: 0,
          progressViews: 0,
          completions: 0,
          learners: new Set(),
        });
      }
      const ls = lessonStatsMap.get(p.lesson_id)!;
      ls.progressViews += 1;
      if (p.completed) ls.completions += 1;
      ls.learners.add(p.user_id);

      if (!courseStatsMap.has(p.course_id)) {
        courseStatsMap.set(p.course_id, { views: 0, learners: new Set(), completions: 0 });
      }
      const cs = courseStatsMap.get(p.course_id)!;
      cs.views += 1;
      if (p.completed) cs.completions += 1;
      cs.learners.add(p.user_id);
    }

    for (const log of recentVideoLogsRes.data || []) {
      const lesson = lessonMap.get(log.lesson_id);
      if (!lesson) continue;

      if (!lessonStatsMap.has(log.lesson_id)) {
        lessonStatsMap.set(log.lesson_id, {
          accessViews: 0,
          progressViews: 0,
          completions: 0,
          learners: new Set(),
        });
      }
      const ls = lessonStatsMap.get(log.lesson_id)!;
      ls.accessViews += 1;
      ls.learners.add(log.user_id);

      if (!courseStatsMap.has(lesson.course_id)) {
        courseStatsMap.set(lesson.course_id, { views: 0, learners: new Set(), completions: 0 });
      }
      const cs = courseStatsMap.get(lesson.course_id)!;
      cs.views += 1;
      cs.learners.add(log.user_id);
    }

    const mostWatchedCourses = Array.from(courseStatsMap.entries())
      .map(([courseId, stat]) => {
        const c = courseMap.get(courseId);
        return {
          id: courseId,
          title_ar: c?.title_ar || "",
          title_en: c?.title_en || "",
          slug: c?.slug || "",
          total_views: stat.views,
          unique_learners: stat.learners.size,
          completed_records: stat.completions,
        };
      })
      .filter((c) => c.total_views > 0)
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 5);

    const mostWatchedLessons = Array.from(lessonStatsMap.entries())
      .map(([lessonId, stat]) => {
        const l = lessonMap.get(lessonId);
        const c = l ? courseMap.get(l.course_id) : undefined;
        return {
          id: lessonId,
          title_ar: l?.title_ar || "",
          title_en: l?.title_en || "",
          course_title_ar: c?.title_ar || "",
          course_title_en: c?.title_en || "",
          total_views: Math.max(stat.accessViews, stat.progressViews),
          completions: stat.completions,
          unique_learners: stat.learners.size,
        };
      })
      .filter((l) => l.total_views > 0)
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 5);

    // 4. Recent activity feed (only real DB events)
    const activityItems: Array<{
      id: string;
      type: "signup" | "request" | "message" | "video_access";
      actor: string;
      detail_ar: string;
      detail_en: string;
      timestamp: string;
    }> = [];

    for (const s of recentSignupsRes.data || []) {
      activityItems.push({
        id: `signup-${s.id}`,
        type: "signup",
        actor: s.full_name || s.email || "Student",
        detail_ar: "انضم كطالب جديد إلى المنصة",
        detail_en: "Registered as a new student",
        timestamp: s.created_at,
      });
    }

    for (const r of (pendingRequestsListRes.data as any[]) || []) {
      activityItems.push({
        id: `req-${r.id}`,
        type: "request",
        actor: r.profiles?.full_name || r.profiles?.email || "Student",
        detail_ar: `طلب اشتراك في: ${r.courses?.title_ar || r.courses?.title_en || "دورة"}`,
        detail_en: `Requested enrollment: ${r.courses?.title_en || r.courses?.title_ar || "Course"}`,
        timestamp: r.created_at,
      });
    }

    for (const m of recentMessagesRes.data || []) {
      activityItems.push({
        id: `msg-${m.id}`,
        type: "message",
        actor: m.name || m.email,
        detail_ar: m.subject ? `رسالة تواصل: ${m.subject}` : "أرسل رسالة تواصل جديدة",
        detail_en: m.subject ? `Contact message: ${m.subject}` : "Sent a new contact message",
        timestamp: m.created_at,
      });
    }

    const recentActivity = activityItems
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return NextResponse.json({
      totalStudents: totalStudentsRes.count ?? 0,
      blockedStudents: blockedStudentsRes.count ?? 0,
      newSignups7d: signups7dRes.count ?? 0,
      newSignups30d: signups30dRowsRes.data?.length ?? 0,
      dailySignups30d,
      activeEnrollments: activeEnrollmentsRes.count ?? 0,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      totalCourses: totalCoursesRes.count ?? 0,
      publishedCourses: publishedCoursesRes.count ?? 0,
      totalLessons: totalLessonsRes.count ?? 0,
      pendingRequestsCount: pendingRequestsCountRes.count ?? 0,
      unreadMessagesCount: unreadMessagesCountRes.count ?? 0,
      recentSignups: recentSignupsRes.data || [],
      recentRequests: pendingRequestsListRes.data || [],
      mostWatchedCourses,
      mostWatchedLessons,
      recentActivity,
      computedAtUtc: nowIso,
    });
  } catch (err: any) {
    console.error("Admin overview API error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
