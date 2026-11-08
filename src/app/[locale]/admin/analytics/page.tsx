"use client";

import { useTranslations } from "next-intl";
import {
  BarChart3,
  TrendingUp,
  PlayCircle,
  ShieldCheck,
  Eye,
  Clock,
  Sparkles,
} from "lucide-react";

export default function AdminAnalyticsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");

  const topLessons = [
    {
      title_ar: "نظرة عامة على واجهة ArcGIS Pro ومفاهيم الجيوماتكس",
      course: "ArcGIS Pro Fundamentals",
      views: 3420,
      completionRate: "94%",
    },
    {
      title_ar: "نظم الإسقاط والتحويل بين المساقط المكانية",
      course: "ArcGIS Pro Fundamentals",
      views: 2890,
      completionRate: "89%",
    },
    {
      title_ar: "حل مشكلة إزاحة الخرائط واختلاف Datum",
      course: "FATHY GEO CODE Tricks",
      views: 2450,
      completionRate: "92%",
    },
    {
      title_ar: "بناء وإدارة File Geodatabase وقواعد الطوبولوجيا",
      course: "ArcGIS Pro Fundamentals",
      views: 2120,
      completionRate: "81%",
    },
  ];

  const videoSecurityLogs = [
    {
      user: "kareem@example.com",
      lessonId: "l1",
      ip: "197.38.12.84 (Cairo, EG)",
      time: "منذ 8 دقائق",
      status: "Authorized",
    },
    {
      user: "heba@example.com",
      lessonId: "l21",
      ip: "156.204.91.12 (Giza, EG)",
      time: "منذ 24 دقيقة",
      status: "Authorized",
    },
    {
      user: "student@fathygeocode.com",
      lessonId: "l3",
      ip: "102.45.188.50 (Alexandria, EG)",
      time: "منذ 45 دقيقة",
      status: "Authorized",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("analytics")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "تحليلات المشاهدات لكل درس، معدلات إتمام الدورات، وسجلات أمان الوصول للفيديوهات"
              : "Lesson views metrics, course completion funnels, and video access security logs"}
          </p>
        </div>
      </div>

      {/* Top Watched Lessons */}
      <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-brand-cyan" />
          <span>الدروس الأكثر مشاهدة وإتماماً</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground">
              <tr>
                <th className="p-3 text-start">عنوان الدرس</th>
                <th className="p-3 text-start">الدورة</th>
                <th className="p-3 text-start">عدد المشاهدات</th>
                <th className="p-3 text-end">معدل الإتمام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {topLessons.map((l, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="p-3 font-semibold text-foreground">
                    {l.title_ar}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {l.course}
                  </td>
                  <td className="p-3 font-mono font-bold text-brand-blue dark:text-cyan-400">
                    {l.views.toLocaleString()}
                  </td>
                  <td className="p-3 text-end font-mono font-bold text-emerald-500">
                    {l.completionRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Access Logs (Security Audit) */}
      <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>سجلات أمان وصول الفيديو (Video Access Security Logs)</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground">
              <tr>
                <th className="p-3 text-start">الطالب (User Email)</th>
                <th className="p-3 text-start">معرّف الدرس (Lesson ID)</th>
                <th className="p-3 text-start">عنوان IP والموقع الجغرافي</th>
                <th className="p-3 text-start">الوقت</th>
                <th className="p-3 text-end">نتيجة التحقق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-xs">
              {videoSecurityLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-muted/30">
                  <td className="p-3 font-sans font-semibold text-foreground">
                    {log.user}
                  </td>
                  <td className="p-3 text-brand-blue dark:text-cyan-400">
                    {log.lessonId}
                  </td>
                  <td className="p-3 text-muted-foreground">{log.ip}</td>
                  <td className="p-3 text-muted-foreground font-sans">
                    {log.time}
                  </td>
                  <td className="p-3 text-end">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
