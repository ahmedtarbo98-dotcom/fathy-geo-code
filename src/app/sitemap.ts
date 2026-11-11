import { MetadataRoute } from "next";
import { getCourses } from "@/lib/data/courses";
import { getPublishedProjects } from "@/lib/projects-server";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fathygeocode.com";
  const courses = getCourses();
  const projects = await getPublishedProjects();
  const locales = ["ar", "en"];

  const routes = [
    "",
    "/courses",
    "/projects",
    "/about",
    "/contact",
    "/verify",
    "/privacy",
    "/terms",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1.0 : 0.8,
      });
    });
  });

  courses.forEach((course) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/courses/${course.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });
  });

  projects.forEach((project) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}/projects/${project.slug}`,
        lastModified: project.updated_at ? new Date(project.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      });
    });
  });

  return sitemapEntries;
}
