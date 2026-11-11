import Image from "next/image";
import { Link } from "@/i18n/routing";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Layers,
} from "lucide-react";
import {
  getCategoryLabel,
  pickLocalized,
  type ProjectRecord,
} from "@/lib/projects";

export default function FeaturedProjects({
  currentLocale,
  projects,
}: {
  currentLocale: string;
  projects: ProjectRecord[];
}) {
  if (!projects || projects.length === 0) {
    return null;
  }

  const isRtl = currentLocale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
              <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
              <span>{isRtl ? "أبرز الأعمال والمشاريع" : "Featured Geospatial Work"}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {isRtl ? "مشاريع مكانية منفذة باحترافية" : "Featured Portfolio Projects"}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {isRtl
                ? "نماذج من المشاريع التطبيقية في نظم المعلومات الجغرافية والاستشعار عن بعد والنمذجة المكانية."
                : "Selected spatial analysis, remote sensing, surveying, and cartographic engineering deliverables."}
            </p>
          </div>

          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-brand-blue/30 bg-brand-blue/5 hover:bg-brand-blue/10 text-brand-blue dark:text-brand-cyan transition-all self-start md:self-auto"
          >
            <span>{isRtl ? "عرض جميع المشاريع" : "View all projects"}</span>
            <Arrow className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Featured Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => {
            const title = pickLocalized(project.title_ar, project.title_en, currentLocale);
            const desc = pickLocalized(
              project.short_description_ar,
              project.short_description_en,
              currentLocale
            );
            const categoryLabel = getCategoryLabel(project.category, currentLocale);

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
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-black/65 backdrop-blur-md text-brand-cyan border border-brand-cyan/40">
                      {categoryLabel}
                    </span>
                    {project.location && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/55 backdrop-blur-md text-white/90 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-cyan" />
                        <span>{project.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors line-clamp-2">
                      {title}
                    </h3>
                    {desc && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-border/40">
                    {project.tools && project.tools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {project.tools.slice(0, 3).map((tool) => (
                          <span
                            key={tool}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-muted text-muted-foreground"
                          >
                            {tool}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs font-bold text-brand-blue dark:text-brand-cyan">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>{isRtl ? "استعراض المشروع" : "View Case Study"}</span>
                      </span>
                      <Arrow className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
