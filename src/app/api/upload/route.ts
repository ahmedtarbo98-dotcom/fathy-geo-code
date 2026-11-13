import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";
import {
  PROJECT_IMAGE_BUCKET,
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
  extractStoragePathFromUrl,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "course-images";
    const folder = (formData.get("folder") as string) || "thumbnails";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
    const isAllowedExt = ["jpg", "jpeg", "png", "webp"].includes(safeExt);

    if (bucket === PROJECT_IMAGE_BUCKET) {
      if (file.size > PROJECT_IMAGE_MAX_BYTES) {
        return NextResponse.json(
          { error: "Image exceeds 5 MB maximum size limit." },
          { status: 400 }
        );
      }
      const normalizedType = (file.type || "").toLowerCase();
      const isAllowedMime =
        PROJECT_IMAGE_MIME_TYPES.includes(normalizedType) ||
        normalizedType.startsWith("image/");

      if (!isAllowedExt && !isAllowedMime) {
        return NextResponse.json(
          { error: "Only JPG, PNG, and WebP images are allowed." },
          { status: 400 }
        );
      }
    }

    const { data: bucketData, error: bucketCheckErr } =
      await adminClient.storage.getBucket(bucket);
    if (!bucketData || bucketCheckErr) {
      await adminClient.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 10485760, // 10 MB
      });
    }

    const cleanFileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const mimeByExt: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const contentType =
      file.type && file.type !== "application/octet-stream" && file.type.startsWith("image/")
        ? file.type
        : mimeByExt[safeExt] || "image/png";

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType,
        upsert: true,
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
      { error: err?.message || "Failed to upload file to storage" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const url = new URL(request.url);
    const fileUrl = url.searchParams.get("url");
    const bucket = url.searchParams.get("bucket") || PROJECT_IMAGE_BUCKET;

    const path = extractStoragePathFromUrl(fileUrl, bucket);
    if (!path) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { error } = await adminClient.storage.from(bucket).remove([path]);
    if (error) throw error;

    return NextResponse.json({ success: true, deletedPath: path });
  } catch (err: any) {
    console.error("API upload delete error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete file from storage" },
      { status: 500 }
    );
  }
}
