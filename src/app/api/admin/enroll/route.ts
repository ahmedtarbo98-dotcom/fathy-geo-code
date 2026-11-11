import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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

    // Verify admin
    const isAdmin =
      user.email === "ahmedtarbo98@gmail.com" ||
      user.email === process.env.ADMIN_EMAIL;

    const adminClient = createAdminClient();

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

    const body = await request.json();
    const { userId, studentEmail, courseId, requestId, action = "enroll" } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // Always prefer the real auth.users ID if studentEmail matches a registered account
    if (studentEmail) {
      const { data: usersList } = await adminClient.auth.admin.listUsers();
      const foundAuth = usersList?.users?.find(
        (u) => u.email?.toLowerCase() === studentEmail.trim().toLowerCase()
      );

      if (foundAuth) {
        targetUserId = foundAuth.id;
        // Ensure profile exists for this auth user
        await adminClient.from("profiles").upsert(
          {
            id: foundAuth.id,
            full_name: foundAuth.user_metadata?.full_name || studentEmail.split("@")[0],
            email: foundAuth.email,
            role: "student",
          },
          { onConflict: "id" }
        );
      } else if (!targetUserId) {
        const { data: prof } = await adminClient
          .from("profiles")
          .select("id")
          .ilike("email", studentEmail.trim())
          .maybeSingle();

        if (prof?.id) {
          targetUserId = prof.id;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        {
          error:
            "لم يتم العثور على حساب الطالب. يرجى التأكد من تسجيل الطالب لحساب أولاً باستخدام البريد الإلكتروني.",
        },
        { status: 400 }
      );
    }

    if (action === "unenroll") {
      const { error: delErr } = await adminClient
        .from("enrollments")
        .delete()
        .eq("user_id", targetUserId)
        .eq("course_id", courseId);

      if (delErr) throw delErr;

      return NextResponse.json({ success: true, action: "unenrolled" });
    }

    // 1. Activate enrollment using service role (bypasses RLS)
    const { data: enrollment, error: enrollErr } = await adminClient
      .from("enrollments")
      .upsert(
        {
          user_id: targetUserId,
          course_id: courseId,
          status: "active",
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id" }
      )
      .select()
      .single();

    if (enrollErr) throw enrollErr;

    // 2. If requestId provided, mark enrollment_request as approved
    if (requestId) {
      await adminClient
        .from("enrollment_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
    }

    return NextResponse.json({
      success: true,
      enrollment,
      message: "تم تفعيل الاشتراك بنجاح للطالب",
    });
  } catch (err: any) {
    console.error("Admin enroll API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process enrollment" },
      { status: 500 }
    );
  }
}
