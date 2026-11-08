"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, Play, Pause, Volume2, Maximize, AlertCircle } from "lucide-react";

export type VideoProvider = "youtube" | "bunny" | "vimeo";

interface VideoPlayerProps {
  provider?: VideoProvider;
  videoId: string;
  userEmail?: string;
  userId?: string;
  isProtected?: boolean;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

export default function VideoPlayer({
  provider = "youtube",
  videoId,
  userEmail = "student@fathygeocode.com",
  userId = "FGC-STUDENT",
  isProtected = true,
  onComplete,
  onProgress,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [watermarkPos, setWatermarkPos] = useState({ top: "25%", left: "30%" });
  const [isTabHidden, setIsTabHidden] = useState(false);

  // 1. Moving dynamic watermark every 20 seconds
  useEffect(() => {
    if (!isProtected) return;

    const interval = setInterval(() => {
      const top = `${Math.floor(Math.random() * 70 + 15)}%`;
      const left = `${Math.floor(Math.random() * 65 + 10)}%`;
      setWatermarkPos({ top, left });
    }, 20000); // 20s

    return () => clearInterval(interval);
  }, [isProtected]);

  // 2. Tab visibility tracking (pause overlay when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 3. Security guards: disable right click, inspection shortcuts
  useEffect(() => {
    if (!isProtected) return;

    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s")
      ) {
        e.preventDefault();
        return false;
      }
    };

    container.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProtected]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black select-none shadow-2xl border border-border/80 group"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Provider Abstraction */}
      {provider === "youtube" ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&iv_load_policy=3&enablejsapi=1`}
          title="FATHY GEO CODE Lecture"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      ) : provider === "bunny" ? (
        /* Bunny.net stream player placeholder ready for DRM upgrade */
        <div className="w-full h-full flex items-center justify-center text-white bg-slate-900">
          <p>Bunny Stream DRM Provider (Configured)</p>
        </div>
      ) : (
        /* Vimeo player placeholder */
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title="Course Video"
          allow="autoplay; fullscreen; picture-in-picture"
          className="w-full h-full border-0"
        />
      )}

      {/* Dynamic Moving Watermark */}
      {isProtected && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-20"
          style={{
            top: watermarkPos.top,
            left: watermarkPos.left,
          }}
        >
          <div className="px-2.5 py-1 rounded bg-black/40 backdrop-blur-[1px] border border-white/10 text-white/40 text-[10px] sm:text-xs font-mono font-bold tracking-wider whitespace-nowrap shadow-sm">
            {userEmail} • {userId.slice(0, 8)}
          </div>
        </div>
      )}

      {/* Tab Hidden Shield Overlay */}
      {isTabHidden && isProtected && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <ShieldAlert className="w-12 h-12 text-brand-cyan animate-pulse" />
          <h3 className="text-lg font-bold">تم إيقاف العرض مؤقتاً</h3>
          <p className="text-xs text-slate-300 max-w-sm">
            تم إيقاف تشغيل المحتوى لحماية الملكية الفكرية أثناء عدم نشاط النافذة. عد إلى الصفحة للمتابعة.
          </p>
        </div>
      )}
    </div>
  );
}
