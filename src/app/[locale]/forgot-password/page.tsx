"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import HeroBackground from "@/components/hero-background";
import { SiteLogoImage } from "@/components/site-branding-provider";
import { resetPassword } from "@/lib/auth/actions";
import {
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ForgotPasswordPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Auth");
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPassword(email, locale);
      setSuccess(t("resetSentSuccess"));
    } catch (err: any) {
      setError(err?.message || "Failed to send reset link. Please check the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-12 overflow-hidden">
      {/* Animated Geospatial Canvas Background */}
      <HeroBackground />

      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-80 h-80 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="rounded-3xl glass-panel p-8 sm:p-10 shadow-2xl shadow-brand-blue/15 border border-border/70 backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="text-center space-y-3 mb-8">
            <Link href="/" className="inline-block group">
              <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-xl group-hover:scale-105 transition-transform duration-300">
                <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background">
                  <SiteLogoImage
                    alt="FATHY GEO CODE"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("forgotTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("forgotSubtitle")}
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-2.5 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {t("email")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className="w-full ps-10 pe-4 py-3 rounded-xl border border-border/80 bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-blue/20 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{loading ? t("loading") : t("sendResetLink")}</span>
              <Arrow className="w-4 h-4" />
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center text-xs">
            <Link
              href="/login"
              className="font-bold text-brand-blue dark:text-brand-cyan hover:underline inline-flex items-center gap-1.5"
            >
              <Arrow className="w-3.5 h-3.5 rotate-180" />
              <span>{t("backToLogin")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
