import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify admin
    const isAdmin =
      user.email === "ahmedtarbo98@gmail.com" ||
      user.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" || profile?.is_blocked) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    // 1. Fetch all courses
    const { data: coursesData } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en");

    // 2. Fetch all profiles from public.profiles
    const { data: profilesData } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Fetch all auth users from Supabase Auth
    const { data: authUsersData } = await adminClient.auth.admin.listUsers();
    const authUsers = authUsersData?.users || [];

    // Map existing profiles by ID and by Email
    const profilesById = new Map<string, any>();
    const profilesByEmail = new Map<string, any>();
    (profilesData || []).forEach((p) => {
      profilesById.set(p.id, p);
      if (p.email) profilesByEmail.set(p.email.toLowerCase(), p);
    });

    // 4. Auto-sync any auth.user that doesn't have a profile
    for (const au of authUsers) {
      if (!profilesById.has(au.id) && !profilesByEmail.has(au.email?.toLowerCase() || "")) {
        const newProf = {
          id: au.id,
          full_name: au.user_metadata?.full_name || au.email?.split("@")[0] || "طالب جديد",
          email: au.email || "",
          phone: au.phone || null,
          role: "student",
          is_blocked: false,
          created_at: au.created_at || new Date().toISOString(),
        };

        await adminClient.from("profiles").upsert(newProf, { onConflict: "id" });
        profilesById.set(au.id, newProf);
      }
    }

    // Re-fetch all profiles to have up-to-date list
    const { data: finalProfiles } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // 5. Fetch all enrollments
    const { data: enrollmentsData } = await adminClient
      .from("enrollments")
      .select("id, user_id, course_id, status, enrolled_at");

    // 6. Fetch all lesson progress
    const { data: progressData } = await adminClient
      .from("lesson_progress")
      .select("user_id, completed");

    // Map students with enrollments and progress
    const mapped = (finalProfiles || []).map((prof) => {
      const userEnrollments = (enrollmentsData || [])
        .filter((e) => e.user_id === prof.id)
        .map((e) => {
          const matched = (coursesData || []).find((c) => c.id === e.course_id);
          return {
            id: e.id,
            course_id: e.course_id,
            status: e.status,
            enrolled_at: e.enrolled_at,
            course_title: matched ? matched.title_ar : "GIS Course",
            course_title_en: matched ? matched.title_en : "GIS Course",
          };
        });

      const userCompleted = (progressData || []).filter(
        (p) => p.user_id === prof.id && p.completed
      ).length;

      const progressPercent =
        userEnrollments.length > 0
          ? Math.min(100, Math.round((userCompleted / (userEnrollments.length * 10)) * 100))
          : 0;

      return {
        id: prof.id,
        full_name: prof.full_name || "Student",
        email: prof.email || "No email",
        phone: prof.phone,
        role: prof.role || "student",
        is_blocked: prof.is_blocked || false,
        created_at: prof.created_at,
        enrollments: userEnrollments,
        progressPercent,
      };
    });

    return NextResponse.json({
      students: mapped,
      courses: coursesData || [],
    });
  } catch (err: any) {
    console.error("Admin students GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load students" },
      { status: 500 }
    );
  }
}
