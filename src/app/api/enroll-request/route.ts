import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { enrollmentRequestSchema, sanitizeText } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP rate limiting (generous for legitimate enrollments)
    const rateCheck = await checkRateLimit(`enroll-req:${clientIp}`, 15, 10 * 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "تم إرسال عدة طلبات مؤخراً. يرجى الانتظار بضع دقائق." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    // 2. Validate input schema
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = enrollmentRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "بيانات الطلب غير صالحة";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { courseId, fullName, email, phone, notes } = parseResult.data;

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeText(fullName) || cleanEmail.split("@")[0];
    const cleanPhone = phone ? sanitizeText(phone) : null;
    const cleanNotes = notes ? sanitizeText(notes) : null;

    const adminClient = createAdminClient();

    // 3. Find course by ID or Slug
    let targetCourse: any = null;
    const { data: byId } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, price, currency, is_free, status")
      .eq("id", courseId)
      .maybeSingle();

    if (byId) {
      targetCourse = byId;
    } else {
      const { data: bySlug } = await adminClient
        .from("courses")
        .select("id, title_ar, title_en, price, currency, is_free, status")
        .eq("slug", courseId)
        .maybeSingle();
      if (bySlug) targetCourse = bySlug;
    }

    if (!targetCourse) {
      return NextResponse.json({ error: "لم يتم العثور على الدورة المطلوبة" }, { status: 404 });
    }

    // 4. Resolve authenticated user or create valid student account in auth.users
    const supabase = createClient();
    let currentUser: any = null;

    // Check cookie session
    const { data: sessionUser } = await supabase.auth.getUser();
    if (sessionUser?.user) {
      currentUser = sessionUser.user;
    }

    // Check Authorization header fallback
    if (!currentUser) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabase.auth.getUser(token);
        if (tokenUser?.user) currentUser = tokenUser.user;
      }
    }

    let targetUserId: string | null = currentUser?.id || null;

    if (!targetUserId) {
      // Find existing profile by email
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        targetUserId = existingProfile.id;
      } else {
        // Create confirmed user in auth.users to satisfy foreign key constraint on public.profiles
        const { data: newAuthData, error: authErr } =
          await adminClient.auth.admin.createUser({
            email: cleanEmail,
            email_confirm: true,
            user_metadata: {
              full_name: cleanName,
              language: "ar",
            },
          });

        if (newAuthData?.user?.id) {
          targetUserId = newAuthData.user.id;
        } else if (authErr) {
          // If already exists in auth.users but not in profiles
          const { data: usersList } = await adminClient.auth.admin.listUsers();
          const matched = (usersList?.users || []).find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (matched) {
            targetUserId = matched.id;
          }
        }

        if (targetUserId) {
          await adminClient.from("profiles").upsert(
            {
              id: targetUserId,
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              role: "student",
              language: "ar",
            },
            { onConflict: "id" }
          );
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "تعذر ربط حساب الطالب، يرجى التأكد من البريد الإلكتروني." },
        { status: 500 }
      );
    }

    // 5. Check if user is already enrolled
    const { data: existingEnrollment } = await adminClient
      .from("enrollments")
      .select("id, status")
      .eq("user_id", targetUserId)
      .eq("course_id", targetCourse.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingEnrollment) {
      return NextResponse.json({
        success: true,
        alreadyEnrolled: true,
        message: "أنت مشترك بالفعل في هذه الدورة ويمكنك مشاهدة الدروس مباشرة.",
      });
    }

    // 6. Check for existing pending request - update if exists instead of erroring
    const { data: existingPending } = await adminClient
      .from("enrollment_requests")
      .select("id")
      .eq("course_id", targetCourse.id)
      .eq("user_id", targetUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      // Update phone / notes on existing pending request
      await adminClient
        .from("enrollment_requests")
        .update({
          phone: cleanPhone,
          notes: cleanNotes,
        })
        .eq("id", existingPending.id);

      return NextResponse.json({
        success: true,
        requestId: existingPending.id,
        courseTitle: targetCourse.title_ar,
        message: "طلبك مسجل بالفعل وقيد المراجعة من الإدارة.",
      });
    }

    // 7. Insert new enrollment request
    const { data: newRequest, error: reqErr } = await adminClient
      .from("enrollment_requests")
      .insert({
        user_id: targetUserId,
        course_id: targetCourse.id,
        status: "pending",
        phone: cleanPhone,
        notes: cleanNotes,
      })
      .select()
      .single();

    if (reqErr) {
      console.error("Enrollment request insert error:", reqErr);
      return NextResponse.json(
        { error: "فشل حفظ طلب التفعيل في قاعدة البيانات." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: newRequest.id,
      courseTitle: targetCourse.title_ar,
    });
  } catch (err: any) {
    console.error("Enroll request API error:", err);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع في الخادم." },
      { status: 500 }
    );
  }
}
