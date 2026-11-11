"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import CertificateCard from "@/components/certificate-card";
import { Award } from "lucide-react";

interface CertItem {
  id: string;
  student_name: string;
  course_title_ar: string;
  course_title_en: string;
  issued_at: string;
}

export default function MyCertificatesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Certificates");
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [certs, setCerts] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserCerts() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setCerts([]);
          return;
        }
        const { data } = await supabase
          .from("certificates")
          .select("id, student_name, course_title_ar, course_title_en, issued_at")
          .eq("user_id", user.id)
          .eq("revoked", false)
          .order("issued_at", { ascending: false });

        setCerts(data || []);
      } finally {
        setLoading(false);
      }
    }
    loadUserCerts();
  }, [supabase]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));

  return (
    <div className="min-h-screen py-10 md:py-16 relative">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <Award className="w-3.5 h-3.5 text-brand-cyan" />
            <span>FATHY GEO CODE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {loading ? (
          <div className="h-64 rounded-3xl bg-muted/60 animate-pulse" />
        ) : certs.length === 0 ? (
          <div className="rounded-3xl glass-panel p-12 border border-dashed border-border/70 text-center space-y-3">
            <Award className="w-10 h-10 text-muted-foreground mx-auto opacity-60" />
            <h2 className="text-lg font-bold text-foreground">
              {isRtl ? "لا توجد شهادات صادرة لحسابك بعد" : "No certificates issued yet"}
            </h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isRtl
                ? "عند إتمامك بنسبة 100% لأي دورة معتمدة سيتم إصدار شهادتك الرقمية الموثقة هنا."
                : "Complete any enrolled course to earn and download your verified digital certificate here."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {certs.map((cert) => (
              <CertificateCard
                key={cert.id}
                id={cert.id}
                studentName={cert.student_name}
                courseTitle={isRtl ? cert.course_title_ar : cert.course_title_en}
                date={fmtDate(cert.issued_at)}
                locale={locale}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
