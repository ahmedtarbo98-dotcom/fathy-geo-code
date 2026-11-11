import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const [{ data: lessons }, { data: courses }, { data: progress }, { data: logs }, { data: profiles }] =
      await Promise.all([
        adminClient.from("lessons").select("id, course_id, title_ar, title_en"),
        adminClient.from("courses").select("id, title_ar, title_en"),
        adminClient.from("lesson_progress").select("user_id, lesson_id, completed, watched_seconds"),
        adminClient
          .from("video_access_logs")
          .select("id, user_id, lesson_id, ip_address, user_agent, accessed_at")
          .order("accessed_at", { ascending: false })
          .limit(50),
        adminClient.from("profiles").select("id, full_name, email"),
      ]);

    const courseMap = new Map((courses || []).map((c: any) => [c.id, c]));
    const lessonMap = new Map((lessons || []).map((l: any) => [l.id, l]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const lessonStats = new Map<
      string,
      { views: number; progressRecords: number; completions: number }
    >();

    for (const p of progress || []) {
      if ((p.watched_seconds || 0) <= 0 && !p.completed) continue;
      if (!lessonStats.has(p.lesson_id)) {
        lessonStats.set(p.lesson_id, { views: 0, progressRecords: 0, completions: 0 });
      }
      const stat = lessonStats.get(p.lesson_id)!;
      stat.progressRecords += 1;
      if (p.completed) stat.completions += 1;
    }

    for (const log of logs || []) {
      if (!lessonStats.has(log.lesson_id)) {
        lessonStats.set(log.lesson_id, { views: 0, progressRecords: 0, completions: 0 });
      }
      lessonStats.get(log.lesson_id)!.views += 1;
    }

    const topLessons = Array.from(lessonStats.entries())
      .map(([lessonId, stat]) => {
        const l: any = lessonMap.get(lessonId);
        const c: any = l ? courseMap.get(l.course_id) : null;
        const totalViews = Math.max(stat.views, stat.progressRecords);
        const denominator = Math.max(stat.progressRecords, 1);
        const completionPct =
          stat.progressRecords === 0
            ? 0
            : Math.round((stat.completions / denominator) * 100);

        return {
          id: lessonId,
          title_ar: l?.title_ar || "",
          title_en: l?.title_en || "",
          course_title_ar: c?.title_ar || "",
          course_title_en: c?.title_en || "",
          views: totalViews,
          completionRate: `${completionPct}%`,
        };
      })
      .filter((item) => item.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    const securityLogs = (logs || []).map((log: any) => {
      const prof: any = profileMap.get(log.user_id);
      const l: any = lessonMap.get(log.lesson_id);
      return {
        id: log.id,
        user: prof?.email || prof?.full_name || log.user_id,
        lessonTitle: l?.title_ar || l?.title_en || log.lesson_id,
        ip: log.ip_address || "Unknown",
        accessedAt: log.accessed_at,
        status: "Authorized",
      };
    });

    return NextResponse.json({ topLessons, securityLogs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load analytics" },
      { status: 500 }
    );
  }
}
