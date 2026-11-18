"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldAlert,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

export type VideoProvider = "youtube" | "bunny" | "vimeo";

interface VideoPlayerProps {
  provider?: VideoProvider;
  videoId: string;
  userEmail?: string;
  userId?: string;
  isProtected?: boolean;
  isPaidCourse?: boolean;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayer({
  provider = "youtube",
  videoId,
  userEmail = "student@fathygeocode.com",
  userId = "FGC-STUDENT",
  isProtected = true,
  isPaidCourse = false,
  onComplete,
  onProgress,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<any>(null);
  const lastProgressReportRef = useRef<number>(0);

  // Throttled progress reporter (every 20s or forced on pause/stop)
  const reportProgress = useCallback((force: boolean = false) => {
    if (!playerRef.current || !onProgress) return;
    try {
      const curr = playerRef.current.getCurrentTime() || 0;
      const dur = playerRef.current.getDuration() || 0;
      if (dur <= 0) return;
      const now = Date.now();
      if (force || now - lastProgressReportRef.current >= 20000) {
        lastProgressReportRef.current = now;
        onProgress((curr / dur) * 100);
      }
    } catch {}
  }, [onProgress]);

  // Watermark and visibility state
  const [watermarkPos, setWatermarkPos] = useState({ top: "25%", left: "30%" });
  const [watermarkPos2, setWatermarkPos2] = useState({ top: "70%", left: "65%" });
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isScreenshotAttempted, setIsScreenshotAttempted] = useState(false);
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(false);

  // Player controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const activeFullscreen = isFullscreen || isPseudoFullscreen;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. Initialize YouTube Iframe API
  useEffect(() => {
    if (provider !== "youtube") return;

    let timer: NodeJS.Timeout;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      // Unique element id for iframe container
      const containerId = `yt-player-${videoId}`;
      const elem = document.getElementById(containerId);
      if (!elem) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player(containerId, {
        host: "https://www.youtube-nocookie.com",
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: typeof window !== "undefined" ? window.location.origin : "",
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
            } else if (event.data === 2) {
              setIsPlaying(false);
              reportProgress(true);
            } else if (event.data === 0) {
              setIsPlaying(false);
              reportProgress(true);
              if (onComplete) onComplete();
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    // Time update poller
    timer = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const curr = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(curr);
          if (dur > 0 && dur !== duration) setDuration(dur);
          reportProgress(false);
        } catch {}
      }
    }, 500);

    return () => {
      clearInterval(timer);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId, provider]);

  // 2. Play / Pause Control
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch {}
  }, [isPlaying]);

  // 3. Seek Control
  const handleSeek = (newTime: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch {}
  };

  // 4. Volume Control
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!playerRef.current) return;
    try {
      playerRef.current.setVolume(newVol);
      if (newVol === 0) {
        playerRef.current.mute();
        setIsMuted(true);
      } else if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    } catch {}
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        playerRef.current.setVolume(volume || 50);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch {}
  };

  // 5. Playback Speed
  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(rate);
    } catch {}
  };

  // 5.1 Playback Quality
  const handleQualityChange = (newQuality: string) => {
    setQuality(newQuality);
    if (!playerRef.current) return;
    try {
      if (typeof playerRef.current.setPlaybackQuality === "function") {
        playerRef.current.setPlaybackQuality(newQuality);
      }
    } catch {}
  };

  // 6. Fullscreen (with iOS / mobile WebView pseudo-fullscreen fallback)
  const toggleFullscreen = async () => {
    const el = containerRef.current as any;
    if (!el) return;

    const doc = document as any;
    const fsElement = doc.fullscreenElement || doc.webkitFullscreenElement;

    if (fsElement || isPseudoFullscreen) {
      if (fsElement) {
        try {
          if (doc.exitFullscreen) await doc.exitFullscreen();
          else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        } catch {}
      }
      try {
        (screen.orientation as any)?.unlock?.();
      } catch {}
      setIsFullscreen(false);
      setIsPseudoFullscreen(false);
      return;
    }

    let enteredNative = false;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        enteredNative = true;
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        enteredNative = true;
      }
    } catch {
      enteredNative = false;
    }

    if (enteredNative) {
      setIsFullscreen(true);
      try {
        await (screen.orientation as any)?.lock?.("landscape");
      } catch {}
    } else {
      // Fallback for iPhone Safari & mobile WebViews where div.requestFullscreen is unsupported
      setIsPseudoFullscreen(true);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(doc.fullscreenElement || doc.webkitFullscreenElement));
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPseudoFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    window.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // 7. Dynamic Moving Watermarks
  useEffect(() => {
    if (!isProtected) return;
    const interval = setInterval(() => {
      const top = `${Math.floor(Math.random() * 65 + 15)}%`;
      const left = `${Math.floor(Math.random() * 60 + 10)}%`;
      setWatermarkPos({ top, left });
    }, isPaidCourse ? 12000 : 20000);

    let interval2: NodeJS.Timeout | null = null;
    if (isPaidCourse) {
      interval2 = setInterval(() => {
        const top = `${Math.floor(Math.random() * 60 + 20)}%`;
        const left = `${Math.floor(Math.random() * 55 + 20)}%`;
        setWatermarkPos2({ top, left });
      }, 15000);
    }

    return () => {
      clearInterval(interval);
      if (interval2) clearInterval(interval2);
    };
  }, [isProtected, isPaidCourse]);

  // 8. Tab Visibility & Anti-Recording Window Blur (Strict on Paid Courses)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsTabHidden(true);
        if (playerRef.current && isPlaying) {
          try {
            playerRef.current.pauseVideo();
          } catch {}
        }
      } else {
        setIsTabHidden(false);
      }
    };

    const handleBlur = () => {
      if (!isProtected || !isPaidCourse) return;
      setIsWindowBlurred(true);
      if (playerRef.current && isPlaying) {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
    };

    const handleFocus = () => {
      setIsWindowBlurred(false);
    };

    const handlePageHide = () => {
      if (!isProtected || !isPaidCourse) return;
      setIsWindowBlurred(true);
      if (playerRef.current && isPlaying) {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [isProtected, isPaidCourse, isPlaying]);

  // 8.1 Anti-Screenshot & Screen-Recording Shortcut Interceptor (Paid Courses)
  useEffect(() => {
    if (!isProtected || !isPaidCourse) return;

    let timeoutId: NodeJS.Timeout;

    const triggerBlackout = () => {
      setIsScreenshotAttempted(true);
      if (playerRef.current && isPlaying) {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("");
        }
      } catch {}

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsScreenshotAttempted(false);
      }, 4000);
    };

    const handleKeyDownCapture = (e: KeyboardEvent) => {
      // PrintScreen / PrtScn
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerBlackout();
        return false;
      }

      // Windows Snipping Tool: Win + Shift + S or Ctrl + Shift + S
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        triggerBlackout();
        return false;
      }

      // Mac screenshot: Cmd + Shift + 3, 4, 5
      if (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        e.preventDefault();
        triggerBlackout();
        return false;
      }

      // Print dialog: Ctrl + P / Cmd + P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerBlackout();
        return false;
      }
    };

    const handleKeyUpCapture = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        triggerBlackout();
        return false;
      }
    };

    window.addEventListener("keydown", handleKeyDownCapture, true);
    window.addEventListener("keyup", handleKeyUpCapture, true);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDownCapture, true);
      window.removeEventListener("keyup", handleKeyUpCapture, true);
    };
  }, [isProtected, isPaidCourse, isPlaying]);

  // 8.2 DevTools & External Overlay Detection (Paid Courses)
  useEffect(() => {
    if (!isProtected || !isPaidCourse) return;

    const checkDimensions = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        setIsDevToolsDetected(true);
      } else {
        setIsDevToolsDetected(false);
      }
    };

    const interval = setInterval(checkDimensions, 1500);
    window.addEventListener("resize", checkDimensions);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDimensions);
    };
  }, [isProtected, isPaidCourse]);

  // 9. Disable Right Click & DevTools shortcuts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
        (e.ctrlKey && (e.key === "s" || e.key === "S"))
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        isPseudoFullscreen
          ? "fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black select-none group flex flex-col justify-end overflow-hidden"
          : "relative w-full aspect-video rounded-2xl overflow-hidden bg-black select-none shadow-2xl border border-border/80 group flex flex-col justify-end"
      }
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* Video Frame Layer — crops out YouTube top header (title/copy link/share) and bottom YouTube logo */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black pointer-events-none overflow-hidden">
        <div
          className="relative w-full aspect-video overflow-hidden"
          style={
            activeFullscreen
              ? { width: "min(100vw, calc(100dvh * 16 / 9))" }
              : undefined
          }
        >
          {provider === "youtube" ? (
            <div className="absolute inset-x-0 -top-[72px] h-[calc(100%+144px)] pointer-events-none">
              <div
                id={`yt-player-${videoId}`}
                className="w-full h-full pointer-events-none"
              />
            </div>
          ) : (
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title="Course Video"
              allow="autoplay; fullscreen"
              className="w-full h-full border-0 pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* CLICK-SHIELD OVERLAY (Protects against clicking YouTube UI, title, share, etc.) */}
      <div
        onClick={togglePlay}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        title={isPlaying ? "انقر للإيقاف المؤقت" : "انقر للتشغيل"}
      />

      {/* Dynamic Moving Watermark 1 */}
      {isProtected && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-20"
          style={{
            top: watermarkPos.top,
            left: watermarkPos.left,
          }}
        >
          <div className="px-2.5 py-1 rounded bg-black/50 backdrop-blur-[2px] border border-white/15 text-white/50 text-[10px] sm:text-xs font-mono font-bold tracking-wider whitespace-nowrap shadow-md">
            {userEmail} • {userId.slice(0, 8)}
          </div>
        </div>
      )}

      {/* Dynamic Moving Watermark 2 (Strict Paid Courses - Diagonal Ghost) */}
      {isProtected && isPaidCourse && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-20 select-none opacity-30 hover:opacity-10"
          style={{
            top: watermarkPos2.top,
            left: watermarkPos2.left,
          }}
        >
          <div className="px-2 py-0.5 rounded text-white/40 text-[9px] sm:text-[11px] font-mono tracking-widest uppercase">
            FGC • {userEmail.split("@")[0]}
          </div>
        </div>
      )}

      {/* Strict Anti-Recording & Screenshot Blackout Overlay (Paid Courses) */}
      {isPaidCourse && (isScreenshotAttempted || isWindowBlurred || isDevToolsDetected) && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center p-6 text-center text-white space-y-3.5 select-none animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse shadow-lg shadow-red-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-red-400">
              {isScreenshotAttempted
                ? "محاولة تصوير محظورة!"
                : isDevToolsDetected
                ? "تم حظر الشاشة لاكتشاف أدوات خارجية"
                : "تم إيقاف الشاشة مؤقتاً لحماية الفيديو"}
            </h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {isScreenshotAttempted
                ? "يمنع تصوير أو تسجيل شاشة الدروس المدفوعة. تم حظر اللقطة وتعتيم الشاشة للحفاظ على حقوق الملكية الفكرية."
                : "تم تعتيم وإيقاف الفيديو تلقائياً بسبب مغادرة النافذة أو فتح برنامج تسجيل خارجي. انقر بالأسفل للمتابعة."}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsWindowBlurred(false);
              setIsScreenshotAttempted(false);
              setIsDevToolsDetected(false);
            }}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 shadow-sm"
          >
            العودة لمتابعة الدرس
          </button>
        </div>
      )}

      {/* Tab Hidden Shield Overlay (Free & Standard Courses) */}
      {!isPaidCourse && isTabHidden && isProtected && (
        <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <ShieldAlert className="w-12 h-12 text-brand-cyan animate-pulse" />
          <h3 className="text-lg font-bold">تم إيقاف العرض مؤقتاً</h3>
          <p className="text-xs text-slate-300 max-w-sm">
            تم إيقاف تشغيل المحتوى لحماية الملكية الفكرية أثناء عدم نشاط النافذة. عد إلى الصفحة للمتابعة.
          </p>
        </div>
      )}

      {/* Big Center Play Button when Paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 z-20 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-blue/90 text-white shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-brand-blue transition-all backdrop-blur-sm"
          aria-label="Play Video"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
        </button>
      )}

      {/* CUSTOM CONTROLS BAR (Responsive on mobile + opaque bottom mask hides any YouTube link/chrome) */}
      <div className="relative z-20 w-full bg-gradient-to-t from-black via-black/90 to-transparent px-2.5 py-2 sm:p-4 space-y-1.5 sm:space-y-2 opacity-95 group-hover:opacity-100 transition-opacity">
        {/* Progress / Seek bar */}
        <div className="w-full flex items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/25 rounded-lg appearance-none cursor-pointer accent-brand-cyan hover:h-2 transition-all"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 text-white text-xs">
          {/* Start: Play/Pause, Replay 10s, Time */}
          <div className="flex items-center gap-1 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(Math.max(0, currentTime - 10))}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/85 hover:text-white transition-colors text-[10px] sm:text-[11px] font-mono flex items-center gap-0.5 shrink-0"
              title="-10 ثوانٍ"
            >
              <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>10s</span>
            </button>

            <span className="font-mono text-[10px] sm:text-xs text-white/85 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* End: Volume, Quality, Speed, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Volume (Slider hidden on narrow mobile so Fullscreen always fits cleanly) */}
            <div className="flex items-center gap-1 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors shrink-0"
                aria-label="Mute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="hidden sm:block w-16 md:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
              />
            </div>

            {/* Quality Selector */}
            <div className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-white/60 hidden md:inline" />
              <select
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
                className="bg-black/60 border border-white/20 text-white text-[10px] sm:text-[11px] font-bold rounded-lg px-1.5 sm:px-2 py-1 outline-none hover:bg-black/80 transition-colors cursor-pointer"
                title="جودة الفيديو"
              >
                <option value="auto" className="bg-slate-900">Auto</option>
                <option value="hd1080" className="bg-slate-900">1080p</option>
                <option value="hd720" className="bg-slate-900">720p</option>
                <option value="large" className="bg-slate-900">480p</option>
                <option value="medium" className="bg-slate-900">360p</option>
              </select>
            </div>

            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="bg-black/60 border border-white/20 text-white text-[10px] sm:text-[11px] font-bold rounded-lg px-1.5 sm:px-2 py-1 outline-none hover:bg-black/80 transition-colors cursor-pointer"
              title="سرعة التشغيل"
            >
              <option value="0.75" className="bg-slate-900">0.75x</option>
              <option value="1" className="bg-slate-900">1x</option>
              <option value="1.25" className="bg-slate-900">1.25x</option>
              <option value="1.5" className="bg-slate-900">1.5x</option>
              <option value="2" className="bg-slate-900">2x</option>
            </select>

            {/* Fullscreen (Always visible & prominent on mobile) */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-white transition-colors shrink-0"
              aria-label="Fullscreen"
              title={activeFullscreen ? "تصغير الشاشة" : "تكبير الشاشة"}
            >
              {activeFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
