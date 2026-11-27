"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  PhoneCall,
  Send,
  User,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Youtube,
  Facebook,
  Linkedin,
} from "lucide-react";

export default function ContactPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("ContactPage");
  const tBrand = useTranslations("Brand");
  const isRtl = locale === "ar";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: name,
          email,
          phone,
          subject,
          message,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || (isRtl ? "فشل إرسال الرسالة، يرجى المحاولة لاحقاً" : "Failed to send message"));
      }

      setSuccess(true);
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || (isRtl ? "تعذر إرسال الرسالة، يمكنك التواصل مباشرة عبر واتساب" : "Failed to send message. Please try WhatsApp directly."));
    } finally {
      setLoading(false);
    }
  };

  const socialChannels = [
    {
      name: "WhatsApp",
      label: "+20 106 068 3463",
      href: "https://wa.me/201060683463",
      icon: PhoneCall,
      color: "hover:text-[#25D366] hover:border-[#25D366]/50 bg-[#25D366]/10 text-[#25D366]",
    },
    {
      name: "Telegram",
      label: "@Fathy772",
      href: "https://t.me/Fathy772",
      icon: Send,
      color: "hover:text-[#229ED9] hover:border-[#229ED9]/50 bg-[#229ED9]/10 text-[#229ED9]",
    },
    {
      name: "YouTube",
      label: "FATHY GEO CODE",
      href: "https://www.youtube.com/channel/UCBrwWaq6E8lg0xEmDCLmekw",
      icon: Youtube,
      color: "hover:text-[#FF0000] hover:border-[#FF0000]/50 bg-[#FF0000]/10 text-[#FF0000]",
    },
    {
      name: "LinkedIn",
      label: "Ahmed Fathy",
      href: "https://www.linkedin.com/in/ahmed-fathy-57b168364",
      icon: Linkedin,
      color: "hover:text-[#0A66C2] hover:border-[#0A66C2]/50 bg-[#0A66C2]/10 text-[#0A66C2]",
    },
    {
      name: "Facebook",
      label: "Ahmed Fathy",
      href: "https://www.facebook.com/share/1NiKuCvtnM/",
      icon: Facebook,
      color: "hover:text-[#1877F2] hover:border-[#1877F2]/50 bg-[#1877F2]/10 text-[#1877F2]",
    },
  ];

  return (
    <div className="relative min-h-screen py-12 md:py-20 bg-background dark:bg-brand-primary">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[450px] h-[450px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-14">
          <div className="badge-altura inline-flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-blue dark:bg-brand-cyan animate-pulse" />
            <span className="font-pixel text-[10px]">{t("badge")}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-heading font-extrabold tracking-tight text-foreground dark:text-cream">
            {t("title")}
          </h1>
          <p className="text-muted-foreground dark:text-brand-muted text-sm sm:text-base leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-5xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl surface-altura p-6 sm:p-10 border border-border/70 dark:border-white/10 shadow-altura">
              {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{t("successMessage")}</span>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground dark:text-cream">
                    {t("name")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground dark:text-brand-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground dark:text-cream">
                      {t("email")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground dark:text-brand-muted">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground dark:text-cream">
                      {t("phone")}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-muted-foreground dark:text-brand-muted">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+20 100 000 0000"
                        className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground dark:text-cream">
                    {t("subject")}
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t("subjectPlaceholder")}
                    className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60"
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground dark:text-cream">
                    {t("message")}
                  </label>
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t("messagePlaceholder")}
                      className="w-full p-3.5 rounded-xl border border-border dark:border-white/10 bg-muted/50 dark:bg-[#030A11] text-foreground dark:text-cream placeholder:text-muted-foreground/60 dark:placeholder:text-brand-muted/60 text-sm focus:outline-none focus:border-brand-blue dark:focus:border-brand-cyan/60 resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 dark:text-brand-primary dark:bg-brand-cyan dark:hover:bg-cyan-300 shadow-cyan-glow hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? "..." : t("submit")}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Social Channels & WhatsApp Box */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct WhatsApp Callout */}
            <div className="rounded-3xl surface-altura p-6 sm:p-7 border border-emerald-500/30 shadow-altura space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <PhoneCall className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground dark:text-cream">
                    {locale === "ar" ? "محادثة فورية عبر واتساب" : "Instant WhatsApp Support"}
                  </h3>
                  <p className="text-xs text-muted-foreground dark:text-brand-muted">
                    {locale === "ar" ? "لتنفيذ المشاريع المكانية والاستفسارات السريعة" : "For GIS projects and fast inquiries"}
                  </p>
                </div>
              </div>

              <a
                href="https://wa.me/201060683463"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{locale === "ar" ? "ابدأ المحادثة الآن" : "Chat on WhatsApp"}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Official Channels List */}
            <div className="rounded-3xl surface-altura p-6 sm:p-7 border border-border/70 dark:border-white/10 shadow-altura space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground dark:text-cream">
                {t("officialChannels")}
              </h3>

              <div className="space-y-2.5">
                {socialChannels.map((ch, idx) => {
                  const Icon = ch.icon;
                  return (
                    <a
                      key={idx}
                      href={ch.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-border/70 dark:border-white/5 bg-muted/40 dark:bg-[#030A11] hover:border-brand-blue/40 dark:hover:border-brand-cyan/40 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border ${ch.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground dark:text-cream">
                            {ch.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground dark:text-brand-muted">
                            {ch.label}
                          </div>
                        </div>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground dark:text-brand-muted group-hover:text-brand-blue dark:group-hover:text-brand-cyan transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
