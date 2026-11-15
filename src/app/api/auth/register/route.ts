import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { registerSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP rate limiting: 5 registration attempts per 15 minutes
    const rateCheck = await checkRateLimit(`register:${clientIp}`, 5, 15 * 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please wait 15 minutes before trying again." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    // 2. Body parsing and Zod schema validation
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = registerSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0]?.message || "Invalid registration data";
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { email, password, fullName, locale, turnstileToken } = parseResult.data;
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Cloudflare Turnstile verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Turnstile verification failed" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 4. Create user via Supabase Admin API
    const { data: createdData, error: createError } =
      await adminClient.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          language: locale,
        },
      });

    let userId = createdData?.user?.id;

    if (createError) {
      const errMsg = createError.message.toLowerCase();
      if (
        errMsg.includes("already registered") ||
        errMsg.includes("already exists") ||
        errMsg.includes("duplicate")
      ) {
        // Return generic message to prevent account enumeration
        return NextResponse.json(
          {
            error:
              locale === "ar"
                ? "تعذر إتمام التسجيل بهذا البريد. إذا كان لديك حساب بالفعل، يرجى تسجيل الدخول مباشرة."
                : "Unable to register with this email. If you already have an account, please sign in.",
            code: "EMAIL_EXISTS",
          },
          { status: 400 }
        );
      }

      console.error("Supabase user creation error:", createError);
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? "تعذر إنشاء الحساب حالياً. يرجى مراجعة البيانات والمحاولة مجدداً."
              : "Unable to create account. Please check your details and try again.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User creation failed unexpectedly." },
        { status: 500 }
      );
    }

    // 5. Ensure profile is provisioned with default 'student' role (never elevated without admin trigger)
    const adminEmail = (process.env.ADMIN_EMAIL || "ahmedtarbo98@gmail.com").toLowerCase();
    const role = normalizedEmail === adminEmail ? "admin" : "student";

    await adminClient.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email: normalizedEmail,
        role,
        language: locale,
      },
      { onConflict: "id" }
    );

    // 6. Link pre-existing enrollments or requests if any matched this email
    const { data: duplicateProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .neq("id", userId);

    if (duplicateProfiles && duplicateProfiles.length > 0) {
      const oldIds = duplicateProfiles.map((p) => p.id);
      await adminClient
        .from("enrollments")
        .update({ user_id: userId })
        .in("user_id", oldIds);
      await adminClient
        .from("enrollment_requests")
        .update({ user_id: userId })
        .in("user_id", oldIds);
    }

    try {
      revalidateTag("public-stats");
      revalidatePath("/ar");
      revalidatePath("/en");
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        full_name: fullName,
      },
    });
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
