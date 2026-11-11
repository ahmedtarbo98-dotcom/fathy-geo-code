"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/routing";
import {
  Briefcase,
  Plus,
  Search,
  Edit3,
  Trash2,
  Copy,
  Star,
  Globe,
  EyeOff,
  GripVertical,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  PROJECT_CATEGORIES,
  getCategoryLabel,
  pickLocalized,
  type ProjectRecord,
} from "@/lib/projects";
import ProjectEditorModal from "@/components/admin/project-editor-modal";

export default function AdminProjectsPage() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const supabase = createClient();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);
  const [busy, setBusy] = useState(false);

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

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/projects", { cache: "no-store", headers });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setProjects(data.projects || []);
    } catch (err: any) {
      notify("error", err?.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [getHeaders, notify]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleToggle = async (
    project: ProjectRecord,
    action: "toggle_publish" | "toggle_feature"
  ) => {
    const nextVal =
      action === "toggle_publish" ? !project.is_published : !project.is_featured;
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action, id: project.id, value: nextVal }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Update failed");
      await loadProjects();
      notify(
        "success",
        action === "toggle_publish"
          ? nextVal
            ? isRtl
              ? "تم نشر المشروع"
              : "Project published"
            : isRtl
            ? "تم تحويل المشروع إلى مسودة"
            : "Project unpublished"
          : nextVal
          ? isRtl
            ? "تم تمييز المشروع في الرئيسية"
            : "Project featured on Home"
          : isRtl
          ? "تم إلغاء تمييز المشروع"
          : "Removed from featured"
      );
    } catch (err: any) {
      notify("error", err?.message || "Toggle error");
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (project: ProjectRecord) => {
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "duplicate", sourceId: project.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Duplicate failed");
      await loadProjects();
      notify("success", isRtl ? "تم نسخ المشروع كمسودة" : "Project duplicated as draft");
    } catch (err: any) {
      notify("error", err?.message || "Duplicate error");
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setBusy(true);
      const headers = await getHeaders();
      const res = await fetch(
        `/api/admin/projects?id=${encodeURIComponent(deleteTarget.id)}`,
        {
          method: "DELETE",
          headers,
        }
      );
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Delete failed");
      setDeleteTarget(null);
      await loadProjects();
      notify(
        "success",
        isRtl
          ? "تم حذف المشروع وجميع ملفاته من التخزين"
          : "Project and associated storage images deleted"
      );
    } catch (err: any) {
      notify("error", err?.message || "Delete error");
    } finally {
      setBusy(false);
    }
  };

  const handleDropReorder = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const fromIdx = projects.findIndex((p) => p.id === draggedId);
    const toIdx = projects.findIndex((p) => p.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...projects];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const items = reordered.map((p, idx) => ({ id: p.id, sort_order: idx }));

    setProjects(reordered.map((p, idx) => ({ ...p, sort_order: idx })));
    setDraggedId(null);

    try {
      const headers = await getHeaders();
      const res = await fetch("/api/admin/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "reorder", items }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      notify("success", isRtl ? "تم حفظ ترتيب المشاريع" : "Project order updated");
    } catch (err: any) {
      notify("error", err?.message || "Reorder failed");
      await loadProjects();
    }
  };

  const filtered = projects.filter((p) => {
    if (statusFilter === "published" && !p.is_published) return false;
    if (statusFilter === "draft" && p.is_published) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${p.title_ar} ${p.title_en} ${p.slug} ${p.category} ${
        p.client_name || ""
      }`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 end-5 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 ${
            toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/50 text-emerald-300"
              : "bg-red-950/95 border-red-500/50 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
            <span>{isRtl ? "إدارة معرض المشاريع" : "Projects Portfolio Management"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isRtl
              ? "أضف، عدّل، رتب بالسحب والإفلات، أو تحكم في نشر وتمييز المشاريع بالرئيسية"
              : "Create, edit, drag-and-drop reorder, publish, feature, or remove portfolio case studies"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadProjects}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border bg-card text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{isRtl ? "تحديث" : "Refresh"}</span>
          </button>

          <button
            onClick={() => {
              setEditingProject(null);
              setEditorOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan text-white text-xs sm:text-sm font-bold shadow-lg shadow-brand-cyan/20 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? "مشروع جديد" : "New Project"}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", ar: "الكل", en: "All" },
              { id: "published", ar: "منشور", en: "Published" },
              { id: "draft", ar: "مسودة", en: "Drafts" },
            ] as const
          ).map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                statusFilter === st.id
                  ? "bg-brand-cyan/15 text-brand-cyan border-brand-cyan/40"
                  : "bg-card text-muted-foreground border-border/70"
              }`}
            >
              {isRtl ? st.ar : st.en}
            </button>
          ))}

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold"
          >
            <option value="all">{isRtl ? "كل التصنيفات" : "All Categories"}</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {isRtl ? c.labelAr : c.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isRtl ? "بحث في المشاريع..." : "Search projects..."}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-border bg-background text-xs"
          />
        </div>
      </div>

      {/* Projects Table / Drag-Drop List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl glass-panel p-14 border border-dashed border-border/70 text-center space-y-3">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h2 className="text-base font-bold text-foreground">
            {isRtl ? "لا توجد مشاريع مضافة بعد" : "No projects yet"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {isRtl
              ? "اضغط على زر \"مشروع جديد\" لإضافة أول مشروع مكاني بمعرض صور وفيديوهات يوتيوب."
              : "Click \"New Project\" to add your first GIS portfolio project with images and YouTube videos."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((project, idx) => {
            const title = pickLocalized(project.title_ar, project.title_en, locale);
            return (
              <div
                key={project.id}
                draggable
                onDragStart={() => setDraggedId(project.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropReorder(project.id)}
                className="rounded-2xl glass-panel p-4 border border-border/70 hover:border-brand-cyan/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="cursor-grab text-muted-foreground hover:text-foreground shrink-0"
                    title={isRtl ? "اسحب لإعادة الترتيب" : "Drag to reorder"}
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={title}
                      className="w-20 h-14 rounded-xl object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-14 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                      <Briefcase className="w-5 h-5 opacity-50" />
                    </div>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <h3 className="font-bold text-sm text-foreground truncate max-w-sm">
                        {title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          project.is_published
                            ? "bg-emerald-500/15 text-emerald-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {project.is_published
                          ? isRtl
                            ? "منشور"
                            : "Published"
                          : isRtl
                          ? "مسودة"
                          : "Draft"}
                      </span>
                      {project.is_featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          <span>{isRtl ? "مميز" : "Featured"}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-brand-cyan">
                        {getCategoryLabel(project.category, locale)}
                      </span>
                      <span>• /projects/{project.slug}</span>
                      <span>
                        • {project.project_media?.length || 0}{" "}
                        {isRtl ? "وسائط" : "media items"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => handleToggle(project, "toggle_publish")}
                    className={`p-2 rounded-xl border border-border transition-colors ${
                      project.is_published
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={
                      project.is_published
                        ? isRtl
                          ? "إلغاء النشر"
                          : "Unpublish"
                        : isRtl
                        ? "نشر المشروع"
                        : "Publish"
                    }
                  >
                    {project.is_published ? (
                      <Globe className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => handleToggle(project, "toggle_feature")}
                    className={`p-2 rounded-xl border border-border transition-colors ${
                      project.is_featured
                        ? "text-amber-500 hover:bg-amber-500/10"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    title={isRtl ? "تمييز في الرئيسية" : "Toggle Featured"}
                  >
                    <Star
                      className={`w-4 h-4 ${project.is_featured ? "fill-amber-500" : ""}`}
                    />
                  </button>

                  {project.is_published && (
                    <Link
                      href={`/projects/${project.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl border border-border text-brand-cyan hover:bg-brand-cyan/10"
                      title={isRtl ? "معاينة في الموقع" : "View live page"}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}

                  <button
                    disabled={busy}
                    onClick={() => handleDuplicate(project)}
                    className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    title={isRtl ? "تكرار المشروع" : "Duplicate"}
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => {
                      setEditingProject(project);
                      setEditorOpen(true);
                    }}
                    className="p-2 rounded-xl border border-border text-brand-blue dark:text-brand-cyan hover:bg-brand-cyan/10"
                    title={isRtl ? "تعديل" : "Edit"}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    disabled={busy}
                    onClick={() => setDeleteTarget(project)}
                    className="p-2 rounded-xl border border-border text-red-500 hover:bg-red-500/10"
                    title={isRtl ? "حذف نهائي" : "Delete"}
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
      {editorOpen && (
        <ProjectEditorModal
          locale={locale}
          project={editingProject}
          authHeaders={authHeaders}
          onClose={() => {
            setEditorOpen(false);
            setEditingProject(null);
          }}
          onSaved={loadProjects}
          onNotify={notify}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-3xl bg-card border border-red-500/30 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-foreground">
                {isRtl ? "تأكيد حذف المشروع" : "Confirm Project Deletion"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl
                  ? `هل أنت متأكد من حذف المشروع "${pickLocalized(
                      deleteTarget.title_ar,
                      deleteTarget.title_en,
                      locale
                    )}"؟ سيتم حذف المشروع وصوره من قاعدة البيانات والتخزين نهائياً.`
                  : `Are you sure you want to delete "${pickLocalized(
                      deleteTarget.title_ar,
                      deleteTarget.title_en,
                      locale
                    )}"? All database records and uploaded images will be permanently removed.`}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {isRtl ? "نعم، احذف نهائياً" : "Yes, Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
