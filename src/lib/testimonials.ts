import { z } from "zod";
import { extractYouTubeId } from "@/lib/youtube";
import { sanitizeText } from "@/lib/security/validation";

export const TESTIMONIAL_BUCKET = "testimonial-media";

export const TESTIMONIAL_STATUSES = ["pending", "published", "hidden"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export type TestimonialMediaType = "image" | "video" | null;

export interface TestimonialCourseRef {
  id: string;
  title_ar: string;
  title_en: string;
  slug?: string;
}

export interface TestimonialRecord {
  id: string;
  student_name_ar: string;
  student_name_en: string;
  student_title_ar: string;
  student_title_en: string;
  content_ar: string;
  content_en: string;
  rating: number;
  avatar_url: string | null;
  course_id: string | null;
  course?: TestimonialCourseRef | null;
  media_type: TestimonialMediaType;
  media_url: string | null;
  status: TestimonialStatus;
  is_published: boolean;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at?: string;
}

function isValidHttpOrRelativeUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export const adminTestimonialSchema = z
  .object({
    student_name_ar: z.string().trim().max(120).optional().default(""),
    student_name_en: z.string().trim().max(120).optional().default(""),
    student_title_ar: z.string().trim().max(160).optional().default(""),
    student_title_en: z.string().trim().max(160).optional().default(""),
    content_ar: z.string().trim().max(2500).optional().default(""),
    content_en: z.string().trim().max(2500).optional().default(""),
    rating: z.number().int().min(1).max(5).default(5),
    avatar_url: z.string().trim().max(1000).nullable().optional(),
    course_id: z.string().uuid().nullable().optional(),
    media_type: z.enum(["image", "video"]).nullable().optional(),
    media_url: z.string().trim().max(1000).nullable().optional(),
    status: z.enum(["pending", "published", "hidden"]).default("published"),
    is_featured: z.boolean().optional().default(false),
    order_index: z.number().int().min(0).optional().default(0),
  })
  .superRefine((data, ctx) => {
    if (!data.student_name_ar.trim() && !data.student_name_en.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reviewer name is required (Arabic or English)",
        path: ["student_name_ar"],
      });
    }
    if (!data.content_ar.trim() && !data.content_en.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Review content is required (Arabic or English)",
        path: ["content_ar"],
      });
    }
    if (data.avatar_url && !isValidHttpOrRelativeUrl(data.avatar_url)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid avatar URL",
        path: ["avatar_url"],
      });
    }
    if (data.media_type && data.media_url) {
      if (data.media_type === "image" && !isValidHttpOrRelativeUrl(data.media_url)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid image URL",
          path: ["media_url"],
        });
      }
      if (
        data.media_type === "video" &&
        !extractYouTubeId(data.media_url) &&
        !isValidHttpOrRelativeUrl(data.media_url)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid video URL",
          path: ["media_url"],
        });
      }
    }
  });

export const publicTestimonialSubmitSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    title: z.string().trim().min(2, "Specialty / Title is required").max(160),
    content: z.string().trim().min(10, "Review must be at least 10 characters").max(2000),
    rating: z.number().int().min(1).max(5),
    course_id: z.string().uuid().nullable().optional(),
    media_type: z.enum(["image", "video"]).nullable().optional(),
    media_url: z.string().trim().max(1000).nullable().optional(),
    locale: z.enum(["ar", "en"]).optional().default("ar"),
    turnstileToken: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.media_url && data.media_url.trim().length > 0) {
      if (data.media_type === "video") {
        if (!extractYouTubeId(data.media_url) && !isValidHttpOrRelativeUrl(data.media_url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid video URL",
            path: ["media_url"],
          });
        }
      } else if (data.media_type === "image") {
        if (!isValidHttpOrRelativeUrl(data.media_url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid image URL",
            path: ["media_url"],
          });
        }
      }
    }
  });

export function normalizeTestimonialInput(
  payload: z.infer<typeof adminTestimonialSchema>
) {
  const nameAr = sanitizeText(payload.student_name_ar || payload.student_name_en);
  const nameEn = sanitizeText(payload.student_name_en || payload.student_name_ar);
  const titleAr = sanitizeText(payload.student_title_ar || payload.student_title_en);
  const titleEn = sanitizeText(payload.student_title_en || payload.student_title_ar);
  const contentAr = sanitizeText(payload.content_ar || payload.content_en);
  const contentEn = sanitizeText(payload.content_en || payload.content_ar);

  const hasMedia = Boolean(payload.media_type && payload.media_url?.trim());

  return {
    student_name_ar: nameAr,
    student_name_en: nameEn,
    student_title_ar: titleAr,
    student_title_en: titleEn,
    content_ar: contentAr,
    content_en: contentEn,
    rating: payload.rating,
    avatar_url: payload.avatar_url?.trim() || null,
    course_id: payload.course_id || null,
    media_type: hasMedia ? payload.media_type! : null,
    media_url: hasMedia ? payload.media_url!.trim() : null,
    status: payload.status,
    is_published: payload.status === "published",
    is_featured: Boolean(payload.is_featured),
    order_index: payload.order_index ?? 0,
  };
}

export function pickLocalizedField(
  arVal: string | null | undefined,
  enVal: string | null | undefined,
  locale: string
): string {
  const ar = (arVal || "").trim();
  const en = (enVal || "").trim();
  if (locale === "ar") return ar || en;
  return en || ar;
}
