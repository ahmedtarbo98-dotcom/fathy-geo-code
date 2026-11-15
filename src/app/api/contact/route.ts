import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { contactMessageSchema, sanitizeText } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP rate limiting: 5 messages per 15 minutes
    const rateCheck = await checkRateLimit(`contact:${clientIp}`, 5, 15 * 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    // 2. Validate input schema
    const rawBody = await request.json().catch(() => ({}));
    const parseResult = contactMessageSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid contact form data";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { fullName, email, phone, subject, message, turnstileToken } = parseResult.data;

    // 3. Turnstile challenge verification
    const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Turnstile verification failed" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    const { error: insertError } = await adminClient.from("contact_messages").insert([
      {
        name: sanitizeText(fullName),
        email: email.trim().toLowerCase(),
        phone: phone ? sanitizeText(phone) : null,
        subject: subject ? sanitizeText(subject) : "Contact Inquiry",
        message: sanitizeText(message),
      },
    ]);

    if (insertError) {
      console.error("Contact message insertion error:", insertError);
      return NextResponse.json(
        { error: "Could not save message. Please try WhatsApp directly." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
