"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/image-upload";
import { getYouTubeThumbnails } from "@/lib/youtube";
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
  ImageIcon,
  BarChart,
  RefreshCw,
  User,
  Youtube,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function AdminSettingsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [siteName, setSiteName] = useState("FATHY GEO CODE");
  const [tagline, setTagline] = useState("GIS & Remote Sensing Educational Hub");
  const [logoUrl, setLogoUrl] = useState("/logo.jpg");
  const [instructorAvatar, setInstructorAvatar] = useState("/logo.jpg");
  const [instructorBioAr, setInstructorBioAr] = useState("");
  const [maxDevices, setMaxDevices] = useState("2");
  const [pauseOnTabHidden, setPauseOnTabHidden] = useState(true);
  const [adminEmail, setAdminEmail] = useState("ahmedtarbo98@gmail.com");

  // Stats visibility & optional manual overrides (default OFF -> real live DB values)
  const [showStatsStrip, setShowStatsStrip] = useState(true);
  const [useManualOverrides, setUseManualOverrides] = useState(false);
  const [statsStudents, setStatsStudents] = useState("");
  const [statsCourses, setStatsCourses] = useState("");
  const [statsLessons, setStatsLessons] = useState("");
  const [statsHours, setStatsHours] = useState("");

  // YouTube Featured Videos on Home (default empty, loaded from site_settings)
  const [fetchingMetaIdx, setFetchingMetaIdx] = useState<number | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<
    {
      id: string;
      title_ar: string;
      title_en: string;
      duration: string;
      views?: string;
      tag: string;
      video_url: string;
      thumbnail_url?: string;
    }[]
  >([]);

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data } = await supabase.from("site_settings").select("*");
        if (data) {
          data.forEach((row) => {
            if (row.key === "platform_stats" && row.value) {
              setShowStatsStrip(row.value.show_stats_strip !== false);
              const overridesEnabled = row.value.use_manual_overrides === true;
              setUseManualOverrides(overridesEnabled);
              setStatsStudents(
                overridesEnabled && row.value.students != null
                  ? String(row.value.students)
                  : ""
              );
              setStatsCourses(
                overridesEnabled && row.value.courses != null
                  ? String(row.value.courses)
                  : ""
              );
              setStatsLessons(
                overridesEnabled && row.value.lessons != null
                  ? String(row.value.lessons)
                  : ""
              );
              setStatsHours(
                overridesEnabled && row.value.hours != null
                  ? String(row.value.hours)
                  : ""
              );
            }
            if (row.key === "instructor_profile" && row.value) {
              if (row.value.avatar_url) setInstructorAvatar(row.value.avatar_url);
              if (row.value.bio_ar) setInstructorBioAr(row.value.bio_ar);
            }
            if (row.key === "site_identity" && row.value) {
              if (row.value.logo_url) setLogoUrl(row.value.logo_url);
              if (row.value.site_name) setSiteName(row.value.site_name);
              if (row.value.tagline) setTagline(row.value.tagline);
            }
            if (row.key === "youtube_featured_videos" && Array.isArray(row.value)) {
              setYoutubeVideos(row.value);
            }
          });
        }
      } catch (err) {
        console.error("Load settings error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();

    if (typeof window !== "undefined" && window.location.hash === "#youtube-videos") {
      setTimeout(() => {
        document.getElementById("youtube-videos")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const fetchYouTubeMeta = async (
    idx: number,
    url: string,
    forceTitleOverwrite = false
  ) => {
    const thumbs = getYouTubeThumbnails(url);
    if (!thumbs.videoId) return;

    try {
      setFetchingMetaIdx(idx);
      const res = await fetch(`/api/youtube-meta?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const meta = await res.json();

      setYoutubeVideos((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          const isPlaceholderTitle =
            !item.title_ar?.trim() ||
            item.title_ar.trim() === "عنوان الفيديو الجديد بالعربية";
          const nextTitleAr =
            forceTitleOverwrite || isPlaceholderTitle
              ? meta.title || item.title_ar
              : item.title_ar;
          const isPlaceholderEn =
            !item.title_en?.trim() ||
            item.title_en.trim() === "New Video Title in English";
          const nextTitleEn =
            forceTitleOverwrite || isPlaceholderEn
              ? meta.title || item.title_en
              : item.title_en;

          return {
            ...item,
            thumbnail_url: meta.thumbnailUrl || thumbs.hq || item.thumbnail_url,
            title_ar: nextTitleAr,
            title_en: nextTitleEn,
          };
        })
      );
    } catch (err) {
      console.warn("YouTube meta fetch error:", err);
    } finally {
      setFetchingMetaIdx(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const toNumOrNull = (val: string) => {
        if (!val.trim()) return null;
        const n = Number(val);
        return Number.isFinite(n) && n >= 0 ? n : null;
      };

      const payload = {
        platform_stats: {
          show_stats_strip: showStatsStrip,
          use_manual_overrides: useManualOverrides,
          students: useManualOverrides ? toNumOrNull(statsStudents) : null,
          courses: useManualOverrides ? toNumOrNull(statsCourses) : null,
          lessons: useManualOverrides ? toNumOrNull(statsLessons) : null,
          hours: useManualOverrides ? toNumOrNull(statsHours) : null,
        },
        instructor_profile: {
          name_ar: "م. أحمد فتحي",
          name_en: "Eng. Ahmed Fathy",
          title_ar: "محلل بيانات مكانية وأخصائي استشعار عن بعد",
          title_en: "Spatial Data Analyst & GIS Specialist",
          bio_ar: instructorBioAr || "محلل بيانات مكانية متخصص في تحليلات نظم المعلومات الجغرافية المتقدمة.",
          whatsapp_phone: "201060683463",
          avatar_url: instructorAvatar,
        },
        site_identity: {
          site_name: siteName,
          tagline: tagline,
          logo_url: logoUrl,
        },
        youtube_featured_videos: youtubeVideos,
      };

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let result: any = {};
      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(`خطأ في معالجة استجابة الخادم (${res.status})`);
      }

      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to save settings");
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("site-branding-updated", {
            detail: {
              logoUrl,
              siteName,
              tagline,
              instructorAvatarUrl: instructorAvatar,
            },
          })
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(isRtl ? `خطأ أثناء الحفظ: ${err.message}` : `Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{t("settings")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "إعدادات الهوية، رفع الشعار والصور من جهازك، وسياسات أمان المشغل"
              : "Platform identity, device image uploads, and player security controls"}
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{isRtl ? "تم حفظ كافة إعدادات المنصة في قاعدة البيانات بنجاح!" : "Platform settings saved successfully!"}</span>
        </div>
      )}

      {/* Honest Protection Note */}
      <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {isRtl ? "ملاحظة أمان وتشفير الفيديوهات (DRM Architecture)" : "Security & Video DRM Advisory"}
          </h4>
          <p className="text-xs text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
            {isRtl
              ? "فيديوهات يوتيوب غير المدرجة (Unlisted) توفر حماية ممتازة مع العلامة المائية المتنقلة ودرع النقرات، ولكن لا يمكن حمايتها بنسبة 100% ضد أدوات التسجيل المتقدمة؛ لأعلى مستويات الحماية المشفرة مستقبلاً، تم تجهيز نظام المشغل (VideoPlayer Abstraction) ليدعم مزود مشفر مثل Bunny Stream DRM أو Vimeo OTT دون الحاجة لتعديل كود الموقع."
              : "YouTube Unlisted videos provide strong deterrence with our dynamic watermarking and click-shield. For enterprise-grade DRM in the future, the VideoPlayer is architected to plug seamlessly into Bunny Stream DRM."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity Settings with Image Upload */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
            <span>{isRtl ? "شعار وهوية المنصة (رفع من جهازك)" : "Platform Logo & Identity"}</span>
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {isRtl ? "لوجو الموقع الرسمي (رفع من الكمبيوتر)" : "Official Platform Logo (Upload)"}
            </label>
            <ImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              bucket="platform-assets"
              folder="branding"
              locale={locale}
              maxSizeMB={5}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                {isRtl ? "اسم المنصة" : "Brand Name"}
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
                {isRtl ? "الشعار الفرعي" : "Tagline"}
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

        {/* Instructor Profile & About Photo */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-5">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-brand-cyan" />
            <span>{isRtl ? "صورة وبيانات المحاضر (صفحة عن المهندس)" : "Instructor Photo & Profile"}</span>
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {isRtl ? "صورة م. أحمد فتحي الشخصية (رفع من الكمبيوتر)" : "Instructor Photo (Upload from computer)"}
            </label>
            <ImageUpload
              value={instructorAvatar}
              onChange={setInstructorAvatar}
              bucket="platform-assets"
              folder="instructor"
              locale={locale}
              maxSizeMB={2}
            />
          </div>

          <div className="space-y-1 pt-2">
            <label className="text-xs font-semibold text-foreground">
              {isRtl ? "نبذة عن المهندس (عربية)" : "Instructor Bio (Arabic)"}
            </label>
            <textarea
              rows={3}
              value={instructorBioAr}
              onChange={(e) => setInstructorBioAr(e.target.value)}
              placeholder="خريج ليسانس آداب برنامج الجيوماتكس ونظم المعلومات الجغرافية، محلل بيانات مكانية..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
            />
          </div>
        </div>

        {/* Public Stats Strip Controls & Optional Overrides */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "شريط الإحصائيات بالصفحة الرئيسية" : "Homepage Stats Strip"}</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isRtl
                  ? "تعرض المنصة الإحصائيات الحقيقية من قاعدة البيانات تلقائياً. التخصيص اليدوي معطل افتراضياً."
                  : "Displays live counts directly from PostgreSQL by default. Manual overrides are OFF unless enabled."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-1">
            <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showStatsStrip}
                onChange={(e) => setShowStatsStrip(e.target.checked)}
                className="rounded border-border w-4 h-4 accent-brand-cyan"
              />
              <span>
                {isRtl ? "إظهار شريط الإحصائيات في الرئيسية" : "Show stats strip on Home"}
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useManualOverrides}
                onChange={(e) => setUseManualOverrides(e.target.checked)}
                className="rounded border-border w-4 h-4 accent-amber-500"
              />
              <span>
                {isRtl
                  ? "تفعيل التعديل اليدوي للأرقام (بدلاً من الحسبة التلقائية)"
                  : "Use manual overrides (instead of live DB numbers)"}
              </span>
            </label>
          </div>

          {useManualOverrides && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  {isRtl ? "عدد الطلاب" : "Students"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={isRtl ? "تلقائي من DB" : "Auto from DB"}
                  value={statsStudents}
                  onChange={(e) => setStatsStudents(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  {isRtl ? "الدورات المنشورة" : "Published Courses"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={isRtl ? "تلقائي من DB" : "Auto from DB"}
                  value={statsCourses}
                  onChange={(e) => setStatsCourses(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  {isRtl ? "الدروس المنشورة" : "Published Lessons"}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder={isRtl ? "تلقائي من DB" : "Auto from DB"}
                  value={statsLessons}
                  onChange={(e) => setStatsLessons(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  {isRtl ? "ساعات التدريب" : "Training Hours"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={isRtl ? "تلقائي من DB" : "Auto from DB"}
                  value={statsHours}
                  onChange={(e) => setStatsHours(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Security & Concurrent Devices */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? "سياسات الأمان ومنع مشاركة الحسابات" : "Security & Concurrent Devices"}</span>
          </h2>

          <div className="space-y-3">
            <div className="space-y-1 max-w-sm">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-brand-cyan" />
                <span>{isRtl ? "الحد الأقصى للأجهزة المتزامنة لكل حساب" : "Max Concurrent Devices"}</span>
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={maxDevices}
                onChange={(e) => setMaxDevices(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm font-mono font-bold"
              />
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
                {isRtl
                  ? "إيقاف تشغيل الفيديو تلقائياً عند إخفاء أو مغادرة تبويب المتصفح"
                  : "Pause video automatically when browser tab is inactive"}
              </label>
            </div>
          </div>
        </div>

        {/* YouTube Featured Videos Management */}
        <div
          id="youtube-videos"
          className="rounded-3xl glass-panel p-6 sm:p-8 border border-red-500/20 shadow-lg space-y-6 scroll-mt-24"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>{isRtl ? "شروحات وفيديوهات عملية على يوتيوب (الصفحة الرئيسية)" : "Homepage YouTube Videos"}</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isRtl
                  ? "الصق رابط فيديو اليوتيوب فقط وسيتم جلب الصورة الرسمية وعنوان الفيديو تلقائياً، ويمكنك تعديل العنوان كما تريد."
                  : "Paste a YouTube video link to automatically fetch its official thumbnail and title, and edit the title anytime."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setYoutubeVideos([
                  ...youtubeVideos,
                  {
                    id: `y_${Date.now()}`,
                    title_ar: "",
                    title_en: "",
                    duration: "",
                    views: "",
                    tag: "",
                    video_url: "",
                    thumbnail_url: "",
                  },
                ]);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isRtl ? "إضافة فيديو يوتيوب جديد" : "Add YouTube Video"}</span>
            </button>
          </div>

          <div className="space-y-4">
            {youtubeVideos.map((video, idx) => {
              const thumbs = getYouTubeThumbnails(video.video_url);
              const previewThumb =
                thumbs.maxres || video.thumbnail_url || thumbs.hq;

              return (
                <div
                  key={video.id || idx}
                  className="p-4 rounded-2xl border border-border/80 bg-background/60 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5" />
                      <span>{isRtl ? `فيديو #${idx + 1}` : `Video #${idx + 1}`}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setYoutubeVideos(youtubeVideos.filter((_, i) => i !== idx));
                      }}
                      className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title={isRtl ? "حذف هذا الفيديو" : "Delete video"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Link + Live Official YouTube Thumbnail Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gradient-to-br from-neutral-900 via-brand-navy to-neutral-950 border border-border/60 flex items-center justify-center">
                        {previewThumb ? (
                          <img
                            src={previewThumb}
                            alt={video.title_ar || "YouTube Thumbnail"}
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (thumbs.hq && img.src !== thumbs.hq) {
                                img.src = thumbs.hq;
                              } else {
                                img.style.display = "none";
                              }
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center px-2 space-y-1">
                            <Youtube className="w-6 h-6 text-red-500 mx-auto opacity-80" />
                            <p className="text-[10px] text-muted-foreground">
                              {isRtl
                                ? "ستظهر صورة الفيديو الرسمية هنا"
                                : "Official thumbnail preview"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-foreground">
                          {isRtl
                            ? "رابط فيديو اليوتيوب (URL) — أضف اللينك هنا فقط"
                            : "YouTube Video URL"}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="url"
                            value={video.video_url}
                            onChange={(e) => {
                              const nextUrl = e.target.value;
                              const nextThumbs = getYouTubeThumbnails(nextUrl);
                              setYoutubeVideos((prev) =>
                                prev.map((item, i) =>
                                  i === idx
                                    ? {
                                        ...item,
                                        video_url: nextUrl,
                                        thumbnail_url:
                                          nextThumbs.hq || item.thumbnail_url,
                                      }
                                    : item
                                )
                              );
                              if (nextThumbs.videoId) {
                                fetchYouTubeMeta(idx, nextUrl, false);
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-brand-cyan"
                            placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
                          />
                          <button
                            type="button"
                            disabled={fetchingMetaIdx === idx || !thumbs.videoId}
                            onClick={() => fetchYouTubeMeta(idx, video.video_url, true)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-muted/60 hover:bg-muted text-[11px] font-bold text-foreground disabled:opacity-40 shrink-0"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${
                                fetchingMetaIdx === idx ? "animate-spin" : ""
                              }`}
                            />
                            <span>
                              {isRtl ? "جلب العنوان والصورة" : "Fetch Info"}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">
                            {isRtl ? "عنوان الفيديو (بالعربية)" : "Video Title (Arabic)"}
                          </label>
                          <input
                            type="text"
                            value={video.title_ar}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYoutubeVideos((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, title_ar: val } : item
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                            placeholder={
                              isRtl
                                ? "يُجلب تلقائياً أو اكتب العنوان..."
                                : "Arabic title..."
                            }
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-muted-foreground">
                            {isRtl ? "عنوان الفيديو (بالإنجليزية - اختياري)" : "Video Title (English - Optional)"}
                          </label>
                          <input
                            type="text"
                            value={video.title_en}
                            onChange={(e) => {
                              const val = e.target.value;
                              setYoutubeVideos((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, title_en: val } : item
                                )
                              );
                            }}
                            className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                            placeholder="Optional English title..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Tag / Duration / Views */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">
                        {isRtl ? "التصنيف (اختياري)" : "Tag (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={video.tag || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setYoutubeVideos((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, tag: val } : item
                            )
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                        placeholder="GIS / Remote Sensing"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">
                        {isRtl ? "المدة (اختياري)" : "Duration (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={video.duration || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setYoutubeVideos((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, duration: val } : item
                            )
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                        placeholder="24:15"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">
                        {isRtl ? "المشاهدات (اختياري)" : "Views (Optional)"}
                      </label>
                      <input
                        type="text"
                        value={video.views || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setYoutubeVideos((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, views: val } : item
                            )
                          );
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                        placeholder={isRtl ? "اختياري" : "Optional"}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all disabled:opacity-50"
        >
          <Save className={`w-4 h-4 ${saving ? "animate-spin" : ""}`} />
          <span>{saving ? (isRtl ? "جارٍ الحفظ..." : "Saving...") : t("saveChanges")}</span>
        </button>
      </form>
    </div>
  );
}
