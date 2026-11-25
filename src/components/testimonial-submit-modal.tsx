"use client";

import { useState } from "react";
import {
  X,
  Star,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  Video,
} from "lucide-react";
import type { TestimonialCourseRef } from "@/lib/testimonials";

interface TestimonialSubmitModalProps {
  open: boolean;
  onClose: () => void;
  courses: TestimonialCourseRef[];
  locale: string;
}

export default function TestimonialSubmitModal({
  open,
  onClose,
  courses,
  locale,
}: TestimonialSubmitModalProps) {
  const isRtl = locale === "ar";

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaUrl, setMediaUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const resetForm = () => {
    setName("");
    setTitle("");
    setCourseId("");
    setRating(5);
    setContent("");
    setMediaType("none");
    setMediaUrl("");
    setError(null);
    setSubmitted(false);
  };

  const handleClose = () => {
    if (submitted) resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError(
        isRtl
          ? "يرجى كتابة اسمك الكامل (حرفين على الأقل)."
          : "Please enter your full name."
      );
      return;
    }

    if (title.trim().length < 2) {
      setError(
        isRtl
          ? "يرجى كتابة تخصصك أو مسماك الوظيفي."
          : "Please enter your specialty or job title."
      );
      return;
    }

    if (content.trim().length < 10) {
      setError(
        isRtl
          ? "يرجى كتابة تجربتك (10 أحرف على الأقل)."
          : "Please write at least 10 characters about your experience."
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          title: title.trim(),
          content: content.trim(),
          rating,
          course_id: courseId || null,
          media_type: mediaType === "none" ? null : mediaType,
          media_url: mediaType === "none" ? null : mediaUrl.trim() || null,
          locale: isRtl ? "ar" : "en",
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(
          json.error ||
            (isRtl ? "تعذر إرسال التقييم، حاول مرة أخرى." : "Failed to submit review.")
        );
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || (isRtl ? "حدث خطأ غير متوقع" : "Unexpected error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-xl rounded-3xl glass-panel bg-card border border-border/80 shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-cyan/15 text-brand-cyan flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                {isRtl ? "شاركنا تجربتك ورأيك" : "Share Your Experience"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isRtl
                  ? "سيتم مراجعة تقييمك من قِبل الإدارة قبل نشره على المنصة"
                  : "Your review will be reviewed by our team before publishing"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-extrabold text-foreground">
                {isRtl
                  ? "شكراً لمشاركتنا تجربتك!"
                  : "Thank You for Sharing Your Review!"}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                {isRtl
                  ? "تم استلام تقييمك بنجاح وحفظه بحالة «قيد المراجعة». سيظهر في الصفحة الرئيسية فور موافقة إدارة المنصة."
                  : "Your review has been received and saved as Pending Review. It will appear on the homepage once approved by the admin."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md transition-all"
            >
              {isRtl ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "الاسم بالكامل *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isRtl ? "مثال: م. أحمد خالد" : "e.g. Eng. Ahmed Khaled"}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "التخصص / المسمى الوظيفي *" : "Specialty / Job Title *"}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isRtl
                      ? "مثال: مهندس نظم معلومات جغرافية"
                      : "e.g. GIS & Remote Sensing Engineer"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
                  <span>{isRtl ? "الكورس أو المنصة" : "Course or Platform"}</span>
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                >
                  <option value="">
                    {isRtl ? "المنصة بشكل عام" : "General Platform Experience"}
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isRtl ? c.title_ar || c.title_en : c.title_en || c.title_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "التقييم بالنجوم *" : "Star Rating *"}
                </label>
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-background border border-border">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-muted-foreground ms-auto px-1">
                    {rating}/5
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "نص التجربة والرأي *" : "Your Review & Experience *"}
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isRtl
                    ? "حدثنا عن تجربتك التعليمية وكيف استفدت من الكورس أو المنصة..."
                    : "Tell us about your learning experience with Fathy Geo Code..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 resize-none"
              />
            </div>

            {/* Optional Media URL */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border/60">
              <label className="text-xs font-bold text-foreground block">
                {isRtl
                  ? "رابط صورة أو فيديو اختياري (إن وجد)"
                  : "Optional Image or Video Link"}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: "none", label: isRtl ? "بدون" : "None", icon: null },
                  { val: "image", label: isRtl ? "رابط صورة" : "Image URL", icon: ImageIcon },
                  { val: "video", label: isRtl ? "فيديو يوتيوب" : "YouTube Video", icon: Video },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = mediaType === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setMediaType(opt.val as "none" | "image" | "video");
                        if (opt.val === "none") setMediaUrl("");
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? "bg-brand-blue text-white border-brand-blue"
                          : "bg-background text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {mediaType !== "none" && (
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={
                    mediaType === "video"
                      ? "https://www.youtube.com/watch?v=..."
                      : "https://example.com/image.jpg"
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md disabled:opacity-60 transition-all"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {submitting
                    ? isRtl
                      ? "جاري الإرسال..."
                      : "Submitting..."
                    : isRtl
                    ? "إرسال التقييم"
                    : "Submit Review"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
