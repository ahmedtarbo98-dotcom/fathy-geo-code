"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
} from "lucide-react";

export default function AdminStudentsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");

  const [students, setStudents] = useState([
    {
      id: "std-1",
      name: "م. كريم عبد الرحمن",
      email: "kareem@example.com",
      phone: "+201011122233",
      enrolledCourses: 2,
      progress: "100%",
      isBlocked: false,
      joinedAt: "10 أكتوبر 2026",
    },
    {
      id: "std-2",
      name: "د. هبة الشامي",
      email: "heba@example.com",
      phone: "+201044455566",
      enrolledCourses: 1,
      progress: "85%",
      isBlocked: false,
      joinedAt: "18 أكتوبر 2026",
    },
    {
      id: "std-3",
      name: "م. محمد السعيد",
      email: "mohamed@example.com",
      phone: "+201077788899",
      enrolledCourses: 3,
      progress: "40%",
      isBlocked: false,
      joinedAt: "25 أكتوبر 2026",
    },
    {
      id: "std-4",
      name: "علي حسن",
      email: "ali@example.com",
      phone: "+201000011122",
      enrolledCourses: 1,
      progress: "10%",
      isBlocked: true,
      joinedAt: "01 نوفمبر 2026",
    },
  ]);

  const [search, setSearch] = useState("");

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBlock = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isBlocked: !s.isBlocked } : s))
    );
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Name,Email,Phone,Courses,Progress,Status"]
        .concat(
          students.map(
            (s) =>
              `${s.id},"${s.name}",${s.email},${s.phone},${s.enrolledCourses},${s.progress},${
                s.isBlocked ? "Blocked" : "Active"
              }`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fathy-geo-code-students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("students")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "متابعة الطلاب المسجلين، إدارة الاشتراكات يدوياً، حظر أو تفعيل الحسابات وتصدير البيانات"
              : "Search learners, view course progress, manually enroll, block/unblock and export CSV"}
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>{locale === "ar" ? "تصدير كـ CSV" : "Export CSV"}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "ar" ? "البحث بالاسم أو البريد الإلكتروني..." : "Search students by name or email..."}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-card text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
        />
      </div>

      {/* Students Table */}
      <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 text-start">{locale === "ar" ? "بيانات الطالب" : "Learner"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الهاتف" : "Phone"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الدورات المشترك بها" : "Enrolled"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الإنجاز" : "Progress"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="p-4 text-end">{locale === "ar" ? "إجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((std) => (
                <tr key={std.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-foreground">{std.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {std.email}
                    </div>
                  </td>

                  <td className="p-4 font-mono text-xs text-muted-foreground">
                    {std.phone}
                  </td>

                  <td className="p-4">
                    <span className="font-bold text-foreground font-mono">
                      {std.enrolledCourses} دورات
                    </span>
                  </td>

                  <td className="p-4 font-bold text-brand-blue dark:text-cyan-400 font-mono">
                    {std.progress}
                  </td>

                  <td className="p-4">
                    {std.isBlocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        {locale === "ar" ? "محظور" : "Blocked"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {locale === "ar" ? "نشط" : "Active"}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleBlock(std.id)}
                        className={`p-1.5 rounded-lg text-xs font-semibold ${
                          std.isBlocked
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        }`}
                        title={std.isBlocked ? "Unblock" : "Block"}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => alert(`Reset progress for ${std.name}`)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                        title="Reset Progress"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
