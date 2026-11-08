"use client";

import { useState } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourseBySlug } from "@/lib/data/courses";
import {
  BookOpen,
  Clock,
  Layers,
  CheckCircle2,
  Lock,
  PlayCircle,
  GraduationCap,
  Sparkles,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function CourseDetailsPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = useTranslations("CourseDetails");
  const tBrand = useTranslations("Brand");
  const isRtl = locale === "ar";

  const course = getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    s1: true,
    s21: true,
    s31: true,
  });

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const title = locale === "ar" ? course.title_ar : course.title_en;
  const description = locale === "ar" ? course.description_ar : course.description_en;
  const whatYouLearn =
    locale === "ar" ? course.what_you_will_learn_ar : course.what_you_will_learn_en;
  const requirements =
    locale === "ar" ? course.requirements_ar : course.requirements_en;
  const level = locale === "ar" ? course.level_ar : course.level_en;

  const totalLessons = course.sections.reduce(
    (acc, s) => acc + s.lessons.length,
    0
  );
  const totalSeconds = course.sections.reduce(
    (acc, s) => acc + s.lessons.reduce((lAcc, l) => lAcc + l.duration_seconds, 0),
    0
  );
  const totalHours = Math.round(totalSeconds / 3600) || 12;

  // WhatsApp Request URL Generator
  const generateWhatsAppUrl = () => {
    const phone = "201060683463";
    const text = encodeURIComponent(
      locale === "ar"
        ? `مرحباً م. أحمد فتحي، أود الاشتراك وتفعيل دورة: "${course.title_ar}". الاسم: ${studentName || "طالب جديد"} - البريد: ${studentEmail || "غير محدد"}`
        : `Hello Eng. Ahmed Fathy, I would like to request access for the course: "${course.title_en}". Name: ${studentName || "New Student"} - Email: ${studentEmail || "N/A"}`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  return (
    <div className="relative min-h-screen py-10 md:py-16">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Course Content (Left / Right depending on RTL) */}
          <div className="lg:col-span-8 space-y-10">
            {/* Header / Breadcrumb & Badge */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-brand-navy text-white">
                  {course.category}
                </span>
                <span className="px-3 py-1 rounded-md text-xs font-semibold bg-secondary text-foreground">
                  {level}
                </span>
                {course.is_free ? (
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-500 text-white">
                    {locale === "ar" ? "دورة مجانية" : "Free Course"}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-400 text-neutral-900">
                    {locale === "ar" ? `دورة مدفوعة ($${course.price})` : `Paid Course ($${course.price})`}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand-cyan" />
                  <span>{t("lessonsCount", { count: totalLessons })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-blue" />
                  <span>{t("totalDuration", { hours: totalHours })}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{locale === "ar" ? "شهادة إتمام معتمدة" : "Certificate Included"}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-border/70 space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-cyan" />
                <span>{locale === "ar" ? "عن الدورة" : "About This Course"}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* What you'll learn */}
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-border/70 space-y-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-brand-cyan" />
                <span>{t("whatYouWillLearn")}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {whatYouLearn.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-background/60 border border-border/40"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-cyan shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-foreground/90 font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Curriculum (Sections & Lessons) */}
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-border/70 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("courseContent")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("sectionsCount", { count: course.sections.length })} •{" "}
                    {t("lessonsCount", { count: totalLessons })}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {course.sections.map((sec, sIdx) => {
                  const secTitle = locale === "ar" ? sec.title_ar : sec.title_en;
                  const isOpen = openSections[sec.id] !== false;

                  return (
                    <div
                      key={sec.id}
                      className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm"
                    >
                      {/* Section Accordion Header */}
                      <button
                        onClick={() => toggleSection(sec.id)}
                        className="w-full flex items-center justify-between p-4 bg-muted/40 hover:bg-muted/70 transition-colors text-start"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-brand-blue/15 text-brand-blue text-xs font-bold flex items-center justify-center">
                            {sIdx + 1}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {secTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {sec.lessons.length}{" "}
                            {locale === "ar" ? "دروس" : "lessons"}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </button>

                      {/* Lessons List */}
                      {isOpen && (
                        <div className="divide-y divide-border/30">
                          {sec.lessons.map((lesson) => {
                            const lTitle =
                              locale === "ar" ? lesson.title_ar : lesson.title_en;
                            const minutes = Math.floor(lesson.duration_seconds / 60);

                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3.5 px-4 hover:bg-muted/20 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.is_free_preview ? (
                                    <PlayCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="text-xs sm:text-sm font-medium text-foreground">
                                    {lTitle}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {lesson.is_free_preview && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      {t("previewAvailable")}
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {minutes} {locale === "ar" ? "د" : "m"}
                                  </span>
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
            </div>

            {/* Requirements */}
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-border/70 space-y-4">
              <h2 className="text-xl font-bold text-foreground">
                {t("requirements")}
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                {requirements.map((req, rIdx) => (
                  <li key={rIdx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructor Box */}
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-border/70">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy to-brand-cyan shadow-lg shrink-0">
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background">
                    <Image
                      src="/logo.jpg"
                      alt={tBrand("owner")}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-2 text-center sm:text-start">
                  <div className="text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                    {t("instructorTitle")}
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground">
                    {tBrand("owner")}
                  </h3>
                  <p className="text-xs font-medium text-brand-blue dark:text-cyan-400">
                    {tBrand("ownerTitle")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    {locale === "ar"
                      ? "خريج ليسانس آداب برنامج الجيوماتكس ونظم المعلومات الجغرافية، محلل بيانات مكانية متخصص في تحليلات نظم المعلومات الجغرافية المتقدمة والاستشعار عن بعد ومشاريع النمذجة البيئية والكارتوغرافيا."
                      : "Spatial Data Analyst with a Bachelor of Arts in Geomatics and GIS. Specialized in advanced GIS analytics, satellite remote sensing, cartographic modeling and professional instruction."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Action Card (Right / Left) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="rounded-3xl glass-panel p-6 sm:p-7 border border-border/70 shadow-2xl shadow-brand-blue/10 backdrop-blur-2xl space-y-6">
              {/* Preview Banner */}
              <div
                className={`relative h-44 rounded-2xl bg-gradient-to-tr ${course.thumbnailGradient} p-5 flex flex-col justify-between overflow-hidden shadow-md`}
              >
                <div className="absolute inset-0 topographic-lines opacity-30" />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/50 text-white backdrop-blur-md">
                    {course.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
                      course.is_free
                        ? "bg-emerald-500 text-white"
                        : "bg-amber-400 text-neutral-900"
                    }`}
                  >
                    {course.is_free ? t("enrollFree") : `$${course.price}`}
                  </span>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-white/90 text-xs">
                  <Layers className="w-4 h-4 text-brand-cyan" />
                  <span>FATHY GEO CODE</span>
                </div>
              </div>

              {/* Price Tag */}
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {locale === "ar" ? "قيمة الاشتراك:" : "Enrollment Fee:"}
                </span>
                <span className="text-3xl font-extrabold text-foreground">
                  {course.is_free ? (
                    <span className="text-emerald-500">
                      {locale === "ar" ? "مجاناً" : "Free"}
                    </span>
                  ) : (
                    <span>${course.price}</span>
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {course.is_free ? (
                  /* Free Course: Instant enroll / start player */
                  <Link
                    href={`/player/${course.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-brand-blue/20 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <GraduationCap className="w-5 h-5 text-brand-cyan" />
                    <span>{t("enrollFree")}</span>
                  </Link>
                ) : (
                  /* Paid Course: Request Access flow (Modal & WhatsApp) */
                  <button
                    onClick={() => setRequestModalOpen(true)}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-brand-cyan/20 bg-gradient-to-r from-brand-blue via-brand-cyan to-teal-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>{t("requestAccess")}</span>
                  </button>
                )}

                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                >
                  <span>{locale === "ar" ? "استفسار أو مساعدة" : "Inquiries & Support"}</span>
                </Link>
              </div>

              {/* Course quick metadata */}
              <div className="space-y-3 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "المستوى" : "Level"}</span>
                  <span className="font-semibold text-foreground">{level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "ساعات التدريب" : "Total Duration"}</span>
                  <span className="font-semibold text-foreground">
                    {totalHours} {locale === "ar" ? "ساعات" : "Hours"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "صلاحية الوصول" : "Access Period"}</span>
                  <span className="font-semibold text-emerald-500">
                    {locale === "ar" ? "مدى الحياة" : "Lifetime Access"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "الشهادة الممنوحة" : "Certificate"}</span>
                  <span className="font-semibold text-brand-cyan">
                    {locale === "ar" ? "شهادة موثقة بـ QR" : "Verified with QR"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paid Request Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl glass-panel p-6 sm:p-8 border border-border shadow-2xl space-y-5 bg-card">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("requestModalTitle")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t("requestModalDesc")}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {locale === "ar" ? "اسمك الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={locale === "ar" ? "م. أحمد محمد" : "John Doe"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  {locale === "ar" ? "بريدك الإلكتروني" : "Email Address"}
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setRequestModalOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t("sendRequestBtn")}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setRequestModalOpen(false)}
                className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
