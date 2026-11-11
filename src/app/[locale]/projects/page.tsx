import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import ProjectsGallery from "@/components/projects-gallery";
import { getPublishedProjects } from "@/lib/projects-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isRtl = locale === "ar";
  return {
    title: isRtl
      ? "معرض المشاريع | FATHY GEO CODE"
      : "Projects Portfolio | FATHY GEO CODE",
    description: isRtl
      ? "استكشف المشاريع المكانية ودراسات الحالة في نظم المعلومات الجغرافية والاستشعار عن بعد والمساحة الرقمية."
      : "Explore GIS, Remote Sensing, Surveying, and Spatial Modeling portfolio case studies by Eng. Ahmed Fathy.",
  };
}

export default async function ProjectsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const initialProjects = await getPublishedProjects();

  return <ProjectsGallery locale={locale} initialProjects={initialProjects} />;
}
