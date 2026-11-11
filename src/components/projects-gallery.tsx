"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import {
  Search,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import {
  PROJECT_CATEGORIES,
  getCategoryLabel,
  pickLocalized,
  type ProjectRecord,
} from "@/lib/projects";

export default function ProjectsGallery({
  locale,
  initialProjects,
}: {
  locale: string;
  initialProjects: ProjectRecord[];
}) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    let active = true;
    async function refreshLive() {
      try {
        setLoading(initialProjects.length === 0);
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active && Array.isArray(json.projects)) {
          setProjects(json.projects);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    refreshLive();
    return () => {
      active = false;
    };
  }, [initialProjects.length]);

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (
        selectedCategory !== "all" &&
        p.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      const hay = [
        p.title_ar,
        p.title_en,
        p.short_description_ar,
        p.short_description_en,
        p.category,
        p.location || "",
        p.client_name || "",
        ...(p.tools || []),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen py-12 md:py-16 relative">
      <div className="container mx-auto px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{isRtl ? "معرض الأعمال والمشاريع" : "Geospatial Portfolio"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {isRtl ? "مشاريع FATHY GEO CODE" : "Geospatial & GIS Projects"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {isRtl
              ? "نماذج من المشاريع المكانية، التحليلات الفضائية، ونمذجة البيانات الجغرافية المنفذة باحترافية."
              : "Explore delivered GIS, Remote Sensing, Surveying, and Spatial Modeling projects."}
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-border/70 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute start-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isRtl
                    ? "ابحث باسم المشروع، الأداة (ArcGIS / GEE)، أو الموقع..."
                    : "Search by project title, tool (ArcGIS / GEE), or location..."
                }
                className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm"
              />
            </div>

            <span className="text-xs font-semibold text-muted-foreground">
              {isRtl
                ? `عرض ${new Intl.NumberFormat("ar-EG").format(filteredProjects.length)} مشروع`
                : `Showing ${filteredProjects.length} projects`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                selectedCategory === "all"
                  ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                  : "bg-background/60 text-muted-foreground border-border/70 hover:text-foreground"
              }`}
            >
              {isRtl ? "الكل" : "All"}
            </button>
            {PROJECT_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  selectedCategory === cat.value
                    ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                    : "bg-background/60 text-muted-foreground border-border/70 hover:text-foreground"
                }`}
              >
                {isRtl ? cat.labelAr : cat.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl glass-panel border border-border/60 overflow-hidden animate-pulse"
              >
                <div className="h-52 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded-lg w-3/4" />
                  <div className="h-4 bg-muted/70 rounded-lg w-full" />
                  <div className="h-4 bg-muted/70 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl glass-panel p-14 border border-dashed border-border/70 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
              <Briefcase className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {projects.length === 0
                ? isRtl
                  ? "لا توجد مشاريع مضافة بعد"
                  : "No projects yet"
                : isRtl
                ? "لا توجد مشاريع مطابقة لبحثك"
                : "No projects match your filters"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              {projects.length === 0
                ? isRtl
                  ? "سيتم عرض المشاريع المكانية ودراسات الحالة هنا فور إضافتها ونشرها."
                  : "Published GIS & geospatial portfolio case studies will appear here once added."
                : isRtl
                ? "جرب تغيير التصنيف أو مسح نص البحث."
                : "Try selecting another category or clearing your search query."}
            </p>
            {selectedCategory !== "all" || searchQuery ? (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold"
              >
                {isRtl ? "إعادة ضبط التصفية" : "Reset Filters"}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project) => {
              const title = pickLocalized(project.title_ar, project.title_en, locale);
              const shortDesc = pickLocalized(
                project.short_description_ar,
                project.short_description_en,
                locale
              );
              const categoryLabel = getCategoryLabel(project.category, locale);

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group flex flex-col rounded-2xl glass-panel overflow-hidden border border-border/70 hover:border-brand-cyan/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-cyan/10"
                >
                  <div className="relative h-52 w-full bg-gradient-to-br from-brand-navy via-brand-blue/80 to-slate-900 overflow-hidden">
                    {project.cover_image_url ? (
                      <Image
                        src={project.cover_image_url}
                        alt={title}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        <Layers className="w-12 h-12 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute top-3 start-3 end-3 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/65 backdrop-blur-md text-brand-cyan border border-brand-cyan/40">
                        {categoryLabel}
                      </span>
                      {project.is_featured && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/90 text-white">
                          {isRtl ? "مميز" : "Featured"}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h2 className="font-bold text-lg text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors line-clamp-2">
                        {title}
                      </h2>
                      {shortDesc && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                          {shortDesc}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-3 border-t border-border/40">
                      {(project.location || project.project_date) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          {project.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                              <span>{project.location}</span>
                            </span>
                          )}
                          {project.project_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                              <span>{project.project_date}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {project.tools && project.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tools.slice(0, 4).map((tool) => (
                            <span
                              key={tool}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs font-bold text-brand-blue dark:text-brand-cyan pt-1">
                        <span>{isRtl ? "عرض التفاصيل والوسائط" : "View Project Details"}</span>
                        <Arrow className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
