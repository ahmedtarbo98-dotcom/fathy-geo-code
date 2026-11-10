"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { CourseDetailData } from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  Filter,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
} from "lucide-react";

export default function CoursesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("CoursesPage");
  const tFeatured = useTranslations("FeaturedCourses");
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const supabase = createClient();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "free" | "paid">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const [coursesList, setCoursesList] = useState<CourseDetailData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLiveCourses() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("courses")
          .select(`
            id,
            slug,
            title_ar,
            title_en,
            short_description_ar,
            short_description_en,
            description_ar,
            description_en,
            thumbnail_url,
            category,
            level,
            is_free,
            price,
            currency,
            status,
            course_sections (
              id,
              title_ar,
              title_en,
              order_index,
              lessons (
                id,
                title_ar,
                title_en,
                duration_seconds,
                is_free_preview,
                order_index
              )
            )
          `)
          .eq("status", "published")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const transformed: CourseDetailData[] = data.map((c: any) => ({
            id: c.id,
            slug: c.slug,
            title_ar: c.title_ar,
            title_en: c.title_en,
            short_description_ar: c.short_description_ar || c.title_ar,
            short_description_en: c.short_description_en || c.title_en,
            description_ar: c.description_ar || "",
            description_en: c.description_en || "",
            what_you_will_learn_ar: [],
            what_you_will_learn_en: [],
            requirements_ar: [],
            requirements_en: [],
            thumbnail_url: c.thumbnail_url || "/logo.jpg",
            thumbnailGradient: "from-blue-600 via-indigo-700 to-brand-navy",
            category: c.category || "GIS & Mapping",
            level: c.level || "all_levels",
            level_ar: c.level === "beginner" ? "مبتدئ" : c.level === "advanced" ? "متقدم" : "جميع المستويات",
            level_en: c.level || "All Levels",
            is_free: c.is_free,
            price: c.price || 0,
            currency: c.currency || "USD",
            status: c.status,
            sections: (c.course_sections || []).map((sec: any) => ({
              id: sec.id,
              title_ar: sec.title_ar,
              title_en: sec.title_en,
              order_index: sec.order_index,
              lessons: sec.lessons || [],
            })),
          }));
          setCoursesList(transformed);
        }
      } catch (err) {
        console.error("Live courses fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveCourses();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    coursesList.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [coursesList]);

  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const title = locale === "ar" ? course.title_ar : course.title_en;
      const desc = locale === "ar" ? course.short_description_ar : course.short_description_en;
      const matchesSearch =
        search.trim() === "" ||
        title.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        selectedType === "all" ||
        (selectedType === "free" && course.is_free) ||
        (selectedType === "paid" && !course.is_free);

      const matchesCategory =
        selectedCategory === "all" || course.category === selectedCategory;

      const matchesLevel =
        selectedLevel === "all" || course.level === selectedLevel;

      return matchesSearch && matchesType && matchesCategory && matchesLevel;
    });
  }, [coursesList, search, selectedType, selectedCategory, selectedLevel, locale]);

  const resetFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedCategory("all");
    setSelectedLevel("all");
  };

  return (
    <div className="relative min-h-screen py-12 md:py-16">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>FATHY GEO CODE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-10 space-y-4">
          <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-border/70 shadow-lg shadow-brand-blue/5">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Search Input */}
              <div className="md:col-span-5 relative">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-11 ps-10 pe-4 rounded-xl bg-background/80 border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan transition-all placeholder:text-muted-foreground/60"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute top-1/2 -translate-y-1/2 end-3 p-1 rounded-md hover:bg-muted text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter (All / Free / Paid) */}
              <div className="md:col-span-3 flex rounded-xl p-1 bg-background/60 border border-border/80">
                {(["all", "free", "paid"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedType === type
                        ? "bg-brand-blue text-white shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`type_${type}`)}
                  </button>
                ))}
              </div>

              {/* Category Dropdown */}
              <div className="md:col-span-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background/80 border border-border/80 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                >
                  <option value="all">{t("allCategories")}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Dropdown */}
              <div className="md:col-span-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-background/80 border border-border/80 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                >
                  <option value="all">{t("allLevels")}</option>
                  <option value="beginner">{t("level_beginner")}</option>
                  <option value="intermediate">{t("level_intermediate")}</option>
                  <option value="advanced">{t("level_advanced")}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center justify-between mb-8 text-xs text-muted-foreground">
          <span>
            {t("foundCourses", { count: filteredCourses.length })}
          </span>
          {(search || selectedType !== "all" || selectedCategory !== "all" || selectedLevel !== "all") && (
            <button
              onClick={resetFilters}
              className="text-brand-blue dark:text-brand-cyan hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("resetFilters")}</span>
            </button>
          )}
        </div>

        {/* Courses Cards Grid */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
            <p className="text-xs text-muted-foreground font-medium">
              {isRtl ? "جارٍ تحميل الدورات التعليمية..." : "Loading courses..."}
            </p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 rounded-3xl glass-panel border border-dashed border-border/80 max-w-lg mx-auto space-y-4">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
            <h3 className="text-lg font-bold text-foreground">
              {t("noResultsTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("noResultsDesc")}
            </p>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-md hover:bg-brand-blue/90"
            >
              {t("resetFilters")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const title = locale === "ar" ? course.title_ar : course.title_en;
              const desc =
                locale === "ar"
                  ? course.short_description_ar
                  : course.short_description_en;
              const level = locale === "ar" ? course.level_ar : course.level_en;
              const lessonsTotal = course.sections.reduce(
                (acc, s) => acc + (s.lessons?.length || 0),
                0
              );
              const durationHours = Math.round(
                course.sections.reduce(
                  (acc, s) =>
                    acc +
                    (s.lessons || []).reduce((lAcc, l) => lAcc + (l.duration_seconds || 0), 0),
                  0
                ) / 3600
              );

              return (
                <div
                  key={course.id}
                  className="group flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-blue/15 hover:border-brand-cyan/40"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-muted overflow-hidden">
                    {course.thumbnail_url ? (
                      <Image
                        src={course.thumbnail_url}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-brand-navy to-brand-blue flex items-center justify-center text-white font-extrabold text-xs">
                        FATHY GEO CODE
                      </div>
                    )}

                    <div className="absolute top-3.5 start-3.5 z-10">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase bg-black/60 text-white backdrop-blur-md border border-white/10">
                        {course.category}
                      </span>
                    </div>

                    <div className="absolute bottom-3.5 end-3.5 z-10">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                          course.is_free
                            ? "bg-emerald-500 text-white"
                            : "bg-black/80 backdrop-blur-md text-brand-cyan border border-brand-cyan/40"
                        }`}
                      >
                        {course.is_free ? tFeatured("free") : `${course.price} ${course.currency || "USD"}`}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <span>{level}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
                          <span>
                            {lessonsTotal} {locale === "ar" ? "درس" : "lessons"}
                          </span>
                        </div>
                        {durationHours > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                              <span>
                                {durationHours} {locale === "ar" ? "ساعة" : "hrs"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors">
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
                        <span>{tFeatured("viewDetails")}</span>
                        <Arrow className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </Link>

                      <Link
                        href={`/courses/${course.slug}`}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-md hover:shadow-brand-blue/30 transition-all hover:scale-105"
                      >
                        {course.is_free
                          ? tFeatured("startNow")
                          : tFeatured("enroll")}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
