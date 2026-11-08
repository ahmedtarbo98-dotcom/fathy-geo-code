"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import { UploadCloud, X, RefreshCw, AlertCircle, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: "course-images" | "platform-assets";
  folder?: string;
  locale?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  value,
  onChange,
  bucket = "course-images",
  folder = "thumbnails",
  locale = "ar",
  maxSizeMB = 2,
}: ImageUploadProps) {
  const isRtl = locale === "ar";
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const supabase = createClient();

  const handleFile = async (file: File) => {
    setError(null);

    // Validate type: jpg, png, webp
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        isRtl
          ? "يرجى اختيار صورة بصيغة JPG أو PNG أو WebP فقط."
          : "Please choose an image in JPG, PNG or WebP format only."
      );
      return;
    }

    // Validate size (max 2 MB)
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(
        isRtl
          ? `حجم الصورة يتجاوز الحد الأقصى المسموح (${maxSizeMB} ميجابايت).`
          : `Image size exceeds the maximum limit of ${maxSizeMB} MB.`
      );
      return;
    }

    try {
      setUploading(true);

      const ext = file.name.split(".").pop() || "jpg";
      const cleanFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

      const { data, error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(cleanFileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) {
        throw uploadErr;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(cleanFileName);

      onChange(publicUrl);
    } catch (err: any) {
      console.error("Storage upload error:", err);
      setError(
        isRtl
          ? `فشل رفع الصورة: ${err.message || "تأكد من صلاحيات المدير وسعة التخزين"}`
          : `Failed to upload image: ${err.message || "Check admin permissions"}`
      );
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onInputChange}
        className="hidden"
      />

      {value ? (
        /* Preview with Replace & Remove */
        <div className="relative group rounded-2xl overflow-hidden border border-border bg-card/60 shadow-md">
          <div className="relative w-full aspect-video max-h-56">
            <Image
              src={value}
              alt="Uploaded Preview"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue/90 flex items-center gap-1.5 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? "animate-spin" : ""}`} />
              <span>{isRtl ? "استبدال الصورة" : "Replace"}</span>
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-red-600/90 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 shadow-md"
            >
              <X className="w-3.5 h-3.5" />
              <span>{isRtl ? "حذف" : "Remove"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragging
              ? "border-brand-cyan bg-brand-cyan/10 scale-[1.01]"
              : "border-border/70 hover:border-brand-blue/60 bg-muted/20 hover:bg-muted/40"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-brand-blue/10 dark:bg-brand-cyan/10 text-brand-blue dark:text-brand-cyan flex items-center justify-center">
              {uploading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-brand-blue" />
              ) : (
                <UploadCloud className="w-6 h-6 text-brand-blue dark:text-brand-cyan" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {uploading
                  ? isRtl
                    ? "جارٍ رفع الصورة إلى الخادم..."
                    : "Uploading image to server..."
                  : isRtl
                  ? "انقر لاختيار صورة من جهازك أو اسحبها وأفلتها هنا"
                  : "Click to choose image from device or drag & drop"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                JPG, PNG, WebP • {isRtl ? `الحد الأقصى ${maxSizeMB} ميجابايت` : `Max ${maxSizeMB} MB`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
