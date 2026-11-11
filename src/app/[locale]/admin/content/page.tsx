"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Settings2, Youtube, BarChart, BookOpen, ArrowUpRight } from "lucide-react";

export default function AdminContentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b border-border/50">
        <h1 className="text-2xl font-extrabold text-foreground">{t("content")}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRtl
            ? "إدارة المحتوى الديناميكي للمنصة مباشرة من الإعدادات والدورات"
            : "Manage dynamic homepage content directly from Settings and Courses"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/settings"
          className="rounded-2xl glass-panel p-5 border border-border/70 hover:border-brand-cyan/40 transition-all space-y-2"
        >
          <Settings2 className="w-6 h-6 text-brand-cyan" />
          <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
            <span>{isRtl ? "الهوية وصورة المحاضر" : "Branding & Instructor"}</span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? "تحديث الشعار الرسمي واسم المنصة والنبذة التعريفية."
              : "Update official logo, tagline, and instructor profile."}
          </p>
        </Link>

        <Link
          href="/admin/settings#youtube-videos"
          className="rounded-2xl glass-panel p-5 border border-border/70 hover:border-red-500/40 transition-all space-y-2"
        >
          <Youtube className="w-6 h-6 text-red-500" />
          <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
            <span>{isRtl ? "فيديوهات يوتيوب المجانية" : "Featured YouTube Videos"}</span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? "إضافة أو تعديل روابط شروحات يوتيوب المعروضة بالرئيسية."
              : "Add or edit real YouTube links shown on the homepage."}
          </p>
        </Link>

        <Link
          href="/admin/courses"
          className="rounded-2xl glass-panel p-5 border border-border/70 hover:border-emerald-500/40 transition-all space-y-2"
        >
          <BookOpen className="w-6 h-6 text-emerald-500" />
          <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
            <span>{isRtl ? "إدارة الدورات والدروس" : "Courses & Curriculum"}</span>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
          </h3>
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? "نشر الدورات وتحديث ساعات التدريب المحسوبة تلقائياً."
              : "Manage courses whose counts & hours populate live homepage stats."}
          </p>
        </Link>
      </div>

      <div className="rounded-2xl glass-panel p-5 border border-border/70 flex items-center gap-3 text-xs text-muted-foreground">
        <BarChart className="w-5 h-5 text-emerald-500 shrink-0" />
        <span>
          {isRtl
            ? "تم استبدال كافة الأرقام الثابتة بإحصائيات حية محسوبة تلقائياً من قاعدة البيانات ويمكن التحكم في ظهورها من صفحة الإعدادات."
            : "Hardcoded homepage numbers have been replaced with live PostgreSQL stats controlled in Settings."}
        </span>
      </div>
    </div>
  );
}
