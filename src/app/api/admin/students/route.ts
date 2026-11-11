import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function sanitizeCsvCell(value: unknown): string {
  const raw = String(value ?? "").replace(/"/g, '""');
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe}"`;
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const url = new URL(request.url);
    const search = (url.searchParams.get("search") || "").trim().toLowerCase();
    const filter = (url.searchParams.get("filter") || "all").toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "15", 10) || 15));
    const exportFormat = url.searchParams.get("export");

    const { data: authUsersRes, error: authListErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authListErr) throw authListErr;

    const authUsers = authUsersRes?.users || [];
    const authUserMap = new Map<
      string,
      { email: string; last_sign_in_at: string | null; created_at: string }
    >();
    for (const u of authUsers) {
      authUserMap.set(u.id, {
        email: u.email || "",
        last_sign_in_at: u.last_sign_in_at || null,
        created_at: u.created_at,
      });
    }

    const [
      { data: existingProfiles, error: profErr },
      { data: coursesData },
      { data: lessonsData },
      { data: enrollmentsData },
      { data: progressData },
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      adminClient
        .from("courses")
        .select("id, title_ar, title_en, slug, status")
        .order("created_at", { ascending: false }),
      adminClient.from("lessons").select("id, course_id"),
      adminClient
        .from("enrollments")
        .select("id, user_id, course_id, status, enrolled_at, expires_at"),
      adminClient
        .from("lesson_progress")
        .select("user_id, course_id, lesson_id, completed"),
    ]);

    if (profErr) throw profErr;

    // Sync any auth users missing from profiles
    const profileIds = new Set((existingProfiles || []).map((p: any) => p.id));
    const missingAuthUsers = authUsers.filter((u) => !profileIds.has(u.id));
    if (missingAuthUsers.length > 0) {
      const inserts = missingAuthUsers.map((u) => ({
        id: u.id,
        full_name:
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "Student",
        email: u.email || null,
        avatar_url: u.user_metadata?.avatar_url || null,
        role:
          u.email?.toLowerCase() === "ahmedtarbo98@gmail.com" ? "admin" : "student",
        is_blocked: false,
      }));
      await adminClient.from("profiles").upsert(inserts, { onConflict: "id" });
    }

    const { data: finalProfiles } =
      missingAuthUsers.length > 0
        ? await adminClient
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
        : { data: existingProfiles };

    const courseMap = new Map<string, any>();
    for (const c of coursesData || []) {
      courseMap.set(c.id, c);
    }

    const lessonCountByCourse = new Map<string, number>();
    for (const l of lessonsData || []) {
      lessonCountByCourse.set(l.course_id, (lessonCountByCourse.get(l.course_id) || 0) + 1);
    }

    const completedCountMap = new Map<string, number>();
    for (const p of progressData || []) {
      if (p.completed) {
        const key = `${p.user_id}:${p.course_id}`;
        completedCountMap.set(key, (completedCountMap.get(key) || 0) + 1);
      }
    }

    const nowMs = Date.now();
    const enrichedStudents = (finalProfiles || []).map((profile: any) => {
      const authMeta = authUserMap.get(profile.id);
      const userEnrollments = (enrollmentsData || []).filter(
        (e: any) => e.user_id === profile.id
      );

      let totalLessonsSum = 0;
      let totalCompletedSum = 0;
      let activeEnrollmentsCount = 0;

      const courseDetails = userEnrollments.map((enr: any) => {
        const course = courseMap.get(enr.course_id);
        const totalLessons = lessonCountByCourse.get(enr.course_id) || 0;
        const completedLessons = Math.min(
          totalLessons,
          completedCountMap.get(`${profile.id}:${enr.course_id}`) || 0
        );
        const progressPct =
          totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        const isNotExpired =
          !enr.expires_at || new Date(enr.expires_at).getTime() > nowMs;
        if (enr.status === "active" && isNotExpired) {
          activeEnrollmentsCount += 1;
        }

        totalLessonsSum += totalLessons;
        totalCompletedSum += completedLessons;

        return {
          enrollment_id: enr.id,
          course_id: enr.course_id,
          title_ar: course?.title_ar || "",
          title_en: course?.title_en || "",
          status: enr.status,
          enrolled_at: enr.enrolled_at,
          expires_at: enr.expires_at,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_pct: progressPct,
        };
      });

      const overallProgress =
        totalLessonsSum === 0
          ? 0
          : Math.round((totalCompletedSum / totalLessonsSum) * 100);

      return {
        id: profile.id,
        full_name: profile.full_name,
        email: authMeta?.email || profile.email || "",
        phone: profile.phone || null,
        avatar_url: profile.avatar_url || null,
        role: profile.role,
        is_blocked: Boolean(profile.is_blocked),
        created_at: profile.created_at || authMeta?.created_at,
        last_sign_in_at: authMeta?.last_sign_in_at || null,
        enrolled_courses_count: activeEnrollmentsCount,
        total_enrollments_count: userEnrollments.length,
        overall_progress: overallProgress,
        course_progress: courseDetails,
      };
    });

    // Exclude admin accounts from student roster counts unless filtering all
    const studentRoster = enrichedStudents.filter((s: any) => s.role !== "admin");

    const counts = {
      all: studentRoster.length,
      blocked: studentRoster.filter((s: any) => s.is_blocked).length,
      enrolled: studentRoster.filter((s: any) => s.enrolled_courses_count > 0).length,
    };

    const filtered = studentRoster.filter((s: any) => {
      if (filter === "blocked" && !s.is_blocked) return false;
      if (filter === "enrolled" && s.enrolled_courses_count <= 0) return false;

      if (search) {
        const hay = `${s.full_name || ""} ${s.email || ""} ${s.phone || ""}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    if (exportFormat === "csv") {
      const header = [
        "Name",
        "Email",
        "Phone",
        "Signup Date (UTC)",
        "Last Sign-In (UTC)",
        "Enrolled Courses",
        "Overall Progress (%)",
        "Status",
      ];
      const rows = filtered.map((s: any) => [
        s.full_name || "",
        s.email || "",
        s.phone || "",
        s.created_at || "",
        s.last_sign_in_at || "",
        s.enrolled_courses_count,
        `${s.overall_progress}%`,
        s.is_blocked ? "Blocked" : "Active",
      ]);

      const csvBody =
        "\uFEFF" +
        [header, ...rows].map((r) => r.map(sanitizeCsvCell).join(",")).join("\n");

      return new NextResponse(csvBody, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="fathy-geo-code-students-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * limit;
    const paginatedStudents = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      students: paginatedStudents,
      total,
      page: safePage,
      limit,
      totalPages,
      counts,
      courses: coursesData || [],
    });
  } catch (err: any) {
    console.error("Admin students GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load students" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const body = await request.json();
    const { action, studentId, isBlocked, courseId } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, role, email")
      .eq("id", studentId)
      .maybeSingle();

    if (
      targetProfile?.role === "admin" ||
      targetProfile?.email?.toLowerCase() === "ahmedtarbo98@gmail.com"
    ) {
      return NextResponse.json(
        { error: "Cannot modify admin accounts from student actions" },
        { status: 400 }
      );
    }

    if (action === "toggle_block") {
      const nextBlocked = Boolean(isBlocked);
      const { error: updErr } = await adminClient
        .from("profiles")
        .update({ is_blocked: nextBlocked })
        .eq("id", studentId);

      if (updErr) throw updErr;

      // Also sync ban on Supabase Auth so blocked users cannot mint new sessions
      await adminClient.auth.admin.updateUserById(studentId, {
        ban_duration: nextBlocked ? "876000h" : "none",
      });

      return NextResponse.json({ success: true, is_blocked: nextBlocked });
    }

    if (action === "reset_progress") {
      let query = adminClient
        .from("lesson_progress")
        .delete()
        .eq("user_id", studentId);
      if (courseId) {
        query = query.eq("course_id", courseId);
      }
      const { error: delErr } = await query;
      if (delErr) throw delErr;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin students PATCH error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const url = new URL(request.url);
    let studentId = url.searchParams.get("studentId") || "";
    if (!studentId) {
      try {
        const body = await request.json();
        studentId = body?.studentId || "";
      } catch {
        // Ignore empty body
      }
    }

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    const { data: targetProfile } = await adminClient
      .from("profiles")
      .select("id, role, email")
      .eq("id", studentId)
      .maybeSingle();

    if (
      targetProfile?.role === "admin" ||
      targetProfile?.email?.toLowerCase() === "ahmedtarbo98@gmail.com"
    ) {
      return NextResponse.json(
        { error: "Admin accounts cannot be deleted" },
        { status: 403 }
      );
    }

    const { error: authDelErr } = await adminClient.auth.admin.deleteUser(studentId);
    if (authDelErr) {
      // Fallback: if user wasn't in auth.users, delete profile row directly
      await adminClient.from("profiles").delete().eq("id", studentId);
    }

    try {
      revalidateTag("public-stats");
      revalidatePath("/ar");
      revalidatePath("/en");
    } catch (e) {
      console.warn("Revalidate public-stats warning:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin students DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}
