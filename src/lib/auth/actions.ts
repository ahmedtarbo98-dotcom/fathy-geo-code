import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(locale: string = "ar") {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: supabaseAnonKey },
      });
      if (res.ok) {
        const settings = await res.json();
        if (settings?.external?.google === false) {
          throw new Error(
            locale === "ar"
              ? "تسجيل الدخول عبر Google غير مفعّل بعد في إعدادات Supabase (Authentication → Providers → Google)."
              : "Google sign-in is not enabled yet in Supabase Dashboard (Authentication → Providers → Google)."
          );
        }
      }
    } catch (checkErr: any) {
      if (checkErr?.message?.includes("Supabase")) {
        throw checkErr;
      }
    }
  }

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
        prompt: "select_account",
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
