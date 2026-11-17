import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import {
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
  extractStoragePathFromUrl,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

const ALLOWED_BUCKETS = new Set([
  "course-images",
  "platform-assets",
  "project-images",
  "project-media",
]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/x-png",
  "image/pjpeg",
]);

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawBucket = (formData.get("bucket") as string) || "course-images";
    const rawFolder = (formData.get("folder") as string) || "thumbnails";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Whitelist bucket
    const bucket = rawBucket.trim().toLowerCase();
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Target storage bucket not allowed" }, { status: 403 });
    }

    // 2. Sanitize folder path (prevent directory traversal)
    const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, "") || "uploads";

    // 3. Strict extension and MIME validation
    const rawExt = file.name.split(".").pop()?.toLowerCase() || "";
    const safeExt = rawExt.replace(/[^a-z0-9]/g, "");

    if (!ALLOWED_EXTENSIONS.has(safeExt)) {
      return NextResponse.json(
        { error: "Invalid file extension. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    const mimeByExt: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };

    const normalizedType = (file.type || "").toLowerCase();
    const isAllowedMime =
      ALLOWED_MIME_TYPES.has(normalizedType) ||
      normalizedType === "" ||
      normalizedType === "application/octet-stream" ||
      normalizedType.startsWith("image/");

    if (!isAllowedMime) {
      return NextResponse.json(
        { error: "Invalid file MIME type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    const contentType =
      normalizedType && normalizedType.startsWith("image/") && !normalizedType.includes("octet")
        ? normalizedType
        : mimeByExt[safeExt] || "image/jpeg";

    // 4. File size limit check (5 MB)
    const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds 5 MB maximum size limit." },
        { status: 400 }
      );
    }

    // 5. Ensure bucket exists
    const { data: bucketData, error: bucketCheckErr } =
      await adminClient.storage.getBucket(bucket);
    if (!bucketData || bucketCheckErr) {
      await adminClient.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5 MB
      });
    }

    // 6. Generate cryptographically random clean file name
    const randomHex = crypto.randomUUID().replace(/-/g, "");
    const cleanFileName = `${folder}/${Date.now()}-${randomHex}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = adminClient.storage.from(bucket).getPublicUrl(cleanFileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: cleanFileName,
    });
  } catch (err: any) {
    console.error("API upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file to storage." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const rawBucket = searchParams.get("bucket") || "course-images";

    if (!path) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    const bucket = rawBucket.trim().toLowerCase();
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: "Invalid bucket" }, { status: 403 });
    }

    // Clean path to prevent traversing out
    const cleanPath = path.replace(/\.\./g, "").trim();

    const { error } = await adminClient.storage.from(bucket).remove([cleanPath]);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API file delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete file from storage." },
      { status: 500 }
    );
  }
}
