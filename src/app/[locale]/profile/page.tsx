"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/client";
import { SiteLogoImage } from "@/components/site-branding-provider";
import {
  User,
  Award,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  ExternalLink,
} from "lucide-react";

interface CertRow {
  id: string;
  course_title_ar: string;
  course_title_en: string;
  issued_at: string;
}

export default function ProfilePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Profile");
  const tCert = useTranslations("Certificates");
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedLang, setSelectedLang] = useState(locale);
  const [certificates, setCertificates] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;
        setUserId(user.id);
        setEmail(user.email || "");

        const [{ data: profile }, { data: certs }] = await Promise.all([
          supabase
            .from("profiles")
            .select("full_name, language")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("certificates")
            .select("id, course_title_ar, course_title_en, issued_at")
            .eq("user_id", user.id)
            .eq("revoked", false)
            .order("issued_at", { ascending: false }),
        ]);

        setFullName(
          profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            ""
        );
        if (profile?.language) setSelectedLang(profile.language);
        setCertificates(certs || []);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [supabase]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setErrorMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), language: selectedLang })
      .eq("id", userId);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setProfileSaved(true);
    if (selectedLang !== locale) {
      router.replace(pathname, { locale: selectedLang });
    }
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newPassword || newPassword !== confirmPassword || newPassword.length < 6) {
      setErrorMsg(
        isRtl
          ? "تأكد من تطابق كلمتي المرور (6 أحرف على الأقل)."
          : "Passwords must match and be at least 6 characters."
      );
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setErrorMsg(error.message);
      return;
    }
    setPasswordSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 2500);
  };

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));

  return (
    <div className="min-h-screen py-10 md:py-16 relative bg-background dark:bg-brand-primary">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-4xl space-y-10">
        <div className="rounded-3xl surface-altura p-8 sm:p-10 border border-border/70 dark:border-white/10 shadow-altura space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-cyan-glow">
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background dark:bg-brand-primary">
                <SiteLogoImage alt="Avatar" className="object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-foreground dark:text-cream">
                {t("title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground dark:text-brand-muted">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl surface-altura p-6 sm:p-8 border border-border/70 dark:border-white/10 shadow-altura space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60 dark:border-white/10">
              <User className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <h2 className="font-heading font-bold text-base text-foreground dark:text-cream">{t("personalInfo")}</h2>
            </div>

            {profileSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("savedSuccess")}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-cream">{t("fullName")}</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-cream">{t("email")}</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border/60 dark:border-white/5 bg-muted/40 dark:bg-[#030A11]/50 text-sm text-muted-foreground/70 dark:text-brand-muted/60 cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-cream">{t("language")}</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                >
                  <option value="ar" className="bg-background dark:bg-[#030A11] text-foreground dark:text-cream">العربية (Arabic)</option>
                  <option value="en" className="bg-background dark:bg-[#030A11] text-foreground dark:text-cream">English (الإنجليزية)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !userId}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 dark:text-brand-primary dark:bg-brand-cyan dark:hover:bg-cyan-300 shadow-cyan-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {t("saveProfile")}
              </button>
            </form>
          </div>

          <div className="rounded-3xl surface-altura p-6 sm:p-8 border border-border/70 dark:border-white/10 shadow-altura space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/60 dark:border-white/10">
              <KeyRound className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <h2 className="font-heading font-bold text-base text-foreground dark:text-cream">{t("changePassword")}</h2>
            </div>

            {passwordSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("passwordUpdated")}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-cream">
                  {t("newPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground dark:text-cream">
                  {t("confirmNewPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !userId}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-foreground bg-muted/70 border border-brand-blue/30 hover:bg-brand-blue hover:text-white dark:text-cream dark:bg-[#030A11] dark:border-brand-cyan/30 dark:hover:bg-brand-cyan dark:hover:text-brand-primary transition-all disabled:opacity-50"
              >
                {t("updatePasswordBtn")}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl surface-altura p-6 sm:p-8 border border-border/70 dark:border-white/10 shadow-altura space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/60 dark:border-white/10">
            <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="font-heading font-bold text-base text-foreground dark:text-cream">{tCert("title")}</h2>
          </div>

          {certificates.length === 0 ? (
            <p className="text-xs text-muted-foreground dark:text-brand-muted py-4 text-center">
              {isRtl
                ? "لا توجد شهادات صادرة لحسابك بعد."
                : "No certificates issued to your account yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/70 dark:border-white/5 bg-muted/40 dark:bg-[#030A11] gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span className="font-mono text-xs font-bold text-brand-blue dark:text-brand-cyan">{cert.id}</span>
                    </div>
                    <h4 className="text-sm font-heading font-bold text-foreground dark:text-cream">
                      {isRtl ? cert.course_title_ar : cert.course_title_en}
                    </h4>
                    <div className="text-xs text-muted-foreground dark:text-brand-muted font-mono">
                      {tCert("issuedDate")} {fmtDate(cert.issued_at)}
                    </div>
                  </div>

                  <a
                    href={`/${locale}/verify/${cert.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm self-start sm:self-center"
                  >
                    <Award className="w-4 h-4" />
                    <span>{tCert("viewCertificate")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
