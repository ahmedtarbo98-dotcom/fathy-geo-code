import { z } from "zod";

/**
 * Sanitizes plain text input to prevent XSS and control character injection
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // Strip raw HTML angle brackets
    .trim();
}

/**
 * Validates internal redirect URLs to prevent open redirect vulnerabilities
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();

  // Must begin with single forward slash and NOT double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return false;
  }

  // Must not contain scheme or protocol separators
  if (trimmed.includes(":") || trimmed.includes("@")) {
    return false;
  }

  return true;
}

/**
 * Strong password schema:
 * - At least 8 characters
 * - At least one uppercase letter OR number OR special character
 */
export const strongPasswordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long." })
  .max(128, { message: "Password cannot exceed 128 characters." })
  .refine(
    (val) => /[A-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(val),
    { message: "Password must contain at least one uppercase letter, number, or symbol." }
  );

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  password: strongPasswordSchema,
  locale: z.enum(["ar", "en"]).default("ar"),
  turnstileToken: z.string().optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
  turnstileToken: z.string().optional().nullable(),
});

export const videoTokenSchema = z.object({
  lessonId: z.string().uuid({ message: "Invalid lesson ID format" }),
});

export const enrollmentRequestSchema = z.object({
  courseId: z.string().min(1, { message: "Course ID is required" }).max(128),
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  turnstileToken: z.string().optional().nullable(),
});

export const contactMessageSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  message: z.string().min(5).max(3000),
  turnstileToken: z.string().optional().nullable(),
});
