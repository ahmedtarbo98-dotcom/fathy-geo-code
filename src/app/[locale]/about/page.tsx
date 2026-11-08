"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  GraduationCap,
  MapPin,
  Sparkles,
  PhoneCall,
  ExternalLink,
  Layers,
  Satellite,
  Compass,
  Code2,
  Workflow,
  CheckCircle2,
  Briefcase,
  Youtube,
  Send,
  Linkedin,
  Facebook,
} from "lucide-react";

export default function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("AboutPage");
  const tBrand = useTranslations("Brand");
  const isRtl = locale === "ar";

  const skills = [
    {
      name: "ArcGIS Pro 3.x",
      desc_ar: "التحليلات المكانية، الطوبولوجيا، والإخراج الكارتوغرافي عالي الدقة",
      desc_en: "Advanced spatial analysis, topology, and publication cartography",
      icon: Layers,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    },
    {
      name: "Google Earth Engine (GEE)",
      desc_ar: "معالجة البيانات الضخمة سحابياً ومراقبة التغير البيئي بأكواد JS/Python",
      desc_en: "Planetary-scale big data analytics and change detection via JS/Python",
      icon: Code2,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
    },
    {
      name: "Remote Sensing & Satellite Imagery",
      desc_ar: "معالجة صور Landsat و Sentinel وحساب المؤشرات الطيفية NDVI و NDWI",
      desc_en: "Processing multispectral imagery, spectral indices and classification",
      icon: Satellite,
      color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
    },
    {
      name: "Spatial Modeling & ModelBuilder",
      desc_ar: "بناء نماذج الملاءمة المكانية Multi-Criteria Evaluation (MCE) ومصفوفات AHP",
      desc_en: "Building automated decision models via AHP matrices and ModelBuilder",
      icon: Workflow,
      color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/30",
    },
    {
      name: "Digital Surveying & Geomatics",
      desc_ar: "نظم الإسقاط، التحويل بين المساقط، ونمذجة الارتفاعات الرقمية DEM/DTM",
      desc_en: "Geodetic datums, projection conversions, and DEM/DTM elevation modeling",
      icon: Compass,
      color: "text-sky-400 bg-sky-400/10 border-sky-400/30",
    },
    {
      name: "Spatial Database (Geodatabase)",
      desc_ar: "تصميم وإدارة قواعد البيانات الجغرافية المؤسسية وحمايتها",
      desc_en: "Enterprise File Geodatabase schema design and integrity maintenance",
      icon: GraduationCap,
      color: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    },
  ];

  const milestones = [
    {
      title_ar: "محلل بيانات مكانية ومؤسس FATHY GEO CODE",
      title_en: "Spatial Data Analyst & Founder of FATHY GEO CODE",
      org: "FATHY GEO CODE Educational Hub",
      period: "2023 - Present",
      desc_ar:
        "تقديم استشارات مكانية، تحليل ومعالجة البيانات الجغرافية لمشاريع التخطيط، وإنشاء محتوى تعليمي متخصص لمجتمع الجيوماتكس العربي والعالمي.",
      desc_en:
        "Providing spatial consultancy, satellite data processing for engineering projects, and leading professional GIS educational programs.",
    },
    {
      title_ar: "ليسانس آداب - برنامج الجيوماتكس ونظم المعلومات الجغرافية",
      title_en: "Bachelor of Arts - Geomatics & GIS Program",
      org: "Faculty of Arts, Geomatics & GIS",
      period: "Degree with Honors",
      desc_ar:
        "دراسة أكاديمية متعمقة في نظم المعلومات الجغرافية، المساحة الهندسية، الاستشعار عن بعد، التحليل الإحصائي المكاني، وإدارة قواعد البيانات الجغرافية.",
      desc_en:
        "Rigorous academic training in GIS methodologies, engineering surveying, satellite photogrammetry, spatial statistics and database management.",
    },
  ];

  const whatsappProjectUrl =
    "https://wa.me/201060683463?text=" +
    encodeURIComponent(
      locale === "ar"
        ? "مرحباً م. أحمد فتحي، أود استشارتك أو التعاقد معك لتنفيذ مشروع مكاني / نظم معلومات جغرافية."
        : "Hello Eng. Ahmed Fathy, I would like to inquire about hiring you or executing a spatial GIS / Remote Sensing project."
    );

  return (
    <div className="relative min-h-screen py-12 md:py-20">
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        {/* Main Bio Card */}
        <div className="rounded-3xl glass-panel p-8 sm:p-12 border border-border/70 shadow-2xl shadow-brand-blue/10 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Photo / Avatar */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden p-1 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-2xl">
                <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-background">
                  <Image
                    src="/logo.jpg"
                    alt={tBrand("owner")}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Bio Content */}
            <div className="lg:col-span-8 space-y-5 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-xs font-semibold text-brand-navy dark:text-brand-cyan">
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{t("badge")}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                {t("title")}
              </h1>

              <div className="text-sm sm:text-base font-semibold text-brand-blue dark:text-cyan-400 flex items-center justify-center lg:justify-start gap-2">
                <Compass className="w-4 h-4" />
                <span>{t("subtitle")}</span>
              </div>

              <p className="text-base sm:text-lg text-foreground/90 font-medium leading-relaxed">
                {t("bioLead")}
              </p>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {t("bioDetails")}
              </p>

              {/* Hire WhatsApp CTA Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href={whatsappProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>{t("hireBtn")}</span>
                  <ExternalLink className="w-4 h-4 opacity-75" />
                </a>

                <div className="flex items-center gap-2">
                  <a
                    href="https://t.me/Fathy772"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border bg-card/60 hover:text-[#229ED9] hover:border-[#229ED9]/50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border bg-card/60 hover:text-red-600 hover:border-red-600/50 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/ahmed-fathy-57b168364"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border bg-card/60 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.facebook.com/share/1NiKuCvtnM/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl border border-border bg-card/60 hover:text-[#1877F2] hover:border-[#1877F2]/50 transition-colors"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Grid */}
        <div className="space-y-8 mb-16">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {t("skillsTitle")}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {locale === "ar"
                ? "أهم التقنيات والبرمجيات المستخدمة في تنفيذ المشاريع المكانية والتحليلات"
                : "Key technologies and frameworks applied across commercial spatial projects"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, sIdx) => {
              const Icon = skill.icon;
              const desc = locale === "ar" ? skill.desc_ar : skill.desc_en;

              return (
                <div
                  key={sIdx}
                  className="rounded-2xl glass-panel p-6 border border-border/70 space-y-3 hover:-translate-y-1 hover:border-brand-blue/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${skill.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">
                      {skill.name}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones / Education & Experience */}
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {t("credentialsTitle")}
            </h2>
          </div>

          <div className="space-y-6">
            {milestones.map((m, mIdx) => {
              const mTitle = locale === "ar" ? m.title_ar : m.title_en;
              const mDesc = locale === "ar" ? m.desc_ar : m.desc_en;

              return (
                <div
                  key={mIdx}
                  className="rounded-2xl glass-panel p-6 sm:p-7 border border-border/70 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="text-lg font-bold text-foreground">
                      {mTitle}
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-secondary text-brand-blue dark:text-brand-cyan self-start sm:self-auto">
                      {m.period}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {m.org}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                    {mDesc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
