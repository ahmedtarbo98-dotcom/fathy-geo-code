"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  MessageSquareQuote,
  Plus,
  Search,
  Star,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  EyeOff,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Video,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import TestimonialModal from "@/components/admin/testimonial-modal";
import {
  pickLocalizedField,
  type TestimonialCourseRef,
  type TestimonialRecord,
  type TestimonialStatus,
} from "@/lib/testimonials";

export default function AdminTestimonialsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [items, setItems] = useState<TestimonialRecord[]>([]);
  const [courses, setCourses] = useState<TestimonialCourseRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TestimonialStatus>("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestimonialRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TestimonialRecord | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  const notify = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const getHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const h: Record<string, string> = {};
    if (session?.access_token) h["Authorization"] = `Bearer ${session.access_token}`;
    setAuthHeaders(h);
    return h;
  }, [supabase]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/testimonials", {
        cache: "no-store",
        headers,
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`);
      setItems(json.testimonials || []);
      setCourses(json.courses || []);
    } catch (err: any) {
      notify("error", err?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [getHeaders, notify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    const total = items.length;
    const published = items.filter((i) => i.status === "published" || (!i.status && i.is_published)).length;
    const pending = items.filter((i) => i.status === "pending").length;
    const hidden = items.filter((i) => i.status === "hidden" || (!i.status && !i.is_published)).length;
    const featured = items.filter((i) => i.is_featured).length;
    return { total, published, pending, hidden, featured };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const effectiveStatus: TestimonialStatus =
        item.status || (item.is_published ? "published" : "hidden");
      if (statusFilter !== "all" && effectiveStatus !== statusFilter) return false;
      if (featuredOnly && !item.is_featured) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hay = [
          item.student_name_ar,
          item.student_name_en,
          item.student_title_ar,
          item.student_title_en,
          item.content_ar,
          item.content_en,
          item.course?.title_ar,
          item.course?.title_en,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, featuredOnly, searchQuery]);

  const handleStatusChange = async (id: string, status: TestimonialStatus) => {
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "set_status", id, status }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Update failed");
      await loadData();
      notify(
        "success",
        isRtl ? "تم تحديث حالة التقييم بنجاح" : "Review status updated"
      );
    } catch (err: any) {
      notify("error", err?.message || "Failed to update status");
    } finally {
      setBusy(false);
    }
  };

  const handleToggleFeatured = async (item: TestimonialRecord) => {
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          action: "toggle_feature",
          id: item.id,
          value: !item.is_featured,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Update failed");
      await loadData();
      notify(
        "success",
        !item.is_featured
          ? isRtl
            ? "تم تمييز التقييم"
            : "Review marked as featured"
          : isRtl
          ? "تم إلغاء التمييز"
          : "Removed from featured"
      );
    } catch (err: any) {
      notify("error", err?.message || "Failed to toggle feature");
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= filteredItems.length) return;

    const currentItem = filteredItems[index];
    const swapItem = filteredItems[targetIdx];

    const newOrderA = swapItem.order_index ?? targetIdx;
    const newOrderB = currentItem.order_index ?? index;
    // Ensure distinct values if equal
    const finalA = newOrderA === newOrderB ? targetIdx : newOrderA;
    const finalB = newOrderA === newOrderB ? index : newOrderB;

    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          action: "reorder",
          items: [
            { id: currentItem.id, order_index: finalA },
            { id: swapItem.id, order_index: finalB },
          ],
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Reorder failed");
      await loadData();
    } catch (err: any) {
      notify("error", err?.message || "Reorder failed");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch(
        `/api/admin/testimonials?id=${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
          headers,
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Delete failed");
      setDeleteTarget(null);
      await loadData();
      notify("success", isRtl ? "تم حذف التقييم بنجاح" : "Review deleted");
    } catch (err: any) {
      notify("error", err?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const statusBadge = (status: TestimonialStatus) => {
    if (status === "published") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          {isRtl ? "منشور" : "Published"}
        </span>
      );
    }
    if (status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <Clock className="w-3 h-3" />
          {isRtl ? "قيد المراجعة" : "Pending"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
        <EyeOff className="w-3 h-3" />
        {isRtl ? "مخفي" : "Hidden"}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 end-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
            toast.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 backdrop-blur-md"
              : "bg-red-500/15 border-red-500/30 text-red-500 backdrop-blur-md"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-blue/15 text-brand-blue flex items-center justify-center border border-brand-blue/25">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
              {isRtl ? "إدارة آراء المتدربين" : "Trainees Reviews Management"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRtl
                ? "مراجعة ونشر وتعديل آراء الطلاب والمهندسين والتمييز والترتيب"
                : "Review, publish, edit, feature, and order student testimonials"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isRtl ? "تحديث" : "Refresh"}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? "إضافة تقييم جديد" : "Add New Review"}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: isRtl ? "الإجمالي" : "Total", value: stats.total, color: "text-foreground" },
          { label: isRtl ? "منشور" : "Published", value: stats.published, color: "text-emerald-500" },
          { label: isRtl ? "قيد المراجعة" : "Pending", value: stats.pending, color: "text-amber-500" },
          { label: isRtl ? "مخفي" : "Hidden", value: stats.hidden, color: "text-muted-foreground" },
          { label: isRtl ? "مميز" : "Featured", value: stats.featured, color: "text-brand-cyan" },
        ].map((st, idx) => (
          <div
            key={idx}
            className="rounded-2xl glass-panel p-4 border border-border/70 flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-muted-foreground">
              {st.label}
            </span>
            <span className={`text-2xl font-extrabold mt-1 ${st.color}`}>
              {st.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl glass-panel p-4 border border-border/70 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isRtl
                ? "ابحث بالاسم، التخصص، نص التقييم، أو الكورس..."
                : "Search by name, title, review text, or course..."
            }
            className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(["all", "pending", "published", "hidden"] as const).map((st) => {
            const labels: Record<string, string> = {
              all: isRtl ? "الكل" : "All",
              pending: isRtl ? "قيد المراجعة" : "Pending",
              published: isRtl ? "منشور" : "Published",
              hidden: isRtl ? "مخفي" : "Hidden",
            };
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === st
                    ? "bg-brand-blue text-white border-brand-blue"
                    : "bg-background text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {labels[st]}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setFeaturedOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              featuredOnly
                ? "bg-amber-500/15 text-amber-500 border-amber-500/40"
                : "bg-background text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRtl ? "المميزة فقط" : "Featured Only"}</span>
          </button>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="rounded-2xl glass-panel p-12 text-center border border-border/70">
          <RefreshCw className="w-7 h-7 text-brand-blue animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted-foreground font-semibold">
            {isRtl ? "جاري تحميل آراء المتدربين..." : "Loading reviews..."}
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl glass-panel p-12 text-center border border-border/70 space-y-3">
          <MessageSquareQuote className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-bold text-foreground">
            {isRtl ? "لا توجد تقييمات مطابقة" : "No reviews found"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRtl
              ? "يمكنك إضافة تقييم جديد أو تعديل خيارات التصفية."
              : "Try adding a new review or adjusting your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const name = pickLocalizedField(
              item.student_name_ar,
              item.student_name_en,
              locale
            );
            const title = pickLocalizedField(
              item.student_title_ar,
              item.student_title_en,
              locale
            );
            const content = pickLocalizedField(item.content_ar, item.content_en, locale);
            const effectiveStatus: TestimonialStatus =
              item.status || (item.is_published ? "published" : "hidden");
            const courseTitle = item.course
              ? pickLocalizedField(item.course.title_ar, item.course.title_en, locale)
              : isRtl
              ? "المنصة بشكل عام"
              : "General Platform";

            return (
              <div
                key={item.id}
                className="rounded-2xl glass-panel p-4 sm:p-5 border border-border/70 hover:border-brand-cyan/40 transition-all flex flex-col lg:flex-row lg:items-center gap-4"
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {item.avatar_url ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
                      <Image
                        src={item.avatar_url}
                        alt={name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-navy to-brand-blue text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-sm text-foreground">{name}</h3>
                      {statusBadge(effectiveStatus)}
                      {item.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <Sparkles className="w-3 h-3" />
                          {isRtl ? "مميز" : "Featured"}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(item.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    {title && (
                      <p className="text-xs text-muted-foreground font-medium">{title}</p>
                    )}

                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed line-clamp-2">
                      &ldquo;{content}&rdquo;
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1 text-brand-cyan font-semibold">
                        <BookOpen className="w-3.5 h-3.5" />
                        {courseTitle}
                      </span>
                      {item.media_type === "image" && item.media_url && (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                          {isRtl ? "مرفق صورة" : "Image attached"}
                        </span>
                      )}
                      {item.media_type === "video" && item.media_url && (
                        <span className="inline-flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-red-500" />
                          {isRtl ? "مرفق فيديو" : "Video attached"}
                        </span>
                      )}
                      <span>
                        {isRtl ? `الترتيب: ${item.order_index ?? 0}` : `Order: ${item.order_index ?? 0}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/50">
                  {/* Reorder */}
                  <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1">
                    <button
                      type="button"
                      disabled={busy || idx === 0}
                      onClick={() => handleMove(idx, -1)}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                      title={isRtl ? "تحريك لأعلى" : "Move up"}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={busy || idx === filteredItems.length - 1}
                      onClick={() => handleMove(idx, 1)}
                      className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
                      title={isRtl ? "تحريك لأسفل" : "Move down"}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Status Selector */}
                  <select
                    disabled={busy}
                    value={effectiveStatus}
                    onChange={(e) =>
                      handleStatusChange(item.id, e.target.value as TestimonialStatus)
                    }
                    className="px-2.5 py-2 rounded-xl bg-background border border-border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-cyan/40"
                  >
                    <option value="published">{isRtl ? "منشور" : "Published"}</option>
                    <option value="pending">{isRtl ? "قيد المراجعة" : "Pending"}</option>
                    <option value="hidden">{isRtl ? "مخفي" : "Hidden"}</option>
                  </select>

                  {/* Feature Toggle */}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleToggleFeatured(item)}
                    className={`p-2 rounded-xl border transition-colors ${
                      item.is_featured
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-500"
                        : "bg-background border-border text-muted-foreground hover:text-amber-500"
                    }`}
                    title={isRtl ? "تمييز / إلغاء التمييز" : "Toggle Featured"}
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setModalOpen(true);
                    }}
                    className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors"
                    title={isRtl ? "تعديل" : "Edit"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                    title={isRtl ? "حذف" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TestimonialModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          loadData();
          notify(
            "success",
            editingItem
              ? isRtl
                ? "تم تحديث التقييم بنجاح"
                : "Review updated successfully"
              : isRtl
              ? "تمت إضافة التقييم بنجاح"
              : "Review created successfully"
          );
        }}
        testimonial={editingItem}
        courses={courses}
        locale={locale}
        authHeaders={authHeaders}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-3xl glass-panel bg-card border border-red-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-foreground">
              {isRtl ? "تأكيد حذف التقييم" : "Confirm Delete Review"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRtl
                ? `هل أنت متأكد من حذف تقييم "${pickLocalizedField(
                    deleteTarget.student_name_ar,
                    deleteTarget.student_name_en,
                    locale
                  )}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete the review by "${pickLocalizedField(
                    deleteTarget.student_name_ar,
                    deleteTarget.student_name_en,
                    locale
                  )}"? This action cannot be undone.`}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold disabled:opacity-60"
              >
                {isRtl ? "نعم، احذف التقييم" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
