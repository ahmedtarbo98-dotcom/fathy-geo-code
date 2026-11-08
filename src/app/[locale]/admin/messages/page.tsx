"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  Trash2,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Search,
} from "lucide-react";

export default function AdminMessagesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");

  const [messages, setMessages] = useState([
    {
      id: "msg-1",
      name: "م. حسام النجار",
      email: "hossam@example.com",
      phone: "+201022233344",
      subject: "طلب استشارة لتنفيذ مشروع دراسة هيدرولوجية ونمذجة DEM",
      message:
        "السلام عليكم م. أحمد، لدينا مشروع تخطيط عمران بمحافظة أسوان ونحتاج لتحليل نموذج الارتفاعات الرقمية DEM وحساب مجاري السيول وتحديد أحواض التصريف عبر ArcGIS Spatial Analyst. نود معرفة إمكانية تنفيذ المشروع والتكلفة والمدة الزمنية.",
      date: "08 نوفمبر 2026 - 02:15 م",
      isRead: false,
    },
    {
      id: "msg-2",
      name: "نادية عبد العزيز",
      email: "nadia@example.com",
      phone: "+201088899900",
      subject: "استفسار بخصوص موعد دورة Google Earth Engine",
      message:
        "مرحباً، أتابع شروحاتك الممتازة على يوتيوب، هل سيتم فتح ورشة عمل متقدمة في كتابة أكواد GEE بالبايثون قريباً؟ شكراً جزيلاً لجهودك.",
      date: "07 نوفمبر 2026 - 11:30 ص",
      isRead: true,
    },
    {
      id: "msg-3",
      name: "م. فادي خوري",
      email: "fadi@example.com",
      phone: "+962791234567",
      subject: "استفسار عن طريقة الدفع والتحويل من خارج مصر",
      message:
        "أهلاً م. أحمد، أود الاشتراك في دورة النمذجة المكانية MCE، ما هي الطرق المتاحة للتحويل الدولي؟",
      date: "06 نوفمبر 2026 - 08:45 م",
      isRead: true,
    },
  ]);

  const [selectedMessage, setSelectedMessage] = useState<any>(messages[0]);

  const toggleRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: !m.isRead } : m))
    );
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            {t("messages")}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "ar"
              ? "صندوق البريد الوارد ورسائل استفسارات المشاريع المكانية من نموذج التواصل"
              : "Inquiries inbox submitted through the public contact form"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Messages List (Col 5) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="rounded-2xl glass-panel border border-border/70 overflow-hidden divide-y divide-border/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.isRead) toggleRead(msg.id);
                }}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id
                    ? "bg-brand-blue/10 dark:bg-brand-cyan/10"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {!msg.isRead && (
                      <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0" />
                    )}
                    <span
                      className={`text-xs font-bold text-foreground line-clamp-1 ${
                        !msg.isRead ? "font-extrabold" : ""
                      }`}
                    >
                      {msg.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {msg.date.split("-")[0]}
                  </span>
                </div>

                <div className="text-xs font-semibold text-foreground/90 line-clamp-1">
                  {msg.subject}
                </div>

                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-1">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail Viewer (Col 7) */}
        <div className="lg:col-span-7">
          {selectedMessage ? (
            <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-border/70 shadow-lg space-y-6 bg-card">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/50">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-foreground">
                    {selectedMessage.subject}
                  </h3>
                  <div className="text-xs text-muted-foreground flex items-center gap-3">
                    <span>
                      {locale === "ar" ? "من:" : "From:"} {selectedMessage.name}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{selectedMessage.email}</span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {selectedMessage.phone}
                  </div>
                </div>

                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Message Body */}
              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-line p-4 rounded-2xl bg-muted/30 border border-border/40">
                {selectedMessage.message}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href={`mailto:${selectedMessage.email}?subject=رد: ${encodeURIComponent(
                    selectedMessage.subject
                  )}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-sm"
                >
                  الرد عبر البريد الإلكتروني
                </a>

                {selectedMessage.phone && (
                  <a
                    href={`https://wa.me/${selectedMessage.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm"
                  >
                    محادثة عبر واتساب
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl glass-panel p-12 text-center text-muted-foreground border border-border/70">
              اختر رسالة من القائمة لعرض تفاصيلها
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
