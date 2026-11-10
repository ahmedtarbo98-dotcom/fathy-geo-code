import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabase.auth.getUser(token);
        user = tokenUser.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin
    const isAdmin =
      user.email === "ahmedtarbo98@gmail.com" ||
      user.email === process.env.ADMIN_EMAIL;

    const adminClient = createAdminClient();

    if (!isAdmin) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" || profile?.is_blocked) {
        return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { platform_stats, instructor_profile, site_identity, youtube_featured_videos } = body;

    // 1. Update platform_stats
    if (platform_stats) {
      const { error: err1 } = await adminClient.from("site_settings").upsert({
        key: "platform_stats",
        value: platform_stats,
        description: "Public platform statistics displayed on the hero stats strip",
        updated_at: new Date().toISOString(),
      });
      if (err1) throw err1;
    }

    // 2. Update instructor_profile
    if (instructor_profile) {
      const { error: err2 } = await adminClient.from("site_settings").upsert({
        key: "instructor_profile",
        value: instructor_profile,
        description: "Instructor and founder profile details for the About page",
        updated_at: new Date().toISOString(),
      });
      if (err2) throw err2;
    }

    // 3. Update site_identity
    if (site_identity) {
      const { error: err3 } = await adminClient.from("site_settings").upsert({
        key: "site_identity",
        value: site_identity,
        description: "Site brand identity and uploaded logo",
        updated_at: new Date().toISOString(),
      });
      if (err3) throw err3;
    }

    // 4. Update youtube_featured_videos
    if (youtube_featured_videos) {
      const { error: err4 } = await adminClient.from("site_settings").upsert({
        key: "youtube_featured_videos",
        value: youtube_featured_videos,
        description: "Featured YouTube videos displayed on the homepage community section",
        updated_at: new Date().toISOString(),
      });
      if (err4) throw err4;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Save settings API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
