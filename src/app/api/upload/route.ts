import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    // 1. Verify user authentication via cookies or Bearer token
    const supabase = createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabase.auth.getUser(token);
        user = tokenUser.user;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول كمدير لرفع الصور (Unauthorized)" },
        { status: 401 }
      );
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "course-images";
    const folder = (formData.get("folder") as string) || "thumbnails";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 3. Admin Client with Service Role (Bypasses manual bucket setup hurdles)
    const admin = createAdminClient();

    // Auto-create bucket if it doesn't exist yet
    const { data: bucketData, error: bucketCheckErr } = await admin.storage.getBucket(bucket);
    if (!bucketData || bucketCheckErr) {
      await admin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5 MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/svg+xml"],
      });
    }

    // 4. Upload file
    const ext = file.name.split(".").pop() || "jpg";
    const cleanFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(cleanFileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // 5. Get public URL
    const {
      data: { publicUrl },
    } = admin.storage.from(bucket).getPublicUrl(cleanFileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (err: any) {
    console.error("API upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file to storage" },
      { status: 500 }
    );
  }
}
