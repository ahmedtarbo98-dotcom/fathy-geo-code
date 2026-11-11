"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Mail, Trash2, CheckCircle2, Clock, Phone, MessageSquare, RefreshCw } from "lucide-react";

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminMessagesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations("Admin");
  const isRtl = locale === "ar";
  const numLocale = isRtl ? "ar-EG" : "en-US";
  const supabase = createClient();

  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRow | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  }, [supabase]);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/messages", { cache: "no-store", headers });
      const data = await res.json();
      if (res.ok && Array.isArray(data.messages)) {
        setMessages(data.messages);
        setSelectedMessage((prev) =>
          prev ? data.messages.find((m: ContactMessageRow) => m.id === prev.id) || data.messages[0] || null : data.messages[0] || null
        );
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const setReadState = async (msg: ContactMessageRow, nextRead: boolean) => {
    const headers = await getAuthHeaders();
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id: msg.id, is_read: nextRead }),
    });
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: nextRead } : m)));
    if (selectedMessage?.id === msg.id) {
      setSelectedMessage({ ...msg, is_read: nextRead });
    }
  };

  const deleteMessage = async (id: string) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/admin/messages?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers,
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
    if (selectedMessage?.id === id) setSelectedMessage(null);
  };

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(numLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t("messages")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "صندوق البريد الوارد ورسائل استفسارات المشاريع المكانية من نموذج التواصل"
              : "Live inquiries inbox submitted through the public contact form"}
          </p>
        </div>
        <button
          onClick={loadMessages}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{isRtl ? "تحديث" : "Refresh"}</span>
        </button>
      </div>

      {loading ? (
        <div className="h-48 rounded-2xl bg-muted/60 animate-pulse" />
      ) : messages.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 border border-dashed border-border/70 text-center space-y-2 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-bold text-foreground">
            {isRtl ? "صندوق الرسائل فارغ حالياً" : "No contact messages yet"}
          </p>
          <p className="text-xs">
            {isRtl
              ? "ستظهر هنا أي رسائل يرسلها الزوار أو العملاء عبر صفحة تواصل معنا."
              : "Messages submitted through the Contact page will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-2xl glass-panel border border-border/70 overflow-hidden divide-y divide-border/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => {
                  setSelectedMessage(msg);
                  if (!msg.is_read) setReadState(msg, true);
                }}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedMessage?.id === msg.id ? "bg-brand-cyan/10" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    {!msg.is_read && <span className="w-2 h-2 rounded-full bg-brand-cyan" />}
                    <span>{msg.name}</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {fmtDate(msg.created_at)}
                  </span>
                </div>
                <p className="text-xs font-semibold text-foreground/90 truncate">
                  {msg.subject || msg.message}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">{msg.email}</p>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7">
            {selectedMessage ? (
              <div className="rounded-2xl glass-panel p-6 border border-border/70 space-y-4">
                <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">
                      {selectedMessage.subject || (isRtl ? "رسالة تواصل" : "Contact Inquiry")}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedMessage.email}</span>
                      </span>
                      {selectedMessage.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedMessage.phone}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{fmtDate(selectedMessage.created_at)}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReadState(selectedMessage, !selectedMessage.is_read)}
                      className="p-2 rounded-xl border border-border hover:bg-muted text-emerald-500"
                      title={isRtl ? "تغيير حالة القراءة" : "Toggle read"}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 rounded-xl border border-border hover:bg-red-500/10 text-red-500"
                      title={isRtl ? "حذف" : "Delete"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl glass-panel p-10 text-center text-xs text-muted-foreground">
                {isRtl ? "اختر رسالة لعرض تفاصيلها" : "Select a message to view details"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
