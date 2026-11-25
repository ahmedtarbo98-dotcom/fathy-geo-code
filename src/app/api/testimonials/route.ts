import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { sanitizeText } from "@/lib/security/validation";
import { publicTestimonialSubmitSchema } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Fetch published testimonials with linked course info
    const { data: testimonials, error } = await adminClient
      .from("testimonials")
      .select(
        `
        id,
        student_name_ar,
        student_name_en,
        student_title_ar,
        student_title_en,
        content_ar,
        content_en,
        rating,
        avatar_url,
        course_id,
        media_type,
        media_url,
        status,
        is_published,
        is_featured,
        order_index,
        created_at,
        course:courses (
          id,
          title_ar,
          title_en,
          slug
        )
      `
      )
      .or("status.eq.published,and(status.is.null,is_published.eq.true)")
      .order("is_featured", { ascending: false })
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback query if migration 00007 hasn't been applied yet
      const { data: fallbackData, error: fallbackErr } = await adminClient
        .from("testimonials")
        .select(
          "id, student_name_ar, student_name_en, student_title_ar, student_title_en, content_ar, content_en, rating, avatar_url, is_published, order_index, created_at"
        )
        .eq("is_published", true)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (fallbackErr) throw fallbackErr;

      const { data: courses } = await adminClient
        .from("courses")
        .select("id, title_ar, title_en, slug")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      return NextResponse.json({
        testimonials: (fallbackData || []).map((t: any) => ({
          ...t,
          status: "published",
          is_featured: false,
          course_id: null,
          course: null,
          media_type: null,
          media_url: null,
        })),
        courses: courses || [],
      });
    }

    const { data: courses } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, slug")
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    return NextResponse.json({
      testimonials: testimonials || [],
      courses: courses || [],
    });
  } catch (err: any) {
    console.error("Public testimonials GET error:", err);
    return NextResponse.json(
      { error: "Failed to load testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate limiting: 5 submissions per 15 minutes per IP
    const rateCheck = await checkRateLimit(`testimonial:${clientIp}`, 5, 15 * 60);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a few minutes before trying again." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = publicTestimonialSubmitSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || "Invalid testimonial data";
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const data = parseResult.data;

    // Optional Turnstile verification if configured
    const turnstileCheck = await verifyTurnstileToken(data.turnstileToken, clientIp);
    if (!turnstileCheck.success) {
      return NextResponse.json(
        { error: turnstileCheck.error || "Security verification failed" },
        { status: 400 }
      );
    }

    // Check if user is logged in (optional)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    const adminClient = createAdminClient();

    // Validate course_id exists if provided
    let validCourseId: string | null = null;
    if (data.course_id) {
      const { data: courseRow } = await adminClient
        .from("courses")
        .select("id")
        .eq("id", data.course_id)
        .maybeSingle();
      if (courseRow?.id) {
        validCourseId = courseRow.id;
      }
    }

    const cleanName = sanitizeText(data.name);
    const cleanTitle = sanitizeText(data.title);
    const cleanContent = sanitizeText(data.content);
    const hasMedia = Boolean(data.media_type && data.media_url?.trim());

    const { error: insertError } = await adminClient.from("testimonials").insert({
      student_name_ar: cleanName,
      student_name_en: cleanName,
      student_title_ar: cleanTitle,
      student_title_en: cleanTitle,
      content_ar: cleanContent,
      content_en: cleanContent,
      rating: data.rating,
      course_id: validCourseId,
      media_type: hasMedia ? data.media_type : null,
      media_url: hasMedia ? data.media_url!.trim() : null,
      status: "pending",
      is_published: false,
      is_featured: false,
      order_index: 999,
      submitted_by: user?.id || null,
    });

    if (insertError) {
      console.error("Testimonial submission insert error:", insertError);
      return NextResponse.json(
        { error: "Could not submit review. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: any) {
    console.error("Public testimonials POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
