"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Star,
  Quote,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  BookOpen,
  Play,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { extractYouTubeId } from "@/lib/youtube";
import {
  pickLocalizedField,
  type TestimonialCourseRef,
  type TestimonialRecord,
} from "@/lib/testimonials";
import TestimonialSubmitModal from "@/components/testimonial-submit-modal";

export default function TestimonialsSection({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const t = useTranslations("Testimonials");
  const isRtl = currentLocale === "ar";

  const [testimonials, setTestimonials] = useState<TestimonialRecord[]>([]);
  const [courses, setCourses] = useState<TestimonialCourseRef[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    type: "image" | "video";
    url: string;
    author: string;
  } | null>(null);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadTestimonials() {
      try {
        const res = await fetch("/api/testimonials", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        setTestimonials(json.testimonials || []);
        setCourses(json.courses || []);
      } catch (err) {
        console.error("Testimonials load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTestimonials();
  }, []);

  const totalPages = Math.max(1, Math.ceil(testimonials.length / itemsPerPage));

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [currentPage, totalPages]);

  const visibleTestimonials = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return testimonials.slice(start, start + itemsPerPage);
  }, [testimonials, currentPage, itemsPerPage]);

  const goPrev = () => {
    setCurrentPage((p) => (p - 1 + totalPages) % totalPages);
  };

  const goNext = () => {
    setCurrentPage((p) => (p + 1) % totalPages);
  };

  return (
    <section
      id="testimonials"
      className="py-20 relative overflow-hidden"
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-cyan">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span>{t("badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground dark:text-[#F2EBDD]">
            {t("title")}
          </h2>
          <p className="text-brand-muted text-sm sm:text-base leading-relaxed">
            {t("subtitle")}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-blue/20 transition-all hover:-translate-y-0.5"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{t("shareExperience")}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl glass-panel border border-border/60 animate-pulse bg-muted/20"
              />
            ))}
          </div>
        ) : testimonials.length === 0 ? (
          <div className="max-w-xl mx-auto rounded-3xl glass-panel p-8 sm:p-10 border border-border/70 text-center space-y-4">
            <Quote className="w-10 h-10 text-brand-cyan/40 mx-auto" />
            <p className="text-sm sm:text-base font-semibold text-muted-foreground">
              {t("emptyState")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {visibleTestimonials.map((item) => {
                const name = pickLocalizedField(
                  item.student_name_ar,
                  item.student_name_en,
                  currentLocale
                );
                const role = pickLocalizedField(
                  item.student_title_ar,
                  item.student_title_en,
                  currentLocale
                );
                const text = pickLocalizedField(
                  item.content_ar,
                  item.content_en,
                  currentLocale
                );
                const courseTitle = item.course
                  ? pickLocalizedField(
                      item.course.title_ar,
                      item.course.title_en,
                      currentLocale
                    )
                  : t("generalPlatform");

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl glass-panel p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between group shadow-lg hover:shadow-brand-blue/10 ${
                      item.is_featured
                        ? "border-brand-cyan/50 ring-1 ring-brand-cyan/20"
                        : "border-border/80"
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top row: Stars + Featured badge + Quote */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(item.rating || 5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.is_featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
                              <Sparkles className="w-3 h-3" />
                              {t("featured")}
                            </span>
                          )}
                          <Quote className="w-7 h-7 text-brand-cyan/20 group-hover:text-brand-cyan/40 transition-colors shrink-0" />
                        </div>
                      </div>

                      {/* Review Text */}
                      <p className="text-sm leading-relaxed text-foreground/90 italic">
                        &ldquo;{text}&rdquo;
                      </p>

                      {/* Optional Media Attachment */}
                      {item.media_type && item.media_url && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewMedia({
                              type: item.media_type!,
                              url: item.media_url!,
                              author: name,
                            })
                          }
                          className="w-full rounded-xl border border-border/70 bg-muted/40 hover:bg-muted/70 px-3 py-2 flex items-center justify-between text-xs font-semibold text-foreground transition-colors"
                        >
                          <span className="inline-flex items-center gap-2">
                            {item.media_type === "video" ? (
                              <Play className="w-4 h-4 text-red-500 fill-current" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-brand-cyan" />
                            )}
                            <span>
                              {item.media_type === "video"
                                ? isRtl
                                  ? "مشاهدة فيديو التقييم"
                                  : "Watch Review Video"
                                : isRtl
                                ? "عرض صورة التقييم"
                                : "View Review Image"}
                            </span>
                          </span>
                          <span className="text-[11px] text-brand-cyan">
                            {isRtl ? "عرض" : "Open"}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Footer: Course Badge + Author */}
                    <div className="pt-5 mt-5 border-t border-border/50 space-y-3">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-cyan bg-brand-cyan/10 px-2.5 py-1 rounded-lg max-w-full">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{courseTitle}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.avatar_url ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border shrink-0">
                            <Image
                              src={item.avatar_url}
                              alt={name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5 truncate">
                            <span className="truncate">{name}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                          </h4>
                          {role && (
                            <p className="text-xs text-muted-foreground truncate">{role}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carousel Navigation Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={isRtl ? goNext : goPrev}
                  aria-label="Previous"
                  className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
                >
                  {isRtl ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPage(idx)}
                      aria-label={`Page ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentPage
                          ? "w-7 bg-brand-cyan"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={isRtl ? goPrev : goNext}
                  aria-label="Next"
                  className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
                >
                  {isRtl ? (
                    <ChevronLeft className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <TestimonialSubmitModal
        open={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        courses={courses}
        locale={currentLocale}
      />

      {/* Media Preview Modal */}
      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewMedia(null)}
        >
          <div
            className="relative w-full max-w-3xl rounded-2xl bg-card border border-border overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-xs font-bold text-foreground">
                {previewMedia.author}
              </span>
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              {previewMedia.type === "image" ? (
                <img
                  src={previewMedia.url}
                  alt={previewMedia.author}
                  className="max-h-[75vh] w-auto rounded-lg object-contain"
                />
              ) : extractYouTubeId(previewMedia.url) ? (
                <div className="w-full aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(
                      previewMedia.url
                    )}?autoplay=1`}
                    className="w-full h-full rounded-lg"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video
                  src={previewMedia.url}
                  controls
                  autoPlay
                  className="max-h-[75vh] w-full rounded-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
