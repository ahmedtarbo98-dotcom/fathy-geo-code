"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ImageIcon,
  Youtube,
} from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";
import { pickLocalized, type ProjectMediaItem } from "@/lib/projects";

export default function ProjectMediaViewer({
  locale,
  projectTitle,
  images,
  videos,
}: {
  locale: string;
  projectTitle: string;
  images: ProjectMediaItem[];
  videos: ProjectMediaItem[];
}) {
  const isRtl = locale === "ar";
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + (isRtl ? -1 : 1) + images.length) % images.length
        );
      }
      if (e.key === "ArrowLeft") {
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + (isRtl ? 1 : -1) + images.length) % images.length
        );
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIdx, images.length, isRtl]);

  const goPrev = () => {
    setLightboxIdx((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    );
  };

  const goNext = () => {
    setLightboxIdx((prev) => (prev === null ? null : (prev + 1) % images.length));
  };

  return (
    <div className="space-y-10">
      {/* Gallery Images */}
      {images.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-cyan" />
            <span>{isRtl ? "معرض صور المشروع والخرائط" : "Project Gallery & Maps"}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img, idx) => {
              const caption = pickLocalized(img.caption_ar, img.caption_en, locale);
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setLightboxIdx(idx)}
                  className="group relative rounded-2xl overflow-hidden border border-border/70 bg-card text-start transition-all hover:border-brand-cyan/50 hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                    <Image
                      src={img.url}
                      alt={caption || projectTitle}
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity p-2.5 rounded-full bg-black/70 text-white backdrop-blur-sm">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  {caption && (
                    <div className="p-3 text-xs font-medium text-muted-foreground line-clamp-2">
                      {caption}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* YouTube Videos (Public youtube-nocookie.com 16:9 embeds) */}
      {videos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" />
            <span>{isRtl ? "فيديوهات وشرح المشروع" : "Project Videos"}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.map((vid, idx) => {
              const videoId = extractYouTubeId(vid.url);
              if (!videoId) return null;
              const caption = pickLocalized(vid.caption_ar, vid.caption_en, locale);

              return (
                <div
                  key={vid.id || idx}
                  className="rounded-2xl overflow-hidden glass-panel border border-border/70 shadow-lg"
                >
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                      title={caption || `${projectTitle} Video ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                  {caption && (
                    <div className="p-3.5 text-xs sm:text-sm font-semibold text-foreground">
                      {caption}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lightbox Modal with Keyboard Arrows & Mobile Swipe */}
      {lightboxIdx !== null && images[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
            const diff = touchStartX.current - endX;
            touchStartX.current = null;
            if (Math.abs(diff) > 45) {
              if (diff > 0) {
                isRtl ? goPrev() : goNext();
              } else {
                isRtl ? goNext() : goPrev();
              }
            }
          }}
        >
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3">
            <span className="text-xs font-mono text-white/75">
              {lightboxIdx + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative w-full max-w-5xl h-[70vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={isRtl ? goNext : goPrev}
                className="absolute left-2 sm:left-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-full">
              <Image
                src={images[lightboxIdx].url}
                alt={
                  pickLocalized(
                    images[lightboxIdx].caption_ar,
                    images[lightboxIdx].caption_en,
                    locale
                  ) || projectTitle
                }
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <button
                type="button"
                onClick={isRtl ? goPrev : goNext}
                className="absolute right-2 sm:right-4 z-10 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {pickLocalized(
            images[lightboxIdx].caption_ar,
            images[lightboxIdx].caption_en,
            locale
          ) && (
            <p className="mt-3 text-sm text-white/90 text-center max-w-2xl">
              {pickLocalized(
                images[lightboxIdx].caption_ar,
                images[lightboxIdx].caption_en,
                locale
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
