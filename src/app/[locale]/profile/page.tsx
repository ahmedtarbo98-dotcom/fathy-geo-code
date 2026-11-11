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
    <div className="min-h-screen py-10 md:py-16 relative">
      <div className="container relative mx-auto px-4 sm:px-6 max-w-4xl space-y-10">
        <div className="rounded-3xl glass-panel p-8 sm:p-10 border border-border/70 shadow-xl space-y-3">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-brand-navy via-brand-blue to-brand-cyan shadow-md">
              <div className="relative w-full h-full rounded-[14px] overflow-hidden bg-background">
                <SiteLogoImage alt="Avatar" className="object-cover" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                {t("title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-500">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
              <User className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <h2 className="font-bold text-base text-foreground">{t("personalInfo")}</h2>
            </div>

            {profileSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("savedSuccess")}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t("fullName")}</label>
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t("email")}</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/50 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{t("language")}</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English (الإنجليزية)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !userId}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-navy via-brand-blue to-brand-cyan shadow-md hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {t("saveProfile")}
              </button>
            </form>
          </div>

          <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
              <KeyRound className="w-5 h-5 text-brand-blue dark:text-brand-cyan" />
              <h2 className="font-bold text-base text-foreground">{t("changePassword")}</h2>
            </div>

            {passwordSaved && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("passwordUpdated")}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t("newPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {t("confirmNewPassword")}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !userId}
                className="w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-foreground bg-secondary hover:bg-muted border border-border transition-all disabled:opacity-50"
              >
                {t("updatePasswordBtn")}
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="font-bold text-base text-foreground">{tCert("title")}</h2>
          </div>

          {certificates.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {isRtl
                ? "لا توجد شهادات صادرة لحسابك بعد."
                : "No certificates issued to your account yet."}
            </p>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border bg-card/60 gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="font-mono text-xs font-bold text-foreground">{cert.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">
                      {isRtl ? cert.course_title_ar : cert.course_title_en}
                    </h4>
                    <div className="text-xs text-muted-foreground">
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
