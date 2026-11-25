"use client";

import { useEffect, useState } from "react";
import {
  X,
  Star,
  Sparkles,
  Image as ImageIcon,
  Video,
  Save,
  RefreshCw,
  AlertCircle,
  User,
  BookOpen,
} from "lucide-react";
import ImageUpload from "@/components/image-upload";
import type {
  TestimonialCourseRef,
  TestimonialRecord,
  TestimonialStatus,
} from "@/lib/testimonials";

interface TestimonialModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  testimonial: TestimonialRecord | null;
  courses: TestimonialCourseRef[];
  locale: string;
  authHeaders: Record<string, string>;
}

export default function TestimonialModal({
  open,
  onClose,
  onSaved,
  testimonial,
  courses,
  locale,
  authHeaders,
}: TestimonialModalProps) {
  const isRtl = locale === "ar";
  const isEdit = Boolean(testimonial);

  const [studentNameAr, setStudentNameAr] = useState("");
  const [studentNameEn, setStudentNameEn] = useState("");
  const [studentTitleAr, setStudentTitleAr] = useState("");
  const [studentTitleEn, setStudentTitleEn] = useState("");
  const [contentAr, setContentAr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [rating, setRating] = useState(5);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [courseId, setCourseId] = useState<string>("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [status, setStatus] = useState<TestimonialStatus>("published");
  const [isFeatured, setIsFeatured] = useState(false);
  const [orderIndex, setOrderIndex] = useState(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (testimonial) {
      setStudentNameAr(testimonial.student_name_ar || "");
      setStudentNameEn(testimonial.student_name_en || "");
      setStudentTitleAr(testimonial.student_title_ar || "");
      setStudentTitleEn(testimonial.student_title_en || "");
      setContentAr(testimonial.content_ar || "");
      setContentEn(testimonial.content_en || "");
      setRating(testimonial.rating || 5);
      setAvatarUrl(testimonial.avatar_url || "");
      setCourseId(testimonial.course_id || "");
      setMediaType(
        testimonial.media_type === "image" || testimonial.media_type === "video"
          ? testimonial.media_type
          : "none"
      );
      setMediaUrl(testimonial.media_url || "");
      setStatus(
        testimonial.status || (testimonial.is_published ? "published" : "hidden")
      );
      setIsFeatured(Boolean(testimonial.is_featured));
      setOrderIndex(testimonial.order_index ?? 0);
    } else {
      setStudentNameAr("");
      setStudentNameEn("");
      setStudentTitleAr("");
      setStudentTitleEn("");
      setContentAr("");
      setContentEn("");
      setRating(5);
      setAvatarUrl("");
      setCourseId("");
      setMediaType("none");
      setMediaUrl("");
      setStatus("published");
      setIsFeatured(false);
      setOrderIndex(0);
    }
  }, [open, testimonial]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!studentNameAr.trim() && !studentNameEn.trim()) {
      setError(
        isRtl
          ? "يرجى إدخال اسم صاحب التقييم (بالعربية أو الإنجليزية)."
          : "Please enter the reviewer name."
      );
      return;
    }

    if (!contentAr.trim() && !contentEn.trim()) {
      setError(
        isRtl
          ? "يرجى كتابة نص التجربة والتقييم."
          : "Please enter the review content."
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...(isEdit ? { id: testimonial!.id } : {}),
        student_name_ar: studentNameAr.trim(),
        student_name_en: studentNameEn.trim(),
        student_title_ar: studentTitleAr.trim(),
        student_title_en: studentTitleEn.trim(),
        content_ar: contentAr.trim(),
        content_en: contentEn.trim(),
        rating,
        avatar_url: avatarUrl.trim() || null,
        course_id: courseId || null,
        media_type: mediaType === "none" ? null : mediaType,
        media_url: mediaType === "none" ? null : mediaUrl.trim() || null,
        status,
        is_featured: isFeatured,
        order_index: Number.isFinite(orderIndex) ? Math.max(0, orderIndex) : 0,
      };

      const res = await fetch("/api/admin/testimonials", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || (isRtl ? "حدث خطأ أثناء الحفظ" : "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl rounded-3xl glass-panel border border-border/80 bg-card shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-blue/15 text-brand-blue flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-foreground">
                {isEdit
                  ? isRtl
                    ? "تعديل تقييم المتدرب"
                    : "Edit Trainee Review"
                  : isRtl
                  ? "إضافة تقييم جديد"
                  : "Add New Review"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isRtl
                  ? "أدخل بيانات المتدرب ونص التجربة وحالة النشر"
                  : "Fill in reviewer details, rating, and publication status"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Reviewer Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "اسم صاحب التقييم (عربي) *" : "Reviewer Name (Arabic) *"}
              </label>
              <input
                type="text"
                value={studentNameAr}
                onChange={(e) => setStudentNameAr(e.target.value)}
                placeholder={isRtl ? "مثال: م. محمد علي" : "e.g. Eng. Mohamed Ali"}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "اسم صاحب التقييم (إنجليزي)" : "Reviewer Name (English)"}
              </label>
              <input
                type="text"
                value={studentNameEn}
                onChange={(e) => setStudentNameEn(e.target.value)}
                placeholder="Eng. Mohamed Ali"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التخصص / المسمى الوظيفي (عربي)" : "Specialty / Title (Arabic)"}
              </label>
              <input
                type="text"
                value={studentTitleAr}
                onChange={(e) => setStudentTitleAr(e.target.value)}
                placeholder={
                  isRtl ? "مثال: أخصائي نظم معلومات جغرافية" : "GIS Specialist"
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التخصص / المسمى الوظيفي (إنجليزي)" : "Specialty / Title (English)"}
              </label>
              <input
                type="text"
                value={studentTitleEn}
                onChange={(e) => setStudentTitleEn(e.target.value)}
                placeholder="GIS & Remote Sensing Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-cyan" />
                <span>{isRtl ? "الصورة الشخصية (اختياري)" : "Profile Avatar (Optional)"}</span>
              </label>
            </div>
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              bucket="testimonial-media"
              folder="avatars"
              locale={locale}
              maxSizeMB={3}
            />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder={
                isRtl
                  ? "أو الصق رابط الصورة الشخصية مباشرة (https://...)"
                  : "Or paste avatar image URL directly (https://...)"
              }
              className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
            />
          </div>

          {/* Rating & Linked Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التقييم بالنجوم (1 إلى 5)" : "Star Rating (1 to 5)"}
              </label>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-background border border-border">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                    title={`${star} / 5`}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-muted-foreground ms-auto px-2">
                  {rating} / 5
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{isRtl ? "ربط التقييم بـ" : "Linked Course / Scope"}</span>
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              >
                <option value="">
                  {isRtl ? "المنصة بشكل عام (عام)" : "General Platform Review"}
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isRtl ? c.title_ar || c.title_en : c.title_en || c.title_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Review Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "نص التجربة (عربي) *" : "Review Text (Arabic) *"}
              </label>
              <textarea
                rows={4}
                value={contentAr}
                onChange={(e) => setContentAr(e.target.value)}
                placeholder={
                  isRtl
                    ? "اكتب تجربة الطالب أو المهندس مع الكورس أو المنصة..."
                    : "Review text in Arabic..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "نص التجربة (إنجليزي)" : "Review Text (English)"}
              </label>
              <textarea
                rows={4}
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                placeholder="Review text in English (optional)..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40 resize-none"
              />
            </div>
          </div>

          {/* Optional Media Attachment */}
          <div className="space-y-3 p-4 rounded-2xl bg-muted/30 border border-border/60">
            <label className="text-xs font-bold text-foreground block">
              {isRtl
                ? "مرفق اختياري للتقييم (صورة أو فيديو)"
                : "Optional Review Attachment (Image or Video)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { val: "none", label: isRtl ? "بدون مرفق" : "None", icon: null },
                { val: "image", label: isRtl ? "صورة" : "Image", icon: ImageIcon },
                { val: "video", label: isRtl ? "فيديو (YouTube / MP4)" : "Video (YouTube / MP4)", icon: Video },
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
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                      active
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm"
                        : "bg-background text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {mediaType === "image" && (
              <div className="space-y-2 pt-2">
                <ImageUpload
                  value={mediaUrl}
                  onChange={setMediaUrl}
                  bucket="testimonial-media"
                  folder="attachments"
                  locale={locale}
                  maxSizeMB={5}
                />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={
                    isRtl ? "أو رابط الصورة (https://...)" : "Or image URL (https://...)"
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                />
              </div>
            )}

            {mediaType === "video" && (
              <div className="space-y-1.5 pt-2">
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                />
              </div>
            )}
          </div>

          {/* Publishing Status, Featured & Order */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/60">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "حالة التقييم" : "Review Status"}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TestimonialStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              >
                <option value="published">{isRtl ? "منشور" : "Published"}</option>
                <option value="pending">{isRtl ? "قيد المراجعة" : "Pending Review"}</option>
                <option value="hidden">{isRtl ? "مخفي" : "Hidden"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "ترتيب الظهور" : "Display Order"}
              </label>
              <input
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value || "0", 10))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
              />
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none p-2.5 rounded-xl border border-border bg-background w-full">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isRtl ? "تقييم مميز" : "Featured Review"}
                </span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md disabled:opacity-60 transition-all"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saving
                  ? isRtl
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isEdit
                  ? isRtl
                    ? "حفظ التعديلات"
                    : "Save Changes"
                  : isRtl
                  ? "إضافة التقييم"
                  : "Create Review"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
