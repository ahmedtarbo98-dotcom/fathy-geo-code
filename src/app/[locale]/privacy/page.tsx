import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div className="min-h-screen py-12 md:py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="rounded-3xl glass-panel p-8 sm:p-12 border border-border/70 space-y-8">
          <div className="space-y-3 pb-6 border-b border-border/50">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {locale === "ar"
                  ? "سياسة الخصوصية وحماية البيانات"
                  : "Privacy & Data Protection Policy"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {locale === "ar"
                ? "سياسة الخصوصية لمنصة FATHY GEO CODE"
                : "FATHY GEO CODE Privacy Policy"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "آخر تحديث: نوفمبر 2026"
                : "Last Updated: November 2026"}
            </p>
          </div>

          <div className="space-y-6 text-sm text-foreground/80 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar" ? "1. مقدمة والتزام" : "1. Introduction & Commitment"}
              </h2>
              <p>
                {locale === "ar"
                  ? "تلتزم منصة FATHY GEO CODE بحماية خصوصية بيانات الطلاب والمتدربين والزوار. توضح هذه السياسة كيفية جمع واستخدام وتأمين بياناتك عند تصفح المنصة أو الاشتراك في دورات نظم المعلومات الجغرافية والاستشعار عن بعد."
                  : "FATHY GEO CODE is committed to protecting the privacy of our students, trainees, and visitors. This policy outlines how your data is collected, utilized, and safeguarded across our learning platform."}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar" ? "2. البيانات التي نجمعها" : "2. Information We Collect"}
              </h2>
              <ul className="list-disc list-inside space-y-1 ps-2">
                <li>
                  {locale === "ar"
                    ? "معلومات الحساب: الاسم الكامل، عنوان البريد الإلكتروني، ورقم الهاتف عند التسجيل أو طلب دورة مدفوعة."
                    : "Account information: Full name, email address, and phone number when registering or requesting course access."}
                </li>
                <li>
                  {locale === "ar"
                    ? "بيانات التقدم الدراسي: الدروس المكتملة، درجات الاختبارات، وسجلات إصدار الشهادات المعتمدة."
                    : "Learning progress: Completed lessons, quiz scores, and issued verification certificates."}
                </li>
                <li>
                  {locale === "ar"
                    ? "سجلات الأمان: يتم تسجيل عنوان IP ونوع المتصفح لضمان عدم مشاركة الحسابات وحماية الملكية الفكرية لمواد الفيديو."
                    : "Security logs: IP address and browser type logged to prevent unauthorized account sharing and protect video intellectual property."}
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar" ? "3. حماية الفيديوهات والعلامة المائية" : "3. Video Protection & Watermarks"}
              </h2>
              <p>
                {locale === "ar"
                  ? "لحماية المحتوى التعليمي، تظهر علامة مائية ديناميكية شبه شفافة تحمل معرف الطالب والبريد الإلكتروني أثناء تشغيل الدروس المدفوعة، لمنع التسجيل أو إعادة النشر غير المصرح به."
                  : "To safeguard proprietary training materials, a dynamic semi-transparent watermark containing student identifiers is displayed during protected course playback to prevent unauthorized distribution."}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar" ? "4. مشاركة البيانات مع أطراف ثالثة" : "4. Third-Party Sharing"}
              </h2>
              <p>
                {locale === "ar"
                  ? "نحن لا نبيع ولا نؤجر بياناتك الشخصية لأي طرف ثالث. تتم معالجة البيانات فقط لخدمات المنصة الأساسية (مثل Supabase لقواعد البيانات وخدمات المصادقة)."
                  : "We do not sell or rent personal information to third parties. Data is processed strictly for core platform operations (such as Supabase for database and authentication)."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
