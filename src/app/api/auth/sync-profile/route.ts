import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Secure profile sync endpoint: Only allows authenticated users to sync their own profile data
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fullName } = await request.json().catch(() => ({}));
    const cleanName = typeof fullName === "string" ? fullName.trim().slice(0, 100) : "";

    const adminClient = createAdminClient();

    // Prevent any role modification - role is controlled exclusively by database triggers/admin
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (cleanName) {
      updateData.full_name = cleanName;
    }

    await adminClient
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sync profile error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
