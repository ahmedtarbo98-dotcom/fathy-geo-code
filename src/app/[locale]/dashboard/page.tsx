"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourses } from "@/lib/data/courses";
import {
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  PlayCircle,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  Compass,
} from "lucide-react";

export default function StudentDashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Dashboard");
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const courses = getCourses();
  const [activeTab, setActiveTab] = useState<"all" | "inProgress" | "completed">("all");

  // Simulated enrolled student data (integrated with DB/localStorage)
  const enrolledCourses = [
    {
      ...courses[0],
      progressPercent: 65,
      lastLessonTitle_ar: "بناء وإدارة File Geodatabase وقواعد الطوبولوجيا",
      lastLessonTitle_en: "Building File Geodatabase & Topology Quality Rules",
      lastLessonId: "l3",
    },
    {
      ...courses[1],
      progressPercent: 100,
      lastLessonTitle_ar: "تحويل ملفات الـ AutoCAD إلى طبقات GIS بدقة متناهية",
      lastLessonTitle_en: "AutoCAD to GIS Layer Conversion Without Geometry Loss",
      lastLessonId: "l22",
    },
  ];

  const continueCourse = enrolledCourses[0];

  const filtered = enrolledCourses.filter((c) => {
    if (activeTab === "inProgress") return c.progressPercent < 100;
    if (activeTab === "completed") return c.progressPercent === 100;
    return true;
  });

  return (
    <div className="min-h-screen py-10 md:py-16 relative">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 space-y-10">
        {/* Welcome Header */}
        <div className="rounded-3xl glass-panel p-8 sm:p-10 border border-border/70 shadow-xl shadow-brand-blue/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{locale === "ar" ? "لوحة الطالب" : "Learner Portal"}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">
                {t("welcomeTitle", { name: locale === "ar" ? "يا مهندس" : "Engineer" })}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                {t("welcomeSubtitle")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-105 active:scale-95 transition-all shadow-md shadow-brand-blue/20"
              >
                <Compass className="w-4 h-4" />
                <span>{t("exploreCourses")}</span>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border/50">
            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
                <BookOpen className="w-4 h-4 text-brand-blue" />
                <span>{t("enrolledCourses")}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground">2</div>
            </div>

            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{t("completedCourses")}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground">1</div>
            </div>

            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{t("certificatesEarned")}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground">1</div>
            </div>

            <div className="p-4 rounded-2xl bg-background/50 border border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
                <Clock className="w-4 h-4 text-brand-cyan" />
                <span>{t("trainingHours")}</span>
              </div>
              <div className="text-2xl font-extrabold text-foreground">28h</div>
            </div>
          </div>
        </div>

        {/* Continue Where You Left Off Card */}
        {continueCourse && (
          <div className="rounded-3xl bg-gradient-to-tr from-brand-navy via-blue-950 to-brand-navy p-6 sm:p-8 text-white border border-brand-cyan/30 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 topographic-lines opacity-20 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan">
                  <PlayCircle className="w-4 h-4" />
                  <span>{t("continueWatching")}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  {locale === "ar" ? continueCourse.title_ar : continueCourse.title_en}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300">
                  {locale === "ar"
                    ? `الدرس الحالي: ${continueCourse.lastLessonTitle_ar}`
                    : `Current Lesson: ${continueCourse.lastLessonTitle_en}`}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-medium text-slate-300">
                    <span>
                      {t("progressLabel", { percent: continueCourse.progressPercent })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-cyan to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${continueCourse.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <Link
                href={`/player/${continueCourse.slug}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-brand-navy bg-brand-cyan hover:bg-cyan-300 hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{t("resumeLesson")}</span>
                <Arrow className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* My Enrolled Courses Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t("enrolledCourses")}
            </h2>

            {/* Filter Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("allTab")}
              </button>
              <button
                onClick={() => setActiveTab("inProgress")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "inProgress"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("inProgressTab")}
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === "completed"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("completedTab")}
              </button>
            </div>
          </div>

          {/* Enrolled Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const title = locale === "ar" ? course.title_ar : course.title_en;
              const isDone = course.progressPercent === 100;

              return (
                <div
                  key={course.id}
                  className="rounded-2xl bg-card border border-border/70 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div
                    className={`h-40 bg-gradient-to-tr ${course.thumbnailGradient} p-4 flex flex-col justify-between relative`}
                  >
                    <div className="flex justify-between items-center z-10">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-black/40 text-white backdrop-blur-md">
                        {course.category}
                      </span>
                      {isDone && (
                        <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t("completedTab")}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-white text-xs font-semibold z-10 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-cyan" />
                      <span>FATHY GEO CODE</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-base text-foreground line-clamp-2">
                        {title}
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t("progressLabel", { percent: course.progressPercent })}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isDone ? "bg-emerald-500" : "bg-brand-blue dark:bg-brand-cyan"
                            }`}
                            style={{ width: `${course.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/player/${course.slug}`}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-secondary hover:bg-brand-blue hover:text-white dark:hover:bg-brand-cyan dark:hover:text-brand-navy transition-colors"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>{isDone ? t("completedTab") : t("resumeLesson")}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
