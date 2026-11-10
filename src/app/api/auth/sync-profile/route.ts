import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, fullName, userId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName || cleanEmail.split("@")[0]).trim();

    const adminClient = createAdminClient();

    // Check if auth user exists
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const matched = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );
      if (matched) targetUserId = matched.id;
    }

    if (targetUserId) {
      await adminClient.from("profiles").upsert(
        {
          id: targetUserId,
          full_name: cleanName,
          email: cleanEmail,
          role: "student",
          language: "ar",
        },
        { onConflict: "id" }
      );
    } else {
      // Check if profile exists by email
      const { data: prof } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (!prof) {
        await adminClient.from("profiles").insert({
          id: crypto.randomUUID(),
          full_name: cleanName,
          email: cleanEmail,
          role: "student",
          language: "ar",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Sync profile error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
