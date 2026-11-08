"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Search,
  Download,
  Ban,
  CheckCircle2,
  BookOpen,
  RotateCcw,
  Plus,
  Mail,
  Phone,
  RefreshCw,
  X,
  AlertCircle,
  GraduationCap,
  Trash2,
} from "lucide-react";

interface StudentEnrollment {
  id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
  course_title?: string;
}

interface StudentRecord {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  is_blocked: boolean;
  created_at: string;
  enrollments: StudentEnrollment[];
  progressPercent: number;
}

interface CourseItem {
  id: string;
  title_ar: string;
  title_en: string;
}

export default function AdminStudentsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Details & Manual Enroll Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Load students & all courses
  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch all courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title_ar, title_en");

      setCourses(coursesData || []);

      // 2. Fetch profiles
      const { data: profilesData, error: profErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profErr) throw profErr;

      // 3. Fetch all enrollments
      const { data: enrollmentsData } = await supabase
        .from("enrollments")
        .select("id, user_id, course_id, status, enrolled_at");

      // 4. Fetch all lesson progress
      const { data: progressData } = await supabase
        .from("lesson_progress")
        .select("user_id, completed");

      // Map profiles with their enrollments and progress
      const mapped: StudentRecord[] = (profilesData || []).map((prof) => {
        const userEnrollments = (enrollmentsData || [])
          .filter((e) => e.user_id === prof.id)
          .map((e) => {
            const matched = (coursesData || []).find((c) => c.id === e.course_id);
            return {
              id: e.id,
              course_id: e.course_id,
              status: e.status,
              enrolled_at: e.enrolled_at,
              course_title: matched
                ? isRtl ? matched.title_ar : matched.title_en
                : "GIS Course",
            };
          });

        const userCompleted = (progressData || []).filter(
          (p) => p.user_id === prof.id && p.completed
        ).length;

        const progressPercent = userEnrollments.length > 0
          ? Math.min(100, Math.round((userCompleted / (userEnrollments.length * 10)) * 100))
          : 0;

        return {
          id: prof.id,
          full_name: prof.full_name || "Student",
          email: prof.email || "No email",
          phone: prof.phone,
          role: prof.role,
          is_blocked: prof.is_blocked || false,
          created_at: prof.created_at,
          enrollments: userEnrollments,
          progressPercent,
        };
      });

      setStudents(mapped);
    } catch (err: any) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isRtl]);

  // Search filter
  const filtered = students.filter(
    (s) =>
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle Block/Unblock
  const toggleBlock = async (studentId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: nextStatus })
        .eq("id", studentId);

      if (error) throw error;

      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, is_blocked: nextStatus } : s))
      );

      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent({ ...selectedStudent, is_blocked: nextStatus });
      }
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  // Manual Enroll Student in Course
  const handleManualEnroll = async () => {
    if (!selectedStudent || !enrollCourseId) return;

    try {
      setActionLoading(true);
      const { data, error } = await supabase.from("enrollments").insert({
        user_id: selectedStudent.id,
        course_id: enrollCourseId,
        status: "active",
      }).select().single();

      if (error) throw error;

      await loadData();

      // Update current selectedStudent modal
      const matched = courses.find((c) => c.id === enrollCourseId);
      const newEnrollment: StudentEnrollment = {
        id: data.id,
        course_id: enrollCourseId,
        status: "active",
        enrolled_at: new Date().toISOString(),
        course_title: matched ? (isRtl ? matched.title_ar : matched.title_en) : "Course",
      };

      setSelectedStudent({
        ...selectedStudent,
        enrollments: [newEnrollment, ...selectedStudent.enrollments],
      });
      setEnrollCourseId("");
    } catch (err: any) {
      alert(isRtl ? `فشل التسجيل: ${err.message}` : `Enrollment failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Unenroll Student
  const handleManualUnenroll = async (enrollmentId: string) => {
    if (!confirm(isRtl ? "إلغاء اشتراك هذا الطالب من الدورة؟" : "Revoke student enrollment?")) return;

    try {
      setActionLoading(true);
      const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
      if (error) throw error;

      await loadData();
      if (selectedStudent) {
        setSelectedStudent({
          ...selectedStudent,
          enrollments: selectedStudent.enrollments.filter((e) => e.id !== enrollmentId),
        });
      }
    } catch (err: any) {
      alert(`Error revoking: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      ["ID,Name,Email,Phone,Role,EnrolledCourses,Progress,Status,JoinedDate"]
        .concat(
          students.map(
            (s) =>
              `"${s.id}","${s.full_name}","${s.email}","${s.phone || ""}","${s.role}",${
                s.enrollments.length
              },"${s.progressPercent}%","${s.is_blocked ? "Blocked" : "Active"}","${s.created_at}"`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fathy-geo-code-students-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{t("students")}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "قائمة الطلاب الحية من قاعدة البيانات، إدارة الاشتراكات، الحظر، وتصدير التقارير"
              : "Live student roster from database, manual enrollment, access management, and CSV export"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isRtl ? "تحديث حي" : "Refresh"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={exportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors"
          >
            <Download className="w-4 h-4 text-brand-cyan" />
            <span>{isRtl ? "تصدير كملف CSV" : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? "البحث بالاسم أو البريد الإلكتروني..." : "Search by name or email..."}
            className="w-full ps-9 pe-4 py-2 rounded-xl border border-border bg-card text-xs font-medium focus:outline-none focus:border-brand-blue"
          />
        </div>

        <span className="text-xs text-muted-foreground font-semibold">
          {filtered.length} {isRtl ? "طالب مسجل" : "students"}
        </span>
      </div>

      {/* Students Table */}
      <div className="rounded-3xl glass-panel border border-border/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
            <p className="text-xs font-semibold">
              {isRtl ? "جارٍ تحميل سجلات الطلاب..." : "Loading student records..."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/40" />
            <p className="font-bold text-foreground">
              {isRtl ? "لم يتم العثور على طلاب مطابقين" : "No students found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-bold">
                  <th className="p-4 text-start">{isRtl ? "اسم الطالب" : "Student"}</th>
                  <th className="p-4 text-start">{isRtl ? "البريد الإلكتروني" : "Email"}</th>
                  <th className="p-4 text-start">{isRtl ? "الدورات المشترك بها" : "Enrolled"}</th>
                  <th className="p-4 text-start">{isRtl ? "التقدم" : "Progress"}</th>
                  <th className="p-4 text-start">{isRtl ? "تاريخ الانضمام" : "Joined"}</th>
                  <th className="p-4 text-start">{isRtl ? "الحالة" : "Status"}</th>
                  <th className="p-4 text-end">{isRtl ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    {/* Student Name */}
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-blue/10 text-brand-blue dark:text-brand-cyan font-extrabold flex items-center justify-center text-[10px]">
                          {student.full_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{student.full_name}</span>
                          {student.role === "admin" && (
                            <span className="ms-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand-cyan/20 text-brand-cyan">
                              ADMIN
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 font-mono text-muted-foreground">
                      {student.email}
                    </td>

                    {/* Enrolled Courses */}
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-brand-blue/10 text-brand-blue dark:text-brand-cyan">
                        {student.enrollments.length} {isRtl ? "دورات" : "courses"}
                      </span>
                    </td>

                    {/* Progress */}
                    <td className="p-4 font-mono font-bold text-foreground">
                      {student.progressPercent}%
                    </td>

                    {/* Joined Date */}
                    <td className="p-4 text-muted-foreground font-mono">
                      {new Date(student.created_at).toLocaleDateString(
                        isRtl ? "ar-EG" : "en-US",
                        { day: "numeric", month: "short", year: "numeric" }
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          student.is_blocked
                            ? "bg-red-500/15 text-red-500"
                            : "bg-emerald-500/15 text-emerald-500"
                        }`}
                      >
                        {student.is_blocked
                          ? isRtl ? "محظور" : "Blocked"
                          : isRtl ? "نشط" : "Active"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="px-2.5 py-1 rounded-lg bg-brand-blue/10 text-brand-blue dark:text-brand-cyan hover:bg-brand-blue/20 font-bold transition-colors"
                        >
                          {isRtl ? "تفاصيل واشتراكات" : "Manage"}
                        </button>

                        <button
                          onClick={() => toggleBlock(student.id, student.is_blocked)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.is_blocked
                              ? "text-emerald-500 hover:bg-emerald-500/10"
                              : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          }`}
                          title={student.is_blocked ? (isRtl ? "إلغاء الحظر" : "Unblock") : (isRtl ? "حظر الطالب" : "Block")}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILS & MANUAL ENROLL MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="my-8 w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-extrabold text-foreground">
                  {selectedStudent.full_name}
                </h3>
                <p className="text-xs font-mono text-muted-foreground">
                  {selectedStudent.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Manual Enroll In Course Section */}
            <div className="p-4 rounded-2xl bg-brand-blue/5 border border-brand-blue/20 space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-cyan" />
                <span>{isRtl ? "تسجيل يدوي في دورة (Manual Enrollment)" : "Manual Course Enrollment"}</span>
              </label>

              <div className="flex items-center gap-2">
                <select
                  value={enrollCourseId}
                  onChange={(e) => setEnrollCourseId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium"
                >
                  <option value="">{isRtl ? "-- اختر الدورة --" : "-- Select Course --"}</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isRtl ? c.title_ar : c.title_en}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleManualEnroll}
                  disabled={!enrollCourseId || actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold disabled:opacity-50"
                >
                  {actionLoading ? "..." : isRtl ? "تفعيل" : "Enroll"}
                </button>
              </div>
            </div>

            {/* List of currently enrolled courses */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground">
                {isRtl ? "الدورات المشترك بها حالياً:" : "Enrolled Courses:"}
              </h4>

              {selectedStudent.enrollments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {isRtl ? "لم يشترك الطالب في أي دورة بعد." : "No enrolled courses."}
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedStudent.enrollments.map((enr) => (
                    <div
                      key={enr.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold text-foreground">{enr.course_title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {isRtl ? "تاريخ الاشتراك:" : "Enrolled:"} {new Date(enr.enrolled_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManualUnenroll(enr.id)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        title={isRtl ? "إلغاء الاشتراك" : "Unenroll"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer close */}
            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
