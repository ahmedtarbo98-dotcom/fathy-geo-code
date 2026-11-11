"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import HeroBackground from "./hero-background";
import type { PublicPlatformStats } from "@/lib/public-stats";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Layers,
  Satellite,
  Globe2,
  CheckCircle2,
  PhoneCall,
  PlayCircle,
} from "lucide-react";

export default function HeroSection({
  currentLocale,
  stats,
}: {
  currentLocale: string;
  stats: PublicPlatformStats;
}) {
  const t = useTranslations("Hero");
  const tBrand = useTranslations("Brand");
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const formattedStudents = new Intl.NumberFormat(numLocale).format(stats.studentsCount);
  const formattedCourses = new Intl.NumberFormat(numLocale).format(stats.publishedCoursesCount);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-8 pb-20">
      {/* Dynamic Geospatial Canvas Background */}
      <HeroBackground />

      {/* Decorative gradient overlay */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-blue/15 dark:bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-cyan/15 dark:bg-brand-cyan/10 rounded-full blur-[110px] pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-8 space-y-6 text-center lg:text-start">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 backdrop-blur-md text-xs sm:text-sm font-semibold text-brand-navy dark:text-brand-cyan shadow-sm">
              <Sparkles className="w-4 h-4 text-brand-cyan animate-pulse" />
              <span>{t("badge")}</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.18] sm:leading-[1.15]">
              <span className="block text-foreground">{t("titlePart1")}</span>
              <span className="block bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan dark:from-blue-400 dark:via-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
                {t("titlePart2")}
              </span>
            </h1>

            {/* Subheadline / description */}
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl leading-relaxed mx-auto lg:mx-0">
              {t("description")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-white shadow-xl shadow-brand-blue/25 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:shadow-brand-cyan/30 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 group"
              >
                <Compass className="w-5 h-5 text-brand-cyan transition-transform group-hover:rotate-45" />
                <span>{t("ctaCourses")}</span>
                <Arrow className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>

              <a
                href="https://wa.me/201060683463?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%20%D9%85.%20%D8%A3%D8%AD%D9%85%D8%AF%D8%8C%20%D8%A3%D9%88%D8%AF%20%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AE%D8%AF%D9%85%D8%A7%D8%AA%20%D8%A7%D9%84%D8%AA%D8%AF%D8%B1%D9%8A%D8%A8%20%D9%88%D8%AA%D9%86%D9%81%D9%8A%D8%B0%20%D8%A7%D9%84%D9%85%D8%B4%D8%A7%D8%B1%D9%8A%D8%B9%20%D8%A7%D9%84%D9%85%D9%83%D8%A7%D9%86%D9%8A%D8%A9"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-base font-semibold border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                <PhoneCall className="w-5 h-5" />
                <span>{t("ctaProjects")}</span>
              </a>
            </div>

            {/* Quick Proof Pills */}
            <div className="pt-6 border-t border-border/40 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="font-medium">ArcGIS Pro 3.x & Spatial</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="font-medium">Google Earth Engine</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start col-span-2 sm:col-span-1">
                <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0" />
                <span className="font-medium">
                  {currentLocale === "ar" ? "شهادات إتمام موثقة" : "Verified Certificates"}
                </span>
              </div>
            </div>
          </div>

          {/* Hero Side Interactive Card / Geospatial Badge */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full max-w-sm p-6 rounded-2xl glass-panel shadow-2xl shadow-brand-blue/15 border border-border/60 hover:shadow-brand-cyan/20 transition-all duration-500">
              {/* Top Card Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-semibold text-foreground">
                    {currentLocale === "ar" ? "المنصة جاهزة للدراسة والتطبيق" : "Active Geospatial Hub"}
                  </span>
                </div>
                <Satellite className="w-4 h-4 text-brand-cyan" />
              </div>

              {/* Spatial Coordinates Box */}
              <div className="my-5 p-3.5 rounded-xl bg-muted/60 border border-border/40 font-mono text-[11px] sm:text-xs text-muted-foreground space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue dark:text-brand-cyan">DATUM:</span>
                  <span className="text-foreground">WGS 84 / UTM Zone 36N</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue dark:text-brand-cyan">INSTR:</span>
                  <span className="text-foreground">{tBrand("owner")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-blue dark:text-brand-cyan">SENSOR:</span>
                  <span className="text-foreground">Multispectral (10m Res)</span>
                </div>
              </div>

              {/* YouTube Quick Channel Card */}
              <a
                href="https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-red-600/10 via-red-500/5 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">
                      {t("youtubeChannel")}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {currentLocale === "ar" ? "شروحات وتطبيقات مجانية" : "Free Practical Tutorials"}
                    </div>
                  </div>
                </div>
                <Arrow className="w-4 h-4 text-muted-foreground group-hover:text-red-500 transition-colors" />
              </a>

              {/* Live Learner & Courses Pill */}
              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {t("activeLearners", { count: formattedStudents })}
                </span>
                <span className="font-bold text-brand-blue dark:text-brand-cyan">
                  {t("publishedCoursesPill", { count: formattedCourses })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
