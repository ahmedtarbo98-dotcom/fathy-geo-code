"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Compass, PhoneCall, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export default function CTASection({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("CTA");
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 bg-gradient-to-tr from-white via-sky-50 to-blue-50/90 dark:from-[#030A11] dark:via-[#071B2B] dark:to-[#030A11] border border-brand-blue/20 dark:border-brand-cyan/30 text-foreground dark:text-white shadow-altura dark:shadow-2xl dark:shadow-black/50">
          {/* Background decorative graphics */}
          <div className="absolute inset-0 topographic-lines opacity-25 pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-cyan/15 dark:bg-brand-cyan/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-blue/15 dark:bg-brand-blue/30 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-blue/25 dark:border-brand-cyan/40 bg-brand-blue/10 dark:bg-brand-cyan/15 backdrop-blur-md text-xs sm:text-sm font-semibold text-brand-blue dark:text-brand-cyan">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-brand-cyan animate-pulse" />
              <span>FATHY GEO CODE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground dark:text-cream font-heading">
              {t("title")}
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground dark:text-brand-muted max-w-2xl mx-auto leading-relaxed">
              {t("subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white dark:text-[#030A11] bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan dark:from-brand-cyan dark:to-sky-300 hover:scale-105 active:scale-95 shadow-lg shadow-brand-blue/25 dark:shadow-brand-cyan/25 transition-all duration-300 group btn-shimmer"
              >
                <Compass className="w-5 h-5 text-brand-cyan dark:text-[#030A11] group-hover:rotate-45 transition-transform" />
                <span>{t("browseCourses")}</span>
                <Arrow className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>

              <a
                href="https://wa.me/201060683463"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-semibold border border-border bg-white/90 hover:bg-muted text-foreground dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>{t("contact")}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
