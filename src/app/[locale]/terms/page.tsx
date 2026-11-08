import { setRequestLocale } from "next-intl/server";
import { FileText, ShieldAlert, Award, AlertCircle } from "lucide-react";

export default function TermsPage({
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-blue/30 bg-brand-blue/10 text-xs font-semibold text-brand-blue dark:text-brand-cyan">
              <FileText className="w-4 h-4" />
              <span>
                {locale === "ar"
                  ? "شروط الاستخدام والملكية الفكرية"
                  : "Terms of Use & Intellectual Property"}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {locale === "ar"
                ? "شروط الاستخدام لمنصة FATHY GEO CODE"
                : "Terms of Use — FATHY GEO CODE"}
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
                {locale === "ar"
                  ? "1. حقوق الملكية الفكرية"
                  : "1. Intellectual Property Rights"}
              </h2>
              <p>
                {locale === "ar"
                  ? "جميع المواد التدريبية، الفيديوهات المسجلة، ملفات التدريب (Shapefiles, DEMs)، النماذج، والشهادات الصادرة من منصة FATHY GEO CODE هي ملكية فكرية حصرية للمهندس أحمد فتحي. يُمنع منعاً باتاً تسجيل أو تنزيل أو إعادة بيع أو مشاركة مقاطع الفيديو على أي منصة أخرى."
                  : "All course curriculum, recorded video materials, spatial training datasets (Shapefiles, DEMs), models, and issued certificates are the exclusive intellectual property of Eng. Ahmed Fathy. Recording, redistributing, or reselling content is strictly prohibited."}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar"
                  ? "2. استخدام الحساب والأجهزة المسموحة"
                  : "2. Account Usage & Device Limitations"}
              </h2>
              <p>
                {locale === "ar"
                  ? "حسابك مخصص للاستخدام الشخصي الفردي فقط. تضع المنصة حداً أقصى للأجهزة المتزامنة (جهازان كحد أقصى). في حال اكتشاف مشاركة الحساب مع أطراف أخرى، تحتفظ إدارة المنصة بحق تجميد أو حظر الحساب دون استرداد الرسوم."
                  : "Your account is strictly for individual personal use. The platform enforces a concurrent session limit (maximum 2 devices). Detected account sharing or credential distribution will result in immediate suspension without refund."}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar"
                  ? "3. شهادات الإتمام والتحقق"
                  : "3. Completion Certificates & Verification"}
              </h2>
              <p>
                {locale === "ar"
                  ? "تُمنح شهادة إتمام الدورة عند إكمال 100% من الدروس واجتياز اختبار التقييم (إن وجد). كل شهادة تحمل كود توثيق فريداً ورابط تحقق إلكتروني رسمي. يحق للمنصة سحب أي شهادة تم الحصول عليها بوسائل غير نزيهة."
                  : "Certificates are granted upon 100% lesson completion and passing the course quiz (where applicable). Each certificate holds a unique verification code and QR link. The platform reserves the right to revoke fraudulently obtained credentials."}
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">
                {locale === "ar"
                  ? "4. سياسة التعديل وإنهاء الخدمة"
                  : "4. Modifications & Termination"}
              </h2>
              <p>
                {locale === "ar"
                  ? "تحتفظ إدارة المنصة بالحق في تحديث محتوى الدورات وتطوير المناهج باستمرار لضمان مواكبة أحدث إصدارات برمجيات Esri وتقنيات الاستشعار عن بعد."
                  : "We reserve the right to periodically update course curriculums and technical materials to ensure alignment with modern GIS software releases and industry standards."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
