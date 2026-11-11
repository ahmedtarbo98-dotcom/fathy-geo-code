"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  BookOpen,
  Award,
  UserCheck,
  Clock,
  ArrowUpRight,
  Plus,
  ShieldCheck,
  MessageSquare,
  Activity,
  BarChart3,
  AlertCircle,
  RefreshCw,
  PlayCircle,
  TrendingUp,
  Briefcase,
} from "lucide-react";

interface DailySignupPoint {
  date: string;
  count: number;
}

interface WatchedCourseItem {
  id: string;
  title_ar: string;
  title_en: string;
  slug: string;
  total_views: number;
  unique_learners: number;
  completed_records: number;
}

interface WatchedLessonItem {
  id: string;
  title_ar: string;
  title_en: string;
  course_title_ar: string;
  course_title_en: string;
  total_views: number;
  completions: number;
  unique_learners: number;
}

interface ActivityItem {
  id: string;
  type: "signup" | "request" | "message" | "video_access";
  actor: string;
  detail_ar: string;
  detail_en: string;
  timestamp: string;
}

interface OverviewData {
  totalStudents: number;
  blockedStudents: number;
  newSignups7d: number;
  newSignups30d: number;
  dailySignups30d: DailySignupPoint[];
  activeEnrollments: number;
  totalEnrollments: number;
  completedEnrollments: number;
  completionRate: number;
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
  totalProjects: number;
  publishedProjects: number;
  recentSignups: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
    is_blocked: boolean;
  }>;
  recentRequests: Array<{
    id: string;
    status: string;
    created_at: string;
    profiles?: { full_name?: string | null; email?: string | null } | null;
    courses?: { title_ar?: string | null; title_en?: string | null } | null;
  }>;
  mostWatchedCourses: WatchedCourseItem[];
  mostWatchedLessons: WatchedLessonItem[];
  recentActivity: ActivityItem[];
  computedAtUtc: string;
}

export default function AdminOverviewPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fmtNum = (n: number | undefined | null) =>
    new Intl.NumberFormat(numLocale, { maximumFractionDigits: 1 }).format(Number.isFinite(n) ? Number(n) : 0);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

  const fmtDateTime = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  const loadDashboardMetrics = useCallback(async () => {
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

      const res = await fetch("/api/admin/overview", {
        cache: "no-store",
        headers,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setData(json);
    } catch (err: any) {
      setError(err?.message || (isRtl ? "تعذر تحميل إحصائيات المنصة" : "Failed to load dashboard metrics"));
    } finally {
      setLoading(false);
    }
  }, [supabase, isRtl]);

  useEffect(() => {
    loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  if (loading && !data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded-xl bg-muted" />
            <div className="h-4 w-80 rounded-lg bg-muted/70" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-muted" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/60 border border-border/40" />
          ))}
        </div>

        <div className="h-64 rounded-2xl bg-muted/60 border border-border/40" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-muted/60 border border-border/40" />
          <div className="h-64 rounded-2xl bg-muted/60 border border-border/40" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl glass-panel p-8 border border-red-500/30 bg-red-500/5 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            {isRtl ? "حدث خطأ أثناء جلب البيانات الحية" : "Error loading live dashboard metrics"}
          </h2>
          <p className="text-xs text-muted-foreground font-mono">{error}</p>
        </div>
        <button
          onClick={loadDashboardMetrics}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
        </button>
      </div>
    );
  }

  const metrics = data!;
  const maxDailyCount = Math.max(1, ...metrics.dailySignups30d.map((d) => d.count));

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {isRtl ? "لوحة التحكم والإحصائيات الحية" : "Live Admin Overview"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRtl
              ? "كافة الأرقام محسوبة مباشرة من قاعدة بيانات المنصة بدون أي بيانات افتراضية"
              : "All metrics are computed live from Supabase PostgreSQL without static placeholders"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={loadDashboardMetrics}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </button>

          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-cyan/20 hover:opacity-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? "إنشاء دورة جديدة" : "Create New Course"}</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Students */}
        <div className="rounded-2xl glass-panel p-5 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground">
              {isRtl ? "الطلاب المسجلون" : "Registered Students"}
            </span>
            <div className="p-2 rounded-xl bg-brand-cyan/10 text-brand-cyan">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {fmtNum(metrics.totalStudents)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              +{fmtNum(metrics.newSignups7d)} {isRtl ? "آخر 7 أيام" : "7d"}
            </span>
            <span className="text-muted-foreground">
              +{fmtNum(metrics.newSignups30d)} {isRtl ? "آخر 30 يوم" : "30d"}
            </span>
          </div>
        </div>

        {/* 2. Active Enrollments */}
        <div className="rounded-2xl glass-panel p-5 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground">
              {isRtl ? "الاشتراكات النشطة" : "Active Enrollments"}
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {fmtNum(metrics.activeEnrollments)}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>
              {isRtl ? "إجمالي الاشتراكات:" : "Total enrollments:"} {fmtNum(metrics.totalEnrollments)}
            </span>
            <span>
              {isRtl ? "محظورين:" : "Blocked:"} {fmtNum(metrics.blockedStudents)}
            </span>
          </div>
        </div>

        {/* 3. Courses & Lessons */}
        <div className="rounded-2xl glass-panel p-5 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground">
              {isRtl ? "الدورات والدروس" : "Courses & Lessons"}
            </span>
            <div className="p-2 rounded-xl bg-brand-blue/10 text-brand-blue">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {fmtNum(metrics.publishedCourses)}{" "}
            <span className="text-sm font-semibold text-muted-foreground">
              / {fmtNum(metrics.totalCourses)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>
              {isRtl ? "دورات منشورة" : "Published courses"}
            </span>
            <span className="font-bold text-foreground">
              {fmtNum(metrics.totalLessons)} {isRtl ? "درس" : "lessons"}
            </span>
          </div>
        </div>

        {/* 4. Completion Rate */}
        <div className="rounded-2xl glass-panel p-5 border border-border/70 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-muted-foreground">
              {isRtl ? "معدل إتمام الدورات" : "Course Completion Rate"}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {fmtNum(metrics.completionRate)}%
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
            <span>
              {fmtNum(metrics.completedEnrollments)} {isRtl ? "إتمام كامل 100%" : "100% completed"}
            </span>
            <span>
              / {fmtNum(metrics.totalEnrollments)} {isRtl ? "اشتراك" : "total"}
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Counters Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/requests"
          className="rounded-2xl glass-panel p-4 border border-border/70 hover:border-amber-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {isRtl ? "طلبات الاشتراك المعلقة" : "Pending Enrollment Requests"}
              </p>
              <p className="text-xl font-extrabold text-foreground">
                {fmtNum(metrics.pendingRequestsCount)}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/messages"
          className="rounded-2xl glass-panel p-4 border border-border/70 hover:border-brand-cyan/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {isRtl ? "رسائل التواصل غير المقروءة" : "Unread Contact Messages"}
              </p>
              <p className="text-xl font-extrabold text-foreground">
                {fmtNum(metrics.unreadMessagesCount)}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/projects"
          className="rounded-2xl glass-panel p-4 border border-border/70 hover:border-emerald-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {isRtl ? "المشاريع (منشور / الإجمالي)" : "Projects (Published / Total)"}
              </p>
              <p className="text-xl font-extrabold text-foreground">
                {fmtNum(metrics.publishedProjects)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">
                  / {fmtNum(metrics.totalProjects)}
                </span>
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      {/* 30-Day UTC Daily Signups Chart */}
      <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-cyan" />
              <span>
                {isRtl
                  ? "تسجيلات الطلاب اليومية — آخر 30 يوماً (UTC)"
                  : "Daily Student Signups — Last 30 Days (UTC)"}
              </span>
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isRtl
                ? `إجمالي آخر 7 أيام: ${fmtNum(metrics.newSignups7d)} | آخر 30 يوماً: ${fmtNum(metrics.newSignups30d)}`
                : `Last 7d: ${fmtNum(metrics.newSignups7d)} | Last 30d: ${fmtNum(metrics.newSignups30d)}`}
            </p>
          </div>
        </div>

        <div className="h-44 flex items-end gap-1 sm:gap-1.5 pt-4 border-b border-border/50 pb-2">
          {metrics.dailySignups30d.map((point) => {
            const heightPct =
              point.count === 0 ? 4 : Math.max(10, Math.round((point.count / maxDailyCount) * 100));
            return (
              <div
                key={point.date}
                title={`${fmtDate(`${point.date}T00:00:00Z`)}: ${fmtNum(point.count)}`}
                className="flex-1 h-full flex flex-col justify-end items-center group relative"
              >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-foreground mb-1 pointer-events-none">
                  {fmtNum(point.count)}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-all ${
                    point.count > 0
                      ? "bg-gradient-to-t from-brand-blue to-brand-cyan group-hover:brightness-110"
                      : "bg-muted/60"
                  }`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
          <span>{fmtDate(`${metrics.dailySignups30d[0]?.date}T00:00:00Z`)}</span>
          <span>
            {fmtDate(
              `${metrics.dailySignups30d[metrics.dailySignups30d.length - 1]?.date}T00:00:00Z`
            )}
          </span>
        </div>
      </div>

      {/* Most-Watched Courses & Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-cyan" />
            <span>{isRtl ? "أكثر الدورات مشاهدة وتفاعلاً" : "Most-Watched Courses"}</span>
          </h2>

          {metrics.mostWatchedCourses.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              {isRtl
                ? "لا توجد مشاهدات مسجلة للدورات حتى الآن."
                : "No course watch activity recorded yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.mostWatchedCourses.map((course) => (
                <div
                  key={course.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {isRtl
                        ? course.title_ar || course.title_en
                        : course.title_en || course.title_ar}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {fmtNum(course.unique_learners)} {isRtl ? "متدرب" : "learners"} •{" "}
                      {fmtNum(course.completed_records)} {isRtl ? "إتمام درس" : "lesson completions"}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-brand-cyan/10 text-brand-cyan text-xs font-bold">
                    {fmtNum(course.total_views)} {isRtl ? "مشاهدة" : "views"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? "أكثر الدروس مشاهدة" : "Most-Watched Lessons"}</span>
          </h2>

          {metrics.mostWatchedLessons.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              {isRtl
                ? "لا توجد مشاهدات مسجلة للدروس حتى الآن."
                : "No lesson watch activity recorded yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.mostWatchedLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {isRtl
                        ? lesson.title_ar || lesson.title_en
                        : lesson.title_en || lesson.title_ar}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {isRtl
                        ? lesson.course_title_ar || lesson.course_title_en
                        : lesson.course_title_en || lesson.course_title_ar}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    {fmtNum(lesson.total_views)} {isRtl ? "مشاهدة" : "views"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Signups + Pending Requests + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Signups */}
        <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-cyan" />
              <span>{isRtl ? "أحدث المسجلين" : "Recent Signups"}</span>
            </h2>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>{isRtl ? "عرض الكل" : "View All"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {metrics.recentSignups.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              {isRtl ? "لا يوجد طلاب مسجلون بعد." : "No students yet."}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentSignups.map((student) => (
                <div
                  key={student.id}
                  className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {student.full_name || (isRtl ? "طالب بدون اسم" : "Unnamed Student")}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {student.email || ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    {fmtDate(student.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Requests */}
        <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{isRtl ? "طلبات معلقة" : "Pending Requests"}</span>
            </h2>
            <Link
              href="/admin/requests"
              className="text-xs font-bold text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>{isRtl ? "إدارة" : "Manage"}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {metrics.recentRequests.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              {isRtl ? "لا توجد طلبات اشتراك معلقة." : "No pending requests."}
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {req.profiles?.full_name || req.profiles?.email || "Student"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {isRtl
                        ? req.courses?.title_ar || req.courses?.title_en
                        : req.courses?.title_en || req.courses?.title_ar}
                    </p>
                  </div>
                  <Link
                    href="/admin/requests"
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold hover:bg-amber-500/25"
                  >
                    {isRtl ? "مراجعة" : "Review"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span>{isRtl ? "أحدث الأنشطة الحية" : "Recent Activity"}</span>
          </h2>

          {metrics.recentActivity.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-xl">
              {isRtl ? "لا يوجد نشاط مسجل بعد." : "No recent activity yet."}
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground truncate">
                      {item.actor}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {fmtDateTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isRtl ? item.detail_ar : item.detail_en}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Security Footer Strip */}
      <div className="rounded-2xl p-5 bg-gradient-to-br from-brand-navy to-slate-900 border border-brand-cyan/20 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">
              {isRtl ? "حماية البيانات وحسابات الطلاب مفعلة" : "Student Data Privacy & RLS Active"}
            </h3>
            <p className="text-xs text-slate-300">
              {isRtl
                ? "إيميلات الطلاب وبياناتهم متاحة للمشرفين فقط عبر خادم محمي بصلاحية الإدارة."
                : "Emails and user records are restricted to administrators via server-side verification."}
            </p>
          </div>
        </div>
        <Link
          href="/admin/settings"
          className="text-xs font-bold text-brand-cyan hover:underline shrink-0"
        >
          {isRtl ? "إعدادات المنصة ←" : "Platform Settings →"}
        </Link>
      </div>
    </div>
  );
}
