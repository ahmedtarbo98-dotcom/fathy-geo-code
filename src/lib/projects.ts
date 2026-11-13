import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";

export const PROJECT_CATEGORIES = [
  { value: "GIS", labelAr: "نظم المعلومات الجغرافية (GIS)", labelEn: "GIS" },
  { value: "Remote Sensing", labelAr: "الاستشعار عن بعد", labelEn: "Remote Sensing" },
  { value: "Surveying", labelAr: "المساحة الرقمية", labelEn: "Surveying" },
  { value: "Spatial Modeling", labelAr: "النمذجة المكانية", labelEn: "Spatial Modeling" },
  { value: "Cartography", labelAr: "إنتاج الخرائط والكارتوغرافيا", labelEn: "Cartography" },
  { value: "GEE", labelAr: "Google Earth Engine", labelEn: "GEE" },
] as const;

export const PROJECT_IMAGE_BUCKET = "project-images";
export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const PROJECT_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/x-png",
  "image/pjpeg",
];

export const projectMediaItemSchema = z
  .object({
    id: z.string().optional(),
    type: z.enum(["image", "video"]),
    url: z.string().trim().min(1, "Media URL is required"),
    caption_ar: z.string().max(300).optional().default(""),
    caption_en: z.string().max(300).optional().default(""),
    sort_order: z.number().int().min(0).optional().default(0),
  })
  .superRefine((item, ctx) => {
    if (item.type === "video" && !extractYouTubeId(item.url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid YouTube URL or video ID",
        path: ["url"],
      });
    }
    if (item.type === "image") {
      try {
        new URL(item.url);
      } catch {
        if (!item.url.startsWith("/")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid image URL",
            path: ["url"],
          });
        }
      }
    }
  });

export const projectInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2, "Slug must be at least 2 characters")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must use lowercase letters, numbers, and hyphens"),
    title_ar: z.string().trim().max(200).optional().default(""),
    title_en: z.string().trim().max(200).optional().default(""),
    short_description_ar: z.string().trim().max(600).optional().default(""),
    short_description_en: z.string().trim().max(600).optional().default(""),
    details_ar: z.string().trim().max(20000).optional().default(""),
    details_en: z.string().trim().max(20000).optional().default(""),
    category: z.string().trim().min(1, "Category is required").max(80),
    client_name: z.string().trim().max(150).nullable().optional(),
    location: z.string().trim().max(150).nullable().optional(),
    project_date: z.string().trim().max(80).nullable().optional(),
    tools: z.array(z.string().trim().min(1).max(60)).max(30).optional().default([]),
    cover_image_url: z.string().trim().max(1000).nullable().optional(),
    is_published: z.boolean().optional().default(false),
    is_featured: z.boolean().optional().default(false),
    sort_order: z.number().int().min(0).optional().default(0),
    media: z.array(projectMediaItemSchema).max(60).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (!data.title_ar.trim() && !data.title_en.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least an Arabic or English project title",
        path: ["title_ar"],
      });
    }
  });

export type ProjectMediaItem = z.infer<typeof projectMediaItemSchema>;
export type ProjectPayload = z.infer<typeof projectInputSchema>;

export interface ProjectRecord {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  short_description_ar: string;
  short_description_en: string;
  details_ar: string;
  details_en: string;
  category: string;
  client_name: string | null;
  location: string | null;
  project_date: string | null;
  tools: string[];
  cover_image_url: string | null;
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  project_media?: ProjectMediaItem[];
}

export function pickLocalized(
  arValue: string | null | undefined,
  enValue: string | null | undefined,
  locale: string
): string {
  const ar = (arValue || "").trim();
  const en = (enValue || "").trim();
  return locale === "ar" ? ar || en : en || ar;
}

export function getCategoryLabel(category: string, locale: string): string {
  const match = PROJECT_CATEGORIES.find(
    (c) => c.value.toLowerCase() === category.toLowerCase()
  );
  if (!match) return category;
  return locale === "ar" ? match.labelAr : match.labelEn;
}

export function generateProjectSlug(titleEn: string, titleAr: string): string {
  const base = (titleEn || titleAr || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length >= 2) return base.slice(0, 80);
  return `project-${Date.now().toString(36)}`;
}

export function extractStoragePathFromUrl(
  url: string | null | undefined,
  bucket = PROJECT_IMAGE_BUCKET
): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const pathPart = url.slice(idx + marker.length).split("?")[0];
  try {
    return decodeURIComponent(pathPart);
  } catch {
    return pathPart || null;
  }
}
