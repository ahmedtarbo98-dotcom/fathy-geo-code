"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Award, Ban, RotateCcw, Search, ExternalLink, RefreshCw } from "lucide-react";

interface CertificateRow {
  id: string;
  student_name: string;
  course_title_ar: string;
  course_title_en: string;
  issued_at: string;
  revoked: boolean;
  profiles?: { email?: string | null; full_name?: string | null } | null;
}

export default function AdminCertificatesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  }, [supabase]);

  const loadCertificates = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/certificates", { cache: "no-store", headers });
      const data = await res.json();
      if (res.ok && Array.isArray(data.certificates)) {
        setCertificates(data.certificates);
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  const toggleRevoke = async (cert: CertificateRow) => {
    const headers = await getAuthHeaders();
    await fetch("/api/admin/certificates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: cert.id, revoked: !cert.revoked }),
    });
    setCertificates((prev) =>
      prev.map((c) => (c.id === cert.id ? { ...c, revoked: !cert.revoked } : c))
    );
  };

  const filtered = certificates.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.student_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.profiles?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("certificates")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "الشهادات الصادرة فعلياً من قاعدة البيانات وإمكانية إلغائها أو تفعيلها"
              : "Issued credentials from PostgreSQL with live revoke/reissue controls"}
          </p>
        </div>
        <button
          onClick={loadCertificates}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{isRtl ? "تحديث" : "Refresh"}</span>
        </button>
      </div>

      <div className="max-w-md relative">
        <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isRtl
              ? "البحث برقم الشهادة أو اسم الطالب..."
              : "Search by certificate ID or student name..."
          }
          className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-card text-xs"
        />
      </div>

      {loading ? (
        <div className="h-44 rounded-2xl bg-muted/60 animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 border border-dashed border-border/70 text-center space-y-2 text-muted-foreground">
          <Award className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-bold text-foreground">
            {isRtl ? "لا توجد شهادات صادرة بعد" : "No certificates issued yet"}
          </p>
          <p className="text-xs">
            {isRtl
              ? "ستظهر الشهادات هنا تلقائياً عند إصدارها للطلاب بعد إتمام الدورات."
              : "Certificates will appear here once issued to students upon course completion."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-muted/50 border-b border-border text-[11px] font-bold text-muted-foreground">
                <tr>
                  <th className="p-3.5 text-start">{isRtl ? "رقم الشهادة" : "ID"}</th>
                  <th className="p-3.5 text-start">{isRtl ? "الطالب" : "Student"}</th>
                  <th className="p-3.5 text-start">{isRtl ? "الدورة" : "Course"}</th>
                  <th className="p-3.5 text-start">{isRtl ? "تاريخ الإصدار" : "Issued"}</th>
                  <th className="p-3.5 text-start">{isRtl ? "الحالة" : "Status"}</th>
                  <th className="p-3.5 text-end">{isRtl ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/20">
                    <td className="p-3.5 font-mono font-bold text-foreground">{cert.id}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-foreground">{cert.student_name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {cert.profiles?.email || ""}
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {isRtl ? cert.course_title_ar : cert.course_title_en}
                    </td>
                    <td className="p-3.5 text-muted-foreground">{fmtDate(cert.issued_at)}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cert.revoked
                            ? "bg-red-500/15 text-red-500"
                            : "bg-emerald-500/15 text-emerald-500"
                        }`}
                      >
                        {cert.revoked
                          ? isRtl
                            ? "ملغاة"
                            : "Revoked"
                          : isRtl
                          ? "سارية"
                          : "Valid"}
                      </span>
                    </td>
                    <td className="p-3.5 text-end">
                      <div className="inline-flex items-center gap-2">
                        <a
                          href={`/${locale}/verify/${cert.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-border hover:bg-muted text-brand-cyan"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => toggleRevoke(cert)}
                          className={`p-1.5 rounded-lg border border-border ${
                            cert.revoked ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {cert.revoked ? (
                            <RotateCcw className="w-3.5 h-3.5" />
                          ) : (
                            <Ban className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
