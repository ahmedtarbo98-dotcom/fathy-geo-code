"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/routing";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-md p-8 rounded-3xl glass-panel border border-destructive/30 shadow-2xl bg-card">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-destructive border border-destructive/30 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">
            حدث خطأ غير متوقع / An unexpected error occurred
          </h2>
          <p className="text-xs text-muted-foreground">
            يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue/90 shadow-md transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة / Try Again</span>
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-secondary hover:bg-muted text-foreground transition-all"
          >
            الرئيسية / Home
          </Link>
        </div>
      </div>
    </div>
  );
}
