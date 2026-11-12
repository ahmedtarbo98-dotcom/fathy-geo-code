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

    if (bucket === PROJECT_IMAGE_BUCKET) {
      if (file.size > PROJECT_IMAGE_MAX_BYTES) {
        return NextResponse.json(
          { error: "Image exceeds 5 MB maximum size limit." },
          { status: 400 }
        );
      }
      const normalizedType = (file.type || "").toLowerCase();
      if (!PROJECT_IMAGE_MIME_TYPES.includes(normalizedType)) {
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
        fileSizeLimit: bucket === PROJECT_IMAGE_BUCKET ? PROJECT_IMAGE_MAX_BYTES : 5242880,
        allowedMimeTypes:
          bucket === PROJECT_IMAGE_BUCKET
            ? PROJECT_IMAGE_MIME_TYPES
            : ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"],
      });
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = rawExt.replace(/[^a-z0-9]/g, "") || "jpg";
    const cleanFileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType: file.type || "image/jpeg",
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
