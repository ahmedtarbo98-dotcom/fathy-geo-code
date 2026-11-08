"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/image-upload";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  X,
  Save,
  DollarSign,
  Star,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface CourseRow {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_description_ar: string;
  short_description_en: string;
  description_ar: string;
  description_en: string;
  thumbnail_url: string | null;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "all_levels";
  is_free: boolean;
  price: number;
  currency: "USD" | "EGP";
  status: "published" | "draft" | "archived";
  is_featured: boolean;
  created_at: string;
}

export default function AdminCoursesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form Fields
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [shortDescAr, setShortDescAr] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [category, setCategory] = useState("GIS & Mapping");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all_levels">("beginner");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("0");
  const [currency, setCurrency] = useState<"USD" | "EGP">("USD");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<"published" | "draft">("published");

  // Fetch courses from Supabase
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchErr) throw fetchErr;
      setCourses((data as CourseRow[]) || []);
    } catch (err: any) {
      console.error("Failed to load courses:", err);
      setError(err.message || "Failed to fetch courses from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCourseId(null);
    setTitleAr("");
    setTitleEn("");
    setShortDescAr("");
    setShortDescEn("");
    setDescAr("");
    setDescEn("");
    setThumbnailUrl("/logo.jpg");
    setCategory("GIS & Mapping");
    setLevel("beginner");
    setIsFree(true);
    setPrice("0");
    setCurrency("USD");
    setIsFeatured(false);
    setStatus("published");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (course: CourseRow) => {
    setEditingCourseId(course.id);
    setTitleAr(course.title_ar);
    setTitleEn(course.title_en);
    setShortDescAr(course.short_description_ar || "");
    setShortDescEn(course.short_description_en || "");
    setDescAr(course.description_ar || "");
    setDescEn(course.description_en || "");
    setThumbnailUrl(course.thumbnail_url || "/logo.jpg");
    setCategory(course.category || "GIS & Mapping");
    setLevel(course.level || "beginner");
    setIsFree(course.is_free);
    setPrice(course.price ? course.price.toString() : "0");
    setCurrency(course.currency || "USD");
    setIsFeatured(course.is_featured || false);
    setStatus(course.status === "draft" ? "draft" : "published");
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleAr.trim() || !titleEn.trim()) {
      alert(isRtl ? "يرجى كتابة عنوان الدورة بالعربية والإنجليزية" : "Please fill in course titles in both languages");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Generate slug from English title
      const baseSlug =
        titleEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") || `course-${Date.now()}`;

      const payload = {
        title_ar: titleAr,
        title_en: titleEn,
        short_description_ar: shortDescAr || titleAr,
        short_description_en: shortDescEn || titleEn,
        description_ar: descAr || shortDescAr || titleAr,
        description_en: descEn || shortDescEn || titleEn,
        thumbnail_url: thumbnailUrl || "/logo.jpg",
        category,
        level,
        is_free: isFree,
        price: isFree ? 0 : parseFloat(price) || 0,
        currency,
        is_featured: isFeatured,
        status,
        updated_at: new Date().toISOString(),
      };

      if (editingCourseId) {
        // UPDATE existing
        const { error: updateErr } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", editingCourseId);

        if (updateErr) throw updateErr;
      } else {
        // INSERT new
        const { error: insertErr } = await supabase
          .from("courses")
          .insert({
            slug: baseSlug,
            ...payload,
            what_you_will_learn_ar: [],
            what_you_will_learn_en: [],
            requirements_ar: [],
            requirements_en: [],
          });

        if (insertErr) throw insertErr;
      }

      setIsModalOpen(false);
      await loadCourses();
    } catch (err: any) {
      console.error("Error saving course:", err);
      alert(isRtl ? `خطأ أثناء الحفظ: ${err.message}` : `Error saving course: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle publish/unpublish directly from row
  const togglePublish = async (course: CourseRow) => {
    const nextStatus = course.status === "published" ? "draft" : "published";
    try {
      const { error: updateErr } = await supabase
        .from("courses")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", course.id);

      if (updateErr) throw updateErr;

      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: nextStatus } : c))
      );
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  // Delete Course (Safe with Cascade)
  const handleDeleteCourse = async (id: string, title: string) => {
    const confirmMsg = isRtl
      ? `تحذير هام: هل أنت متأكد من حذف دورة "${title}"؟\nسيتم حذف جميع الأقسام والدروس وتقدم الطلاب المرتبط بها بأمان وبشكل نهائي.`
      : `Warning: Are you sure you want to delete course "${title}"?\nAll associated sections, lessons, and progress records will be safely removed.`;

    if (!confirm(confirmMsg)) return;

    try {
      setLoading(true);
      const { error: delErr } = await supabase.from("courses").delete().eq("id", id);
      if (delErr) throw delErr;

      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error("Delete course error:", err);
      alert(isRtl ? `فشل الحذف: ${err.message}` : `Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{t("courses")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "إدارة الدورات التدريبية، تعديل الأسعار، رفع البوسترات من جهازك، ونشر/إلغاء نشر الدورات"
              : "Manage courses, pricing, device thumbnail uploads, and publish/unpublish settings"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCourses}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isRtl ? "تحديث القائمة" : "Refresh list"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md shadow-brand-blue/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addNewCourse")}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Courses List */}
      {loading && courses.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
          <p className="text-xs font-medium">
            {isRtl ? "جارٍ تحميل الدورات من قاعدة البيانات..." : "Loading courses from database..."}
          </p>
        </div>
      ) : courses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/40 space-y-3">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-bold text-foreground">
            {isRtl ? "لا توجد دورات حالياً" : "No courses found"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isRtl
              ? "ابدأ بإضافة أول دورة تدريبية ورفع بوسترها من جهازك عبر الزر أعلاه."
              : "Get started by adding your first course and uploading its thumbnail from your computer."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const courseTitle = isRtl ? course.title_ar : course.title_en;
            const courseDesc = isRtl ? course.short_description_ar : course.short_description_en;

            return (
              <div
                key={course.id}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Header */}
                <div className="relative w-full aspect-video bg-muted overflow-hidden">
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={courseTitle}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-navy text-white text-xs font-bold">
                      FATHY GEO CODE
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-2.5 start-2.5 flex items-center gap-1.5 z-10">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                        course.status === "published"
                          ? "bg-emerald-500/90 text-white backdrop-blur-[2px]"
                          : "bg-amber-500/90 text-white backdrop-blur-[2px]"
                      }`}
                    >
                      {course.status === "published"
                        ? isRtl ? "منشور" : "Published"
                        : isRtl ? "مسودة" : "Draft"}
                    </span>

                    {course.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-cyan text-brand-navy shadow-sm flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-brand-navy" />
                        <span>{isRtl ? "مميز" : "Featured"}</span>
                      </span>
                    )}
                  </div>

                  {/* Price Badge */}
                  <div className="absolute bottom-2.5 end-2.5 z-10">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shadow-md ${
                        course.is_free
                          ? "bg-emerald-500 text-white"
                          : "bg-black/80 text-brand-cyan border border-brand-cyan/30 backdrop-blur-sm"
                      }`}
                    >
                      {course.is_free ? (isRtl ? "مجاني" : "FREE") : `${course.price} ${course.currency}`}
                    </span>
                  </div>
                </div>

                {/* Body Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                      <span>{course.category}</span>
                      <span className="capitalize">{course.level}</span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1">
                      {courseTitle}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {courseDesc}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                    {/* Toggle publish button */}
                    <button
                      onClick={() => togglePublish(course)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                        course.status === "published"
                          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                      }`}
                      title={course.status === "published" ? "إلغاء النشر" : "نشر الدورة"}
                    >
                      {course.status === "published" ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{isRtl ? "إلغاء النشر" : "Unpublish"}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isRtl ? "نشر الدورة" : "Publish"}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(course)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title={isRtl ? "تعديل الدورة" : "Edit course"}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteCourse(course.id, courseTitle)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title={isRtl ? "حذف الدورة" : "Delete course"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-3xl rounded-3xl bg-card border border-border/80 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/80 bg-muted/30">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
                <h2 className="text-base font-extrabold text-foreground">
                  {editingCourseId
                    ? isRtl ? "تعديل بيانات الدورة" : "Edit Course Details"
                    : isRtl ? "إضافة دورة تدريبية جديدة" : "Add New Course"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourse} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* THUMBNAIL UPLOAD FROM DEVICE */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  {isRtl ? "بوستر / غلاف الدورة (رفع من جهازك)" : "Course Thumbnail (Upload from computer)"}
                </label>
                <ImageUpload
                  value={thumbnailUrl}
                  onChange={setThumbnailUrl}
                  bucket="course-images"
                  folder="courses"
                  locale={locale}
                  maxSizeMB={2}
                />
              </div>

              {/* Titles AR & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "عنوان الدورة (بالعربية) *" : "Course Title (Arabic) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: أساسيات وتطبيقات ArcGIS Pro"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "عنوان الدورة (بالإنجليزية) *" : "Course Title (English) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. ArcGIS Pro Fundamentals"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Short Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "الوصف المختصر (بالعربية)" : "Short Description (Arabic)"}
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescAr}
                    onChange={(e) => setShortDescAr(e.target.value)}
                    placeholder="نبذة سريعة تظهر في كارت الدورة..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "الوصف المختصر (بالإنجليزية)" : "Short Description (English)"}
                  </label>
                  <textarea
                    rows={2}
                    value={shortDescEn}
                    onChange={(e) => setShortDescEn(e.target.value)}
                    placeholder="Brief summary shown on course card..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Detailed Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "الوصف الكامل والشامل (بالعربية)" : "Full Description (Arabic)"}
                  </label>
                  <textarea
                    rows={3}
                    value={descAr}
                    onChange={(e) => setDescAr(e.target.value)}
                    placeholder="تفاصيل محتوى الدورة وأهدافها..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "الوصف الكامل والشامل (بالإنجليزية)" : "Full Description (English)"}
                  </label>
                  <textarea
                    rows={3}
                    value={descEn}
                    onChange={(e) => setDescEn(e.target.value)}
                    placeholder="Detailed syllabus description..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* Category & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "التصنيف / المجال" : "Category"}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none"
                  >
                    <option value="GIS & Mapping">GIS & Mapping (نظم المعلومات الجغرافية)</option>
                    <option value="Remote Sensing">Remote Sensing (الاستشعار عن بعد)</option>
                    <option value="Surveying & Geodesy">Surveying & Geodesy (المساحة والجيوديسيا)</option>
                    <option value="Spatial Modeling">Spatial Modeling (النمذجة المكانية MCE)</option>
                    <option value="Google Earth Engine">Google Earth Engine (GEE)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "مستوى الدورة" : "Course Level"}
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none"
                  >
                    <option value="beginner">{isRtl ? "مبتدئ (Beginner)" : "Beginner"}</option>
                    <option value="intermediate">{isRtl ? "متوسط (Intermediate)" : "Intermediate"}</option>
                    <option value="advanced">{isRtl ? "متقدم (Advanced)" : "Advanced"}</option>
                    <option value="all_levels">{isRtl ? "جميع المستويات (All Levels)" : "All Levels"}</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Free / Paid */}
              <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {isRtl ? "نوع الدورة من حيث الدفع" : "Pricing Model"}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFree(true)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        isFree
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isRtl ? "دورة مجانية" : "Free Course"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsFree(false)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        !isFree
                          ? "bg-brand-blue text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {isRtl ? "دورة مدفوعة" : "Paid Course"}
                    </button>
                  </div>
                </div>

                {!isFree && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">
                        {isRtl ? "سعر الدورة" : "Price"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-foreground">
                        {isRtl ? "العملة" : "Currency"}
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                      >
                        <option value="USD">USD ($ دولار أمريكي)</option>
                        <option value="EGP">EGP (ج.م جنيه مصري)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "حالة النشر" : "Publish Status"}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none"
                  >
                    <option value="published">{isRtl ? "منشور للعامة (Published)" : "Published"}</option>
                    <option value="draft">{isRtl ? "مسودة غير منشورة (Draft)" : "Draft"}</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-cyan"></div>
                    <span className="ms-3 text-xs font-bold text-foreground">
                      {isRtl ? "عرض في قسم الدورات المميزة بالرئيسية" : "Feature on Homepage"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md shadow-brand-blue/20 transition-colors"
                >
                  <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                  <span>{saving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : (isRtl ? "حفظ الدورة" : "Save Course")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
