"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { ShieldCheck, Search, Award, CheckCircle2, QrCode } from "lucide-react";

export default function VerifyIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [certId, setCertId] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;
    router.push(`/verify/${certId.trim()}`);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-lg w-full rounded-3xl glass-panel p-8 sm:p-10 border border-border/70 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            {locale === "ar"
              ? "التحقق من صحة الشهادات"
              : "Certificate Verification"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {locale === "ar"
              ? "أدخل كود الشهادة الفريد (مثال: FGC-2026-001) للتحقق من صحتها وتاريخ إصدارها"
              : "Enter the unique certificate ID (e.g. FGC-2026-001) to verify its authenticity"}
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder={locale === "ar" ? "أدخل رقم الشهادة هنا..." : "Enter Certificate ID..."}
              className="w-full ps-10 pe-4 py-3 rounded-xl border border-border/80 bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-blue/20"
          >
            {locale === "ar" ? "التحقق من الشهادة الآن" : "Verify Certificate Now"}
          </button>
        </form>

        <div className="pt-4 border-t border-border/40 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <QrCode className="w-4 h-4 text-brand-cyan" />
          <span>
            {locale === "ar"
              ? "يمكنك أيضاً مسح رمز الـ QR المطبوع على الشهادة مباشرة"
              : "You can also scan the QR code printed on the physical certificate"}
          </span>
        </div>
      </div>
    </div>
  );
}
