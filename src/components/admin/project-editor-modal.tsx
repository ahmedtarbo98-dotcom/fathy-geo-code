"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Trash2,
  Plus,
  Youtube,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Save,
  ImageIcon,
  AlertCircle,
  Loader2,
  Star,
  Globe,
} from "lucide-react";
import { extractYouTubeId, getYouTubeThumbnails } from "@/lib/youtube";
import {
  PROJECT_CATEGORIES,
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
  generateProjectSlug,
  projectInputSchema,
  type ProjectMediaItem,
  type ProjectRecord,
} from "@/lib/projects";

export interface ProjectEditorFormState {
  id?: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_description_ar: string;
  short_description_en: string;
  details_ar: string;
  details_en: string;
  category: string;
  client_name: string;
  location: string;
  project_date: string;
  tools: string[];
  cover_image_url: string;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  media: ProjectMediaItem[];
}

function buildInitialState(project: ProjectRecord | null): ProjectEditorFormState {
  if (!project) {
    return {
      slug: "",
      title_ar: "",
      title_en: "",
      short_description_ar: "",
      short_description_en: "",
      details_ar: "",
      details_en: "",
      category: "GIS",
      client_name: "",
      location: "",
      project_date: "",
      tools: [],
      cover_image_url: "",
      is_published: false,
      is_featured: false,
      sort_order: 0,
      media: [],
    };
  }

  return {
    id: project.id,
    slug: project.slug || "",
    title_ar: project.title_ar || "",
    title_en: project.title_en || "",
    short_description_ar: project.short_description_ar || "",
    short_description_en: project.short_description_en || "",
    details_ar: project.details_ar || "",
    details_en: project.details_en || "",
    category: project.category || "GIS",
    client_name: project.client_name || "",
    location: project.location || "",
    project_date: project.project_date || "",
    tools: Array.isArray(project.tools) ? project.tools : [],
    cover_image_url: project.cover_image_url || "",
    is_published: Boolean(project.is_published),
    is_featured: Boolean(project.is_featured),
    sort_order: project.sort_order ?? 0,
    media: (project.project_media || []).map((m, idx) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      caption_ar: m.caption_ar || "",
      caption_en: m.caption_en || "",
      sort_order: m.sort_order ?? idx,
    })),
  };
}

export default function ProjectEditorModal({
  locale,
  project,
  authHeaders,
  onClose,
  onSaved,
  onNotify,
}: {
  locale: string;
  project: ProjectRecord | null;
  authHeaders: Record<string, string>;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onNotify: (type: "success" | "error", msg: string) => void;
}) {
  const isRtl = locale === "ar";
  const initialSnapshotRef = useRef<string>("");
  const [form, setForm] = useState<ProjectEditorFormState>(() => buildInitialState(project));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(Boolean(project?.id));
  const [toolInput, setToolInput] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  const [uploadingCover, setUploadingCover] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draggedMediaIdx, setDraggedMediaIdx] = useState<number | null>(null);
  const [coverDragOver, setCoverDragOver] = useState(false);
  const [galleryDragOver, setGalleryDragOver] = useState(false);

  // Track unsaved files uploaded during this modal session so cancelling removes orphans cleanly
  const sessionUploadedUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    const init = buildInitialState(project);
    setForm(init);
    initialSnapshotRef.current = JSON.stringify(init);
    setSlugManuallyEdited(Boolean(project?.id));
  }, [project]);

  const isDirty = JSON.stringify(form) !== initialSnapshotRef.current;

  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const validateImageFile = (file: File): string | null => {
    if (!PROJECT_IMAGE_MIME_TYPES.includes(file.type.toLowerCase())) {
      return isRtl
        ? `صيغة الملف "${file.name}" غير مدعومة (JPG / PNG / WebP فقط).`
        : `Unsupported format for "${file.name}" (JPG, PNG, WebP only).`;
    }
    if (file.size > PROJECT_IMAGE_MAX_BYTES) {
      return isRtl
        ? `حجم الصورة "${file.name}" يتجاوز الحد الأقصى 3 ميجابايت.`
        : `Image "${file.name}" exceeds the 3 MB limit.`;
    }
    return null;
  };

  const uploadSingleImage = async (file: File, folder: string): Promise<string> => {
    const err = validateImageFile(file);
    if (err) throw new Error(err);

    const body = new FormData();
    body.append("file", file);
    body.append("bucket", PROJECT_IMAGE_BUCKET);
    body.append("folder", folder);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: authHeaders,
      body,
    });
    const json = await res.json();
    if (!res.ok || !json.url) {
      throw new Error(json.error || "Upload failed");
    }
    sessionUploadedUrlsRef.current.push(json.url);
    return json.url as string;
  };

  const deleteStorageFileIfSessionUploaded = async (url: string) => {
    if (!sessionUploadedUrlsRef.current.includes(url)) return;
    try {
      await fetch(
        `/api/upload?url=${encodeURIComponent(url)}&bucket=${PROJECT_IMAGE_BUCKET}`,
        { method: "DELETE", headers: authHeaders }
      );
      sessionUploadedUrlsRef.current = sessionUploadedUrlsRef.current.filter((u) => u !== url);
    } catch {
      // Ignore cleanup failure
    }
  };

  const handleCoverUpload = async (file: File | null | undefined) => {
    if (!file) return;
    try {
      setUploadingCover(true);
      setValidationError(null);
      const prevCover = form.cover_image_url;
      const url = await uploadSingleImage(file, "covers");
      setForm((prev) => ({ ...prev, cover_image_url: url }));
      if (prevCover) {
        await deleteStorageFileIfSessionUploaded(prevCover);
      }
      onNotify("success", isRtl ? "تم رفع صورة الغلاف بنجاح" : "Cover image uploaded");
    } catch (err: any) {
      onNotify("error", err?.message || "Cover upload error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleGalleryFilesUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setGalleryUploadProgress({ done: 0, total: fileList.length });
    const uploaded: ProjectMediaItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      try {
        const url = await uploadSingleImage(fileList[i], "gallery");
        uploaded.push({
          type: "image",
          url,
          caption_ar: "",
          caption_en: "",
          sort_order: form.media.length + uploaded.length,
        });
      } catch (err: any) {
        onNotify("error", err?.message || `Failed to upload ${fileList[i].name}`);
      }
      setGalleryUploadProgress({ done: i + 1, total: fileList.length });
    }

    if (uploaded.length > 0) {
      setForm((prev) => ({
        ...prev,
        media: [...prev.media, ...uploaded],
      }));
      onNotify(
        "success",
        isRtl
          ? `تم رفع ${uploaded.length} صورة للمعرض`
          : `Uploaded ${uploaded.length} gallery image(s)`
      );
    }
    setGalleryUploadProgress(null);
  };

  const handleAddTool = () => {
    const parts = toolInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setForm((prev) => ({
      ...prev,
      tools: Array.from(new Set([...prev.tools, ...parts])),
    }));
    setToolInput("");
  };

  const handleAddYouTubeVideo = () => {
    const trimmed = newVideoUrl.trim();
    if (!trimmed) return;
    const ytId = extractYouTubeId(trimmed);
    if (!ytId) {
      onNotify(
        "error",
        isRtl
          ? "رابط اليوتيوب غير صحيح. تأكد من لصق رابط فيديو صالح."
          : "Invalid YouTube URL. Please enter a valid YouTube link."
      );
      return;
    }

    setForm((prev) => ({
      ...prev,
      media: [
        ...prev.media,
        {
          type: "video",
          url: trimmed,
          caption_ar: "",
          caption_en: "",
          sort_order: prev.media.length,
        },
      ],
    }));
    setNewVideoUrl("");
  };

  const moveMediaItem = (index: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= form.media.length || index === targetIndex) return;
    const next = [...form.media];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setForm((prev) => ({
      ...prev,
      media: next.map((m, i) => ({ ...m, sort_order: i })),
    }));
  };

  const removeMediaItem = async (index: number) => {
    const target = form.media[index];
    setForm((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index).map((m, i) => ({ ...m, sort_order: i })),
    }));
    if (target?.type === "image") {
      await deleteStorageFileIfSessionUploaded(target.url);
    }
  };

  const handleAttemptClose = async () => {
    if (isDirty) {
      const ok = window.confirm(
        isRtl
          ? "لديك تغييرات غير محفوظة. هل أنت متأكد من الإغلاق وتجاهلها؟"
          : "You have unsaved changes. Discard and close?"
      );
      if (!ok) return;
      // Cleanup newly uploaded orphaned files from this cancelled session
      for (const u of [...sessionUploadedUrlsRef.current]) {
        await deleteStorageFileIfSessionUploaded(u);
      }
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const computedSlug =
      form.slug.trim() || generateProjectSlug(form.title_en, form.title_ar);

    const normalizedPayload = {
      ...form,
      slug: computedSlug,
      client_name: form.client_name.trim() || null,
      location: form.location.trim() || null,
      project_date: form.project_date.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      media: form.media.map((m, idx) => ({ ...m, sort_order: idx })),
    };

    const parsed = projectInputSchema.safeParse(normalizedPayload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Validation failed";
      setValidationError(firstIssue);
      onNotify("error", firstIssue);
      return;
    }

    try {
      setSaving(true);
      const isEdit = Boolean(form.id);
      const res = await fetch("/api/admin/projects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(isEdit ? { id: form.id, ...parsed.data } : parsed.data),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      sessionUploadedUrlsRef.current = [];
      initialSnapshotRef.current = JSON.stringify(form);
      onNotify(
        "success",
        isEdit
          ? isRtl
            ? "تم تحديث المشروع بنجاح"
            : "Project updated successfully"
          : isRtl
          ? "تم إنشاء المشروع بنجاح"
          : "Project created successfully"
      );
      await onSaved();
      onClose();
    } catch (err: any) {
      const msg = err?.message || "Save failed";
      setValidationError(msg);
      onNotify("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const imageIndices = form.media
    .map((m, idx) => ({ m, idx }))
    .filter((entry) => entry.m.type === "image");

  const videoIndices = form.media
    .map((m, idx) => ({ m, idx }))
    .filter((entry) => entry.m.type === "video");

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="rounded-3xl bg-card border border-border/80 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-lg font-extrabold text-foreground">
              {form.id
                ? isRtl
                  ? "تعديل بيانات المشروع"
                  : "Edit Project"
                : isRtl
                ? "إضافة مشروع جديد للمعرض"
                : "Create New Portfolio Project"}
            </h2>
            {isDirty && (
              <span className="text-[11px] font-bold text-amber-500">
                {isRtl ? "• توجد تغييرات غير محفوظة" : "• Unsaved changes"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Titles & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "عنوان المشروع (بالعربية)" : "Project Title (Arabic)"}
              </label>
              <input
                type="text"
                value={form.title_ar}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title_ar: val,
                    slug:
                      !slugManuallyEdited && !prev.title_en
                        ? generateProjectSlug("", val)
                        : prev.slug,
                  }));
                }}
                placeholder="مثال: نمذجة مخاطر السيول بحوض قنا"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "عنوان المشروع (بالإنجليزية)" : "Project Title (English)"}
              </label>
              <input
                type="text"
                value={form.title_en}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title_en: val,
                    slug: !slugManuallyEdited
                      ? generateProjectSlug(val, prev.title_ar)
                      : prev.slug,
                  }));
                }}
                placeholder="e.g. Flash Flood Risk Modeling in Qena Basin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "الرابط المختصر (Slug)" : "URL Slug"}
              </label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  }));
                }}
                placeholder="flood-risk-qena-basin"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-brand-cyan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التصنيف" : "Category"}
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {isRtl ? c.labelAr : c.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Short Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "وصف مختصر (عربي)" : "Short Description (Arabic)"}
              </label>
              <textarea
                rows={2}
                value={form.short_description_ar}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, short_description_ar: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "وصف مختصر (إنجليزي)" : "Short Description (English)"}
              </label>
              <textarea
                rows={2}
                value={form.short_description_en}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, short_description_en: e.target.value }))
                }
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs"
              />
            </div>
          </div>

          {/* Long Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التفاصيل الكاملة للمشروع (عربي)" : "Full Case Study Details (Arabic)"}
              </label>
              <textarea
                rows={5}
                value={form.details_ar}
                onChange={(e) => setForm((prev) => ({ ...prev, details_ar: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                {isRtl ? "التفاصيل الكاملة (إنجليزي)" : "Full Case Study Details (English)"}
              </label>
              <textarea
                rows={5}
                value={form.details_en}
                onChange={(e) => setForm((prev) => ({ ...prev, details_en: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Optional Metadata: Client, Location, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isRtl ? "العميل (اختياري)" : "Client (Optional)"}
              </label>
              <input
                type="text"
                value={form.client_name}
                onChange={(e) => setForm((prev) => ({ ...prev, client_name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isRtl ? "الموقع الجغرافي (اختياري)" : "Location (Optional)"}
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder={isRtl ? "مثال: مصر / السعودية" : "e.g. Egypt / KSA"}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                {isRtl ? "تاريخ التنفيذ (اختياري)" : "Project Date (Optional)"}
              </label>
              <input
                type="text"
                value={form.project_date}
                onChange={(e) => setForm((prev) => ({ ...prev, project_date: e.target.value }))}
                placeholder={isRtl ? "مثال: 2026" : "e.g. Nov 2026"}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs"
              />
            </div>
          </div>

          {/* Tools Tag Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground">
              {isRtl ? "الأدوات والبرمجيات المستخدمة" : "Tools & Technologies"}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={toolInput}
                onChange={(e) => setToolInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTool();
                  }
                }}
                placeholder={
                  isRtl
                    ? "اكتب اسم الأداة واضغط Enter (مثال: ArcGIS Pro, GEE, Python)"
                    : "Type tool name and press Enter (e.g. ArcGIS Pro, GEE)"
                }
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs"
              />
              <button
                type="button"
                onClick={handleAddTool}
                className="px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.tools.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {form.tools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan text-xs font-bold"
                  >
                    <span>{tool}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tools: prev.tools.filter((t) => t !== tool),
                        }))
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cover Image Upload (Picker + Drag & Drop, max 3 MB) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground block">
              {isRtl
                ? "صورة الغلاف الرئيسية (JPG / PNG / WebP — بحد أقصى 3 ميجابايت)"
                : "Cover Image (JPG / PNG / WebP — max 3 MB)"}
            </label>

            {form.cover_image_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted max-w-md">
                <img
                  src={form.cover_image_url}
                  alt="Cover preview"
                  className="w-full h-48 object-cover"
                />
                <div className="p-2.5 bg-background/90 border-t border-border/50 flex items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRtl ? "تغيير الغلاف" : "Replace Cover"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      const prevUrl = form.cover_image_url;
                      setForm((prev) => ({ ...prev, cover_image_url: "" }));
                      await deleteStorageFileIfSessionUploaded(prevUrl);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? "إزالة" : "Remove"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setCoverDragOver(true);
                }}
                onDragLeave={() => setCoverDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setCoverDragOver(false);
                  handleCoverUpload(e.dataTransfer.files?.[0]);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
                  coverDragOver
                    ? "border-brand-cyan bg-brand-cyan/10"
                    : "border-border hover:border-brand-cyan/50 bg-muted/20"
                }`}
              >
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 animate-spin text-brand-cyan" />
                ) : (
                  <Upload className="w-6 h-6 text-brand-cyan" />
                )}
                <span className="text-xs font-bold text-foreground">
                  {uploadingCover
                    ? isRtl
                      ? "جاري رفع صورة الغلاف..."
                      : "Uploading cover..."
                    : isRtl
                    ? "اسحب صورة الغلاف هنا أو اضغط للاختيار"
                    : "Drag & drop cover image here, or click to select"}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          {/* Multi-Image Gallery Upload + Captions + Reorder */}
          <div className="p-5 rounded-2xl border border-border/70 bg-muted/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-brand-cyan" />
                  <span>
                    {isRtl
                      ? "معرض صور المشروع (رفع متعدد + ترتيب بالسحب + وصف)"
                      : "Gallery Images (Multi-upload, Reorder & Captions)"}
                  </span>
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {isRtl
                    ? "يمكنك تحديد أو سحب عدة صور دفعة واحدة (JPG / PNG / WebP، حد أقصى 3 ميجابايت لكل صورة)."
                    : "Select or drag multiple images at once (JPG/PNG/WebP, max 3 MB each)."}
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold cursor-pointer self-start">
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? "رفع صور للمعرض" : "Upload Images"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => e.target.files && handleGalleryFilesUpload(e.target.files)}
                />
              </label>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setGalleryDragOver(true);
              }}
              onDragLeave={() => setGalleryDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setGalleryDragOver(false);
                if (e.dataTransfer.files?.length) {
                  handleGalleryFilesUpload(e.dataTransfer.files);
                }
              }}
              className={`p-4 rounded-xl border border-dashed text-center text-xs transition-colors ${
                galleryDragOver
                  ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan font-bold"
                  : "border-border/70 text-muted-foreground"
              }`}
            >
              {galleryUploadProgress
                ? `${isRtl ? "جاري الرفع:" : "Uploading:"} ${galleryUploadProgress.done} / ${
                    galleryUploadProgress.total
                  }`
                : isRtl
                ? "أو اسحب عدة صور وأفلتها هنا مباشرة"
                : "Or drag & drop multiple images right here"}
            </div>

            {imageIndices.length > 0 && (
              <div className="space-y-3">
                {imageIndices.map(({ m, idx }, pos) => (
                  <div
                    key={`${m.url}-${idx}`}
                    draggable
                    onDragStart={() => setDraggedMediaIdx(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedMediaIdx !== null) {
                        moveMediaItem(draggedMediaIdx, idx);
                        setDraggedMediaIdx(null);
                      }
                    }}
                    className="p-3 rounded-xl bg-card border border-border/80 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <img
                        src={m.url}
                        alt={m.caption_ar || `Gallery ${pos + 1}`}
                        className="w-20 h-14 rounded-lg object-cover border border-border"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 w-full">
                      <input
                        type="text"
                        placeholder={isRtl ? "وصف الصورة (عربي)" : "Caption (Arabic)"}
                        value={m.caption_ar || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            media: prev.media.map((item, i) =>
                              i === idx ? { ...item, caption_ar: val } : item
                            ),
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                      />
                      <input
                        type="text"
                        placeholder={isRtl ? "وصف الصورة (إنجليزي)" : "Caption (English)"}
                        value={m.caption_en || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            media: prev.media.map((item, i) =>
                              i === idx ? { ...item, caption_en: val } : item
                            ),
                          }));
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveMediaItem(idx, idx - 1)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveMediaItem(idx, idx + 1)}
                        className="p-1.5 rounded-lg border border-border hover:bg-muted"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMediaItem(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        title={isRtl ? "حذف الصورة" : "Delete image"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* YouTube Videos Manager */}
          <div className="p-5 rounded-2xl border border-red-500/25 bg-red-500/5 space-y-4">
            <div>
              <h3 className="text-xs font-extrabold text-foreground flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>{isRtl ? "فيديوهات المشروع (روابط يوتيوب)" : "Project Videos (YouTube Links)"}</span>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {isRtl
                  ? "أضف أي عدد من روابط يوتيوب وسيتم التحقق منها وعرض معاينتها تلقائياً."
                  : "Add any number of YouTube video links with auto validation and thumbnail preview."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddYouTubeVideo();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddYouTubeVideo}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? "إضافة فيديو" : "Add Video"}</span>
              </button>
            </div>

            {videoIndices.length > 0 && (
              <div className="space-y-3">
                {videoIndices.map(({ m, idx }) => {
                  const thumbs = getYouTubeThumbnails(m.url);
                  const isValid = Boolean(thumbs.videoId);
                  return (
                    <div
                      key={`vid-${idx}`}
                      draggable
                      onDragStart={() => setDraggedMediaIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggedMediaIdx !== null) {
                          moveMediaItem(draggedMediaIdx, idx);
                          setDraggedMediaIdx(null);
                        }
                      }}
                      className="p-3 rounded-xl bg-card border border-border/80 space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="flex items-center gap-2 shrink-0">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          {thumbs.hq ? (
                            <img
                              src={thumbs.hq}
                              alt="YouTube thumbnail"
                              className="w-24 h-14 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="w-24 h-14 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-[10px] text-red-500 font-bold">
                              Invalid ID
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <input
                            type="url"
                            value={m.url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((prev) => ({
                                ...prev,
                                media: prev.media.map((item, i) =>
                                  i === idx ? { ...item, url: val } : item
                                ),
                              }));
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-lg border bg-background text-xs font-mono ${
                              isValid ? "border-border" : "border-red-500"
                            }`}
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder={isRtl ? "عنوان الفيديو (عربي)" : "Video Caption (AR)"}
                              value={m.caption_ar || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  media: prev.media.map((item, i) =>
                                    i === idx ? { ...item, caption_ar: val } : item
                                  ),
                                }));
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                            />
                            <input
                              type="text"
                              placeholder={isRtl ? "عنوان الفيديو (إنجليزي)" : "Video Caption (EN)"}
                              value={m.caption_en || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setForm((prev) => ({
                                  ...prev,
                                  media: prev.media.map((item, i) =>
                                    i === idx ? { ...item, caption_en: val } : item
                                  ),
                                }));
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => moveMediaItem(idx, idx - 1)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveMediaItem(idx, idx + 1)}
                            className="p-1.5 rounded-lg border border-border hover:bg-muted"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMediaItem(idx)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Visibility Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_published: e.target.checked }))
                }
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "نشر المشروع للزوار الآن" : "Publish publicly"}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-bold text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
                }
                className="w-4 h-4 accent-amber-500 rounded"
              />
              <Star className="w-4 h-4 text-amber-500" />
              <span>
                {isRtl ? "تمييز المشروع في الصفحة الرئيسية" : "Feature on Homepage"}
              </span>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border/60 flex items-center justify-end gap-3 bg-muted/20">
          <button
            type="button"
            onClick={handleAttemptClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
          >
            {isRtl ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={saving || uploadingCover || Boolean(galleryUploadProgress)}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white text-xs font-bold shadow-md disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isRtl ? "حفظ المشروع" : "Save Project"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
