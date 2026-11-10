import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { lessonId } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Query real protected video ID for this lesson
    const { data: videoData } = await adminClient
      .from("lesson_videos")
      .select("video_id, provider")
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const videoId = videoData?.video_id || "dQw4w9WgXcQ";
    const provider = videoData?.provider || "youtube";

    // Watermark display info
    const watermark = user
      ? {
          email: user.email,
          userId: user.id.slice(0, 8),
        }
      : {
          email: "FATHY GEO CODE • زائر المنصة",
          userId: "GUEST",
        };

    // Log access if user is logged in
    if (user) {
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
        // Fallback ignore log errors
      }
    }

    return NextResponse.json({
      videoId,
      provider,
      watermark,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
