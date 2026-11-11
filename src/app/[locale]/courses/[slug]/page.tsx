"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { getCourseBySlug, CourseDetailData } from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/client";
import { SiteLogoImage } from "@/components/site-branding-provider";
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
  RefreshCw,
  CreditCard,
  Send,
} from "lucide-react";

export default function CourseDetailsPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const t = useTranslations("CourseDetails");
  const tBrand = useTranslations("Brand");
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Paid Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);

        const rawSlug = String(slug || "").trim();
        const decodedSlug = decodeURIComponent(rawSlug).trim();
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decodedSlug);

        // 1. Try Supabase query safely
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
          // Try decoded slug
          const { data: d1, error: e1 } = await supabase
            .from("courses")
            .select(selectFields)
            .eq("slug", decodedSlug)
            .maybeSingle();

          if (!e1 && d1) {
            dbCourse = d1;
          } else {
            // Try raw slug
            const { data: d2, error: e2 } = await supabase
              .from("courses")
              .select(selectFields)
              .eq("slug", rawSlug)
              .maybeSingle();

            if (!e2 && d2) {
              dbCourse = d2;
            } else {
              // Try case-insensitive ilike
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

          const transformed: CourseDetailData = {
            id: dbCourse.id,
            slug: dbCourse.slug,
            title_ar: dbCourse.title_ar,
            title_en: dbCourse.title_en,
            short_description_ar: dbCourse.short_description_ar || dbCourse.title_ar,
            short_description_en: dbCourse.short_description_en || dbCourse.title_en,
            description_ar: dbCourse.description_ar || dbCourse.short_description_ar || "",
            description_en: dbCourse.description_en || dbCourse.short_description_en || "",
            what_you_will_learn_ar: Array.isArray(dbCourse.what_you_will_learn_ar)
              ? dbCourse.what_you_will_learn_ar
              : [],
            what_you_will_learn_en: Array.isArray(dbCourse.what_you_will_learn_en)
              ? dbCourse.what_you_will_learn_en
              : [],
            requirements_ar: Array.isArray(dbCourse.requirements_ar)
              ? dbCourse.requirements_ar
              : [],
            requirements_en: Array.isArray(dbCourse.requirements_en)
              ? dbCourse.requirements_en
              : [],
            thumbnail_url: dbCourse.thumbnail_url || "/logo.jpg",
            thumbnailGradient: "from-blue-600 via-indigo-700 to-brand-navy",
            category: dbCourse.category || "GIS & Mapping",
            level: dbCourse.level || "all_levels",
            level_ar:
              dbCourse.level === "beginner"
                ? "مبتدئ"
                : dbCourse.level === "advanced"
                ? "متقدم"
                : "جميع المستويات",
            level_en: dbCourse.level || "All Levels",
            is_free: dbCourse.is_free,
            price: dbCourse.price || 0,
            currency: dbCourse.currency || "USD",
            status: dbCourse.status || "published",
            sections: sortedSections,
          };

          setCourse(transformed);

          // Open first section by default
          if (sortedSections.length > 0) {
            setOpenSections({ [sortedSections[0].id]: true });
          }

          // Check enrollment status & prefill user info
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
              setStudentName(session.user.user_metadata?.full_name || "");
              setStudentEmail(session.user.email || "");
            }

            const headers: Record<string, string> = {};
            if (session?.access_token) {
              headers["Authorization"] = `Bearer ${session.access_token}`;
            }

            const enrRes = await fetch(`/api/check-enrollment?courseId=${dbCourse.id}`, {
              headers,
            });
            if (enrRes.ok) {
              const enrData = await enrRes.json();
              setIsEnrolled(!!enrData.isEnrolled);
              setHasPendingRequest(!!enrData.pendingRequest);
            }
          } catch (e) {
            console.warn("Check enrollment warning:", e);
          }

          return;
        }

        // 2. Fallback to static mock courses
        const staticMatch = getCourseBySlug(decodedSlug) || getCourseBySlug(rawSlug);
        if (staticMatch) {
          setCourse(staticMatch);
          if (staticMatch.sections.length > 0) {
            setOpenSections({ [staticMatch.sections[0].id]: true });
          }
          return;
        }

        // If not found in either
        setCourse(null);
      } catch (err) {
        console.error("Failed to load course details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-cyan" />
        <p className="text-xs text-muted-foreground font-medium">
          {isRtl ? "جارٍ تحميل بيانات الدورة..." : "Loading course details..."}
        </p>
      </div>
    );
  }

  if (!course) {
    notFound();
  }

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
    (acc, s) => acc + (s.lessons?.length || 0),
    0
  );
  const totalSeconds = course.sections.reduce(
    (acc, s) => acc + (s.lessons || []).reduce((lAcc, l) => lAcc + (l.duration_seconds || 0), 0),
    0
  );
  const totalHours = Math.round(totalSeconds / 3600) || 12;

  // WhatsApp Request URL Generator
  const generateWhatsAppUrl = () => {
    const phone = "201060683463";
    const text = encodeURIComponent(
      locale === "ar"
        ? `مرحباً م. أحمد فتحي، أود الاشتراك وتفعيل دورة: "${course.title_ar}".\nاسم الطالب: ${studentName || "طالب جديد"}\nالبريد: ${studentEmail || "غير محدد"}\nالهاتف: ${studentPhone || "غير محدد"}`
        : `Hello Eng. Ahmed Fathy, I would like to request access for the course: "${course.title_en}".\nName: ${studentName || "New Student"}\nEmail: ${studentEmail || "N/A"}\nPhone: ${studentPhone || "N/A"}`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  // Handle Submit Enrollment Request
  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.trim()) {
      alert(isRtl ? "يرجى إدخال الاسم والبريد الإلكتروني" : "Please enter your name and email");
      return;
    }

    try {
      setSubmittingRequest(true);

      // Call dedicated API endpoint with Service Role bypass
      const res = await fetch("/api/enroll-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          fullName: studentName,
          email: studentEmail,
          phone: studentPhone,
          notes: `Requested via Course Details page (${course.price} ${course.currency})`,
        }),
      });

      const result = await res.json();
      if (!res.ok || result.error) {
        console.warn("Backend enroll request warning:", result.error);
      }

      setRequestSuccess(true);

      // Open WhatsApp automatically
      window.open(generateWhatsAppUrl(), "_blank");
    } catch (err: any) {
      console.error("Enrollment request error:", err);
      // Still open WhatsApp as fallback
      window.open(generateWhatsAppUrl(), "_blank");
      setRequestSuccess(true);
    } finally {
      setSubmittingRequest(false);
    }
  };

  return (
    <div className="relative min-h-screen py-8 md:py-16 overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[260px] sm:w-[400px] h-[260px] sm:h-[400px] bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Main Course Content */}
          <div className="order-2 lg:order-1 lg:col-span-8 space-y-8 sm:space-y-10 min-w-0">
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
                    {course.price} {course.currency}
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
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-cyan" />
                  <span>{totalHours} {locale === "ar" ? "ساعة تدريبية" : "Training Hours"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{locale === "ar" ? "شهادة إتمام معتمدة" : "Verified Certificate"}</span>
                </div>
              </div>
            </div>

            {/* Course Overview */}
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-cyan" />
                <span>{t("overview")}</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {description}
              </p>
            </div>

            {/* What you'll learn */}
            {whatYouLearn && whatYouLearn.length > 0 && (
              <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 space-y-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span>{t("whatYouWillLearn")}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {whatYouLearn.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        ✓
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Curriculum Sections & Lessons */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
                  <span>{t("curriculum")}</span>
                </h2>
                <span className="text-xs text-muted-foreground">
                  {course.sections.length} {locale === "ar" ? "فصول" : "Sections"} • {totalLessons} {locale === "ar" ? "دروس" : "Lessons"}
                </span>
              </div>

              {course.sections.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/40 text-muted-foreground text-xs">
                  {isRtl
                    ? "المنهج التدريبي قيد التحديث والإضافة حالياً."
                    : "Curriculum is currently being updated."}
                </div>
              ) : (
                <div className="space-y-3">
                  {course.sections.map((section, sIdx) => {
                    const sTitle = locale === "ar" ? section.title_ar : section.title_en;
                    const isOpen = !!openSections[section.id];
                    return (
                      <div
                        key={section.id || sIdx}
                        className="rounded-2xl border border-border/70 bg-card/60 overflow-hidden shadow-sm transition-all"
                      >
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full p-4 flex items-center justify-between text-start hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-brand-navy/10 dark:bg-brand-navy/40 text-brand-blue dark:text-brand-cyan text-xs font-bold flex items-center justify-center font-mono">
                              {sIdx + 1}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {sTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">
                              {section.lessons?.length || 0} {locale === "ar" ? "دروس" : "lessons"}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-3 divide-y divide-border/40">
                            {(section.lessons || []).map((lesson, lIdx) => {
                              const lTitle = locale === "ar" ? lesson.title_ar : lesson.title_en;
                              const minutes = Math.round((lesson.duration_seconds || 900) / 60);
                              const canWatch = isEnrolled || lesson.is_free_preview || course.is_free;
                              return canWatch ? (
                                <Link
                                  key={lesson.id || lIdx}
                                  href={`/player/${course.slug}?lessonId=${lesson.id}`}
                                  className="py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm group hover:bg-brand-blue/5 px-2 rounded-lg transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <PlayCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                                    <span className="text-foreground font-medium group-hover:text-brand-blue dark:group-hover:text-brand-cyan truncate">
                                      {lTitle}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                                      <span>{isEnrolled ? (isRtl ? "مشاهدة الدرس" : "Watch Lesson") : (isRtl ? "معاينة" : "Preview")}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </span>
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {minutes} {locale === "ar" ? "د" : "m"}
                                    </span>
                                  </div>
                                </Link>
                              ) : (
                                <div
                                  key={lesson.id || lIdx}
                                  className="py-2.5 flex items-center justify-between text-xs sm:text-sm px-2"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="text-muted-foreground font-medium">
                                      {lTitle}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
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
              )}
            </div>

            {/* Instructor Box */}
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy to-brand-cyan shadow-lg shrink-0">
                  <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background">
                    <SiteLogoImage
                      variant="instructor"
                      alt={tBrand("owner")}
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
                      ? "مهندس ومطور نظم معلومات جغرافية معتمد، متخصص في تحليلات نظم المعلومات الجغرافية المتقدمة والاستشعار عن بعد وبرمجة التطبيقات المكانية."
                      : "Certified GIS Engineer & Spatial Data Analyst specializing in remote sensing, spatial programming, and GIS workflows."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Action Card */}
          <div className="order-1 lg:order-2 lg:col-span-4 lg:sticky lg:top-28 space-y-6">
            <div className="rounded-3xl glass-panel p-5 sm:p-7 border border-border/70 shadow-2xl shadow-brand-blue/10 backdrop-blur-2xl space-y-5 sm:space-y-6">
              {/* Thumbnail Banner */}
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-md bg-muted">
                {course.thumbnail_url ? (
                  <Image
                    src={course.thumbnail_url}
                    alt={title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-brand-navy text-white text-xs font-bold">
                    FATHY GEO CODE
                  </div>
                )}
                <div className="absolute top-2.5 start-2.5 z-10">
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Price Tag or Enrolled Status */}
              {isEnrolled ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>
                    {isRtl
                      ? "تم تفعيل اشتراكك في هذه الدورة بنجاح!"
                      : "You are enrolled in this course!"}
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {locale === "ar" ? "قيمة الاشتراك:" : "Enrollment Fee:"}
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
                    {course.is_free ? (
                      <span className="text-emerald-500">
                        {locale === "ar" ? "مجاناً" : "Free"}
                      </span>
                    ) : (
                      <span>{course.price} {course.currency}</span>
                    )}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isEnrolled ? (
                  <Link
                    href={`/player/${course.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-brand-blue/20 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <PlayCircle className="w-5 h-5 text-brand-cyan" />
                    <span>
                      {isRtl ? "تم التفعيل • ابدأ المشاهدة الآن" : "Activated • Start Watching Now"}
                    </span>
                  </Link>
                ) : course.is_free ? (
                  <Link
                    href={`/player/${course.slug}`}
                    className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-brand-blue/20 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <GraduationCap className="w-5 h-5 text-brand-cyan" />
                    <span>{t("enrollFree")}</span>
                  </Link>
                ) : (
                  <>
                    {hasPendingRequest && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                        {isRtl
                          ? "⏳ تم استلام طلب الاشتراك الخاص بك وجاري مراجعته من الإدارة لتفعيل الدورة على حسابك."
                          : "⏳ Your enrollment request is pending review."}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setRequestSuccess(false);
                        setRequestModalOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all"
                    >
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span>{isRtl ? "طلب الاشتراك والتفعيل (فودافون كاش / إنستاباي)" : "Request Access & Payment"}</span>
                    </button>

                    <Link
                      href={`/player/${course.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-all"
                    >
                      <PlayCircle className="w-4 h-4 shrink-0" />
                      <span>{isRtl ? "مشاهدة الدروس المجانية والمعاينة" : "Watch Free Preview Lessons"}</span>
                    </Link>
                  </>
                )}

                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                >
                  <span>{locale === "ar" ? "استفسار أو مساعدة" : "Inquiries & Support"}</span>
                </Link>
              </div>

              {/* Metadata list */}
              <div className="space-y-3 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "المستوى" : "Level"}</span>
                  <span className="font-semibold text-foreground">{level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "ساعات التدريب" : "Total Duration"}</span>
                  <span className="font-semibold text-foreground">{totalHours} {locale === "ar" ? "ساعات" : "Hours"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "صلاحية الوصول" : "Access Period"}</span>
                  <span className="font-semibold text-emerald-500">{locale === "ar" ? "مدى الحياة" : "Lifetime Access"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{locale === "ar" ? "الشهادة" : "Certificate"}</span>
                  <span className="font-semibold text-brand-cyan">{locale === "ar" ? "شهادة موثقة بـ QR" : "Verified with QR"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Paid Request & Payment Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 border border-border shadow-2xl space-y-5 bg-card">
            {requestSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-foreground">
                  {isRtl ? "تم إرسال طلب الاشتراك بنجاح!" : "Enrollment Request Sent!"}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isRtl
                    ? "تم تسجيل طلبك وفتح محادثة واتساب مع م. أحمد فتحي لتأكيد التحويل وتفعيل الدورة على حسابك فوراً."
                    : "Your request has been registered and WhatsApp opened to confirm payment and activate your access."}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setRequestModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold"
                  >
                    {isRtl ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnrollment} className="space-y-4">
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {isRtl ? `الاشتراك في دورة: ${course.title_ar}` : `Enroll in: ${course.title_en}`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? `قيمة الدورة: ${course.price} ${course.currency}` : `Course Fee: ${course.price} ${course.currency}`}
                  </p>
                </div>

                {/* Payment Methods Info Box */}
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/80 space-y-2.5 text-xs">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <span>{isRtl ? "طرق الدفع والتحويل المتاحة داخل مصر:" : "Available Payment Methods:"}</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[11px] text-muted-foreground">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
                      <span className="font-sans font-bold text-foreground">📱 فودافون كاش (Vodafone Cash):</span>
                      <span className="font-bold text-emerald-500 font-mono text-xs">01060683463</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-background border border-border/60">
                      <span className="font-sans font-bold text-foreground">⚡ إنستاباي (InstaPay):</span>
                      <span className="font-bold text-brand-cyan font-mono text-xs">01149280661</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
                    {isRtl
                      ? "💡 قم بالتحويل أولاً إلى أحد الرقمين أعلاه، ثم اكتب بياناتك بالأسفل واضغط تأكيد لفتح محادثة واتساب وإرسال إشعار التحويل. ستقوم إدارة المنصة بمراجعة التحويل وتفعيل الدورة على حسابك مباشرة."
                      : "💡 Transfer the fee via Cash or InstaPay to the numbers above, enter your details below, and confirm to send verification via WhatsApp. Admin will review and activate your access manually."}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs bg-background"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        {locale === "ar" ? "البريد الإلكتروني" : "Email"}
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs bg-background"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        {locale === "ar" ? "رقم الهاتف / واتساب" : "Phone / WhatsApp"}
                      </label>
                      <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="01012345678"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-border text-xs bg-background font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submittingRequest
                        ? (isRtl ? "جارٍ تسجيل الطلب..." : "Submitting...")
                        : (isRtl ? "تأكيد الاشتراك وإرسال إشعار التحويل عبر واتساب" : "Confirm & Send via WhatsApp")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="w-full py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    {locale === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
