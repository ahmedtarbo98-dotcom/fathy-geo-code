"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileEdit,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  Send,
  Youtube,
  PhoneCall,
  Globe,
} from "lucide-react";

export default function AdminContentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const [saved, setSaved] = useState(false);

  // Home Page texts
  const [heroTitleAr, setHeroTitleAr] = useState("احتراف نظم المعلومات الجغرافية والاستشعار عن بعد من الصفر للتميز");
  const [heroDescAr, setHeroDescAr] = useState("منصة تعليمية وتطبيقية متقدمة يقدمها م. أحمد فتحي. دورات شاملة في ArcGIS Pro، Google Earth Engine، النمذجة المكانية، والمساحة الرقمية.");
  const [statsStudents, setStatsStudents] = useState("1500");
  const [statsCourses, setStatsCourses] = useState("14");
  const [statsHours, setStatsHours] = useState("160");

  // Social Links
  const [telegramUrl, setTelegramUrl] = useState("https://t.me/Fathy772");
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw");
  const [whatsappPhone, setWhatsappPhone] = useState("201060683463");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("content")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "تعديل نصوص الصفحة الرئيسية، أرقام الإحصائيات، قنوات التواصل وروابط المنصة"
              : "Edit homepage copy, stats counters, social channels, and CMS entries"}
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>تم حفظ وتحديث محتوى المنصة بنجاح!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Hero Section Copy */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>نصوص الترويسة الرئيسية (Hero Section)</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                العنوان الرئيسي (Hero Headline)
              </label>
              <input
                type="text"
                value={heroTitleAr}
                onChange={(e) => setHeroTitleAr(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                الوصف التعريفي (Hero Subtitle)
              </label>
              <textarea
                rows={3}
                value={heroDescAr}
                onChange={(e) => setHeroDescAr(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-background text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Stats Strip Numbers */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-blue" />
            <span>أرقام شريط الإحصائيات (Stats Strip)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                عدد الطلاب (Students)
              </label>
              <input
                type="text"
                value={statsStudents}
                onChange={(e) => setStatsStudents(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                عدد الدورات (Courses)
              </label>
              <input
                type="text"
                value={statsCourses}
                onChange={(e) => setStatsCourses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                ساعات التدريب (Hours)
              </label>
              <input
                type="text"
                value={statsHours}
                onChange={(e) => setStatsHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Official Channels */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>روابط وقنوات التواصل الرسمية</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>قناة يوتيوب الرسمية</span>
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-[#229ED9]" />
                <span>رابط تيليجرام (Telegram)</span>
              </label>
              <input
                type="text"
                value={telegramUrl}
                onChange={(e) => setTelegramUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#25D366]" />
                <span>رقم واتساب لتنفيذ المشاريع والاشتراك</span>
              </label>
              <input
                type="text"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{t("saveChanges")}</span>
        </button>
      </form>
    </div>
  );
}
