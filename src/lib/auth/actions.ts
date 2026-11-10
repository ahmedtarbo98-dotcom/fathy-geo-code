import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(locale: string = "ar") {
  const supabase = createClient();
  const siteUrl =
    (typeof window !== "undefined" && window.location.origin)
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://fathy-geo-code.vercel.app");

  const redirectTo = `${siteUrl}/auth/callback?next=/${locale}/dashboard`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  locale: string = "ar"
) {
  const supabase = createClient();
  const siteUrl =
    (typeof window !== "undefined" && window.location.origin)
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://fathy-geo-code.vercel.app");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        language: locale,
      },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/${locale}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string, locale: string = "ar") {
  const supabase = createClient();
  const siteUrl =
    (typeof window !== "undefined" && window.location.origin)
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || "https://fathy-geo-code.vercel.app");

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/${locale}/profile`,
  });

  if (error) throw error;
  return data;
}
