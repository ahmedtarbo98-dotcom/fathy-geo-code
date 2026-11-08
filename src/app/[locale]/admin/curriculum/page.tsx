"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getCourses, CourseDetailData } from "@/lib/data/courses";
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
} from "lucide-react";

export default function AdminCurriculumPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const allCourses = getCourses();
  const [selectedCourseId, setSelectedCourseId] = useState(allCourses[0].id);

  const activeCourse = allCourses.find((c) => c.id === selectedCourseId) || allCourses[0];

  // Helper function to extract YouTube video ID from standard URL or direct ID
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  // Section & lesson draft state
  const [newSectionTitleAr, setNewSectionTitleAr] = useState("");
  const [newLessonTitleAr, setNewLessonTitleAr] = useState("");
  const [newLessonTitleEn, setNewLessonTitleEn] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [durationMin, setDurationMin] = useState("15");

  const handleAddLesson = (sectionId: string) => {
    const videoId = extractYouTubeId(videoUrlInput);
    alert(
      locale === "ar"
        ? `تم إضافة الدرس ومعرّف الفيديو المستخرج: ${videoId}`
        : `Lesson added with extracted video ID: ${videoId}`
    );
    setNewLessonTitleAr("");
    setNewLessonTitleEn("");
    setVideoUrlInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("curriculum")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "بناء الأقسام، ترتيب الدروس، استخراج معرّفات فيديو يوتيوب، وربط المرفقات"
              : "Build curriculum hierarchy, extract YouTube video IDs, and manage spatial resources"}
          </p>
        </div>

        {/* Course Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {locale === "ar" ? "اختر الدورة:" : "Select Course:"}
          </span>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="py-2 px-3 rounded-xl border border-border bg-card text-xs font-bold"
          >
            {allCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "ar" ? c.title_ar : c.title_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Curriculum View */}
      <div className="space-y-6">
        {activeCourse.sections.map((section, sIdx) => {
          const sTitle = locale === "ar" ? section.title_ar : section.title_en;

          return (
            <div
              key={section.id}
              className="rounded-3xl glass-panel p-6 border border-border/70 space-y-4 shadow-md"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue text-xs font-bold flex items-center justify-center">
                    {sIdx + 1}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground">
                    {sTitle}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {section.lessons.length} {locale === "ar" ? "دروس" : "lessons"}
                </span>
              </div>

              {/* Existing Lessons */}
              <div className="space-y-2">
                {section.lessons.map((lesson, lIdx) => {
                  const lTitle = locale === "ar" ? lesson.title_ar : lesson.title_en;

                  return (
                    <div
                      key={lesson.id}
                      className="p-3.5 rounded-xl border border-border/60 bg-background/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-4 h-4 text-brand-cyan shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground">
                            {lTitle}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {Math.floor(lesson.duration_seconds / 60)} min • ID: {lesson.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {lesson.is_free_preview && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Free Preview
                          </span>
                        )}
                        <button
                          onClick={() => alert("Edit lesson")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Lesson Input */}
              <div className="mt-4 pt-4 border-t border-border/40 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={newLessonTitleAr}
                    onChange={(e) => setNewLessonTitleAr(e.target.value)}
                    placeholder={locale === "ar" ? "عنوان الدرس بالعربية..." : "Lesson Title (Arabic)..."}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                  />
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                    placeholder="رابط يوتيوب غير مدرج (Unlisted URL or Video ID)..."
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`preview-${section.id}`}
                    checked={isPreview}
                    onChange={(e) => setIsPreview(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor={`preview-${section.id}`} className="text-xs text-muted-foreground">
                    معاينة مجانية
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <button
                    onClick={() => handleAddLesson(section.id)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 transition-all flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة درس</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
