"use client";

import { useTranslations } from "next-intl";
import { Star, Quote, CheckCircle2, Sparkles } from "lucide-react";

export default function TestimonialsSection({
  currentLocale,
}: {
  currentLocale: string;
}) {
  const t = useTranslations("Testimonials");

  const testimonials = [
    {
      name_ar: "م. كريم عبد الرحمن",
      name_en: "Eng. Kareem Abdelrahman",
      role_ar: "مهندس تخطيط ومساحة",
      role_en: "Surveying & Urban Planning Engineer",
      text_ar:
        "شرح المهندس أحمد فتحي في ArcGIS Pro عملي جداً ومباشر. تعلمت كيفية بناء نموذج ملاءمة مكانية وفر عليّ أسابيع من التخبط في مشروعي الهندسي.",
      text_en:
        "Eng. Ahmed Fathy's ArcGIS Pro tutorials are exceptionally practical. The spatial suitability modeling workflow saved me weeks on my engineering master's project.",
      rating: 5,
    },
    {
      name_ar: "د. هبة الشامي",
      name_en: "Dr. Heba El-Shamy",
      role_ar: "باحثة استشعار عن بعد وبيئة",
      role_en: "Environmental Remote Sensing Researcher",
      text_ar:
        "أفضل مصدر عربي لتعلم معالجة الصور الفضائية وGoogle Earth Engine. الدقة العلمية والتطبيقات الواقعية جعلت الفهم أسهل بكثير.",
      text_en:
        "The best bilingual source for satellite image analysis and GEE. The scientific accuracy and hands-on case studies made complex algorithms easy to implement.",
      rating: 5,
    },
    {
      name_ar: "م. محمد السعيد",
      name_en: "Eng. Mohamed El-Saeed",
      role_ar: "أخصائي نظم معلومات جغرافية",
      role_en: "GIS Specialist",
      text_ar:
        "طريقة حل المشكلات الكارتوغرافية والجيوديسية فريدة جداً. أسلوب متميز وشهادات إتمام الدورة كانت إضافة قوية لسيرتي الذاتية.",
      text_en:
        "His methods for geodetic problem-solving and map automation are top-tier. The verified certificate added serious credibility to my professional portfolio.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
            <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
            <span>{t("badge")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => {
            const name = currentLocale === "ar" ? item.name_ar : item.name_en;
            const role = currentLocale === "ar" ? item.role_ar : item.role_en;
            const text = currentLocale === "ar" ? item.text_ar : item.text_en;

            return (
              <div
                key={idx}
                className="relative rounded-2xl glass-panel p-7 border border-border/70 flex flex-col justify-between space-y-6 hover:border-brand-blue/40 hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-brand-cyan/20 rotate-180" />
                  </div>

                  <p className="text-sm text-foreground/90 leading-relaxed italic">
                    "{text}"
                  </p>
                </div>

                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{name}</h4>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{currentLocale === "ar" ? "متدرب موثق" : "Verified"}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
