import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";

export type AdminAuthResult =
  | { ok: true; user: User; adminClient: ReturnType<typeof createAdminClient> }
  | { ok: false; response: NextResponse };

export async function requireAdminRequest(request: Request): Promise<AdminAuthResult> {
  const supabase = createClient();
  let {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const { data: tokenData } = await supabase.auth.getUser(token);
      user = tokenData.user;
    }
  }

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const adminClient = createAdminClient();
  const primaryAdminEmail = (process.env.ADMIN_EMAIL || "ahmedtarbo98@gmail.com").toLowerCase();
  const isOwnerEmail =
    user.email?.toLowerCase() === "ahmedtarbo98@gmail.com" ||
    user.email?.toLowerCase() === primaryAdminEmail;

  if (!isOwnerEmail) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role, is_blocked")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin" || profile?.is_blocked) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, user, adminClient };
}
