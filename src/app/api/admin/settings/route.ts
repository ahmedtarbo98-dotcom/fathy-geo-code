import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdminRequest } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/security/audit-logger";
import { getClientIp } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { user: adminUser, adminClient } = auth;
    const clientIp = getClientIp(request);

    const body = await request.json().catch(() => ({}));
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

    await logAdminAction({
      adminId: adminUser.id,
      action: "update_site_settings",
      targetType: "site_settings",
      details: {
        keysUpdated: Object.keys(body).filter((k) => !!body[k]),
      },
      ipAddress: clientIp,
    });

    try {
      revalidateTag("site-branding");
      revalidateTag("public-stats");
      revalidatePath("/ar");
      revalidatePath("/en");
      revalidatePath("/ar", "layout");
      revalidatePath("/en", "layout");
    } catch (revalErr) {
      console.warn("Revalidate branding warning:", revalErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Save settings API error:", err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
