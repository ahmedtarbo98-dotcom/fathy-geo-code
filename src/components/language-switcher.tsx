"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleLanguage = () => {
    const nextLocale = currentLocale === "ar" ? "en" : "ar";
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <button
      onClick={toggleLanguage}
      disabled={isPending}
      title={currentLocale === "ar" ? "Switch to English" : "التحويل إلى العربية"}
      aria-label="Switch Language"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/60 bg-background/60 backdrop-blur-md text-xs font-semibold text-foreground transition-all duration-300 hover:border-brand-blue hover:text-brand-blue hover:shadow-[0_0_15px_rgba(30,111,217,0.2)] hover:scale-105 active:scale-95 disabled:opacity-50"
    >
      <Languages className="w-3.5 h-3.5 text-brand-cyan" />
      <span>{currentLocale === "ar" ? "English" : "العربية"}</span>
    </button>
  );
}
