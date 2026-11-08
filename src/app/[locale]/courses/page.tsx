"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourses } from "@/lib/data/courses";
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

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "free" | "paid">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  const allCourses = useMemo(() => getCourses(), []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allCourses.forEach((c) => set.add(c.category));
    return Array.from(set);
  }, [allCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
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
  }, [allCourses, search, selectedType, selectedCategory, selectedLevel, locale]);

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
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border/80 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute inset-y-0 end-0 pe-3 flex items-center text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-border/80 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                >
                  <option value="all">{t("allTypes")}</option>
                  <option value="free">{t("freeOnly")}</option>
                  <option value="paid">{t("paidOnly")}</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="md:col-span-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-border/80 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                >
                  <option value="all">{t("allCategories")}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div className="md:col-span-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-border/80 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                >
                  <option value="all">{t("allLevels")}</option>
                  <option value="beginner">
                    {locale === "ar" ? "مبتدئ" : "Beginner"}
                  </option>
                  <option value="intermediate">
                    {locale === "ar" ? "متوسط" : "Intermediate"}
                  </option>
                  <option value="advanced">
                    {locale === "ar" ? "متقدم" : "Advanced"}
                  </option>
                  <option value="all_levels">
                    {locale === "ar" ? "جميع المستويات" : "All Levels"}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center justify-between mb-8 text-xs text-muted-foreground px-1">
          <span>
            {locale === "ar"
              ? `عرض ${filteredCourses.length} من إجمالي ${allCourses.length} دورة`
              : `Showing ${filteredCourses.length} of ${allCourses.length} courses`}
          </span>

          {(search ||
            selectedType !== "all" ||
            selectedCategory !== "all" ||
            selectedLevel !== "all") && (
            <button
              onClick={resetFilters}
              className="text-brand-blue dark:text-brand-cyan hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t("resetFilters")}</span>
            </button>
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => {
              const title = locale === "ar" ? course.title_ar : course.title_en;
              const desc =
                locale === "ar"
                  ? course.short_description_ar
                  : course.short_description_en;
              const level = locale === "ar" ? course.level_ar : course.level_en;
              const lessonsTotal = course.sections.reduce(
                (acc, s) => acc + s.lessons.length,
                0
              );
              const durationHours = Math.round(
                course.sections.reduce(
                  (acc, s) =>
                    acc +
                    s.lessons.reduce((lAcc, l) => lAcc + l.duration_seconds, 0),
                  0
                ) / 3600
              );

              return (
                <div
                  key={course.id}
                  className="group flex flex-col rounded-2xl bg-card border border-border/70 overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-blue/15 hover:border-brand-cyan/40"
                >
                  {/* Thumbnail */}
                  <div
                    className={`relative h-48 w-full bg-gradient-to-tr ${course.thumbnailGradient} p-5 flex flex-col justify-between overflow-hidden`}
                  >
                    <div className="absolute inset-0 topographic-lines opacity-30" />
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-black/40 text-white backdrop-blur-md border border-white/10">
                        {course.category}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                          course.is_free
                            ? "bg-emerald-500 text-white"
                            : "bg-amber-400 text-neutral-900"
                        }`}
                      >
                        {course.is_free ? tFeatured("free") : `$${course.price}`}
                      </span>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs font-medium">
                      <Layers className="w-4 h-4 text-brand-cyan" />
                      <span>FATHY GEO CODE</span>
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
                            {lessonsTotal} {tFeatured("lessons")}
                          </span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-brand-blue" />
                          <span>
                            {durationHours || 12} {tFeatured("duration")}
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

                    <div className="pt-4 border-t border-border/40">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 bg-secondary hover:bg-brand-blue hover:text-white dark:hover:bg-brand-cyan dark:hover:text-brand-navy"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>{tFeatured("details")}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 px-4 rounded-3xl glass-panel border border-border/60 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg text-foreground">
              {t("noCoursesFound")}
            </h3>
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors"
            >
              {t("resetFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
