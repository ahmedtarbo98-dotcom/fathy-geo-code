"use client";

import { useState, useEffect, Suspense } from "react";
import { notFound, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourseBySlug, LessonData } from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/client";
import VideoPlayer from "@/components/video-player";
import {
  CheckCircle2,
  PlayCircle,
  Lock,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileCode,
  Check,
  RefreshCw,
} from "lucide-react";

function CoursePlayerContent({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = useTranslations("Player");
  const isRtl = locale === "ar";
  const NextArrow = isRtl ? ChevronLeft : ChevronRight;
  const PrevArrow = isRtl ? ChevronRight : ChevronLeft;
  const supabase = createClient();
  const searchParams = useSearchParams();
  const urlLessonId = searchParams.get("lessonId");

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<"overview" | "resources" | "notes">("overview");
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const [videoTokenData, setVideoTokenData] = useState({
    videoId: "dQw4w9WgXcQ",
    email: "student@fathygeocode.com",
    userId: "STUDENT",
  });
  const [lessonResourcesList, setLessonResourcesList] = useState<any[]>([]);

  useEffect(() => {
    async function loadPlayerCourse() {
      try {
        setLoading(true);

        const rawSlug = String(slug || "").trim();
        const decodedSlug = decodeURIComponent(rawSlug).trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

        const selectFields = `
          *,
          course_sections (
            id,
            title_ar,
            title_en,
            order_index,
            lessons (
              id,
              title_ar,
              title_en,
              duration_seconds,
              is_free_preview,
              order_index
            )
          )
        `;

        let dbCourse: any = null;

        if (isUuid) {
          const { data, error } = await supabase
            .from("courses")
            .select(selectFields)
            .eq("id", decodedSlug)
            .maybeSingle();
          if (!error && data) dbCourse = data;
        } else {
          const { data: d1, error: e1 } = await supabase
            .from("courses")
            .select(selectFields)
            .eq("slug", decodedSlug)
            .maybeSingle();

          if (!e1 && d1) {
            dbCourse = d1;
          } else {
            const { data: d2, error: e2 } = await supabase
              .from("courses")
              .select(selectFields)
              .eq("slug", rawSlug)
              .maybeSingle();

            if (!e2 && d2) {
              dbCourse = d2;
            } else {
              const { data: d3 } = await supabase
                .from("courses")
                .select(selectFields)
                .ilike("slug", decodedSlug)
                .maybeSingle();
              if (d3) dbCourse = d3;
            }
          }
        }

        if (dbCourse) {
          const sortedSections = (dbCourse.course_sections || [])
            .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
            .map((sec: any) => ({
              id: sec.id,
              title_ar: sec.title_ar,
              title_en: sec.title_en,
              order_index: sec.order_index,
              lessons: (sec.lessons || []).sort(
                (a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)
              ),
            }));

          setCourse({
            ...dbCourse,
            sections: sortedSections,
          });

          // Check enrollment status
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
            const enrRes = await fetch(`/api/check-enrollment?courseId=${dbCourse.id}`, {
              headers,
            });
            if (enrRes.ok) {
              const enrData = await enrRes.json();
              setIsEnrolled(!!enrData.isEnrolled);
            }
          } catch (e) {
            console.warn("Player enrollment check failed:", e);
          }

          return;
        }

        // 2. Fallback to static
        const staticMatch = getCourseBySlug(decodedSlug) || getCourseBySlug(rawSlug);
        if (staticMatch) {
          setCourse(staticMatch);
          return;
        }

        setCourse(null);
      } catch (err) {
        console.error("Player load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlayerCourse();
  }, [slug]);

  // Flatten lessons
  const allLessons: any[] = [];
  if (course?.sections) {
    course.sections.forEach((s: any) => {
      (s.lessons || []).forEach((l: any) => {
        allLessons.push({
          ...l,
          sectionTitle_ar: s.title_ar,
          sectionTitle_en: s.title_en,
        });
      });
    });
  }

  const currentLesson = allLessons[currentLessonIndex] || allLessons[0];
  const isCurrentCompleted = !!completedLessons[currentLesson?.id];

  // Auto select lesson if passed in query param
  useEffect(() => {
    if (urlLessonId && allLessons.length > 0) {
      const idx = allLessons.findIndex((l) => l.id === urlLessonId);
      if (idx !== -1) {
        setCurrentLessonIndex(idx);
      }
    }
  }, [urlLessonId, allLessons.length]);

  // Fetch real protected video & watermark
  useEffect(() => {
    if (!currentLesson?.id) return;

    // 1. Fetch token and video
    fetch("/api/video/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: currentLesson.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.videoId) {
          setVideoTokenData({
            videoId: data.videoId,
            email: data.watermark?.email || "student@fathygeocode.com",
            userId: data.watermark?.userId || "STUDENT",
          });
        }
      })
      .catch((err) => console.error("Video token error:", err));

    // 2. Fetch live resources from DB
    supabase
      .from("lesson_resources")
      .select("*")
      .eq("lesson_id", currentLesson.id)
      .order("order_index", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLessonResourcesList(data);
        } else {
          setLessonResourcesList([]);
        }
      });
  }, [currentLesson?.id]);

  // Calculate percentage
  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const totalCount = allLessons.length || 1;
  const progressPercent = Math.min(100, Math.round((completedCount / totalCount) * 100));

  const toggleComplete = (id: string) => {
    setCompletedLessons((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const newCount = Object.values(next).filter(Boolean).length;
      if (newCount === totalCount) {
        setShowCertificateModal(true);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex((prev) => prev - 1);
    }
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2500);
  };

  // Sample lesson resources
  const sampleResources = [
    {
      title_ar: "حزمة بيانات التدريب والطبقات الجغرافية (Shapefiles & DEM)",
      title_en: "Practice Dataset Package (Shapefiles & DEM)",
      type: "file",
      size: "24.5 MB",
    },
    {
      title_ar: "دليل واجهة ArcGIS Pro ومفاهيم الطوبولوجيا (PDF)",
      title_en: "ArcGIS Pro Interface & Topology Cheat Sheet (PDF)",
      type: "file",
      size: "3.2 MB",
    },
    {
      title_ar: "التوثيق الرسمي لنظم الإسقاط من Esri Documentation",
      title_en: "Official Esri Coordinate Systems Documentation",
      type: "link",
      url: "https://pro.arcgis.com",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-cyan" />
        <p className="text-xs text-muted-foreground font-medium">
          {isRtl ? "جارٍ تحميل مشغل الدورة..." : "Loading course player..."}
        </p>
      </div>
    );
  }

  if (!course) {
    notFound();
  }

  const canWatchCurrentLesson = isEnrolled || course?.is_free || currentLesson?.is_free_preview;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Player Top Navigation Bar */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md px-3 sm:px-6 py-3">
        <div className="container mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/courses/${course.slug}`}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              <PrevArrow className="w-3.5 h-3.5" />
              <span>{locale === "ar" ? "تفاصيل الدورة" : "Course Details"}</span>
            </Link>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <h1 className="text-xs sm:text-sm font-bold text-foreground line-clamp-1 truncate">
              {locale === "ar" ? course.title_ar : course.title_en}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <span className="text-muted-foreground hidden sm:inline">
              {t("courseProgress")}:
            </span>
            <div className="w-16 sm:w-32 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono font-bold text-brand-cyan">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Main Video & Lesson Content (Col 8) */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            {/* Custom Video Player or Locked Paywall */}
            {canWatchCurrentLesson ? (
              <VideoPlayer
                provider="youtube"
                videoId={videoTokenData.videoId}
                userEmail={videoTokenData.email}
                userId={videoTokenData.userId}
                isProtected={true}
                onComplete={() => toggleComplete(currentLesson?.id)}
              />
            ) : (
              <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-border/80 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {locale === "ar"
                      ? "هذا الدرس متاح للمشتركين فقط"
                      : "This lesson is for enrolled students only"}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {locale === "ar"
                      ? "يرجى الاشتراك وتفعيل الدورة للوصول إلى جميع الدروس والفيديوهات المحمية."
                      : "Please enroll and activate this course to access all protected lessons."}
                  </p>
                </div>
                <Link
                  href={`/courses/${course.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all"
                >
                  <span>
                    {locale === "ar" ? "طلب الاشتراك والتفعيل الآن" : "Request Enrollment"}
                  </span>
                </Link>
              </div>
            )}

            {/* Video Action Controls Bar */}
            <div className="rounded-2xl glass-panel p-4 sm:p-5 border border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-start">
                <span className="text-[11px] font-semibold text-brand-cyan uppercase tracking-wider">
                  {locale === "ar"
                    ? currentLesson?.sectionTitle_ar
                    : currentLesson?.sectionTitle_en}
                </span>
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {locale === "ar" ? currentLesson?.title_ar : currentLesson?.title_en}
                </h2>
              </div>

              {/* Complete & Nav Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleComplete(currentLesson?.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
                    isCurrentCompleted
                      ? "bg-emerald-500 text-white hover:bg-emerald-600"
                      : "bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isCurrentCompleted ? t("isCompleted") : t("markCompleted")}
                  </span>
                </button>

                <div className="flex items-center gap-1 border-s border-border ps-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentLessonIndex === 0}
                    className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
                    title={t("prevLesson")}
                  >
                    <PrevArrow className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleNext}
                    disabled={currentLessonIndex === allLessons.length - 1}
                    className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted disabled:opacity-30 transition-colors"
                    title={t("nextLesson")}
                  >
                    <NextArrow className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs (Overview / Resources / Notes) */}
            <div className="rounded-3xl glass-panel border border-border/70 overflow-hidden shadow-lg">
              {/* Tab Headers */}
              <div className="flex border-b border-border bg-muted/40 text-xs sm:text-sm font-bold">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3.5 transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === "overview"
                      ? "border-brand-cyan text-brand-blue dark:text-brand-cyan bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t("tabOverview")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("resources")}
                  className={`px-6 py-3.5 transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === "resources"
                      ? "border-brand-cyan text-brand-blue dark:text-brand-cyan bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{t("tabResources")}</span>
                </button>

                <button
                  onClick={() => setActiveTab("notes")}
                  className={`px-6 py-3.5 transition-colors flex items-center gap-2 border-b-2 ${
                    activeTab === "notes"
                      ? "border-brand-cyan text-brand-blue dark:text-brand-cyan bg-card"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>{t("tabNotes")}</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 sm:p-8">
                {activeTab === "overview" && (
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <h3 className="font-bold text-base text-foreground">
                      {locale === "ar" ? "أهداف ومحاور الدرس:" : "Lesson Learning Objectives:"}
                    </h3>
                    <p>
                      {locale === "ar"
                        ? "في هذا الدرس التطبيقي، نستعرض مع المهندس أحمد فتحي خطوات التنفيذ العملية خطوة بخطوة. يرجى تنزيل ملفات التدريب المرفقة من تبويب 'المرفقات' لمزامنة التطبيق المباشر داخل برنامجك."
                        : "In this practical lesson guided by Eng. Ahmed Fathy, we dive straight into step-by-step geospatial execution. Please download the dataset package from the 'Datasets & Resources' tab to follow along inside your software."}
                    </p>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-xs font-mono text-foreground/80 space-y-1">
                      <div>DATUM: WGS 84 / UTM 36N</div>
                      <div>SOFTWARE: ArcGIS Pro 3.x / Earth Engine</div>
                      <div>INSTRUCTOR: Eng. Ahmed Fathy</div>
                    </div>
                  </div>
                )}

                {activeTab === "resources" && (
                  <div className="space-y-3">
                    {(lessonResourcesList.length > 0 ? lessonResourcesList : sampleResources).map((res, rIdx) => {
                      const resTitle = locale === "ar" ? res.title_ar : (res.title_en || res.title_ar);
                      const resourceUrl = res.external_url || res.url;

                      return (
                        <div
                          key={res.id || rIdx}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/60 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
                              {res.type === "file" ? (
                                <FileCode className="w-4 h-4" />
                              ) : (
                                <ExternalLink className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-bold text-foreground">
                                {resTitle}
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                {resourceUrl ? resourceUrl.slice(0, 40) + "..." : (res.size || "GIS Resource")}
                              </div>
                            </div>
                          </div>

                          {resourceUrl ? (
                            <a
                              href={resourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-blue text-white hover:bg-brand-blue/90 shadow-sm transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{locale === "ar" ? "فتح الرابط / تحميل" : "Open / Download"}</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => alert(locale === "ar" ? "بدء تنزيل الملف التدريبي..." : "Downloading exercise files...")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-brand-blue hover:text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t("downloadFile")}</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === "notes" && (
                  <div className="space-y-4">
                    <textarea
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("notesPlaceholder")}
                      className="w-full p-4 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        {notesSaved ? t("notesSaved") : ""}
                      </span>
                      <button
                        onClick={handleSaveNotes}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors shadow-sm"
                      >
                        {t("saveNotes")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: Syllabus / Lesson List (Col 4) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-3xl glass-panel p-6 border border-border/70 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-cyan" />
                  <span>{locale === "ar" ? "قائمة الدروس" : "Course Lessons"}</span>
                </h3>
                <span className="text-xs font-semibold text-muted-foreground">
                  {completedCount} / {totalCount}
                </span>
              </div>

              {/* Sections Accordion */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pe-1">
                {(course.sections || []).map((section: any, sIdx: number) => {
                  const sTitle = locale === "ar" ? section.title_ar : section.title_en;

                  return (
                    <div
                      key={section.id || sIdx}
                      className="rounded-2xl border border-border/60 bg-card overflow-hidden"
                    >
                      <div className="p-3 bg-muted/40 font-bold text-xs text-foreground flex items-center justify-between">
                        <span>{sTitle}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {section.lessons?.length || 0} {locale === "ar" ? "دروس" : "lessons"}
                        </span>
                      </div>

                      <div className="divide-y divide-border/30">
                        {(section.lessons || []).map((lesson: any) => {
                          const lTitle =
                            locale === "ar" ? lesson.title_ar : lesson.title_en;
                          const isDone = !!completedLessons[lesson.id];
                          const isActive =
                            currentLesson?.id === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                const idx = allLessons.findIndex(
                                  (l) => l.id === lesson.id
                                );
                                if (idx !== -1) setCurrentLessonIndex(idx);
                              }}
                              className={`w-full flex items-center justify-between p-3 text-start transition-colors ${
                                isActive
                                  ? "bg-brand-blue/15 text-brand-blue dark:text-brand-cyan font-bold"
                                  : "hover:bg-muted/30 text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleComplete(lesson.id);
                                  }}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                    isDone
                                      ? "bg-emerald-500 border-emerald-500 text-white"
                                      : "border-border text-transparent"
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </span>
                                <span className="text-xs line-clamp-1">{lTitle}</span>
                              </div>

                              <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                                {Math.floor((lesson.duration_seconds || 900) / 60)}m
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Certificate Unlock Banner */}
              {progressPercent === 100 ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-brand-cyan/15 border border-emerald-500/30 text-center space-y-2.5">
                  <Award className="w-8 h-8 text-emerald-500 mx-auto" />
                  <div className="text-xs font-bold text-foreground">
                    {t("certificateUnlockedTitle")}
                  </div>
                  <Link
                    href={`/verify/FGC-2026-${(course.slug || "CRS").slice(0, 4).toUpperCase()}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all"
                  >
                    <span>{t("claimCertificate")}</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Award className="w-4 h-4 text-brand-cyan" />
                  <span>
                    {locale === "ar"
                      ? "أكمل 100% لإصدار شهادة الإتمام الموثقة"
                      : "Reach 100% to unlock your verified certificate"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoursePlayerPage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-24 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-cyan" />
          <p className="text-xs text-muted-foreground font-medium">Loading course player...</p>
        </div>
      }
    >
      <CoursePlayerContent params={params} />
    </Suspense>
  );
}
