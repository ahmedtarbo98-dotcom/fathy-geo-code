import { setRequestLocale } from "next-intl/server";
import HeroSection from "@/components/hero-section";
import StatsStrip from "@/components/stats-strip";
import WhatYouLearn from "@/components/what-you-learn";
import FeaturedCourses from "@/components/featured-courses";
import YouTubeSection from "@/components/youtube-section";
import TestimonialsSection from "@/components/testimonials-section";
import CTASection from "@/components/cta-section";
import { getPublicPlatformStats } from "@/lib/public-stats";

export const revalidate = 300;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const publicStats = await getPublicPlatformStats();

  return (
    <div className="relative flex flex-col">
      {/* 1. Hero with Animated Geospatial Canvas & Globe */}
      <HeroSection currentLocale={locale} stats={publicStats} />

      {/* 2. Stats Strip */}
      <StatsStrip currentLocale={locale} stats={publicStats} />

      {/* 3. What You'll Learn (GIS, Remote Sensing, Surveying, MCE, GEE, ArcGIS Pro) */}
      <WhatYouLearn currentLocale={locale} />

      {/* 4. Featured Courses Preview Strip */}
      <FeaturedCourses currentLocale={locale} />

      {/* 5. YouTube Channel Spotlight Section */}
      <YouTubeSection currentLocale={locale} />

      {/* 6. Student & Engineer Testimonials */}
      <TestimonialsSection currentLocale={locale} />

      {/* 7. Final Call to Action */}
      <CTASection currentLocale={locale} />
    </div>
  );
}
