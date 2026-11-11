"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { SiteBranding, DEFAULT_BRANDING } from "@/lib/site-branding";

interface SiteBrandingContextValue extends SiteBranding {
  isReady: boolean;
  refreshBranding: () => Promise<void>;
}

const SiteBrandingContext = createContext<SiteBrandingContextValue>({
  ...DEFAULT_BRANDING,
  isReady: false,
  refreshBranding: async () => {},
});

export function SiteBrandingProvider({
  initialBranding,
  children,
}: {
  initialBranding: SiteBranding;
  children: React.ReactNode;
}) {
  const [branding, setBranding] = useState<SiteBranding>(initialBranding);
  const [isReady, setIsReady] = useState<boolean>(
    Boolean(initialBranding.instructorAvatarUrl) || initialBranding.logoUrl !== "/logo.jpg"
  );

  const refreshBranding = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_identity", "instructor_profile"]);

      if (data && data.length > 0) {
        setBranding((prev) => {
          const next = { ...prev };
          for (const row of data) {
            if (row.key === "site_identity" && row.value) {
              if (row.value.logo_url) next.logoUrl = row.value.logo_url;
              if (row.value.site_name) next.siteName = row.value.site_name;
              if (row.value.tagline) next.tagline = row.value.tagline;
            }
            if (row.key === "instructor_profile" && row.value) {
              if (row.value.avatar_url) {
                next.instructorAvatarUrl = row.value.avatar_url;
              }
            }
          }
          return next;
        });
      }
    } catch {
      // Keep current branding
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    refreshBranding();

    const handleUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Partial<SiteBranding>>)?.detail;
      if (detail) {
        setBranding((prev) => ({
          ...prev,
          ...detail,
        }));
      }
      refreshBranding();
    };

    window.addEventListener("site-branding-updated", handleUpdated);
    return () => {
      window.removeEventListener("site-branding-updated", handleUpdated);
    };
  }, [refreshBranding]);

  return (
    <SiteBrandingContext.Provider
      value={{
        ...branding,
        isReady,
        refreshBranding,
      }}
    >
      {children}
    </SiteBrandingContext.Provider>
  );
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext);
}

export function SiteLogoImage({
  variant = "logo",
  alt = "FATHY GEO CODE",
  className = "object-cover",
  priority = false,
}: {
  variant?: "logo" | "instructor";
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const { logoUrl, instructorAvatarUrl } = useSiteBranding();
  const src =
    variant === "instructor"
      ? instructorAvatarUrl || logoUrl || "/logo.jpg"
      : logoUrl || "/logo.jpg";

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      className={className}
    />
  );
}
