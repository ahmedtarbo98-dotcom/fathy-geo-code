"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Youtube, Play, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface YouTubeCard {
  id?: string;
  title_ar: string;
  title_en: string;
  duration: string;
  views: string;
  tag: string;
  video_url?: string;
}

const DEFAULT_VIDEOS: YouTubeCard[] = [
  {
    title_ar: "أسرار التعامل مع صور الأقمار الصناعية وحساب مؤشر NDVI",
    title_en: "Satellite Imagery Analysis & NDVI Spectral Index in ArcGIS Pro",
    duration: "24:15",
    views: "3.4K",
    tag: "Remote Sensing",
    video_url: "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
  },
  {
    title_ar: "بناء نموذج ملاءمة مكانية باستخدام ModelBuilder خطوة بخطوة",
    title_en: "Building a Multi-Criteria Spatial Suitability Model with ModelBuilder",
    duration: "32:40",
    views: "5.1K",
    tag: "GIS Analysis",
    video_url: "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
  },
  {
    title_ar: "مقدمة سريعة للمبتدئين في Google Earth Engine عبر الجافاسكريبت",
    title_en: "Fast-Track Introduction to Google Earth Engine Scripting",
    duration: "19:50",
    views: "2.8K",
    tag: "GEE & Code",
    video_url: "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
  },
];

export default function YouTubeSection({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("YouTubeSection");
  const channelUrl = "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw";
  const supabase = createClient();

  const [videoCards, setVideoCards] = useState<YouTubeCard[]>(DEFAULT_VIDEOS);

  useEffect(() => {
    async function loadDynamicYouTubeVideos() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "youtube_featured_videos")
          .single();

        if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
          setVideoCards(data.value);
        }
      } catch (err) {
        // Fallback to defaults
      }
    }
    loadDynamicYouTubeVideos();
  }, []);

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-b from-background via-brand-navy/5 to-background">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="rounded-3xl p-8 sm:p-12 glass-panel border border-red-500/20 shadow-2xl shadow-red-500/5 relative overflow-hidden">
          {/* Ambient red/cyan glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400">
                  <Youtube className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  <span>{t("badge")}</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                  {t("title")}
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {t("subtitle")}
                </p>
              </div>

              {/* YouTube Subscribe Button */}
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/25 transition-all duration-300 hover:scale-105 active:scale-95 self-start md:self-center"
              >
                <Youtube className="w-5 h-5 fill-white" />
                <span>{t("subscribe")}</span>
                <ExternalLink className="w-4 h-4 opacity-75" />
              </a>
            </div>

            {/* Video Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {videoCards.map((video, idx) => {
                const title = currentLocale === "ar" ? video.title_ar : video.title_en;
                const targetLink = video.video_url && video.video_url.trim().length > 5 ? video.video_url : channelUrl;

                return (
                  <a
                    key={idx}
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-xl overflow-hidden bg-background/80 border border-border/60 hover:border-red-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/10"
                  >
                    {/* Simulated Video Preview Thumbnail */}
                    <div className="relative h-44 w-full bg-gradient-to-br from-neutral-900 via-brand-navy to-neutral-950 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-600 transition-all duration-300">
                        <Play className="w-5 h-5 fill-white ml-0.5 rtl:mr-0.5" />
                      </div>

                      <span className="absolute bottom-2.5 right-2.5 rtl:left-2.5 rtl:right-auto px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-black/80 text-white">
                        {video.duration}
                      </span>

                      <span className="absolute top-2.5 left-2.5 rtl:right-2.5 rtl:left-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30">
                        {video.tag}
                      </span>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <h4 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-red-500 transition-colors">
                        {title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                        <span>{video.views}</span>
                        <span className="text-red-500 font-semibold flex items-center gap-1">
                          <span>{t("watchVideo")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
