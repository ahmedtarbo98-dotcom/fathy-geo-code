"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function AdminRequestsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");

  const [requests, setRequests] = useState([
    {
      id: "req-1",
      name: "م. إبراهيم خليل",
      email: "ibrahim@example.com",
      phone: "+201012345678",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      price: "$49",
      date: "08 نوفمبر 2026 - 01:20 م",
      status: "pending",
    },
    {
      id: "req-2",
      name: "د. سارة فؤاد",
      email: "sara@example.com",
      phone: "+201098765432",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      price: "$49",
      date: "08 نوفمبر 2026 - 10:15 ص",
      status: "pending",
    },
    {
      id: "req-3",
      name: "م. وائل ناصر",
      email: "wael@example.com",
      phone: "+201055566677",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      price: "$49",
      date: "07 نوفمبر 2026 - 05:40 م",
      status: "approved",
    },
  ]);

  const handleApprove = (id: string, name: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
    );
    alert(
      locale === "ar"
        ? `تمت الموافقة وتفعيل الاشتراك للطالب: ${name}`
        : `Access approved and activated for ${name}`
    );
  };

  const handleReject = (id: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "rejected" } : r))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("requests")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "مراجعة وتفعيل طلبات الاشتراك في الدورات المدفوعة الواردة عبر واتساب"
              : "Review, approve, or reject manual course enrollment requests"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 text-start">{locale === "ar" ? "الطالب" : "Student"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الدورة المطلوبة" : "Requested Course"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "السعر" : "Price"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "التاريخ" : "Date"}</th>
                <th className="p-4 text-start">{locale === "ar" ? "الحالة" : "Status"}</th>
                <th className="p-4 text-end">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-foreground">{req.name}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      {req.email} • {req.phone}
                    </div>
                  </td>

                  <td className="p-4 font-medium text-foreground">
                    {req.course}
                  </td>

                  <td className="p-4 font-mono font-bold text-brand-blue dark:text-cyan-400">
                    {req.price}
                  </td>

                  <td className="p-4 text-xs text-muted-foreground">
                    {req.date}
                  </td>

                  <td className="p-4">
                    {req.status === "pending" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {locale === "ar" ? "قيد المراجعة" : "Pending"}
                      </span>
                    ) : req.status === "approved" ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {locale === "ar" ? "تم التفعيل" : "Approved"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        {locale === "ar" ? "مرفوض" : "Rejected"}
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`https://wa.me/${req.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20"
                        title="Chat on WhatsApp"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>

                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id, req.name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
                          >
                            {t("approve")}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted"
                          >
                            {t("reject")}
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
      </div>
    </div>
  );
}
