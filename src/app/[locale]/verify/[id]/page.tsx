import { Link } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { SiteLogoImage } from "@/components/site-branding-provider";
import { createClient } from "@/lib/supabase/server";
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Award,
  ArrowRight,
  ArrowLeft,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificateVerificationPage({
  params: { locale, id },
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const supabase = createClient();
  const normalizedId = decodeURIComponent(id).trim();

  const { data: certRow } = await supabase
    .from("certificates")
    .select("id, student_name, course_title_ar, course_title_en, issued_at, revoked")
    .ilike("id", normalizedId)
    .maybeSingle();

  const isValid = Boolean(certRow && !certRow.revoked);

  const formattedIssuedDate = certRow?.issued_at
    ? new Intl.DateTimeFormat(numLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(certRow.issued_at))
    : "";

  return (
    <div className="min-h-[88vh] py-16 px-4 flex items-center justify-center bg-background dark:bg-brand-primary">
      <div className="max-w-xl w-full">
        {isValid && certRow ? (
          <div className="rounded-3xl surface-altura p-8 sm:p-10 border border-emerald-500/30 shadow-altura space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-border/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {isRtl ? "شهادة موثقة ومعتمدة" : "Official Verified Credential"}
                  </span>
                  <h1 className="text-xl font-heading font-extrabold text-foreground dark:text-cream font-mono">
                    {certRow.id}
                  </h1>
                </div>
              </div>

              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border/70 dark:border-white/10 bg-background dark:bg-[#030A11]">
                <SiteLogoImage alt="Logo" className="object-cover" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/50 dark:bg-[#030A11] border border-border/60 dark:border-white/5 space-y-1">
                <span className="text-xs text-muted-foreground dark:text-brand-muted">
                  {isRtl ? "مُنحت هذه الشهادة للمهندس / الطالب:" : "Granted to Learner:"}
                </span>
                <div className="text-lg font-heading font-extrabold text-foreground dark:text-cream">
                  {certRow.student_name}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/50 dark:bg-[#030A11] border border-border/60 dark:border-white/5 space-y-1">
                <span className="text-xs text-muted-foreground dark:text-brand-muted">
                  {isRtl ? "لإتمامه بنجاح الدورة التخصصية:" : "For Successful Completion of:"}
                </span>
                <div className="text-base font-heading font-bold text-brand-blue dark:text-brand-cyan">
                  {isRtl ? certRow.course_title_ar : certRow.course_title_en}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-[#030A11]/60 border border-border/60 dark:border-white/5">
                  <span className="text-muted-foreground dark:text-brand-muted block mb-1">
                    {isRtl ? "تاريخ الإصدار:" : "Issued Date:"}
                  </span>
                  <span className="font-semibold text-foreground dark:text-cream flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-brand-blue dark:text-brand-cyan" />
                    <span>{formattedIssuedDate}</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-[#030A11]/60 border border-border/60 dark:border-white/5">
                  <span className="text-muted-foreground dark:text-brand-muted block mb-1">
                    {isRtl ? "توقيع المحاضر:" : "Instructor Signature:"}
                  </span>
                  <span className="font-semibold text-foreground dark:text-cream flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>{isRtl ? "م. أحمد فتحي" : "Eng. Ahmed Fathy"}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground dark:text-brand-muted">
              <span>FATHY GEO CODE — GIS &amp; Remote Sensing Hub</span>
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>VALID RECORD</span>
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/courses"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-muted/70 border border-brand-blue/30 text-foreground hover:bg-brand-blue hover:text-white dark:bg-[#030A11] dark:border-brand-cyan/30 dark:text-cream dark:hover:bg-brand-cyan dark:hover:text-brand-primary transition-all"
              >
                <span>{isRtl ? "استكشف كافة الدورات" : "Browse All Courses"}</span>
                <Arrow className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl surface-altura p-8 sm:p-10 border border-destructive/30 shadow-altura text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-red-600 dark:text-red-400 border border-destructive/30 flex items-center justify-center">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground dark:text-cream">
              {certRow?.revoked
                ? isRtl
                  ? "هذه الشهادة ملغاة"
                  : "Certificate Revoked"
                : isRtl
                ? "لم يتم العثور على الشهادة"
                : "Certificate Not Found"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground dark:text-brand-muted">
              {isRtl
                ? `الرقم "${normalizedId}" غير مسجل في سجلات المنصة الرسمية أو تم إلغاؤه.`
                : `Credential "${normalizedId}" is not found in our verification database or was revoked.`}
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 dark:text-brand-primary dark:bg-brand-cyan dark:hover:bg-cyan-300 shadow-cyan-glow"
            >
              {isRtl ? "البحث برقم آخر" : "Try Another ID"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
