"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Clock,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface EnrollmentRequestItem {
  id: string;
  user_id: string;
  course_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "pending" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  course_title?: string;
  course_price?: number;
  course_currency?: string;
}

export default function AdminRequestsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [requests, setRequests] = useState<EnrollmentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch real requests & courses from Supabase
  const loadRequests = async () => {
    try {
      setLoading(true);

      // 1. Fetch courses lookup
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title_ar, title_en, price, currency");

      const coursesMap = new Map();
      (coursesData || []).forEach((c) => {
        coursesMap.set(c.id, c);
      });

      // 2. Fetch enrollment requests
      const { data: reqData, error: reqErr } = await supabase
        .from("enrollment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqErr) throw reqErr;

      const mapped: EnrollmentRequestItem[] = (reqData || []).map((r) => {
        const c = coursesMap.get(r.course_id);
        return {
          ...r,
          course_title: c ? (isRtl ? c.title_ar : c.title_en) : "GIS Course",
          course_price: c ? c.price : 0,
          course_currency: c ? c.currency : "USD",
        };
      });

      setRequests(mapped);
    } catch (err: any) {
      console.error("Failed to load enrollment requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [isRtl]);

  // Approve request & enroll student in course
  const handleApprove = async (req: EnrollmentRequestItem) => {
    try {
      setActionLoadingId(req.id);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/admin/enroll", {
        method: "POST",
        headers,
        body: JSON.stringify({
          userId: req.user_id,
          studentEmail: req.email,
          courseId: req.course_id,
          requestId: req.id,
          action: "enroll",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to approve enrollment");
      }

      // Update local state
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r))
      );

      alert(
        isRtl
          ? `✅ تم تفعيل الاشتراك بنجاح للطالب: ${req.full_name}!\nيمكن للطالب الآن الدخول ومشاهدة جميع دروس الدورة والفيديوهات.`
          : `✅ Enrollment approved & activated for ${req.full_name}!`
      );
    } catch (err: any) {
      console.error("Approve request error:", err);
      alert(isRtl ? `خطأ أثناء التفعيل: ${err.message}` : `Approval error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject request
  const handleReject = async (reqId: string) => {
    if (!confirm(isRtl ? "هل أنت متأكد من رفض هذا الطلب؟" : "Reject this request?")) return;
    try {
      setActionLoadingId(reqId);
      const { error } = await supabase
        .from("enrollment_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reqId);

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, status: "rejected" } : r))
      );
    } catch (err: any) {
      alert(`Error rejecting request: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered requests
  const filteredRequests = requests.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{t("requests")}</span>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                {pendingCount} {isRtl ? "جديد" : "New"}
              </span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "مراجعة وتفعيل اشتراكات الطلاب في الدورات المدفوعة بعد استلام التحويل (كاش / إنستاباي)"
              : "Review, approve, and activate student course access after receiving payment"}
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
          title="تحديث القائمة"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        {(
          [
            { id: "all", label_ar: "جميع الطلبات", label_en: "All Requests" },
            { id: "pending", label_ar: `قيد المراجعة (${pendingCount})`, label_en: `Pending (${pendingCount})` },
            { id: "approved", label_ar: "المفعلة", label_en: "Approved" },
            { id: "rejected", label_ar: "المرفوضة", label_en: "Rejected" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-2 rounded-xl transition-all ${
              filterStatus === tab.id
                ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                : "border border-border bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {isRtl ? tab.label_ar : tab.label_en}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-brand-cyan" />
            <p className="text-xs text-muted-foreground font-medium">
              {isRtl ? "جارٍ تحميل طلبات الاشتراك الحية..." : "Loading requests..."}
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-20 text-center space-y-3 text-muted-foreground">
            <UserCheck className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <h3 className="text-sm font-bold text-foreground">
              {isRtl ? "لا توجد طلبات اشتراك في هذا القسم" : "No requests found"}
            </h3>
            <p className="text-xs max-w-sm mx-auto">
              {isRtl
                ? "عندما يطلب طالب الاشتراك في دورة مدفوعة، سيظهر طلبه هنا لتتمكن من مراجعة التحويل وتفعيل الدورة له بضغطة زر واحدة."
                : "When students request course access, they will appear here for manual verification and 1-click activation."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs sm:text-sm">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 text-start">{locale === "ar" ? "الطالب" : "Student"}</th>
                  <th className="p-4 text-start">{locale === "ar" ? "الدورة المطلوبة" : "Requested Course"}</th>
                  <th className="p-4 text-start">{locale === "ar" ? "السعر" : "Price"}</th>
                  <th className="p-4 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="p-4 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                  <th className="p-4 text-end">{locale === "ar" ? "إجراءات التفعيل" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground">{req.full_name}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {req.email} {req.phone ? `• ${req.phone}` : ""}
                      </div>
                    </td>

                    <td className="p-4 font-medium text-foreground">
                      <div>{req.course_title}</div>
                      {req.notes && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                          {req.notes}
                        </div>
                      )}
                    </td>

                    <td className="p-4 font-mono font-bold text-brand-blue dark:text-cyan-400">
                      {req.course_price} {req.course_currency}
                    </td>

                    <td className="p-4 text-xs text-muted-foreground font-mono">
                      {new Date(req.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="p-4">
                      {req.status === "pending" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {locale === "ar" ? "قيد المراجعة" : "Pending"}
                        </span>
                      ) : req.status === "approved" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {locale === "ar" ? "تم التفعيل بنجاح" : "Approved"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          {locale === "ar" ? "مرفوض" : "Rejected"}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        {/* WhatsApp Contact Button */}
                        {req.phone && (
                          <a
                            href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                            title="مراسلة عبر واتساب"
                          >
                            <PhoneCall className="w-4 h-4" />
                          </a>
                        )}

                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleApprove(req)}
                              disabled={actionLoadingId === req.id}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {actionLoadingId === req.id
                                  ? (isRtl ? "جارٍ التفعيل..." : "Activating...")
                                  : (isRtl ? "تفعيل الدورة الآن" : "Approve & Enroll")}
                              </span>
                            </button>

                            <button
                              onClick={() => handleReject(req.id)}
                              disabled={actionLoadingId === req.id}
                              className="px-2.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="رفض الطلب"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
