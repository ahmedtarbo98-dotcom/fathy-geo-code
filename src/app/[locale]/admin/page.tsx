"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  Users,
  BookOpen,
  Award,
  TrendingUp,
  UserCheck,
  PlayCircle,
  PhoneCall,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const stats = [
    {
      title: t("totalStudents"),
      value: "1,520",
      change: "+14% this month",
      icon: Users,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
    {
      title: t("activeEnrollments"),
      value: "1,845",
      change: "+18 this week",
      icon: BookOpen,
      color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    },
    {
      title: t("publishedCourses"),
      value: "14",
      change: "3 Free • 11 Paid",
      icon: Award,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      title: t("completionRate"),
      value: "86.4%",
      change: "+3.2% vs average",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  const pendingRequests = [
    {
      id: "req-1",
      name: "م. إبراهيم خليل",
      email: "ibrahim@example.com",
      phone: "+201012345678",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      date: "منذ ساعتين",
    },
    {
      id: "req-2",
      name: "د. سارة فؤاد",
      email: "sara@example.com",
      phone: "+201098765432",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      date: "منذ 5 ساعات",
    },
  ];

  const recentActivity = [
    {
      user: "م. طارق يوسف",
      action_ar: "أكمل دورة 'أساسيات وتطبيقات ArcGIS Pro' وتم إصدار شهادة",
      action_en: "Completed 'ArcGIS Pro Fundamentals' and issued certificate",
      time: "منذ 15 دقيقة",
    },
    {
      user: "م. نورهان علي",
      action_ar: "اشتركت في دورة 'أسرار وحيل FATHY GEO CODE'",
      action_en: "Enrolled in 'FATHY GEO CODE Tricks'",
      time: "منذ 40 دقيقة",
    },
    {
      user: "أحمد عبد الله",
      action_ar: "اجتاز اختبار تقييم ArcGIS Pro بنسبة 95%",
      action_en: "Passed ArcGIS Pro assessment quiz with 95%",
      time: "منذ ساعتين",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("overview")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "متابعة أداء المنصة التعليمية، الطلاب، والاشتراكات"
              : "Monitor platform metrics, learner activity, and access requests"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-sm transition-all"
          >
            <span>{t("addNewCourse")}</span>
            <Arrow className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl glass-panel p-5 border border-border/70 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold">
                  {s.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border ${s.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono">
                  {s.value}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {s.change}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Pending Enrollment Requests (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-bold text-foreground">
                {t("pendingRequests")}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                {pendingRequests.length} جديد
              </span>
            </div>
            <Link
              href="/admin/requests"
              className="text-xs text-brand-blue dark:text-brand-cyan hover:underline font-semibold"
            >
              {locale === "ar" ? "عرض الكل" : "View All"}
            </Link>
          </div>

          <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden divide-y divide-border/50">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      {req.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({req.date})</span>
                  </div>
                  <div className="text-xs text-brand-blue dark:text-cyan-400 font-medium">
                    {req.course}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {req.email} • {req.phone}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                    title="WhatsApp"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => alert(locale === "ar" ? "تم تفعيل الاشتراك للطالب بنجاح!" : "Enrollment activated!")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    {t("approve")}
                  </button>
                  <button
                    onClick={() => alert(locale === "ar" ? "تم رفض الطلب" : "Request rejected")}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted"
                  >
                    {t("reject")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-cyan" />
            <h2 className="text-base font-bold text-foreground">
              {locale === "ar" ? "النشاط الأخير في المنصة" : "Recent Platform Activity"}
            </h2>
          </div>

          <div className="rounded-2xl glass-panel p-5 border border-border/70 space-y-4">
            {recentActivity.map((act, aIdx) => (
              <div key={aIdx} className="flex items-start gap-3 pb-3 border-b border-border/40 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-brand-cyan mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-foreground">{act.user}</div>
                  <div className="text-xs text-muted-foreground">
                    {locale === "ar" ? act.action_ar : act.action_en}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    {act.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
