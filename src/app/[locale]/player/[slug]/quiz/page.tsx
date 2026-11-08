"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourseBySlug } from "@/lib/data/courses";
import CertificateCard from "@/components/certificate-card";
import {
  HelpCircle,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function CourseQuizPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const sampleQuestions = [
    {
      id: "q1",
      question_ar: "ما هو المرجع الجيوديسي المعتمد عالمياً في نظام تحديد المواقع GPS والخرائط الرقمية؟",
      question_en: "What is the global geodetic datum used in GPS and digital mapping?",
      options: ["WGS 84", "NAD 27", "ED 50", "Pulkovo 1942"],
      correct: 0,
      explanation_ar: "نظام WGS 84 (World Geodetic System 1984) هو المرجع الجيوديسي القياسي المستخدم في نظام GPS.",
      explanation_en: "WGS 84 is the worldwide standard reference ellipsoid adopted by GPS satellites.",
    },
    {
      id: "q2",
      question_ar: "أي من الصيغ التالية تمثل قاعدة بيانات مكانية متكاملة تدعم الطوبولوجيا في برمجيات Esri؟",
      question_en: "Which format represents an enterprise geodatabase supporting topology in Esri software?",
      options: ["Shapefile (.shp)", "File Geodatabase (.gdb)", "KML/KMZ", "GeoJSON"],
      correct: 1,
      explanation_ar: "قاعدة بيانات File Geodatabase (.gdb) تدعم بناء القواعد الطوبولوجية وعلاقات الجيوداتابيس المتقدمة.",
      explanation_en: "File Geodatabase natively supports topology rules and enterprise feature classes.",
    },
    {
      id: "q3",
      question_ar: "ما هي الأداة المستخدمة في ArcGIS Pro لإجراء تقييم الملاءمة متعدد المعايير وإعادة التصنيف؟",
      question_en: "Which toolset in ArcGIS Pro is used to conduct Multi-Criteria Evaluation (MCE)?",
      options: ["Buffer & Clip", "Spatial Analyst & ModelBuilder", "Georeferencing", "Kriging Interpolation"],
      correct: 1,
      explanation_ar: "يتم استخدام Spatial Analyst وأداة ModelBuilder لأتمتة نماذج الملاءمة المكانية وحساب الأوزان النسبية.",
      explanation_en: "Spatial Analyst and ModelBuilder automate multi-criteria overlay workflows.",
    },
  ];

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);

  const handleSelect = (qIdx: number, oIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    sampleQuestions.forEach((q, idx) => {
      if (answers[idx] === q.correct) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / sampleQuestions.length) * 100);
    setScorePercent(percent);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScorePercent(0);
  };

  const passed = scorePercent >= 70;

  return (
    <div className="min-h-screen py-10 md:py-16 relative">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <Link
            href={`/player/${course.slug}`}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{locale === "ar" ? "العودة لمشاهدة الدروس" : "Back to Lessons"}</span>
          </Link>

          <span className="text-xs font-mono font-bold text-brand-blue dark:text-brand-cyan">
            {locale === "ar" ? "درجة النجاح: 70%" : "Passing Score: 70%"}
          </span>
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <HelpCircle className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{locale === "ar" ? "اختبار التقييم المهني" : "Professional Assessment Quiz"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {locale === "ar" ? `اختبار: ${course.title_ar}` : `Assessment: ${course.title_en}`}
          </h1>
        </div>

        {/* Quiz Result Card */}
        {submitted ? (
          <div className="space-y-8">
            <div
              className={`rounded-3xl glass-panel p-8 text-center space-y-4 border ${
                passed ? "border-emerald-500/40 bg-emerald-500/5" : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                  passed
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {passed ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>

              <h2 className="text-2xl font-black text-foreground">
                {passed
                  ? locale === "ar"
                    ? "مبارك! لقد اجتزت الاختبار بنجاح"
                    : "Congratulations! You Passed"
                  : locale === "ar"
                  ? "للأسف لم تجتز الاختبار، يمكنك إعادة المحاولة"
                  : "Assessment Not Passed. You Can Retry"}
              </h2>

              <div className="text-4xl font-black font-mono text-brand-blue dark:text-brand-cyan">
                {scorePercent}%
              </div>

              <div className="pt-2 flex justify-center gap-3">
                {!passed && (
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{locale === "ar" ? "إعادة الاختبار" : "Retry Assessment"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* If Passed: Official Certificate Card Generator Unlocked */}
            {passed && (
              <div className="space-y-6 pt-4 animate-in fade-in">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    {locale === "ar" ? "تم إصدار وتوثيق شهادتك الرسمية" : "Official Credential Issued"}
                  </span>
                  <h3 className="text-xl font-extrabold text-foreground">
                    {locale === "ar" ? "شهادة الإتمام والتفوق المعتمدة" : "Verified Completion Certificate"}
                  </h3>
                </div>

                <CertificateCard
                  id={`FGC-2026-${course.slug.slice(0, 4).toUpperCase()}`}
                  studentName={locale === "ar" ? "م. كريم عبد الرحمن" : "Eng. Kareem Abdelrahman"}
                  courseTitle={locale === "ar" ? course.title_ar : course.title_en}
                  date={locale === "ar" ? "نوفمبر 2026" : "November 2026"}
                  locale={locale}
                />
              </div>
            )}
          </div>
        ) : (
          /* Quiz Questions Form */
          <div className="space-y-6">
            {sampleQuestions.map((q, qIdx) => (
              <div
                key={q.id}
                className="rounded-3xl glass-panel p-6 sm:p-7 border border-border/70 shadow-md space-y-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-brand-blue/15 text-brand-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h3 className="font-bold text-sm sm:text-base text-foreground leading-relaxed">
                    {locale === "ar" ? q.question_ar : q.question_en}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[qIdx] === oIdx;

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelect(qIdx, oIdx)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium text-start transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-brand-blue/15 border-brand-blue text-brand-blue dark:text-cyan-400 font-bold shadow-sm"
                            : "bg-background/60 border-border hover:bg-muted/40 text-foreground"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-brand-blue bg-brand-blue text-white"
                              : "border-border"
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < sampleQuestions.length}
              className="w-full py-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-brand-blue/20 disabled:opacity-50"
            >
              {locale === "ar" ? "تسليم الإجابات واعتماد النتيجة" : "Submit & Verify Score"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
