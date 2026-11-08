import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // In demo / fallback mode, if no user is signed in, return safe demo token
    if (userError || !user) {
      return NextResponse.json({
        videoId: "dQw4w9WgXcQ",
        provider: "youtube",
        watermark: {
          email: "student@fathygeocode.com",
          userId: "DEMO-USER",
        },
      });
    }

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check lesson and video
    const { data: videoData, error: videoError } = await adminClient
      .from("lesson_videos")
      .select("video_id, provider")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const videoId = videoData?.video_id || "dQw4w9WgXcQ";
    const provider = videoData?.provider || "youtube";

    // Log access
    try {
      await adminClient.from("video_access_logs").insert([
        {
          user_id: user.id,
          lesson_id: lessonId,
          ip_address: request.headers.get("x-forwarded-for") || "127.0.0.1",
          user_agent: request.headers.get("user-agent") || "Browser",
        },
      ]);
    } catch {
      // Fallback ignore log errors in local development
    }

    return NextResponse.json({
      videoId,
      provider,
      watermark: {
        email: user.email,
        userId: user.id.slice(0, 8),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
