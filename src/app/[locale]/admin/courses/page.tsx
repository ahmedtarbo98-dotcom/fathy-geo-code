"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getCourses, CourseDetailData } from "@/lib/data/courses";
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
} from "lucide-react";

export default function AdminCoursesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const [coursesList, setCoursesList] = useState<CourseDetailData[]>(getCourses());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState("GIS & Mapping");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all_levels">("beginner");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("0");
  const [shortDescAr, setShortDescAr] = useState("");
  const [shortDescEn, setShortDescEn] = useState("");

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const newCourse: CourseDetailData = {
      id: `c-${Date.now()}`,
      slug: titleEn.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `course-${Date.now()}`,
      title_ar: titleAr,
      title_en: titleEn,
      short_description_ar: shortDescAr,
      short_description_en: shortDescEn,
      description_ar: shortDescAr,
      description_en: shortDescEn,
      what_you_will_learn_ar: [],
      what_you_will_learn_en: [],
      requirements_ar: [],
      requirements_en: [],
      thumbnail_url: "/logo.jpg",
      thumbnailGradient: "from-blue-600 to-brand-navy",
      category,
      level,
      level_ar: level === "beginner" ? "مبتدئ" : "متقدم",
      level_en: level,
      is_free: isFree,
      price: isFree ? 0 : parseFloat(price) || 0,
      currency: "USD",
      status: "published",
      sections: [],
    };

    setCoursesList([newCourse, ...coursesList]);
    setIsModalOpen(false);
    setTitleAr("");
    setTitleEn("");
    setShortDescAr("");
    setShortDescEn("");
  };

  const toggleStatus = (id: string) => {
    setCoursesList((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "published" ? "draft" : "published" }
          : c
      )
    );
  };

  const deleteCourse = (id: string) => {
    if (confirm(locale === "ar" ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?")) {
      setCoursesList((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("courses")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "إنشاء وإدارة ونشر الدورات التدريبية في مجالات الجيوماتكس ونظم المعلومات"
              : "Create, edit, publish, and reorder geospatial learning programs"}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t("addNewCourse")}</span>
        </button>
      </div>

      {/* Courses Table */}
      <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 text-start">{locale === "ar" ? "عنوان الدورة" : "Course Title"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "التصنيف" : "Category"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "السعر / النوع" : "Price"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="p-4 text-end">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {coursesList.map((course) => {
                const title = locale === "ar" ? course.title_ar : course.title_en;
                const isPub = course.status === "published";

                return (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{title}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        slug: /{course.slug}
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-muted text-foreground">
                        {course.category}
                      </span>
                    </td>

                    <td className="p-4">
                      {course.is_free ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {locale === "ar" ? "مجانية" : "Free"}
                        </span>
                      ) : (
                        <span className="font-bold text-foreground font-mono">
                          ${course.price}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(course.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          isPub
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        }`}
                      >
                        {isPub ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        <span>{isPub ? (locale === "ar" ? "منشورة" : "Published") : (locale === "ar" ? "مسودة" : "Draft")}</span>
                      </button>
                    </td>

                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl glass-panel p-6 sm:p-8 border border-border shadow-2xl bg-card space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-blue" />
                <span>{t("addNewCourse")}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    عنوان الدورة بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: تحليل البيانات المكانية في ArcGIS Pro"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    Course Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g. Spatial Analysis in ArcGIS Pro"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    التصنيف (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  >
                    <option value="GIS & Mapping">GIS & Mapping</option>
                    <option value="Remote Sensing">Remote Sensing</option>
                    <option value="Spatial Modeling">Spatial Modeling</option>
                    <option value="Surveying">Surveying</option>
                    <option value="Tips & Automation">Tips & Automation</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    المستوى (Level)
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
                  >
                    <option value="beginner">Beginner (مبتدئ)</option>
                    <option value="intermediate">Intermediate (متوسط)</option>
                    <option value="advanced">Advanced (متقدم)</option>
                    <option value="all_levels">All Levels (شامل)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    السعر بالدولار ($)
                  </label>
                  <input
                    type="number"
                    disabled={isFree}
                    value={isFree ? 0 : price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isFreeCheck"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="rounded border-border text-brand-blue"
                />
                <label htmlFor="isFreeCheck" className="text-xs font-semibold text-foreground cursor-pointer">
                  دورة مجانية متاحة للجميع (Free Course)
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  وصف مختصر بالعربية
                </label>
                <textarea
                  rows={2}
                  value={shortDescAr}
                  onChange={(e) => setShortDescAr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Short Description (English)
                </label>
                <textarea
                  rows={2}
                  value={shortDescEn}
                  onChange={(e) => setShortDescEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-md"
                >
                  حفظ ونشر الدورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
