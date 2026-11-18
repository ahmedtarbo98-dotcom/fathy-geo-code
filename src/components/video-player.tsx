"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldAlert,
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Sparkles,
  SlidersHorizontal,
  Loader2,
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
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Modern UI & Interaction states
  const [showControls, setShowControls] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    type: "play" | "pause" | "forward" | "rewind" | "volume" | "mute";
    text?: string;
    id: number;
  } | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [isPlaying]);

  const triggerFeedback = useCallback(
    (
      type: "play" | "pause" | "forward" | "rewind" | "volume" | "mute",
      text?: string
    ) => {
      setFeedback({ type, text, id: Date.now() });
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = setTimeout(() => {
        setFeedback(null);
      }, 650);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

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
            // YT.PlayerState: PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5, ENDED = 0
            if (event.data === 1) {
              setIsPlaying(true);
              setIsBuffering(false);
            } else if (event.data === 2) {
              setIsPlaying(false);
              setIsBuffering(false);
              reportProgress(true);
            } else if (event.data === 3) {
              setIsBuffering(true);
            } else if (event.data === 0) {
              setIsPlaying(false);
              setIsBuffering(false);
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
        setIsPlaying(false);
        triggerFeedback("pause");
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
        triggerFeedback("play");
      }
    } catch {}
    resetControlsTimeout();
  }, [isPlaying, triggerFeedback, resetControlsTimeout]);

  // 3. Seek Control
  const handleSeek = useCallback(
    (newTime: number, showVisual: boolean = false, type?: "forward" | "rewind") => {
      if (!playerRef.current) return;
      const clamped = Math.max(0, Math.min(duration || 10000, newTime));
      try {
        playerRef.current.seekTo(clamped, true);
        setCurrentTime(clamped);
        if (showVisual && type) {
          triggerFeedback(type, type === "forward" ? "+10s" : "-10s");
        }
      } catch {}
      resetControlsTimeout();
    },
    [duration, triggerFeedback, resetControlsTimeout]
  );

  // 4. Volume Control
  const handleVolumeChange = useCallback(
    (newVol: number) => {
      const clamped = Math.max(0, Math.min(100, newVol));
      setVolume(clamped);
      if (!playerRef.current) return;
      try {
        playerRef.current.setVolume(clamped);
        if (clamped === 0) {
          playerRef.current.mute();
          setIsMuted(true);
        } else if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
      resetControlsTimeout();
    },
    [isMuted, resetControlsTimeout]
  );

  const toggleMute = useCallback(() => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
        playerRef.current.setVolume(volume || 50);
        triggerFeedback("volume", `${volume || 50}%`);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
        triggerFeedback("mute");
      }
    } catch {}
    resetControlsTimeout();
  }, [isMuted, volume, triggerFeedback, resetControlsTimeout]);

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
      const ytQuality = newQuality === "auto" ? "default" : newQuality;
      const curr = Math.floor(playerRef.current.getCurrentTime?.() || currentTime || 0);

      if (typeof playerRef.current.setPlaybackQuality === "function") {
        playerRef.current.setPlaybackQuality(ytQuality);
      }

      // Force YouTube stream switch by reloading at current second with suggestedQuality
      if (typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById({
          videoId: videoId,
          startSeconds: curr,
          suggestedQuality: ytQuality,
        });
      }

      triggerFeedback("volume", newQuality.toUpperCase());
    } catch (err) {
      console.warn("Quality switch error:", err);
    }
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

  // 6.1 Keyboard Shortcuts for Power Users (Space/K = Play, J/L or Arrows = Seek, M = Mute, F = Fullscreen)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "L") {
        e.preventDefault();
        handleSeek(currentTime + 10, true, "forward");
      } else if (e.key === "ArrowLeft" || e.key === "j" || e.key === "J") {
        e.preventDefault();
        handleSeek(currentTime - 10, true, "rewind");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = Math.min(100, volume + 5);
        handleVolumeChange(next);
        triggerFeedback("volume", `${next}%`);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.max(0, volume - 5);
        handleVolumeChange(next);
        triggerFeedback("volume", `${next}%`);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [currentTime, volume, togglePlay, handleSeek, handleVolumeChange, toggleMute, triggerFeedback]);

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
      dir="ltr"
      onMouseMove={resetControlsTimeout}
      onMouseEnter={resetControlsTimeout}
      onTouchStart={resetControlsTimeout}
      className={
        isPseudoFullscreen
          ? `fixed inset-0 z-[9999] w-screen h-[100dvh] bg-black select-none group flex flex-col justify-end overflow-hidden ${
              !showControls && isPlaying ? "cursor-none" : "cursor-default"
            }`
          : `relative w-full aspect-video rounded-2xl overflow-hidden bg-black select-none shadow-2xl border border-border/80 group flex flex-col justify-end ${
              !showControls && isPlaying ? "cursor-none" : "cursor-default"
            }`
      }
      style={{ userSelect: "none", WebkitUserSelect: "none", direction: "ltr" }}
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

      {/* Interactive Overlay with Single & Double-Click Support */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;

          if (e.detail === 2) {
            // Double click: Rewind on left 35%, Forward on right 35%, Fullscreen in middle
            if (clickX < width * 0.35) {
              handleSeek(currentTime - 10, true, "rewind");
            } else if (clickX > width * 0.65) {
              handleSeek(currentTime + 10, true, "forward");
            } else {
              toggleFullscreen();
            }
          } else if (e.detail === 1) {
            togglePlay();
          }
        }}
        className="absolute inset-0 z-10 cursor-pointer bg-transparent"
        title={isPlaying ? "انقر للإيقاف المؤقت (نقر مزدوج للتقديم/الترجيع)" : "انقر للتشغيل"}
      />

      {/* Visual Feedback Badge (Center Ripple) */}
      {feedback && (
        <div
          key={feedback.id}
          className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white flex flex-col items-center justify-center pointer-events-none z-30 transition-all duration-300 shadow-2xl animate-in fade-in zoom-in-90"
        >
          {feedback.type === "play" && <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white ml-0.5" />}
          {feedback.type === "pause" && <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />}
          {feedback.type === "forward" && (
            <>
              <RotateCw className="w-5 h-5 text-brand-cyan" />
              <span className="text-[9px] font-mono font-bold text-brand-cyan mt-0.5">{feedback.text}</span>
            </>
          )}
          {feedback.type === "rewind" && (
            <>
              <RotateCcw className="w-5 h-5 text-brand-cyan" />
              <span className="text-[9px] font-mono font-bold text-brand-cyan mt-0.5">{feedback.text}</span>
            </>
          )}
          {feedback.type === "volume" && (
            <>
              <Volume2 className="w-5 h-5 text-white" />
              <span className="text-[9px] font-mono font-bold mt-0.5">{feedback.text}</span>
            </>
          )}
          {feedback.type === "mute" && <VolumeX className="w-6 h-6 text-red-400" />}
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none z-20 shadow-2xl">
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-brand-cyan animate-spin" />
        </div>
      )}

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
      {!isPlaying && !isBuffering && isReady && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 z-20 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-blue/90 hover:bg-brand-blue text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all backdrop-blur-sm group/playbtn border border-white/20"
          aria-label="Play Video"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white drop-shadow" />
        </button>
      )}

      {/* MODERN GLASS CONTROLS BAR (Auto-fades on inactivity) */}
      <div
        className={`relative z-20 w-full bg-gradient-to-t from-black via-black/85 to-transparent px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 sm:space-y-2 transition-all duration-300 ${
          showControls || !isPlaying
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Custom Sleek Progress Bar with Hover Preview Time */}
        <div
          ref={progressBarRef}
          onMouseMove={(e) => {
            if (!progressBarRef.current || duration <= 0) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setHoverPos(pos * 100);
            setHoverTime(pos * duration);
          }}
          onMouseLeave={() => setHoverTime(null)}
          onClick={(e) => {
            if (!progressBarRef.current || duration <= 0) return;
            const rect = progressBarRef.current.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            handleSeek(pos * duration);
          }}
          className="group/seek relative w-full py-2 cursor-pointer flex items-center select-none"
        >
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-black/90 backdrop-blur-md border border-white/20 text-white font-mono text-[10px] pointer-events-none shadow-xl z-30 whitespace-nowrap"
              style={{ left: `${hoverPos}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Track container */}
          <div className="relative w-full h-1.5 group-hover/seek:h-2.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200">
            {/* Played Gradient Fill */}
            <div
              className="h-full bg-gradient-to-r from-brand-blue via-brand-cyan to-cyan-300 rounded-full transition-[width] duration-75"
              style={{
                width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%`,
              }}
            />
          </div>

          {/* Glowing Thumb Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-brand-cyan shadow-lg shadow-cyan-500/50 scale-0 group-hover/seek:scale-100 transition-transform duration-150 pointer-events-none"
            style={{
              left: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%`,
            }}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 text-white text-xs">
          {/* Start: Play/Pause, Rewind 10s, Forward 10s, Time */}
          <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white transition-all shrink-0"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "إيقاف مؤقت (Space)" : "تشغيل (Space)"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              )}
            </button>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime - 10, true, "rewind")}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white/85 hover:text-white transition-all text-[10px] sm:text-[11px] font-mono flex items-center gap-0.5 shrink-0"
              title="ترجيع 10 ثوانٍ (J)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">10s</span>
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime + 10, true, "forward")}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white/85 hover:text-white transition-all text-[10px] sm:text-[11px] font-mono flex items-center gap-0.5 shrink-0"
              title="تقديم 10 ثوانٍ (L)"
            >
              <span className="hidden sm:inline">10s</span>
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Time Display */}
            <span
              className="font-mono text-[10px] sm:text-xs text-white/85 whitespace-nowrap px-1"
              style={{ direction: "ltr" }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* End: Volume, Quality, Speed, Fullscreen */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Volume Control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors shrink-0"
                aria-label="Mute"
                title="كتم / تشغيل الصوت (M)"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : volume < 50 ? (
                  <Volume1 className="w-4 h-4" />
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
                className="hidden sm:block w-14 md:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-cyan"
                title={`مستوى الصوت: ${isMuted ? 0 : volume}%`}
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
                <option value="auto" className="bg-slate-900">Auto (تلقائي)</option>
                <option value="hd1080" className="bg-slate-900">1080p FHD</option>
                <option value="hd720" className="bg-slate-900">720p HD</option>
                <option value="large" className="bg-slate-900">480p SD</option>
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

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all shrink-0"
              aria-label="Fullscreen"
              title={activeFullscreen ? "تصغير الشاشة (F)" : "تكبير الشاشة (F)"}
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
