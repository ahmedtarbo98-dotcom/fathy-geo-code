import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");
    const details = searchParams.get("details") === "1";

    const supabase = createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabase.auth.getUser(token);
        user = tokenUser.user;
      }
    }

    if (!user) {
      return NextResponse.json({ isEnrolled: false, pendingRequest: false, enrolledCourseIds: [] });
    }

    const adminClient = createAdminClient();

    // Check if user is admin
    let userIsAdmin =
      user.email === "ahmedtarbo98@gmail.com" ||
      user.email === process.env.ADMIN_EMAIL;

    if (!userIsAdmin) {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (prof?.role === "admin") {
        userIsAdmin = true;
      }
    }

    if (userIsAdmin && courseId) {
      return NextResponse.json({ isEnrolled: true, isAdmin: true, pendingRequest: false });
    }

    // Collect all user IDs linked to this user (user.id + any profile matching email)
    const userIds = [user.id];
    if (user.email) {
      const { data: emailProfiles } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", user.email);
      (emailProfiles || []).forEach((p) => {
        if (!userIds.includes(p.id)) userIds.push(p.id);
      });
    }

    // Fetch active enrollments
    const { data: enrollments } = await adminClient
      .from("enrollments")
      .select("id, course_id, status")
      .in("user_id", userIds)
      .eq("status", "active");

    const enrolledCourseIds = (enrollments || []).map((e) => e.course_id);

    if (courseId) {
      const isEnrolled = enrolledCourseIds.includes(courseId) || userIsAdmin;

      let pendingRequest = false;
      if (!isEnrolled) {
        const { data: reqs } = await adminClient
          .from("enrollment_requests")
          .select("id, status")
          .eq("course_id", courseId)
          .eq("status", "pending")
          .or(`user_id.in.(${userIds.join(",")}),email.ilike.${user.email || "none"}`)
          .limit(1);

        if (reqs && reqs.length > 0) {
          pendingRequest = true;
        }
      }

      return NextResponse.json({
        isEnrolled,
        pendingRequest,
        isAdmin: userIsAdmin,
      });
    }

    if (details) {
      const { data: detailedEnrollments } = await adminClient
        .from("enrollments")
        .select(`
          id,
          status,
          enrolled_at,
          course_id,
          courses (
            id,
            slug,
            title_ar,
            title_en,
            category,
            thumbnail_url,
            course_sections (
              id,
              title_ar,
              title_en,
              order_index,
              lessons (
                id,
                title_ar,
                title_en,
                duration_seconds,
                order_index
              )
            )
          )
        `)
        .in("user_id", userIds)
        .eq("status", "active");

      const { data: progressData } = await adminClient
        .from("lesson_progress")
        .select("lesson_id, completed")
        .in("user_id", userIds)
        .eq("completed", true);

      return NextResponse.json({
        enrolledCourseIds,
        detailedEnrollments: detailedEnrollments || [],
        completedLessonIds: (progressData || []).map((p) => p.lesson_id),
        isAdmin: userIsAdmin,
      });
    }

    return NextResponse.json({
      enrolledCourseIds,
      isAdmin: userIsAdmin,
    });
  } catch (err: any) {
    console.error("check-enrollment error:", err);
    return NextResponse.json({
      isEnrolled: false,
      pendingRequest: false,
      enrolledCourseIds: [],
    });
  }
}
