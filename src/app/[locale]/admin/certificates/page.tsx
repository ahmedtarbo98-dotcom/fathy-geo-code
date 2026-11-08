"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Award,
  ShieldCheck,
  Ban,
  RotateCcw,
  Search,
  ExternalLink,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function AdminCertificatesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");

  const [certificates, setCertificates] = useState([
    {
      id: "FGC-2026-ARCGIS",
      studentName: "م. كريم عبد الرحمن",
      email: "kareem@example.com",
      course: "أساسيات وتطبيقات ArcGIS Pro من البداية للاحتراف",
      issuedAt: "15 أكتوبر 2026",
      isRevoked: false,
    },
    {
      id: "FGC-2026-TRICKS",
      studentName: "د. هبة الشامي",
      email: "heba@example.com",
      course: "أسرار وحيل FATHY GEO CODE في الجيوماتكس",
      issuedAt: "28 أكتوبر 2026",
      isRevoked: false,
    },
    {
      id: "FGC-2026-MODELING",
      studentName: "علي حسن",
      email: "ali@example.com",
      course: "النمذجة المكانية والملاءمة البيئية المتقدمة (MCE)",
      issuedAt: "02 نوفمبر 2026",
      isRevoked: true,
    },
  ]);

  const [search, setSearch] = useState("");
  const [signerName, setSignerName] = useState("Eng. Ahmed Fathy");
  const [signerTitle, setSignerTitle] = useState("Spatial Data Analyst");
  const [templateSaved, setTemplateSaved] = useState(false);

  const toggleRevoke = (id: string) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isRevoked: !c.isRevoked } : c))
    );
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  const filtered = certificates.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.studentName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("certificates")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "متابعة وإلغاء/إعادة تفعيل الشهادات الصادرة، وتعديل بيانات التوقيع الرسمي"
              : "List issued credentials, revoke or reissue, and customize signature settings"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Issued Certificates List (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="max-w-md relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث برقم الشهادة أو اسم الطالب..."
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border bg-card text-xs"
            />
          </div>

          <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs sm:text-sm">
                <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4 text-start">كود الشهادة</th>
                    <th className="p-4 text-start">الطالب والدورة</th>
                    <th className="p-4 text-start">تاريخ الإصدار</th>
                    <th className="p-4 text-start">الحالة</th>
                    <th className="p-4 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filtered.map((cert) => (
                    <tr key={cert.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-mono font-bold text-foreground">
                        {cert.id}
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-foreground">{cert.studentName}</div>
                        <div className="text-[11px] text-brand-blue dark:text-cyan-400">
                          {cert.course}
                        </div>
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        {cert.issuedAt}
                      </td>

                      <td className="p-4">
                        {cert.isRevoked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                            ملغاة (Revoked)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            سارية (Valid)
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/${locale}/verify/${cert.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                            title="Verify Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => toggleRevoke(cert.id)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              cert.isRevoked
                                ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            }`}
                            title={cert.isRevoked ? "Reissue" : "Revoke"}
                          >
                            {cert.isRevoked ? <RotateCcw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
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

        {/* Certificate Signature Settings (Col 4) */}
        <div className="lg:col-span-4">
          <div className="rounded-3xl glass-panel p-6 border border-border/70 shadow-lg space-y-4 bg-card">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>إعدادات التوقيع والاعتماد</span>
            </h3>

            {templateSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-xs text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم حفظ إعدادات قالب الشهادة بنجاح!</span>
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  اسم المعتمد الموقع على الشهادة
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  المسمى المهني للموقع
                </label>
                <input
                  type="text"
                  value={signerTitle}
                  onChange={(e) => setSignerTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                <div>الجهة المصدرة: FATHY GEO CODE</div>
                <div>الاعتماد: QR Code + Unique ID Verification</div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-sm transition-all"
              >
                {t("saveChanges")}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
