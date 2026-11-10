"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
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
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface OverviewStats {
  totalStudents: number;
  activeEnrollments: number;
  publishedCourses: number;
  totalLessons: number;
  completionRate: number;
  newSignups7Days: number;
  newSignups30Days: number;
}

interface PendingRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  course_id: string;
  course_title?: string;
  created_at: string;
}

interface RecentStudent {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface CourseStat {
  id: string;
  title_ar: string;
  title_en: string;
  enrollment_count: number;
  status: string;
  is_free: boolean;
}

export default function AdminOverviewPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats>({
    totalStudents: 0,
    activeEnrollments: 0,
    publishedCourses: 0,
    totalLessons: 0,
    completionRate: 0,
    newSignups7Days: 0,
    newSignups30Days: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
  const [popularCourses, setPopularCourses] = useState<CourseStat[]>([]);

  const loadRealData = async () => {
    try {
      setLoading(true);

      // 1. Total Students
      const { count: studentsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // 2. Active Enrollments
      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // 3. Courses (Published and Total)
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title_ar, title_en, status, is_free");

      const publishedCount = (coursesData || []).filter((c) => c.status === "published").length;

      // 4. Lessons Count
      const { count: lessonsCount } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true });

      // 5. Completion Rate calculation
      const { count: completedLessonsCount } = await supabase
        .from("lesson_progress")
        .select("*", { count: "exact", head: true })
        .eq("completed", true);

      const totalExpectedProgress = (enrollmentsCount || 0) * (lessonsCount || 1);
      const calculatedRate =
        totalExpectedProgress > 0 && completedLessonsCount
          ? Math.min(100, Math.round((completedLessonsCount / totalExpectedProgress) * 100))
          : 0;

      // 6. Signups in last 7 and 30 days
      const now = new Date();
      const date7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const date30DaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { count: count7 } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date7DaysAgo);

      const { count: count30 } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", date30DaysAgo);

      setStats({
        totalStudents: studentsCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        publishedCourses: publishedCount,
        totalLessons: lessonsCount || 0,
        completionRate: calculatedRate,
        newSignups7Days: count7 || 0,
        newSignups30Days: count30 || 0,
      });

      // 7. Recent 5 Students
      const { data: recentUsers } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentStudents((recentUsers as RecentStudent[]) || []);

      // 8. Pending Requests via API
      let loadedViaApi = false;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
        const reqRes = await fetch("/api/admin/requests", { headers });
        if (reqRes.ok) {
          const reqJson = await reqRes.json();
          if (reqJson?.requests) {
            const pending = reqJson.requests
              .filter((r: any) => r.status === "pending")
              .slice(0, 5)
              .map((r: any) => ({
                id: r.id,
                full_name: r.full_name,
                email: r.email,
                phone: r.phone,
                course_id: r.course_id,
                course_title: isRtl ? r.course_title : (r.course_title_en || r.course_title),
                created_at: r.created_at,
              }));
            setPendingRequests(pending);
            loadedViaApi = true;
          }
        }
      } catch (err) {
        console.warn("Failed to load requests via API:", err);
      }

      if (!loadedViaApi) {
        const { data: reqData } = await supabase
          .from("enrollment_requests")
          .select("id, full_name, email, phone, course_id, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5);

        if (reqData && reqData.length > 0) {
          // Map course title
          const mapped = reqData.map((r) => {
            const matchedCourse = (coursesData || []).find((c) => c.id === r.course_id);
            return {
              ...r,
              course_title: matchedCourse
                ? isRtl ? matchedCourse.title_ar : matchedCourse.title_en
                : "GIS Course",
            };
          });
          setPendingRequests(mapped);
        } else {
          setPendingRequests([]);
        }
      }

      // 9. Popular Courses (Enrollments per course)
      const { data: allEnrollments } = await supabase
        .from("enrollments")
        .select("course_id");

      const countMap: Record<string, number> = {};
      (allEnrollments || []).forEach((e) => {
        countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
      });

      const coursesWithCounts: CourseStat[] = (coursesData || []).map((c) => ({
        id: c.id,
        title_ar: c.title_ar,
        title_en: c.title_en,
        status: c.status,
        is_free: c.is_free,
        enrollment_count: countMap[c.id] || 0,
      }));

      coursesWithCounts.sort((a, b) => b.enrollment_count - a.enrollment_count);
      setPopularCourses(coursesWithCounts.slice(0, 5));
    } catch (err) {
      console.error("Failed to load real dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [isRtl]);

  const statCards = [
    {
      title: isRtl ? "إجمالي الطلاب المسجلين" : "Registered Students",
      value: stats.totalStudents.toLocaleString(),
      change: `+${stats.newSignups30Days} ${isRtl ? "آخر 30 يوم" : "last 30d"}`,
      icon: Users,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
    {
      title: isRtl ? "الاشتراكات النشطة" : "Active Enrollments",
      value: stats.activeEnrollments.toLocaleString(),
      change: `+${stats.newSignups7Days} ${isRtl ? "آخر 7 أيام" : "last 7d"}`,
      icon: BookOpen,
      color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    },
    {
      title: isRtl ? "الدورات المنشورة" : "Published Courses",
      value: stats.publishedCourses.toString(),
      change: `${stats.totalLessons} ${isRtl ? "درساً تفاعلياً" : "interactive lessons"}`,
      icon: Award,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    },
    {
      title: isRtl ? "متوسط إتمام الدروس" : "Completion Rate",
      value: `${stats.completionRate}%`,
      change: isRtl ? "حساب حي من قاعدة البيانات" : "Live from database",
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("overview")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "إحصائيات المنصة الحية، طلبات الاشتراك المعلقة، والنشاط الفعلي لطلاب الجيوماتكس"
              : "Live platform metrics, pending enrollments, and real geomatics student activities"}
          </p>
        </div>

        <button
          onClick={loadRealData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-cyan" : ""}`} />
          <span>{isRtl ? "تحديث حي" : "Live Refresh"}</span>
        </button>
      </div>

      {/* 4 Real Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((st, idx) => {
          const Icon = st.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {st.title}
                </span>
                <div className={`p-2 rounded-xl border ${st.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {loading ? "..." : st.value}
                </span>
                <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                  {st.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Columns Layout: Pending WhatsApp Requests & Recent Student Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending WhatsApp Requests */}
        <div className="lg:col-span-2 rounded-3xl glass-panel p-6 border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-500" />
              <h2 className="text-sm font-extrabold text-foreground">
                {isRtl ? "طلبات التسجيل المباشرة عبر الواتساب" : "WhatsApp Enrollment Requests"}
              </h2>
            </div>
            <Link
              href="/admin/requests"
              className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>{isRtl ? "عرض الكل" : "View all"}</span>
              <Arrow className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-cyan mb-2" />
              <span>{isRtl ? "جارٍ فحص الطلبات..." : "Checking requests..."}</span>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto" />
              <p className="font-bold text-foreground">
                {isRtl ? "لا توجد طلبات معلقة حالياً" : "No pending requests"}
              </p>
              <p className="text-[11px]">
                {isRtl
                  ? "جميع طلبات التحاق الطلاب تمت مراجعتها."
                  : "All student enrollment requests have been handled."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-background/60 border border-border/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {req.full_name}
                      </span>
                      {req.phone && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                          {req.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-brand-blue dark:text-brand-cyan font-semibold">
                      {req.course_title}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {req.email}
                    </p>
                  </div>

                  <Link
                    href="/admin/requests"
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors self-end sm:self-auto"
                  >
                    <span>{isRtl ? "مراجعة وتفعيل" : "Review & Enroll"}</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Registered Students */}
        <div className="rounded-3xl glass-panel p-6 border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <h2 className="text-sm font-extrabold text-foreground">
                {isRtl ? "أحدث الطلاب المسجلين" : "Recent Signups"}
              </h2>
            </div>
            <Link
              href="/admin/students"
              className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline flex items-center gap-1"
            >
              <span>{isRtl ? "الطلاب" : "All"}</span>
              <Arrow className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-cyan mb-2" />
            </div>
          ) : recentStudents.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {isRtl ? "لا يوجد طلاب مسجلون بعد." : "No registered students yet."}
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentStudents.map((st) => (
                <div
                  key={st.id}
                  className="p-3 rounded-2xl bg-background/50 border border-border/50 space-y-0.5"
                >
                  <p className="text-xs font-bold text-foreground">{st.full_name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{st.email}</p>
                  <p className="text-[9px] text-muted-foreground/70 font-mono">
                    {new Date(st.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Most Popular Courses Table */}
      <div className="rounded-3xl glass-panel p-6 border border-border/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <h2 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-cyan" />
            <span>{isRtl ? "الدورات التدريبية الأكثر التحاقاً وإقبالاً" : "Most Enrolled Courses"}</span>
          </h2>
          <Link
            href="/admin/courses"
            className="text-xs font-bold text-brand-blue dark:text-brand-cyan hover:underline"
          >
            {isRtl ? "إدارة الدورات" : "Manage"}
          </Link>
        </div>

        {popularCourses.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {isRtl ? "لم يتم تسجيل دورات في النظام بعد." : "No courses enrolled yet."}
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {popularCourses.map((c, idx) => (
              <div key={c.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono font-bold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-foreground block">
                      {isRtl ? c.title_ar : c.title_en}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {c.is_free ? (isRtl ? "مجانية" : "Free") : (isRtl ? "مدفوعة" : "Paid")} • {c.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-brand-cyan/15 text-brand-cyan">
                    {c.enrollment_count} {isRtl ? "طالب" : "students"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
