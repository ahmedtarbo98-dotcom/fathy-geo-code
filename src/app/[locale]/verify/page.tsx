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
    <div className="min-h-[85vh] flex items-center justify-center py-16 px-4 bg-background dark:bg-brand-primary">
      <div className="max-w-lg w-full rounded-3xl surface-altura p-8 sm:p-10 border border-border/70 dark:border-white/10 shadow-altura space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-blue/10 dark:bg-brand-cyan/10 text-brand-blue dark:text-brand-cyan border border-brand-blue/20 dark:border-brand-cyan/20 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground dark:text-cream">
            {locale === "ar"
              ? "التحقق من صحة الشهادات"
              : "Certificate Verification"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground dark:text-brand-muted">
            {locale === "ar"
              ? "أدخل كود الشهادة الفريد (مثال: FGC-2026-001) للتحقق من صحتها وتاريخ إصدارها"
              : "Enter the unique certificate ID (e.g. FGC-2026-001) to verify its authenticity"}
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground dark:text-brand-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder={locale === "ar" ? "أدخل رقم الشهادة هنا..." : "Enter Certificate ID..."}
              className="w-full ps-10 pe-4 py-3 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm font-mono focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 dark:text-brand-primary dark:bg-brand-cyan dark:hover:bg-cyan-300 shadow-cyan-glow hover:scale-[1.01] active:scale-[0.98] transition-all"
          >
            {locale === "ar" ? "التحقق من الشهادة الآن" : "Verify Certificate Now"}
          </button>
        </form>

        <div className="pt-4 border-t border-border/60 dark:border-white/10 text-xs text-muted-foreground dark:text-brand-muted flex items-center justify-center gap-2">
          <QrCode className="w-4 h-4 text-brand-blue dark:text-brand-cyan" />
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
