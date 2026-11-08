"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getCourses } from "@/lib/data/courses";
import { HelpCircle, Plus, CheckCircle2, Trash2, Award, Sparkles } from "lucide-react";

export default function AdminQuizzesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const courses = getCourses();

  const [questions, setQuestions] = useState([
    {
      id: "q-1",
      question_ar: "ما هو المرجع الجيوديسي المعتمد عالمياً في نظام تحديد المواقع GPS؟",
      question_en: "What is the global geodetic datum used in GPS?",
      options: ["WGS 84", "NAD 27", "ED 50", "Pulkovo 1942"],
      correctIndex: 0,
    },
    {
      id: "q-2",
      question_ar: "أي من الصيغ التالية تمثل قاعدة بيانات مكانية متكاملة تدعم الطوبولوجيا في Esri؟",
      question_en: "Which format represents an enterprise geodatabase supporting topology in Esri?",
      options: ["Shapefile (.shp)", "File Geodatabase (.gdb)", "KML/KMZ", "GeoJSON"],
      correctIndex: 1,
    },
  ]);

  const [newQuestionAr, setNewQuestionAr] = useState("");
  const [opt0, setOpt0] = useState("");
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");
  const [correctIdx, setCorrectIdx] = useState(0);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionAr || !opt0 || !opt1) return;

    setQuestions([
      ...questions,
      {
        id: `q-${Date.now()}`,
        question_ar: newQuestionAr,
        question_en: newQuestionAr,
        options: [opt0, opt1, opt2 || "N/A", opt3 || "N/A"],
        correctIndex: correctIdx,
      },
    ]);

    setNewQuestionAr("");
    setOpt0("");
    setOpt1("");
    setOpt2("");
    setOpt3("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("quizzes")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "إنشاء وإدارة بنك الأسئلة والاختبارات التقييمية المؤهلة للشهادة"
              : "Manage assessment quizzes, questions, correct answers, and passing criteria"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Existing Questions List (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-cyan" />
            <span>{locale === "ar" ? "أسئلة اختبار الدورة" : "Quiz Questions"}</span>
            <span className="text-xs text-muted-foreground">({questions.length})</span>
          </h2>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="rounded-2xl glass-panel p-5 border border-border/70 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-brand-blue/15 text-brand-blue text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {qIdx + 1}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {locale === "ar" ? q.question_ar : q.question_en}
                    </span>
                  </div>
                  <button
                    onClick={() => setQuestions(questions.filter((item) => item.id !== q.id))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                        oIdx === q.correctIndex
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold"
                          : "bg-muted/40 border-border/50 text-muted-foreground"
                      }`}
                    >
                      {oIdx === q.correctIndex ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-border inline-block" />
                      )}
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Question Form (Col 5) */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl glass-panel p-6 border border-border/70 shadow-lg space-y-4 bg-card">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-blue" />
              <span>{locale === "ar" ? "إضافة سؤال جديد" : "Add New Question"}</span>
            </h3>

            <form onSubmit={handleAddQuestion} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  نص السؤال (Question Text) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newQuestionAr}
                  onChange={(e) => setNewQuestionAr(e.target.value)}
                  placeholder="اكتب السؤال هنا..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-foreground block">
                  الخيارات الأربعة (Options)
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctRadio"
                    checked={correctIdx === 0}
                    onChange={() => setCorrectIdx(0)}
                  />
                  <input
                    type="text"
                    required
                    value={opt0}
                    onChange={(e) => setOpt0(e.target.value)}
                    placeholder="الخيار الأول (اضغط على الدائرة إذا كان هو الصحيح)"
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctRadio"
                    checked={correctIdx === 1}
                    onChange={() => setCorrectIdx(1)}
                  />
                  <input
                    type="text"
                    required
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    placeholder="الخيار الثاني"
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctRadio"
                    checked={correctIdx === 2}
                    onChange={() => setCorrectIdx(2)}
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    placeholder="الخيار الثالث (اختياري)"
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctRadio"
                    checked={correctIdx === 3}
                    onChange={() => setCorrectIdx(3)}
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    placeholder="الخيار الرابع (اختياري)"
                    className="w-full px-3 py-1.5 rounded-xl border border-border bg-background text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-sm transition-all"
              >
                إضافة السؤال للاختبار
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
