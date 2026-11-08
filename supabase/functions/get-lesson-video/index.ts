// ==============================================================================
// Supabase Edge Function: get-lesson-video
// Secure endpoint to verify student enrollment and return protected video ID
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // 1. Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized. Please log in." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { lessonId } = await req.json();

    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: "Missing lessonId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Service Role client for administrative and protected table checks
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Fetch lesson and course info
    const { data: lesson, error: lessonError } = await adminClient
      .from("lessons")
      .select("id, course_id, is_free_preview, courses(id, is_free, status)")
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Check if user is admin
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_blocked")
      .eq("id", user.id)
      .single();

    if (profile?.is_blocked) {
      return new Response(
        JSON.stringify({ error: "Account suspended. Contact administrator." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isAdmin = profile?.role === "admin";
    const isFreeCourse = (lesson as any).courses?.is_free;
    const isPreview = lesson.is_free_preview;

    let hasAccess = isAdmin || isFreeCourse || isPreview;

    if (!hasAccess) {
      // Check active enrollment
      const { data: enrollment } = await adminClient
        .from("enrollments")
        .select("status, expires_at")
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

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Active enrollment required to view this video." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Retrieve video ID from protected table
    const { data: videoData, error: videoError } = await adminClient
      .from("lesson_videos")
      .select("video_id, provider")
      .eq("lesson_id", lessonId)
      .single();

    if (videoError || !videoData) {
      return new Response(
        JSON.stringify({ error: "Video source not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Log access for security audit
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    await adminClient.from("video_access_logs").insert([
      {
        user_id: user.id,
        lesson_id: lessonId,
        ip_address: ip,
        user_agent: userAgent,
      },
    ]);

    return new Response(
      JSON.stringify({
        videoId: videoData.video_id,
        provider: videoData.provider,
        watermark: {
          email: user.email,
          userId: user.id.slice(0, 8),
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
