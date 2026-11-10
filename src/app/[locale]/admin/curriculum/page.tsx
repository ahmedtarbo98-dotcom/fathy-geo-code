"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Layers,
  Plus,
  PlayCircle,
  Video,
  FileCode,
  Link2,
  Trash2,
  CheckCircle2,
  Eye,
  Clock,
  Sparkles,
  Edit,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CourseOption {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
}

interface LessonResource {
  id: string;
  title_ar: string;
  title_en: string;
  external_url: string;
  resource_type: "file" | "link";
  order_index: number;
}

interface LessonItem {
  id: string;
  section_id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string | null;
  description_en: string | null;
  duration_seconds: number;
  is_free_preview: boolean;
  order_index: number;
  video_id?: string;
  resources: LessonResource[];
}

interface SectionItem {
  id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  order_index: number;
  lessons: LessonItem[];
}

function AdminCurriculumContent({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlCourseId = searchParams.get("courseId");

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Helper function to extract YouTube video ID
  const extractYouTubeId = (url: string) => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.length === 11 && !trimmed.includes("/") && !trimmed.includes(".")) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return match && match[2].length === 11 ? match[2] : trimmed;
  };

  // Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [secTitleAr, setSecTitleAr] = useState("");
  const [secTitleEn, setSecTitleEn] = useState("");

  // Lesson Modal State
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<string>("");
  const [lessonTitleAr, setLessonTitleAr] = useState("");
  const [lessonTitleEn, setLessonTitleEn] = useState("");
  const [lessonDescAr, setLessonDescAr] = useState("");
  const [lessonDescEn, setLessonDescEn] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDurationMin, setLessonDurationMin] = useState("15");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [lessonResources, setLessonResources] = useState<
    { id?: string; title_ar: string; external_url: string }[]
  >([]);

  // Resource input row
  const [newResTitle, setNewResTitle] = useState("");
  const [newResUrl, setNewResUrl] = useState("");

  // 1. Fetch courses
  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("courses")
          .select("id, title_ar, title_en, slug")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && data.length > 0) {
          setCourses(data);
          const matchedCourse = urlCourseId ? data.find((c) => c.id === urlCourseId) : null;
          setSelectedCourseId(matchedCourse ? matchedCourse.id : data[0].id);
        }
      } catch (err) {
        console.error("Failed to load courses for curriculum:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, [urlCourseId]);

  // 2. Fetch sections, lessons, videos & resources for selected course
  const loadCurriculum = async (courseId: string) => {
    if (!courseId) return;
    try {
      setLoading(true);

      // Fetch sections
      const { data: secData, error: secErr } = await supabase
        .from("course_sections")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (secErr) throw secErr;

      // Fetch lessons
      const { data: lesData, error: lesErr } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lesErr) throw lesErr;

      // Fetch videos (Admin permitted via RLS)
      const lessonIds = (lesData || []).map((l) => l.id);
      let videosMap: Record<string, string> = {};
      let resourcesMap: Record<string, LessonResource[]> = {};

      if (lessonIds.length > 0) {
        const { data: vidData } = await supabase
          .from("lesson_videos")
          .select("lesson_id, video_id")
          .in("lesson_id", lessonIds);

        if (vidData) {
          vidData.forEach((v) => {
            videosMap[v.lesson_id] = v.video_id;
          });
        }

        const { data: resData } = await supabase
          .from("lesson_resources")
          .select("*")
          .in("lesson_id", lessonIds)
          .order("order_index", { ascending: true });

        if (resData) {
          resData.forEach((r) => {
            if (!resourcesMap[r.lesson_id]) resourcesMap[r.lesson_id] = [];
            resourcesMap[r.lesson_id].push(r);
          });
        }
      }

      // Assemble hierarchy
      const assembled: SectionItem[] = (secData || []).map((sec) => ({
        id: sec.id,
        course_id: sec.course_id,
        title_ar: sec.title_ar,
        title_en: sec.title_en,
        order_index: sec.order_index,
        lessons: (lesData || [])
          .filter((l) => l.section_id === sec.id)
          .map((l) => ({
            ...l,
            video_id: videosMap[l.id] || "",
            resources: resourcesMap[l.id] || [],
          })),
      }));

      setSections(assembled);
    } catch (err: any) {
      console.error("Failed to load curriculum:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      loadCurriculum(selectedCourseId);
    }
  }, [selectedCourseId]);

  // Section Modal Handlers
  const handleOpenAddSection = () => {
    setEditingSectionId(null);
    setSecTitleAr("");
    setSecTitleEn("");
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section: SectionItem) => {
    setEditingSectionId(section.id);
    setSecTitleAr(section.title_ar);
    setSecTitleEn(section.title_en);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitleAr.trim()) return;

    try {
      setSaving(true);
      if (editingSectionId) {
        await supabase
          .from("course_sections")
          .update({
            title_ar: secTitleAr,
            title_en: secTitleEn || secTitleAr,
          })
          .eq("id", editingSectionId);
      } else {
        await supabase.from("course_sections").insert({
          course_id: selectedCourseId,
          title_ar: secTitleAr,
          title_en: secTitleEn || secTitleAr,
          order_index: sections.length + 1,
        });
      }
      setIsSectionModalOpen(false);
      await loadCurriculum(selectedCourseId);
    } catch (err: any) {
      alert(`Error saving section: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (sectionId: string, title: string) => {
    if (!confirm(isRtl ? `حذف القسم "${title}" وجميع دروسه؟` : `Delete section "${title}" and all its lessons?`))
      return;
    try {
      await supabase.from("course_sections").delete().eq("id", sectionId);
      await loadCurriculum(selectedCourseId);
    } catch (err: any) {
      alert(`Error deleting section: ${err.message}`);
    }
  };

  // Lesson Modal Handlers
  const handleOpenAddLesson = (sectionId: string) => {
    setEditingLessonId(null);
    setTargetSectionId(sectionId);
    setLessonTitleAr("");
    setLessonTitleEn("");
    setLessonDescAr("");
    setLessonDescEn("");
    setLessonVideoUrl("");
    setLessonDurationMin("15");
    setIsFreePreview(false);
    setLessonResources([]);
    setNewResTitle("");
    setNewResUrl("");
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (lesson: LessonItem) => {
    setEditingLessonId(lesson.id);
    setTargetSectionId(lesson.section_id);
    setLessonTitleAr(lesson.title_ar);
    setLessonTitleEn(lesson.title_en);
    setLessonDescAr(lesson.description_ar || "");
    setLessonDescEn(lesson.description_en || "");
    setLessonVideoUrl(
      lesson.video_id ? `https://www.youtube.com/watch?v=${lesson.video_id}` : ""
    );
    setLessonDurationMin(Math.round(lesson.duration_seconds / 60).toString() || "15");
    setIsFreePreview(lesson.is_free_preview);
    setLessonResources(
      (lesson.resources || []).map((r) => ({
        id: r.id,
        title_ar: r.title_ar,
        external_url: r.external_url || "",
      }))
    );
    setNewResTitle("");
    setNewResUrl("");
    setIsLessonModalOpen(true);
  };

  const handleAddResourceItem = () => {
    if (!newResTitle.trim() || !newResUrl.trim()) return;
    setLessonResources([
      ...lessonResources,
      { title_ar: newResTitle.trim(), external_url: newResUrl.trim() },
    ]);
    setNewResTitle("");
    setNewResUrl("");
  };

  const handleRemoveResourceItem = (index: number) => {
    setLessonResources(lessonResources.filter((_, idx) => idx !== index));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitleAr.trim()) {
      alert(isRtl ? "يرجى كتابة عنوان الدرس" : "Please enter lesson title");
      return;
    }

    try {
      setSaving(true);
      const extractedVideoId = extractYouTubeId(lessonVideoUrl);
      const durationSeconds = (parseInt(lessonDurationMin) || 15) * 60;

      let lessonId = editingLessonId;

      if (editingLessonId) {
        // UPDATE Lesson
        await supabase
          .from("lessons")
          .update({
            title_ar: lessonTitleAr,
            title_en: lessonTitleEn || lessonTitleAr,
            description_ar: lessonDescAr,
            description_en: lessonDescEn || lessonDescAr,
            duration_seconds: durationSeconds,
            is_free_preview: isFreePreview,
          })
          .eq("id", editingLessonId);
      } else {
        // INSERT Lesson
        const { data: newLes, error: newLesErr } = await supabase
          .from("lessons")
          .insert({
            course_id: selectedCourseId,
            section_id: targetSectionId,
            title_ar: lessonTitleAr,
            title_en: lessonTitleEn || lessonTitleAr,
            description_ar: lessonDescAr,
            description_en: lessonDescEn || lessonDescAr,
            duration_seconds: durationSeconds,
            is_free_preview: isFreePreview,
            order_index: Date.now() % 10000,
          })
          .select("id")
          .single();

        if (newLesErr) throw newLesErr;
        lessonId = newLes.id;
      }

      // Update protected `lesson_videos` table
      if (lessonId && extractedVideoId) {
        await supabase
          .from("lesson_videos")
          .upsert({
            lesson_id: lessonId,
            provider: "youtube",
            video_id: extractedVideoId,
          });
      }

      // Update resources
      if (lessonId) {
        // Clear previous resources
        await supabase.from("lesson_resources").delete().eq("lesson_id", lessonId);

        if (lessonResources.length > 0) {
          const resRows = lessonResources.map((res, index) => ({
            lesson_id: lessonId,
            title_ar: res.title_ar,
            title_en: res.title_ar,
            external_url: res.external_url,
            resource_type: "link" as const,
            order_index: index + 1,
          }));

          await supabase.from("lesson_resources").insert(resRows);
        }
      }

      setIsLessonModalOpen(false);
      await loadCurriculum(selectedCourseId);
    } catch (err: any) {
      console.error("Error saving lesson:", err);
      alert(`Error saving lesson: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string, title: string) => {
    if (!confirm(isRtl ? `حذف الدرس "${title}"؟` : `Delete lesson "${title}"?`)) return;
    try {
      await supabase.from("lessons").delete().eq("id", lessonId);
      await loadCurriculum(selectedCourseId);
    } catch (err: any) {
      alert(`Error deleting lesson: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{t("curriculum")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "إدارة هيكل الدورة، تعديل روابط فيديو يوتيوب المحمية، وإضافة روابط ومرفقات الملاءمة المكانية"
              : "Manage curriculum structure, protected video links, and lesson download resources"}
          </p>
        </div>

        {/* Course Selector & Add Section */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="py-2 px-3 rounded-xl border border-border bg-card text-xs font-bold text-foreground focus:outline-none"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {isRtl ? c.title_ar : c.title_en}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenAddSection}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md shadow-brand-blue/20 transition-all hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isRtl ? "إضافة قسم جديد" : "Add Section"}</span>
          </button>
        </div>
      </div>

      {/* Security Info Card */}
      <div className="p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 flex items-start gap-3 text-xs text-foreground/80 leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-brand-cyan block mb-0.5">
            {isRtl ? "نظام حماية الفيديوهات والمحتوى:" : "Video Security & DRM Architecture:"}
          </span>
          <p className="text-muted-foreground text-[11px]">
            {isRtl
              ? "معرّفات الفيديوهات (YouTube IDs) تُحفظ في جدول مشفر ومحمي RLS (lesson_videos) ولا يمكن للطلاب قراءته مباشرة. يتم حجب واجهة يوتيوب الأصلية ودرع النقرات يمنع فتح الفيديو خارج المنصة. (ملاحظة: روابط YouTube غير المدرجة توفر حماية قوية لكنها لا تمنع التسجيل الخارجي لشاشة الجهاز بنسبة 100%)."
              : "Video IDs are stored in the protected lesson_videos table with RLS shielding. Click-shield overlay prevents direct YouTube link copying and UI clicks."}
          </p>
        </div>
      </div>

      {/* Sections & Lessons Content */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
          <p className="text-xs font-medium">
            {isRtl ? "جارٍ تحميل محتوى المنهج..." : "Loading curriculum..."}
          </p>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/40 space-y-3">
          <Layers className="w-12 h-12 mx-auto text-muted-foreground/40" />
          <h3 className="text-sm font-bold text-foreground">
            {isRtl ? "لا توجد أقسام في هذه الدورة بعد" : "No sections in this course yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {isRtl
              ? "اضغط على زر «إضافة قسم جديد» للبدء في تقسيم محتوى الدورة وإضافة الدروس."
              : "Click 'Add Section' to start structuring this course curriculum."}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section, sIdx) => {
            const secTitle = isRtl ? section.title_ar : section.title_en;

            return (
              <div
                key={section.id}
                className="rounded-3xl glass-panel p-5 border border-border/80 shadow-sm space-y-4"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-brand-cyan/15 text-brand-cyan text-xs font-extrabold flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <h2 className="text-sm font-extrabold text-foreground">
                      {secTitle}
                    </h2>
                    <span className="text-[11px] text-muted-foreground font-semibold">
                      ({section.lessons.length} {isRtl ? "دروس" : "lessons"})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAddLesson(section.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue dark:text-brand-cyan text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isRtl ? "إضافة درس" : "Add Lesson"}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditSection(section)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                      title={isRtl ? "تعديل عنوان القسم" : "Edit section title"}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSection(section.id, secTitle)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      title={isRtl ? "حذف القسم" : "Delete section"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lessons in this section */}
                {section.lessons.length === 0 ? (
                  <p className="text-xs text-muted-foreground/80 py-2 italic">
                    {isRtl ? "لا توجد دروس في هذا القسم بعد." : "No lessons in this section yet."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {section.lessons.map((lesson, lIdx) => {
                      const lesTitle = isRtl ? lesson.title_ar : lesson.title_en;

                      return (
                        <div
                          key={lesson.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-background/60 border border-border/60 hover:border-brand-blue/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-muted-foreground w-6">
                              {sIdx + 1}.{lIdx + 1}
                            </span>
                            <PlayCircle className="w-4 h-4 text-brand-cyan shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground">
                                  {lesTitle}
                                </span>
                                {lesson.is_free_preview && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                                    {isRtl ? "معاينة مجانية" : "Free Preview"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  <span>{Math.round(lesson.duration_seconds / 60)} {isRtl ? "دقيقة" : "min"}</span>
                                </span>
                                {lesson.video_id ? (
                                  <span className="text-emerald-500 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isRtl ? "الفيديو مرتبط" : "Video Linked"} ({lesson.video_id})</span>
                                  </span>
                                ) : (
                                  <span className="text-amber-500">
                                    {isRtl ? "لم يتم ربط فيديو بعد" : "No video linked"}
                                  </span>
                                )}
                                {lesson.resources.length > 0 && (
                                  <span className="text-brand-blue dark:text-brand-cyan flex items-center gap-1">
                                    <Link2 className="w-3 h-3" />
                                    <span>{lesson.resources.length} {isRtl ? "مرفقات/روابط" : "resources"}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 self-end sm:self-auto">
                            <button
                              onClick={() => handleOpenEditLesson(lesson)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold text-brand-blue dark:text-brand-cyan hover:bg-brand-blue/10 flex items-center gap-1 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>{isRtl ? "تعديل الدرس" : "Edit"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(lesson.id, lesTitle)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title={isRtl ? "حذف الدرس" : "Delete lesson"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION MODAL */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-extrabold text-foreground">
                {editingSectionId
                  ? isRtl ? "تعديل عنوان القسم" : "Edit Section"
                  : isRtl ? "إضافة قسم جديد للمنهج" : "Add New Section"}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "عنوان القسم (بالعربية) *" : "Section Title (Arabic) *"}
                </label>
                <input
                  type="text"
                  required
                  value={secTitleAr}
                  onChange={(e) => setSecTitleAr(e.target.value)}
                  placeholder="مثال: القسم الأول: نظم الإحداثيات والمرجع الجيوديسي"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "عنوان القسم (بالإنجليزية)" : "Section Title (English)"}
                </label>
                <input
                  type="text"
                  value={secTitleEn}
                  onChange={(e) => setSecTitleEn(e.target.value)}
                  placeholder="e.g. Section 1: Coordinate Reference Systems"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md"
                >
                  {saving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : (isRtl ? "حفظ القسم" : "Save Section")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON MODAL (With Video link extraction, preview toggle, and resources) */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
                <h3 className="text-sm font-extrabold text-foreground">
                  {editingLessonId
                    ? isRtl ? "تعديل بيانات ورابط الدرس" : "Edit Lesson Content & Video"
                    : isRtl ? "إضافة درس جديد" : "Add New Lesson"}
                </h3>
              </div>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Lesson Titles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "عنوان الدرس (بالعربية) *" : "Lesson Title (Arabic) *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonTitleAr}
                    onChange={(e) => setLessonTitleAr(e.target.value)}
                    placeholder="مثال: مقدمة في الإرجاع الجغرافي Georeferencing"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "عنوان الدرس (بالإنجليزية)" : "Lesson Title (English)"}
                  </label>
                  <input
                    type="text"
                    value={lessonTitleEn}
                    onChange={(e) => setLessonTitleEn(e.target.value)}
                    placeholder="e.g. Introduction to Georeferencing"
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-brand-blue"
                  />
                </div>
              </div>

              {/* VIDEO LINK WITH AUTO EXTRACTION */}
              <div className="p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-brand-cyan" />
                    <span>{isRtl ? "رابط فيديو الدرس (YouTube URL)" : "Lesson Video Link (YouTube)"}</span>
                  </label>
                  {lessonVideoUrl && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-brand-cyan/20 text-brand-cyan">
                      ID: {extractYouTubeId(lessonVideoUrl)}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={lessonVideoUrl}
                  onChange={(e) => setLessonVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono focus:outline-none focus:border-brand-blue"
                />

                {/* Live YouTube Preview Card */}
                {extractYouTubeId(lessonVideoUrl) && extractYouTubeId(lessonVideoUrl).length === 11 && (
                  <div className="rounded-xl overflow-hidden border border-brand-cyan/30 bg-background/80 p-2.5 flex items-center gap-3">
                    <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(lessonVideoUrl)}/hqdefault.jpg`}
                        alt="YouTube Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <div className="text-emerald-500 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRtl ? "تم التحقق من رابط الفيديو بنجاح" : "Valid YouTube video detected"}</span>
                      </div>
                      <div className="font-mono text-[10px] text-brand-cyan">
                        ID: {extractYouTubeId(lessonVideoUrl)}
                      </div>
                      <a
                        href={`https://www.youtube.com/watch?v=${extractYouTubeId(lessonVideoUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-foreground hover:text-brand-cyan hover:underline flex items-center gap-1"
                      >
                        <span>{isRtl ? "معاينة الفيديو في يوتيوب" : "Preview on YouTube"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-muted-foreground">
                  {isRtl
                    ? "الصق رابط يوتيوب العادي وسيتم استخراج الـ Video ID تلقائياً وتخزينه في جدول الفيديوهات المحمي."
                    : "Paste any YouTube link; the 11-char ID is extracted and stored in the protected table."}
                </p>
              </div>

              {/* Duration & Free Preview Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">
                    {isRtl ? "مدة الدرس (بالدقائق)" : "Duration (minutes)"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lessonDurationMin}
                    onChange={(e) => setLessonDurationMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFreePreview}
                      onChange={(e) => setIsFreePreview(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    <span className="ms-3 text-xs font-bold text-foreground">
                      {isRtl ? "متاح كمعاينة مجانية للجميع (Free Preview)" : "Enable Free Preview"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Lesson Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  {isRtl ? "وصف وملاحظات الدرس" : "Lesson Description & Notes"}
                </label>
                <textarea
                  rows={2}
                  value={lessonDescAr}
                  onChange={(e) => setLessonDescAr(e.target.value)}
                  placeholder="ملخص محتوى الدرس وما سيتم شرحه..."
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none"
                />
              </div>

              {/* LESSON RESOURCES (LINKS & FILES) */}
              <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
                    <span>{isRtl ? "مرفقات وروابط الدرس (Resources & Datasets)" : "Lesson Resources & Links"}</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {lessonResources.length} {isRtl ? "روابط مضافة" : "added"}
                  </span>
                </div>

                {/* List of current resources */}
                {lessonResources.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {lessonResources.map((res, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-background border border-border/60 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <ExternalLink className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                          <span className="font-bold text-foreground truncate">{res.title_ar}</span>
                          <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">
                            {res.external_url}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveResourceItem(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new resource inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 border-t border-border/50">
                  <input
                    type="text"
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder={isRtl ? "اسم المرفق (مثال: ملف بيانات Shapefile)" : "Resource title"}
                    className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-medium"
                  />
                  <input
                    type="url"
                    value={newResUrl}
                    onChange={(e) => setNewResUrl(e.target.value)}
                    placeholder={isRtl ? "رابط التحميل (Google Drive / GitHub / URL)" : "URL (e.g. Drive / Dropbox)"}
                    className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddResourceItem}
                    className="px-3 py-1.5 rounded-lg bg-brand-cyan/20 text-brand-navy dark:text-brand-cyan text-xs font-bold hover:bg-brand-cyan/30 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? "إضافة" : "Add"}</span>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  {isRtl ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md shadow-brand-blue/20"
                >
                  <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
                  <span>{saving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : (isRtl ? "حفظ الدرس" : "Save Lesson")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCurriculumPage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-muted-foreground space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
          <p className="text-xs font-medium">Loading curriculum...</p>
        </div>
      }
    >
      <AdminCurriculumContent params={params} />
    </Suspense>
  );
}
