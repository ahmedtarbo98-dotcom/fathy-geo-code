"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
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

interface CourseCard {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_description_ar: string;
  short_description_en: string;
  category: string;
  level: string;
  is_free: boolean;
  price: number;
  currency: string;
  thumbnail_url: string | null;
  is_featured: boolean;
}

export default function FeaturedCourses({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const t = useTranslations("FeaturedCourses");
  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const supabase = createClient();

  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeaturedCourses() {
      try {
        const { data, error } = await supabase
          .from("courses")
          .select("id, slug, title_ar, title_en, short_description_ar, short_description_en, category, level, is_free, price, currency, thumbnail_url, is_featured")
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          // Prefer featured courses, fallback to top 3 published
          const featuredOnly = data.filter((c) => c.is_featured);
          setCourses(featuredOnly.length > 0 ? featuredOnly.slice(0, 3) : data.slice(0, 3));
        }
      } catch (err) {
        console.error("Featured courses error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFeaturedCourses();
  }, []);

  if (!loading && courses.length === 0) {
    return null;
  }

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
          {courses.map((course) => {
            const title =
              currentLocale === "ar" ? course.title_ar : course.title_en;
            const desc =
              currentLocale === "ar" ? course.short_description_ar : course.short_description_en;

            return (
              <div
                key={course.id}
                className="group relative rounded-3xl glass-panel border border-border/80 overflow-hidden shadow-lg hover:shadow-2xl hover:border-brand-blue/50 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Course Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-brand-navy to-brand-blue flex items-center justify-center text-white font-extrabold text-sm">
                      FATHY GEO CODE
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3.5 start-3.5 flex items-center gap-2 z-10">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                      {course.category}
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 end-3.5 z-10">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold shadow-lg ${
                        course.is_free
                          ? "bg-emerald-500 text-white"
                          : "bg-black/80 backdrop-blur-md text-brand-cyan border border-brand-cyan/40"
                      }`}
                    >
                      {course.is_free ? t("free") : `${course.price} ${course.currency || "USD"}`}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                      <span className="capitalize">{course.level}</span>
                      <span className="text-brand-blue dark:text-brand-cyan">GIS & RS</span>
                    </div>

                    <h3 className="text-lg font-bold text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors line-clamp-2">
                      {title}
                    </h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <Link
                      href={`/courses/${course.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors"
                    >
                      <span>{t("viewDetails")}</span>
                      <Arrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </Link>

                    <Link
                      href={`/courses/${course.slug}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-sm hover:shadow-md transition-all hover:scale-105"
                    >
                      {course.is_free ? t("startNow") : t("enroll")}
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
