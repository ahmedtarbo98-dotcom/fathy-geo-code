import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { videoTokenSchema } from "@/lib/security/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. IP-level rate limiting (max 40 requests/min)
    const ipRate = await checkRateLimit(`video:${clientIp}`, 40, 60);
    if (!ipRate.success) {
      return NextResponse.json(
        { error: "Too many video requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // 2. Parse and validate input
    const body = await request.json().catch(() => ({}));
    const parseResult = videoTokenSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { lessonId } = parseResult.data;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 3. User-level rate limiting if logged in
    if (user?.id) {
      const userRate = await checkRateLimit(`video-user:${user.id}`, 30, 60);
      if (!userRate.success) {
        return NextResponse.json(
          { error: "Too many video requests. Please slow down." },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
    }

    const adminClient = createAdminClient();

    // 4. Fetch lesson and parent course status
    const { data: lesson, error: lessonErr } = await adminClient
      .from("lessons")
      .select("id, course_id, is_free_preview, courses(id, is_free, status)")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonErr || !lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseData = (lesson as any).courses;
    const isFreeCourse = Boolean(courseData?.is_free);
    const isFreePreview = Boolean(lesson.is_free_preview);

    // 5. Authorize access
    let hasAccess = false;
    let isAdmin = false;

    if (user) {
      // Check if user is blocked or admin
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.is_blocked) {
        return NextResponse.json(
          { error: "Your account is suspended. Please contact platform support." },
          { status: 403 }
        );
      }

      const primaryAdminEmail = (process.env.ADMIN_EMAIL || "ahmedtarbo98@gmail.com").toLowerCase();
      isAdmin =
        profile?.role === "admin" ||
        user.email?.toLowerCase() === primaryAdminEmail;

      if (isAdmin || isFreeCourse || isFreePreview) {
        hasAccess = true;
      } else {
        // Check active enrollment
        const { data: enrollment } = await adminClient
          .from("enrollments")
          .select("id, status, expires_at")
          .eq("user_id", user.id)
          .eq("course_id", lesson.course_id)
          .eq("status", "active")
          .maybeSingle();

        if (enrollment) {
          if (!enrollment.expires_at || new Date(enrollment.expires_at) > new Date()) {
            hasAccess = true;
          }
        }
      }
    } else {
      // Guest user: allowed ONLY if preview or free course
      hasAccess = isFreeCourse || isFreePreview;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied. Enrollment in this course is required to watch this lesson." },
        { status: 403 }
      );
    }

    // 6. Query protected video ID
    const { data: videoData } = await adminClient
      .from("lesson_videos")
      .select("video_id, provider")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const videoId = videoData?.video_id || "dQw4w9WgXcQ";
    const provider = videoData?.provider || "youtube";

    // Watermark
    const watermark = user
      ? {
          email: user.email,
          userId: user.id.slice(0, 8),
        }
      : {
          email: "FATHY GEO CODE • زائر المنصة",
          userId: "GUEST",
        };

    // Log access
    if (user) {
      try {
        await adminClient.from("video_access_logs").insert([
          {
            user_id: user.id,
            lesson_id: lessonId,
            ip_address: clientIp,
            user_agent: request.headers.get("user-agent") || "Browser",
          },
        ]);
      } catch {
        // Ignore logging failures
      }
    }

    return NextResponse.json({
      videoId,
      provider,
      watermark,
    });
  } catch (err: any) {
    console.error("Video token error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred." },
      { status: 500 }
    );
  }
}
