"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { PlayCircle, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";

interface TopLesson {
  id: string;
  title_ar: string;
  title_en: string;
  course_title_ar: string;
  course_title_en: string;
  views: number;
  completionRate: string;
}

interface SecurityLog {
  id: string;
  user: string;
  lessonTitle: string;
  ip: string;
  accessedAt: string;
  status: string;
}

export default function AdminAnalyticsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [topLessons, setTopLessons] = useState<TopLesson[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const res = await fetch("/api/admin/analytics", { cache: "no-store", headers });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setTopLessons(data.topLessons || []);
      setSecurityLogs(data.securityLogs || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const fmtNum = (n: number) => new Intl.NumberFormat(numLocale).format(n);
  const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("analytics")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "تحليلات المشاهدات الحية لكل درس وسجلات أمان الوصول للفيديوهات"
              : "Live lesson view metrics and video access security logs"}
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{isRtl ? "تحديث" : "Refresh"}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Watched Lessons */}
      <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <PlayCircle className="w-4 h-4 text-brand-cyan" />
          <span>{isRtl ? "الدروس الأكثر مشاهدة وإتماماً" : "Most-Watched Lessons"}</span>
        </h2>

        {loading ? (
          <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
        ) : topLessons.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
            {isRtl ? "لا توجد مشاهدات مسجلة للدروس حتى الآن." : "No lesson views recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{isRtl ? "عنوان الدرس" : "Lesson"}</th>
                  <th className="p-3 text-start">{isRtl ? "الدورة" : "Course"}</th>
                  <th className="p-3 text-start">{isRtl ? "المشاهدات" : "Views"}</th>
                  <th className="p-3 text-start">{isRtl ? "معدل الإتمام" : "Completion Rate"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {topLessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">
                      {isRtl ? lesson.title_ar || lesson.title_en : lesson.title_en || lesson.title_ar}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {isRtl
                        ? lesson.course_title_ar || lesson.course_title_en
                        : lesson.course_title_en || lesson.course_title_ar}
                    </td>
                    <td className="p-3 font-mono font-bold text-brand-cyan">
                      {fmtNum(lesson.views)}
                    </td>
                    <td className="p-3 font-bold text-emerald-500">{lesson.completionRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security Access Logs */}
      <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>{isRtl ? "سجلات الوصول الآمن للفيديو" : "Video Security Access Logs"}</span>
        </h2>

        {loading ? (
          <div className="h-32 rounded-xl bg-muted/60 animate-pulse" />
        ) : securityLogs.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
            {isRtl ? "لا توجد سجلات تشغيل مسجلة بعد." : "No video access logs recorded yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{isRtl ? "المستخدم" : "User"}</th>
                  <th className="p-3 text-start">{isRtl ? "الدرس" : "Lesson"}</th>
                  <th className="p-3 text-start">IP</th>
                  <th className="p-3 text-start">{isRtl ? "الوقت" : "Time"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {securityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{log.user}</td>
                    <td className="p-3 text-foreground">{log.lessonTitle}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{log.ip}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {fmtDateTime(log.accessedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
