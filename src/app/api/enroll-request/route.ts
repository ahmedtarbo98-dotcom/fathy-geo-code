import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { enrollmentRequestSchema, sanitizeText } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP rate limiting: 5 enrollment requests per 10 minutes
    const rateCheck = await checkRateLimit(`enroll-req:${clientIp}`, 5, 10 * 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes before submitting again." },
        { status: 429, headers: { "Retry-After": "600" } }
      );
    }

    // 2. Validate input schema
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = enrollmentRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid submission data";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { courseId, fullName, email, phone, notes, turnstileToken } = parseResult.data;

    // 3. Cloudflare Turnstile verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Turnstile verification failed" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeText(fullName);
    const cleanPhone = phone ? sanitizeText(phone) : null;
    const cleanNotes = notes ? sanitizeText(notes) : null;

    const adminClient = createAdminClient();

    // 4. Verify course exists and is published
    const { data: course, error: cErr } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, price, currency, is_free, status")
      .eq("id", courseId)
      .maybeSingle();

    if (cErr || !course || course.status !== "published") {
      return NextResponse.json({ error: "Course not found or inactive" }, { status: 404 });
    }

    // 5. Check if user is already logged in
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let targetUserId = currentUser?.id;

    if (!targetUserId) {
      // Find existing profile by email or create a new student record
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        targetUserId = existingProfile.id;
      } else {
        const newId = crypto.randomUUID();
        const { error: insErr } = await adminClient.from("profiles").insert({
          id: newId,
          full_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: "student",
          language: "ar",
        });

        if (!insErr) {
          targetUserId = newId;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Could not associate student account." },
        { status: 500 }
      );
    }

    // 6. Check for duplicate pending request
    const { data: existingPending } = await adminClient
      .from("enrollment_requests")
      .select("id")
      .eq("course_id", course.id)
      .eq("user_id", targetUserId)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        {
          error: "طلب الانضمام لهذه الدورة قيد المراجعة بالفعل من قبل الإدارة.",
          code: "DUPLICATE_PENDING",
        },
        { status: 409 }
      );
    }

    // 7. Insert enrollment request
    const { data: newRequest, error: reqErr } = await adminClient
      .from("enrollment_requests")
      .insert({
        user_id: targetUserId,
        course_id: course.id,
        status: "pending",
        phone: cleanPhone,
        notes: cleanNotes,
      })
      .select()
      .single();

    if (reqErr) {
      console.error("Enrollment request insert error:", reqErr);
      return NextResponse.json(
        { error: "Failed to submit request. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: newRequest.id,
      courseTitle: course.title_ar,
    });
  } catch (err: any) {
    console.error("Enroll request API error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
