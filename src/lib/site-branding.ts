export interface SiteBranding {
  logoUrl: string;
  siteName: string;
  tagline: string;
  instructorAvatarUrl: string | null;
}

export const DEFAULT_BRANDING: SiteBranding = {
  logoUrl: "/logo.jpg",
  siteName: "FATHY GEO CODE",
  tagline: "GIS & Remote Sensing Educational Hub",
  instructorAvatarUrl: null,
};

export async function getSiteBranding(): Promise<SiteBranding> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey || supabaseUrl.includes("placeholder-project")) {
    return DEFAULT_BRANDING;
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/site_settings?select=key,value&key=in.(site_identity,instructor_profile)`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        next: {
          tags: ["site-branding"],
          revalidate: 30,
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) {
      return DEFAULT_BRANDING;
    }

    const rows: Array<{ key: string; value: Record<string, any> }> =
      await res.json();

    const branding: SiteBranding = { ...DEFAULT_BRANDING };

    for (const row of rows || []) {
      if (row.key === "site_identity" && row.value) {
        if (row.value.logo_url) branding.logoUrl = row.value.logo_url;
        if (row.value.site_name) branding.siteName = row.value.site_name;
        if (row.value.tagline) branding.tagline = row.value.tagline;
      }
      if (row.key === "instructor_profile" && row.value) {
        if (row.value.avatar_url) {
          branding.instructorAvatarUrl = row.value.avatar_url;
        }
      }
    }

    return branding;
  } catch {
    return DEFAULT_BRANDING;
  }
}
