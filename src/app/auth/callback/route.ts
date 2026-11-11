import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ar/dashboard";
  const oauthError = searchParams.get("error_description") || searchParams.get("error");
  const locale = next.startsWith("/en") ? "en" : "ar";

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.email) {
          const adminClient = createAdminClient();
          const normalizedEmail = user.email.trim().toLowerCase();
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            normalizedEmail.split("@")[0] ||
            "Student";
          const avatarUrl =
            user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
          const adminEmail = (
            process.env.ADMIN_EMAIL || "ahmedtarbo98@gmail.com"
          ).toLowerCase();

          const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

          const role =
            existingProfile?.role === "admin" || normalizedEmail === adminEmail
              ? "admin"
              : "student";

          await adminClient.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              email: normalizedEmail,
              avatar_url: avatarUrl,
              role,
              language: locale,
            },
            { onConflict: "id" }
          );

          // Link any pre-existing email-matched records to this Google user ID
          const { data: duplicateProfiles } = await adminClient
            .from("profiles")
            .select("id")
            .ilike("email", normalizedEmail)
            .neq("id", user.id);

          if (duplicateProfiles && duplicateProfiles.length > 0) {
            const oldIds = duplicateProfiles.map((p) => p.id);
            await adminClient
              .from("enrollments")
              .update({ user_id: user.id })
              .in("user_id", oldIds);
            await adminClient
              .from("enrollment_requests")
              .update({ user_id: user.id })
              .in("user_id", oldIds);
          }
        }
      } catch (syncErr) {
        console.error("OAuth profile sync warning:", syncErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If error occurred during exchange
  return NextResponse.redirect(`${origin}/${locale}/login?error=auth_callback_failed`);
}
