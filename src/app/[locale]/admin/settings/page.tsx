"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import ImageUpload from "@/components/image-upload";
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

  // Stats override
  const [statsStudents, setStatsStudents] = useState("1500");
  const [statsCourses, setStatsCourses] = useState("14");
  const [statsHours, setStatsHours] = useState("160");
  const [statsProjects, setStatsProjects] = useState("45");
  const [statsSatisfaction, setStatsSatisfaction] = useState("99");

  // YouTube Featured Videos on Home
  const [youtubeVideos, setYoutubeVideos] = useState<
    {
      id: string;
      title_ar: string;
      title_en: string;
      duration: string;
      views: string;
      tag: string;
      video_url: string;
    }[]
  >([
    {
      id: "y1",
      title_ar: "أسرار التعامل مع صور الأقمار الصناعية وحساب مؤشر NDVI",
      title_en: "Satellite Imagery Analysis & NDVI Spectral Index in ArcGIS Pro",
      duration: "24:15",
      views: "3.4K",
      tag: "Remote Sensing",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: "y2",
      title_ar: "بناء نموذج ملاءمة مكانية باستخدام ModelBuilder خطوة بخطوة",
      title_en: "Building a Multi-Criteria Spatial Suitability Model with ModelBuilder",
      duration: "32:40",
      views: "5.1K",
      tag: "GIS Analysis",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
    {
      id: "y3",
      title_ar: "مقدمة سريعة للمبتدئين في Google Earth Engine عبر الجافاسكريبت",
      title_en: "Fast-Track Introduction to Google Earth Engine Scripting",
      duration: "19:50",
      views: "2.8K",
      tag: "GEE & Code",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    },
  ]);

  // Load existing settings
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from("site_settings").select("*");
        if (data) {
          data.forEach((row) => {
            if (row.key === "platform_stats" && row.value) {
              setStatsStudents(row.value.students?.toString() || "1500");
              setStatsCourses(row.value.courses?.toString() || "14");
              setStatsHours(row.value.hours?.toString() || "160");
              setStatsProjects(row.value.projects?.toString() || "45");
              setStatsSatisfaction(row.value.satisfaction?.toString() || "99");
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
            if (row.key === "youtube_featured_videos" && Array.isArray(row.value) && row.value.length > 0) {
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
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        platform_stats: {
          students: parseInt(statsStudents) || 1500,
          courses: parseInt(statsCourses) || 14,
          hours: parseInt(statsHours) || 160,
          projects: parseInt(statsProjects) || 45,
          satisfaction: parseInt(statsSatisfaction) || 99,
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
              maxSizeMB={2}
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

        {/* Public Stats Strip Override */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-4">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <BarChart className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? "إحصائيات شريط الرئيسية (تخصيص اختياري)" : "Home Stats Strip Override"}</span>
          </h2>
          <p className="text-[11px] text-muted-foreground">
            {isRtl
              ? "إذا تركت هذه الحقول، ستحسب المنصة الإحصائيات آلياً من قاعدة البيانات الحية. يمكنك هنا تحديد أرقام مخصصة تظهر للزوار."
              : "Optional override numbers for public hero stats strip."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">الطلاب</label>
              <input
                type="number"
                value={statsStudents}
                onChange={(e) => setStatsStudents(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">الدورات</label>
              <input
                type="number"
                value={statsCourses}
                onChange={(e) => setStatsCourses(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">الساعات</label>
              <input
                type="number"
                value={statsHours}
                onChange={(e) => setStatsHours(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">المشاريع</label>
              <input
                type="number"
                value={statsProjects}
                onChange={(e) => setStatsProjects(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground">الرضا %</label>
              <input
                type="number"
                value={statsSatisfaction}
                onChange={(e) => setStatsSatisfaction(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
              />
            </div>
          </div>
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
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-red-500/20 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>{isRtl ? "شروحات وفيديوهات عملية على يوتيوب (الصفحة الرئيسية)" : "Homepage YouTube Videos"}</span>
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isRtl
                  ? "تحكم في الفيديوهات المعروضة في قسم المجتمع وقناة اليوتيوب على الصفحة الرئيسية. يمكنك تعديل العناوين، الروابط، المدة، والتصنيف."
                  : "Manage the featured YouTube tutorial cards displayed in the homepage community section."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setYoutubeVideos([
                  ...youtubeVideos,
                  {
                    id: `y_${Date.now()}`,
                    title_ar: "عنوان الفيديو الجديد بالعربية",
                    title_en: "New Video Title in English",
                    duration: "15:00",
                    views: "1.2K",
                    tag: "GIS & Python",
                    video_url: "https://www.youtube.com/watch?v=",
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
            {youtubeVideos.map((video, idx) => (
              <div
                key={video.id || idx}
                className="p-4 rounded-2xl border border-border/80 bg-background/60 space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                    <Youtube className="w-3.5 h-3.5" />
                    <span>فيديو #{idx + 1}</span>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      {isRtl ? "عنوان الفيديو (بالعربية)" : "Video Title (Arabic)"}
                    </label>
                    <input
                      type="text"
                      value={video.title_ar}
                      onChange={(e) => {
                        const updated = [...youtubeVideos];
                        updated[idx].title_ar = e.target.value;
                        setYoutubeVideos(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                      placeholder="أسرار التعامل مع صور الأقمار الصناعية..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      {isRtl ? "عنوان الفيديو (بالإنجليزية)" : "Video Title (English)"}
                    </label>
                    <input
                      type="text"
                      value={video.title_en}
                      onChange={(e) => {
                        const updated = [...youtubeVideos];
                        updated[idx].title_en = e.target.value;
                        setYoutubeVideos(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-semibold"
                      placeholder="Satellite Imagery Analysis & NDVI..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      {isRtl ? "رابط فيديو اليوتيوب (URL)" : "YouTube Video URL"}
                    </label>
                    <input
                      type="url"
                      value={video.video_url}
                      onChange={(e) => {
                        const updated = [...youtubeVideos];
                        updated[idx].video_url = e.target.value;
                        setYoutubeVideos(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono text-brand-cyan"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">
                      {isRtl ? "التصنيف / التاج" : "Tag"}
                    </label>
                    <input
                      type="text"
                      value={video.tag}
                      onChange={(e) => {
                        const updated = [...youtubeVideos];
                        updated[idx].tag = e.target.value;
                        setYoutubeVideos(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                      placeholder="Remote Sensing"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">
                        {isRtl ? "المدة" : "Duration"}
                      </label>
                      <input
                        type="text"
                        value={video.duration}
                        onChange={(e) => {
                          const updated = [...youtubeVideos];
                          updated[idx].duration = e.target.value;
                          setYoutubeVideos(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                        placeholder="24:15"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-muted-foreground">
                        {isRtl ? "المشاهدات" : "Views"}
                      </label>
                      <input
                        type="text"
                        value={video.views}
                        onChange={(e) => {
                          const updated = [...youtubeVideos];
                          updated[idx].views = e.target.value;
                          setYoutubeVideos(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-mono"
                        placeholder="3.4K"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
