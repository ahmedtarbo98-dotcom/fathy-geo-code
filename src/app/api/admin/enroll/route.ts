import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/security/audit-logger";
import { getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { user: adminUser, adminClient } = auth;
    const clientIp = getClientIp(request);

    const body = await request.json().catch(() => ({}));
    const { userId, studentEmail, courseId, requestId, action = "enroll" } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    if (studentEmail) {
      const cleanEmail = String(studentEmail).trim().toLowerCase();
      const { data: prof } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (prof?.id) {
        targetUserId = prof.id;
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

      await logAdminAction({
        adminId: adminUser.id,
        action: "revoke_enrollment",
        targetType: "enrollment",
        targetId: `${targetUserId}:${courseId}`,
        details: { courseId, targetUserId, studentEmail },
        ipAddress: clientIp,
      });

      return NextResponse.json({ success: true, action: "unenrolled" });
    }

    // Activate enrollment
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

    if (requestId) {
      await adminClient
        .from("enrollment_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", requestId);
    }

    await logAdminAction({
      adminId: adminUser.id,
      action: "approve_enrollment",
      targetType: "enrollment",
      targetId: enrollment?.id,
      details: { courseId, targetUserId, requestId, studentEmail },
      ipAddress: clientIp,
    });

    return NextResponse.json({
      success: true,
      enrollment,
      message: "تم تفعيل الاشتراك بنجاح للطالب",
    });
  } catch (err: any) {
    console.error("Admin enroll API error:", err);
    return NextResponse.json(
      { error: "Failed to process enrollment" },
      { status: 500 }
    );
  }
}
