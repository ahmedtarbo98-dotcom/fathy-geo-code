"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  Download,
  UserCheck,
  UserX,
  Plus,
  CheckCircle2,
  X,
  BookOpen,
  ShieldAlert,
  Trash2,
  RotateCcw,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface CourseProgressDetail {
  enrollment_id: string;
  course_id: string;
  title_ar: string;
  title_en: string;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
}

interface StudentRow {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  is_blocked: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  enrolled_courses_count: number;
  total_enrollments_count: number;
  overall_progress: number;
  course_progress: CourseProgressDetail[];
}

interface CourseSummary {
  id: string;
  title_ar: string;
  title_en: string;
  status: string;
}

type FilterMode = "all" | "blocked" | "enrolled";

export default function AdminStudentsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [counts, setCounts] = useState({ all: 0, blocked: 0, enrolled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const fmtNum = (n: number) =>
    new Intl.NumberFormat(numLocale).format(Number.isFinite(n) ? n : 0);

  const fmtDate = (iso: string | null) => {
    if (!iso) return isRtl ? "لم يسجل دخول" : "Never";
    return new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    return headers;
  }, [supabase]);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        filter,
        search: debouncedSearch,
      });

      const res = await fetch(`/api/admin/students?${params.toString()}`, {
        cache: "no-store",
        headers,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setStudents(data.students || []);
      setCourses(data.courses || []);
      setCounts(data.counts || { all: 0, blocked: 0, enrolled: 0 });
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);

      if (data.courses?.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data.courses[0].id);
      }

      // Sync open details modal if student is in updated results
      setSelectedStudent((prev) => {
        if (!prev) return null;
        return (data.students || []).find((s: StudentRow) => s.id === prev.id) || null;
      });
    } catch (err: any) {
      setError(err?.message || (isRtl ? "تعذر تحميل قائمة الطلاب" : "Failed to load students"));
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, page, filter, debouncedSearch, isRtl, selectedCourseId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const toggleBlockStatus = async (student: StudentRow) => {
    try {
      setActionBusy(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          action: "toggle_block",
          studentId: student.id,
          isBlocked: !student.is_blocked,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      await fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleManualEnrollAction = async (
    studentId: string,
    courseId: string,
    action: "enroll" | "unenroll"
  ) => {
    try {
      setActionBusy(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          userId: studentId,
          courseId,
          action,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      await fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleResetProgress = async (studentId: string, courseId?: string) => {
    const confirmed = window.confirm(
      courseId
        ? isRtl
          ? "هل تريد تصفير تقدم الطالب في هذه الدورة؟"
          : "Reset progress for this course?"
        : isRtl
        ? "هل تريد تصفير جميع سجلات التقدم لهذا الطالب؟"
        : "Reset ALL course progress for this student?"
    );
    if (!confirmed) return;

    try {
      setActionBusy(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          action: "reset_progress",
          studentId,
          courseId,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      await fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleDeleteStudent = async (student: StudentRow) => {
    const confirmed = window.confirm(
      isRtl
        ? `هل أنت متأكد من حذف حساب "${student.full_name || student.email}" نهائياً؟ لا يمكن التراجع.`
        : `Permanently delete student "${student.full_name || student.email}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setActionBusy(true);
      const headers = await getAuthHeaders();
      const res = await fetch(
        `/api/admin/students?studentId=${encodeURIComponent(student.id)}`,
        {
          method: "DELETE",
          headers,
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Failed");
      setSelectedStudent(null);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionBusy(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        export: "csv",
        filter,
        search: debouncedSearch,
      });
      const res = await fetch(`/api/admin/students?${params.toString()}`, {
        headers,
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `fathy-geo-code-students-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{isRtl ? "إدارة الطلاب المسجلين" : "Registered Students"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "بيانات حية من المصادقة والملفات الشخصية، متاحة للإدارة فقط"
              : "Live roster joined with auth emails and real progress; admin-only access"}
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold hover:border-brand-cyan/40 transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-brand-cyan" />
          <span>{isRtl ? "تصدير CSV" : "Export CSV"}</span>
        </button>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", labelAr: "الكل", labelEn: "All", count: counts.all },
              { id: "enrolled", labelAr: "مشتركون بدورات", labelEn: "Enrolled", count: counts.enrolled },
              { id: "blocked", labelAr: "محظورون", labelEn: "Blocked", count: counts.blocked },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id);
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                filter === tab.id
                  ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                  : "bg-card text-muted-foreground border-border/70 hover:text-foreground"
              }`}
            >
              {isRtl ? tab.labelAr : tab.labelEn} ({fmtNum(tab.count)})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={isRtl ? "ابحث بالاسم، البريد، الهاتف..." : "Search name, email, phone..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-2 rounded-xl border border-border bg-background text-xs"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-5 rounded-2xl border border-red-500/30 bg-red-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStudents}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase text-[11px]">
                <th className="py-3.5 px-4">{isRtl ? "الطالب" : "Student"}</th>
                <th className="py-3.5 px-4">{isRtl ? "تاريخ التسجيل" : "Signup Date"}</th>
                <th className="py-3.5 px-4">{isRtl ? "آخر دخول" : "Last Sign-In"}</th>
                <th className="py-3.5 px-4">{isRtl ? "الدورات" : "Enrolled"}</th>
                <th className="py-3.5 px-4">{isRtl ? "التقدم الفعلي" : "Overall Progress"}</th>
                <th className="py-3.5 px-4">{isRtl ? "الحالة" : "Status"}</th>
                <th className="py-3.5 px-4 text-right rtl:text-left">
                  {isRtl ? "إجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4" colSpan={7}>
                      <div className="h-6 bg-muted/60 rounded-lg w-full" />
                    </td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground">
                    {isRtl
                      ? "لا يوجد طلاب مطابقون للبحث أو الفلتر الحالي."
                      : "No students match the current filter."}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-cyan text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(student.full_name || student.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate max-w-[180px]">
                            {student.full_name || (isRtl ? "بدون اسم" : "Unnamed")}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {fmtDate(student.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {fmtDate(student.last_sign_in_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-blue/10 text-brand-blue dark:text-brand-cyan">
                        <BookOpen className="w-3 h-3" />
                        <span>{fmtNum(student.enrolled_courses_count)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 w-36">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span>{fmtNum(student.overall_progress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-cyan transition-all"
                            style={{ width: `${student.overall_progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {student.is_blocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-500">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{isRtl ? "محظور" : "Blocked"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isRtl ? "نشط" : "Active"}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 rounded-lg bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan transition-colors"
                          title={isRtl ? "عرض التفاصيل والتقدم" : "View Details"}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={actionBusy}
                          onClick={() => toggleBlockStatus(student)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.is_blocked
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500"
                              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-500"
                          }`}
                          title={
                            student.is_blocked
                              ? isRtl
                                ? "إلغاء الحظر"
                                : "Unblock"
                              : isRtl
                              ? "حظر الحساب"
                              : "Block Student"
                          }
                        >
                          {student.is_blocked ? (
                            <UserCheck className="w-3.5 h-3.5" />
                          ) : (
                            <UserX className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          disabled={actionBusy}
                          onClick={() => handleDeleteStudent(student)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                          title={isRtl ? "حذف الحساب نهائياً" : "Delete Student"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {isRtl
                ? `إجمالي: ${fmtNum(total)} طالب | صفحة ${fmtNum(page)} من ${fmtNum(totalPages)}`
                : `Total: ${fmtNum(total)} students | Page ${fmtNum(page)} of ${fmtNum(totalPages)}`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
              >
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Details & Per-Course Actions Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-card border border-border/80 max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  {selectedStudent.full_name || (isRtl ? "طالب" : "Student")}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedStudent.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-muted-foreground text-[10px]">
                  {isRtl ? "تاريخ التسجيل" : "Signup Date"}
                </p>
                <p className="font-bold mt-0.5">{fmtDate(selectedStudent.created_at)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-muted-foreground text-[10px]">
                  {isRtl ? "آخر تسجيل دخول" : "Last Sign-In"}
                </p>
                <p className="font-bold mt-0.5">{fmtDate(selectedStudent.last_sign_in_at)}</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                <p className="text-muted-foreground text-[10px]">
                  {isRtl ? "التقدم العام" : "Overall Progress"}
                </p>
                <p className="font-bold mt-0.5 text-brand-cyan">
                  {fmtNum(selectedStudent.overall_progress)}%
                </p>
              </div>
            </div>

            {/* Per-course progress */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-foreground">
                  {isRtl ? "الدورات المشترك بها والتقدم التفصيلي" : "Enrolled Courses & Progress"}
                </h4>
                {selectedStudent.course_progress.length > 0 && (
                  <button
                    disabled={actionBusy}
                    onClick={() => handleResetProgress(selectedStudent.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isRtl ? "تصفير كل التقدم" : "Reset All Progress"}</span>
                  </button>
                )}
              </div>

              {selectedStudent.course_progress.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                  {isRtl
                    ? "هذا الطالب غير مشترك في أي دورة بعد."
                    : "Not enrolled in any courses yet."}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedStudent.course_progress.map((cp) => (
                    <div
                      key={cp.enrollment_id}
                      className="p-3.5 rounded-xl bg-muted/30 border border-border/50 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {isRtl ? cp.title_ar || cp.title_en : cp.title_en || cp.title_ar}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-brand-cyan">
                          {fmtNum(cp.completed_lessons)} / {fmtNum(cp.total_lessons)} (
                          {fmtNum(cp.progress_pct)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-brand-cyan"
                          style={{ width: `${cp.progress_pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          disabled={actionBusy}
                          onClick={() => handleResetProgress(selectedStudent.id, cp.course_id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-bold hover:bg-amber-500/20"
                        >
                          {isRtl ? "تصفير التقدم" : "Reset Progress"}
                        </button>
                        <button
                          disabled={actionBusy}
                          onClick={() =>
                            handleManualEnrollAction(selectedStudent.id, cp.course_id, "unenroll")
                          }
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 text-[10px] font-bold hover:bg-red-500/20"
                        >
                          {isRtl ? "إلغاء الاشتراك" : "Unenroll"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Enroll New Course */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-3">
              <h4 className="text-xs font-bold text-foreground">
                {isRtl ? "فتح / تفعيل اشتراك في دورة" : "Manual Enroll in Course"}
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isRtl ? c.title_ar : c.title_en}
                    </option>
                  ))}
                </select>
                <button
                  disabled={actionBusy || !selectedCourseId}
                  onClick={() =>
                    handleManualEnrollAction(selectedStudent.id, selectedCourseId, "enroll")
                  }
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue/90 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isRtl ? "تفعيل" : "Enroll"}</span>
                </button>
              </div>
            </div>

            {/* Footer Dangerous / Account Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
              <button
                disabled={actionBusy}
                onClick={() => toggleBlockStatus(selectedStudent)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold ${
                  selectedStudent.is_blocked
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {selectedStudent.is_blocked ? (
                  <UserCheck className="w-4 h-4" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                <span>
                  {selectedStudent.is_blocked
                    ? isRtl
                      ? "فك حظر الحساب"
                      : "Unblock Account"
                    : isRtl
                    ? "حظر الحساب"
                    : "Block Account"}
                </span>
              </button>

              <button
                disabled={actionBusy}
                onClick={() => handleDeleteStudent(selectedStudent)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/15 text-red-500 text-xs font-bold hover:bg-red-500/25"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isRtl ? "حذف الطالب نهائياً" : "Delete Student"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
