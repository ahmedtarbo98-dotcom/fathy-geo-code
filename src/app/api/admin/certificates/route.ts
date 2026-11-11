import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.adminClient
      .from("certificates")
      .select(`*, profiles:user_id (email, full_name)`)
      .order("issued_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ certificates: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load certificates" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const { id, revoked, revoked_reason } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Certificate id is required" }, { status: 400 });
    }

    const { error } = await auth.adminClient
      .from("certificates")
      .update({
        revoked: Boolean(revoked),
        revoked_reason: revoked ? revoked_reason || null : null,
      })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update certificate" },
      { status: 500 }
    );
  }
}
