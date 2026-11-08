"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CertificateCard from "@/components/certificate-card";
import {
  Award,
  ShieldCheck,
  Printer,
  Calendar,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function MyCertificatesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Certificates");

  const [activeCert, setActiveCert] = useState<any>({
    id: "FGC-2026-ARCGIS",
    studentName: locale === "ar" ? "م. كريم عبد الرحمن" : "Eng. Kareem Abdelrahman",
    courseTitle:
      locale === "ar"
        ? "أساسيات وتطبيقات ArcGIS Pro من البداية للاحتراف"
        : "ArcGIS Pro Fundamentals & Applied Spatial Analysis",
    date: locale === "ar" ? "15 أكتوبر 2026" : "October 15, 2026",
  });

  return (
    <div className="min-h-screen py-10 md:py-16 relative">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-5xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <Award className="w-3.5 h-3.5 text-brand-cyan" />
            <span>FATHY GEO CODE</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground">
            {t("title")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {/* Certificate Card Render with Print/Download */}
        {activeCert && (
          <CertificateCard
            id={activeCert.id}
            studentName={activeCert.studentName}
            courseTitle={activeCert.courseTitle}
            date={activeCert.date}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}
