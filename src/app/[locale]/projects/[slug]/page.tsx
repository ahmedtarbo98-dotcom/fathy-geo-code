import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import {
  MapPin,
  Calendar,
  Building2,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Wrench,
  Layers,
} from "lucide-react";
import { getPublishedProjectBySlug } from "@/lib/projects-server";
import { getCategoryLabel, pickLocalized } from "@/lib/projects";
import ProjectMediaViewer from "@/components/project-media-viewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const project = await getPublishedProjectBySlug(slug);
  if (!project) {
    return {
      title: locale === "ar" ? "مشروع غير موجود | FATHY GEO CODE" : "Project Not Found",
    };
  }

  const title = pickLocalized(project.title_ar, project.title_en, locale);
  const description = pickLocalized(
    project.short_description_ar || project.details_ar,
    project.short_description_en || project.details_en,
    locale
  ).slice(0, 160);

  return {
    title: `${title} | FATHY GEO CODE`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: project.cover_image_url ? [{ url: project.cover_image_url, alt: title }] : [],
    },
  };
}

export default async function ProjectDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const isRtl = locale === "ar";
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const project = await getPublishedProjectBySlug(slug);
  if (!project) {
    notFound();
  }

  const title = pickLocalized(project.title_ar, project.title_en, locale);
  const shortDesc = pickLocalized(
    project.short_description_ar,
    project.short_description_en,
    locale
  );
  const details = pickLocalized(project.details_ar, project.details_en, locale);
  const categoryLabel = getCategoryLabel(project.category, locale);

  const media = project.project_media || [];
  const images = media.filter((m) => m.type === "image");
  const videos = media.filter((m) => m.type === "video");

  const whatsappMsg = isRtl
    ? `السلام عليكم م. أحمد، أرغب في طلب تنفيذ مشروع مشابه لمشروع: "${title}"`
    : `Hello Eng. Ahmed, I would like to request a similar project to: "${title}"`;
  const whatsappUrl = `https://wa.me/201060683463?text=${encodeURIComponent(whatsappMsg)}`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fathygeocode.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: shortDesc || details.slice(0, 200),
    image: project.cover_image_url || undefined,
    url: `${baseUrl}/${locale}/projects/${project.slug}`,
    genre: categoryLabel,
    keywords: (project.tools || []).join(", "),
    dateCreated: project.created_at,
    creator: {
      "@type": "Person",
      name: "Eng. Ahmed Fathy",
    },
  };

  return (
    <div className="min-h-screen py-10 md:py-16 relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
        {/* Back Breadcrumb */}
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-brand-cyan transition-colors"
          >
            <BackArrow className="w-4 h-4" />
            <span>{isRtl ? "العودة إلى جميع المشاريع" : "Back to All Projects"}</span>
          </Link>
        </div>

        {/* Hero Card */}
        <div className="rounded-3xl glass-panel overflow-hidden border border-border/70 shadow-2xl">
          {project.cover_image_url ? (
            <div className="relative h-64 sm:h-96 w-full bg-slate-900">
              <Image
                src={project.cover_image_url}
                alt={title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            </div>
          ) : (
            <div className="h-40 w-full bg-gradient-to-br from-brand-navy via-brand-blue to-slate-900 flex items-center justify-center">
              <Layers className="w-12 h-12 text-white/30" />
            </div>
          )}

          <div className="p-6 sm:p-10 space-y-6">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                {categoryLabel}
              </span>
              {project.location && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{project.location}</span>
                </span>
              )}
              {project.project_date && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                  <span>{project.project_date}</span>
                </span>
              )}
              {project.client_name && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{project.client_name}</span>
                </span>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {title}
              </h1>
              {shortDesc && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {shortDesc}
                </p>
              )}
            </div>

            {project.tools && project.tools.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{isRtl ? "الأدوات والبرمجيات المستخدمة" : "Tools & Technologies"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-blue/10 text-brand-blue dark:text-brand-cyan border border-brand-blue/20"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Request Similar Project WhatsApp CTA */}
            <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "هل لديك مشروع هندسي أو تحليلي مشابه وتحتاج لتنفيذه؟"
                  : "Have a similar GIS or spatial engineering requirement?"}
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {isRtl ? "طلب تنفيذ مشروع مشابه" : "Request a similar project"}
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Full Details Section */}
        {details && (
          <section className="rounded-3xl glass-panel p-6 sm:p-10 border border-border/70 space-y-4">
            <h2 className="text-xl font-extrabold text-foreground">
              {isRtl ? "تفاصيل المشروع والمنهجية" : "Project Overview & Methodology"}
            </h2>
            <div className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {details}
            </div>
          </section>
        )}

        {/* Interactive Image Gallery Lightbox & Embedded YouTube Videos */}
        {(images.length > 0 || videos.length > 0) && (
          <ProjectMediaViewer
            locale={locale}
            projectTitle={title}
            images={images}
            videos={videos}
          />
        )}
      </div>
    </div>
  );
}
