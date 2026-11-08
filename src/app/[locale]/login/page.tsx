"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import HeroBackground from "@/components/hero-background";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/actions";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Auth");
  const tBrand = useTranslations("Brand");
  const router = useRouter();
  const isRtl = locale === "ar";
  const Arrow = isRtl ? ArrowLeft : ArrowRight;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      setSuccess(t("loginSuccess"));
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle(locale);
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 py-12 overflow-hidden">
      {/* Animated Geospatial Canvas Background */}
      <HeroBackground />

      {/* Decorative ambient glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 w-80 h-80 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="relative w-full max-w-md z-10">
        <div className="rounded-3xl glass-panel p-8 sm:p-10 shadow-2xl shadow-brand-blue/15 border border-border/70 backdrop-blur-2xl">
          {/* Logo & Header */}
          <div className="text-center space-y-3 mb-8">
            <Link href="/" className="inline-block group">
              <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-xl group-hover:scale-105 transition-transform duration-300">
                <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background">
                  <Image
                    src="/logo.jpg"
                    alt="FATHY GEO CODE"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("loginTitle")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("loginSubtitle")}
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
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {/* Email Field */}
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

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  {t("password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand-blue dark:text-brand-cyan hover:underline"
                >
                  {t("forgotPasswordLink")}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full ps-10 pe-11 py-3 rounded-xl border border-border/80 bg-background/60 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3.5 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg shadow-brand-blue/20 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <GraduationCap className="w-4 h-4" />
              <span>{loading ? t("loading") : t("signInButton")}</span>
              <Arrow className="w-4 h-4" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-card/70 hover:bg-muted text-sm font-semibold text-foreground transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? t("loading") : t("googleSignIn")}</span>
          </button>

          {/* Switch to Register */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            <span>{t("noAccount")} </span>
            <Link
              href="/register"
              className="font-bold text-brand-blue dark:text-brand-cyan hover:underline"
            >
              {t("registerNow")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
