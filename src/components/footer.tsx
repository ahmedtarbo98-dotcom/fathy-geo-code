import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { SiteLogoImage } from "./site-branding-provider";
import {
  Send,
  Youtube,
  Facebook,
  Linkedin,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function Footer({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations("Footer");
  const tBrand = useTranslations("Brand");
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Telegram",
      href: "https://t.me/Fathy772",
      icon: Send,
      color: "hover:text-[#229ED9] hover:border-[#229ED9]/50",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
      icon: Youtube,
      color: "hover:text-[#FF0000] hover:border-[#FF0000]/50",
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/share/1NiKuCvtnM/",
      icon: Facebook,
      color: "hover:text-[#1877F2] hover:border-[#1877F2]/50",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/ahmed-fathy-57b168364",
      icon: Linkedin,
      color: "hover:text-[#0A66C2] hover:border-[#0A66C2]/50",
    },
    {
      name: "WhatsApp",
      href: "https://wa.me/201060683463",
      icon: PhoneCall,
      color: "hover:text-[#25D366] hover:border-[#25D366]/50",
    },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-background via-muted/30 to-brand-navy/10 dark:to-brand-navy/30 border-t border-border/50 overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute inset-0 pointer-events-none topographic-lines opacity-40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md">
                <div className="relative w-full h-full rounded-[10px] overflow-hidden bg-background">
                  <SiteLogoImage
                    alt="FATHY GEO CODE"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-foreground">
                  {tBrand("name")}
                </span>
                <span className="text-xs text-brand-cyan font-medium">
                  {tBrand("tagline")}
                </span>
              </div>
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {t("description")}
            </p>

            <div className="pt-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{currentLocale === "ar" ? "قنوات التواصل والمتابعة" : "Official Channels"}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={item.name}
                      aria-label={item.name}
                      className={`w-9 h-9 rounded-lg border border-border/70 bg-card/60 flex items-center justify-center text-muted-foreground transition-all duration-300 hover:scale-110 active:scale-95 shadow-sm ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/courses"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan inline-flex items-center gap-1.5"
                >
                  <span>{t("courses")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/projects"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan inline-flex items-center gap-1.5"
                >
                  <span>{t("projects")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan inline-flex items-center gap-1.5"
                >
                  <span>{t("about")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan inline-flex items-center gap-1.5"
                >
                  <span>{t("contact")}</span>
                </Link>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan inline-flex items-center gap-1.5"
                >
                  <span>YouTube Channel</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>

          {/* Training Specializations */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
              {currentLocale === "ar" ? "المسارات التعليمية" : "Specializations"}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>ArcGIS Pro & Spatial Analyst</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Google Earth Engine (GEE)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Remote Sensing & Satellite Imagery</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Spatial Modeling & MCE</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Digital Elevation Models (DEM)</span>
              </li>
            </ul>
          </div>

          {/* Verification & Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground tracking-wide flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {t("legal")}
            </h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/verify"
                  className="transition-colors text-brand-blue dark:text-brand-cyan font-medium inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{t("verifyCertificate")}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-brand-blue dark:hover:text-brand-cyan"
                >
                  {t("terms")}
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="https://wa.me/201060683463"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{currentLocale === "ar" ? "طلب استشارة أو مشروع" : "Request Project / Hire"}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>{t("copyright", { year: currentYear })}</p>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-brand-cyan" />
            <span>
              {tBrand("owner")} — {tBrand("ownerTitle")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
