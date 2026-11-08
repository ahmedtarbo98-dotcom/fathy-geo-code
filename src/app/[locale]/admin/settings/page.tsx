"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Settings,
  ShieldAlert,
  Save,
  CheckCircle2,
  Users,
  Smartphone,
  Info,
  Layers,
  Lock,
} from "lucide-react";

export default function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const [saved, setSaved] = useState(false);

  const [siteName, setSiteName] = useState("FATHY GEO CODE");
  const [tagline, setTagline] = useState("GIS & Remote Sensing Educational Hub");
  const [maxDevices, setMaxDevices] = useState("2");
  const [pauseOnTabHidden, setPauseOnTabHidden] = useState(true);
  const [adminEmail, setAdminEmail] = useState("ahmedfathy@example.com");

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
            {t("settings")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "إعدادات الأمان، الحد الأقصى للأجهزة المتزامنة، وإدارة صلاحيات الإدارة"
              : "Security configurations, max concurrent sessions, and administrative controls"}
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>تم حفظ إعدادات المنصة بنجاح!</span>
        </div>
      )}

      {/* Honest Protection Note required by §5 item 6 */}
      <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {locale === "ar" ? "ملاحظة أمان وتشفير الفيديوهات (DRM Architecture)" : "Security & Video DRM Advisory"}
          </h4>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
            {locale === "ar"
              ? "فيديوهات يوتيوب غير المدرجة (Unlisted) توفر حماية ممتازة مع العلامة المائية المتنقلة وحظر الروابط المباشرة، ولكن لا يمكن حمايتها بنسبة 100% ضد أدوات التسجيل المتقدمة؛ لأعلى مستويات الحماية المشفرة مستقبلاً، تم تجهيز نظام المشغل (VideoPlayer Abstraction) ليدعم مزود مشفر مثل Bunny Stream DRM أو Vimeo OTT دون الحاجة لإعادة كتابة كود الموقع."
              : "YouTube Unlisted videos provide strong deterrence with our dynamic watermarking and hidden token Edge Functions. However, for 100% DRM protection against advanced screen capture, our VideoPlayer abstraction is architected to seamlessly plug into Bunny Stream DRM or Vimeo OTT without touching the rest of the application."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Settings */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-blue" />
            <span>الهوية والمسميات</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                اسم المنصة (Brand Name)
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                الشعار الفرعي (Tagline)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
            </div>
          </div>
        </div>

        {/* Security & Concurrent Devices */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>سياسات الأمان ومنع مشاركة الحسابات</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1 max-w-sm">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-cyan" />
                <span>الحد الأقصى للأجهزة المتزامنة لكل حساب</span>
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono font-bold"
              />
              <span className="text-[11px] text-muted-foreground block">
                القيمة الموصى بها: جهازان كحد أقصى (حاسوب + هاتف)
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pauseTab"
                checked={pauseOnTabHidden}
                onChange={(e) => setPauseOnTabHidden(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="pauseTab" className="text-xs font-semibold text-foreground cursor-pointer">
                إيقاف تشغيل الفيديو تلقائياً عند إخفاء أو مغادرة تبويب المتصفح
              </label>
            </div>
          </div>
        </div>

        {/* Admin Account */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-cyan" />
            <span>مدير النظام المعتمد (Primary Admin)</span>
          </h2>

          <div className="space-y-1 max-w-md">
            <label className="text-xs font-semibold text-foreground">
              البريد الإلكتروني للمدير (م. أحمد فتحي)
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono"
            />
            <span className="text-[11px] text-muted-foreground block">
              هذا الحساب يمتلك تلقائياً صلاحية role = 'admin' وكافة صلاحيات لوحة التحكم
            </span>
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
