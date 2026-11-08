"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Sparkles,
  BookOpen,
  Clock,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";

export interface CourseCardData {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  category: string;
  level: string;
  level_ar: string;
  lessonsCount: number;
  durationHours: number;
  isFree: boolean;
  price: number;
  thumbnailGradient: string;
}

export const sampleCourses: CourseCardData[] = [
  {
    id: "course-1",
    slug: "arcgis-pro-fundamentals",
    title_ar: "أساسيات وتطبيقات ArcGIS Pro من البداية للاحتراف",
    title_en: "ArcGIS Pro Fundamentals & Applied Spatial Analysis",
    desc_ar: "دورة شاملة تغطي واجهة البرنامج، إدارة الجيوداتابيس، التحليلات المكانية المتقدمة والإخراج الكارتوغرافي الاحترافي.",
    desc_en: "Comprehensive guide covering Esri ArcGIS Pro interface, geodatabase management, spatial analysis tools and professional cartography.",
    category: "GIS & Mapping",
    level: "Beginner to Intermediate",
    level_ar: "مبتدئ إلى متوسط",
    lessonsCount: 28,
    durationHours: 18,
    isFree: true,
    price: 0,
    thumbnailGradient: "from-blue-600 via-indigo-700 to-brand-navy",
  },
  {
    id: "course-2",
    slug: "fathy-geo-code-tricks",
    title_ar: "أسرار وحيل FATHY GEO CODE في الجيوماتكس",
    title_en: "FATHY GEO CODE Practical Geomatics Tricks & Workflows",
    desc_ar: "مجموعة من أقوى التكنيكات السريعة لاختصار ساعات العمل في معالجة البيانات، التحويل بين المساقط، وحل المشكلات المكانية الشائعة.",
    desc_en: "Essential shortcuts and techniques to save hours in spatial data cleaning, datum conversions, and solving typical GIS bottlenecks.",
    category: "Tips & Automation",
    level: "All Levels",
    level_ar: "جميع المستويات",
    lessonsCount: 16,
    durationHours: 10,
    isFree: true,
    price: 0,
    thumbnailGradient: "from-brand-cyan via-teal-600 to-brand-navy",
  },
  {
    id: "course-3",
    slug: "spatial-modeling-mce",
    title_ar: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
    title_en: "Advanced Spatial Modeling & Multi-Criteria Evaluation",
    desc_ar: "بناء نماذج اتخاذ القرار المكاني وتحديد أنسب المواقع للمشاريع الاستثمارية والبيئية باستخدام ModelBuilder وSpatial Analyst.",
    desc_en: "Constructing multi-criteria decision models (AHP/MCE) for environmental risk and site suitability using ModelBuilder.",
    category: "Spatial Modeling",
    level: "Advanced",
    level_ar: "متقدم",
    lessonsCount: 36,
    durationHours: 24,
    isFree: false,
    price: 49,
    thumbnailGradient: "from-brand-navy via-blue-900 to-indigo-950",
  },
];

export default function FeaturedCourses({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const t = useTranslations("FeaturedCourses");
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 relative bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{t("badge")}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {t("title")}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              {t("subtitle")}
            </p>
          </div>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue dark:text-brand-cyan hover:underline group self-start md:self-end"
          >
            <span>{t("viewAll")}</span>
            <Arrow className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sampleCourses.map((course) => {
            const title =
              currentLocale === "ar" ? course.title_ar : course.title_en;
            const desc =
              currentLocale === "ar" ? course.desc_ar : course.desc_en;
            const level =
              currentLocale === "ar" ? course.level_ar : course.level;

            return (
              <div
                key={course.id}
                className="group flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-blue/15 hover:border-brand-cyan/40"
              >
                {/* Course Thumbnail */}
                <div
                  className={`relative h-48 w-full bg-gradient-to-tr ${course.thumbnailGradient} p-5 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Subtle grid pattern */}
                  <div className="absolute inset-0 topographic-lines opacity-30" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-black/40 text-white backdrop-blur-md border border-white/10">
                      {course.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                        course.isFree
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-400 text-neutral-900"
                      }`}
                    >
                      {course.isFree ? t("free") : `$${course.price}`}
                    </span>
                  </div>

                  <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs font-medium">
                    <Layers className="w-4 h-4 text-brand-cyan" />
                    <span>FATHY GEO CODE</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <span>{level}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
                        <span>
                          {course.lessonsCount} {t("lessons")}
                        </span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-brand-blue" />
                        <span>
                          {course.durationHours} {t("duration")}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors leading-snug line-clamp-2">
                      {title}
                    </h3>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  {/* Card Action */}
                  <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-secondary hover:bg-brand-blue hover:text-white dark:hover:bg-brand-cyan dark:hover:text-brand-navy"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{t("details")}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
