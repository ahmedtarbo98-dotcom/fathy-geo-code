import { MetadataRoute } from "next";
import { getCourses } from "@/lib/data/courses";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fathygeocode.com";
  const courses = getCourses();
  const locales = ["ar", "en"];

  const routes = [
    "",
    "/courses",
    "/about",
    "/contact",
    "/verify",
    "/privacy",
    "/terms",
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Static Pages across both locales
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

  // Dynamic Course Pages
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

  return sitemapEntries;
}
