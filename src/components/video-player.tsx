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
  Settings,
  Check,
  Tv,
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
  title?: string;
  courseName?: string;
  instructorName?: string;
  drmLabel?: string;
  onComplete?: () => void;
  onProgress?: (percent: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

function normalizeYouTubeId(raw: string | null | undefined): string {
  if (!raw) return "";
  const input = String(raw).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const match = input.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : input;
}

export default function VideoPlayer({
  provider = "youtube",
  videoId,
  userEmail = "",
  userId = "",
  isProtected = true,
  isPaidCourse = false,
  title,
  courseName,
  instructorName = "Eng: Ahmed Fathy",
  drmLabel = "FGC DRM",
  onComplete,
  onProgress,
}: VideoPlayerProps) {
  const resolvedVideoId = provider === "youtube" ? normalizeYouTubeId(videoId) : String(videoId || "").trim();
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
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  // Quality & Speed Popover states (Altura GIS style)
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      setIsQualityMenuOpen(false);
      setIsSpeedMenuOpen(false);
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  const getQualityLabel = (q: string) => {
    switch (q) {
      case "hd1080": return "1080p HD";
      case "hd720": return "720p HD";
      case "large": return "480p SD";
      case "medium": return "360p SD";
      case "small": return "240p SD";
      case "auto":
      default: return "تلقائي (Auto)";
    }
  };

  const getQualityShortLabel = (q: string) => {
    switch (q) {
      case "hd1080": return "1080p HD";
      case "hd720": return "720p HD";
      case "large": return "480p SD";
      case "medium": return "360p SD";
      case "small": return "240p SD";
      case "auto":
      default: return "Auto";
    }
  };

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
    if (!resolvedVideoId) {
      setIsBuffering(false);
      setIsReady(false);
      setPlayerError("لم يتم العثور على رابط الفيديو لهذا الدرس.");
      return;
    }

    let timer: NodeJS.Timeout;
    let apiWaitTimer: NodeJS.Timeout;
    let destroyed = false;

    setIsReady(false);
    setIsPlaying(false);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(0);
    setPlayerError(null);

    const initPlayer = () => {
      if (destroyed || !window.YT || !window.YT.Player) return false;

      // Unique element id for iframe container
      const containerId = `yt-player-${resolvedVideoId}`;
      const elem = document.getElementById(containerId);
      if (!elem) return false;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
      }

      playerRef.current = new window.YT.Player(containerId, {
        host: "https://www.youtube-nocookie.com",
        videoId: resolvedVideoId,
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
            if (destroyed) return;
            setIsReady(true);
            setIsBuffering(false);
            setPlayerError(null);
            setDuration(event.target.getDuration() || 0);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            if (destroyed) return;
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
            } else if (event.data === 5) {
              setIsBuffering(false);
            } else if (event.data === 0) {
              setIsPlaying(false);
              setIsBuffering(false);
              reportProgress(true);
              if (onComplete) onComplete();
            }
          },
          onError: (event: any) => {
            if (destroyed) return;
            setIsBuffering(false);
            setIsPlaying(false);
            const code = Number(event?.data);
            if (code === 101 || code === 150) {
              setPlayerError("تعذر تشغيل الفيديو داخل المشغل لأن التضمين معطل على هذا الفيديو في يوتيوب.");
            } else if (code === 100 || code === 2) {
              setPlayerError("الفيديو غير متاح أو الرابط غير صحيح. يرجى التواصل مع الإدارة.");
            } else {
              setPlayerError("حدث خطأ أثناء تحميل الفيديو. تأكد من اتصالك بالإنترنت أو عطّل مانع الإعلانات وحاول مجدداً.");
            }
          },
        },
      });
      return true;
    };

    if (!window.YT?.Player) {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === "function") {
          try { prevReady(); } catch {}
        }
        initPlayer();
      };

      // Poll briefly in case API script finished loading or callback already fired
      let attempts = 0;
      apiWaitTimer = setInterval(() => {
        attempts += 1;
        if (initPlayer()) {
          clearInterval(apiWaitTimer);
        } else if (attempts > 120) {
          clearInterval(apiWaitTimer);
          setIsBuffering(false);
          setPlayerError("تعذر الاتصال بخادم يوتيوب. يرجى التحقق من الشبكة أو إضافات حجب المحتوى.");
        }
      }, 100);
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
      destroyed = true;
      clearInterval(timer);
      clearInterval(apiWaitTimer);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [resolvedVideoId, provider, retrySeed]);

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
  const handleSpeedSelect = (rate: number) => {
    setPlaybackRate(rate);
    setIsSpeedMenuOpen(false);
    if (!playerRef.current) return;
    try {
      playerRef.current.setPlaybackRate(rate);
      triggerFeedback("volume", `${rate}x`);
    } catch {}
    resetControlsTimeout();
  };

  const handleSpeedChange = (rate: number) => {
    handleSpeedSelect(rate);
  };

  // 5.1 Playback Quality (Active Stream Switching)
  const handleQualitySelect = (newQuality: string) => {
    setQuality(newQuality);
    setIsQualityMenuOpen(false);
    if (!playerRef.current) return;
    try {
      const ytQuality = newQuality === "auto" ? "default" : newQuality;
      const curr = Math.floor(playerRef.current.getCurrentTime?.() || currentTime || 0);

      if (typeof playerRef.current.setPlaybackQuality === "function") {
        playerRef.current.setPlaybackQuality(ytQuality);
      }
      if (typeof playerRef.current.setPlaybackQualityRange === "function") {
        playerRef.current.setPlaybackQualityRange(ytQuality, ytQuality);
      }

      // Reload at current second with suggestedQuality
      if (typeof playerRef.current.loadVideoById === "function") {
        playerRef.current.loadVideoById({
          videoId: resolvedVideoId,
          startSeconds: curr,
          suggestedQuality: ytQuality,
        });
      }

      triggerFeedback("volume", getQualityShortLabel(newQuality));
    } catch (err) {
      console.warn("Quality switch error:", err);
    }
    resetControlsTimeout();
  };

  const handleQualityChange = (newQuality: string) => {
    handleQualitySelect(newQuality);
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
                id={`yt-player-${resolvedVideoId}`}
                className="w-full h-full pointer-events-none"
              />
            </div>
          ) : (
            <iframe
              src={`https://player.vimeo.com/video/${resolvedVideoId}`}
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

      {/* Buffering / Initializing Spinner */}
      {(isBuffering || (!isReady && !playerError && provider === "youtube")) && (
        <div className="absolute inset-0 m-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center pointer-events-none z-30 shadow-2xl">
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 text-brand-cyan animate-spin" />
        </div>
      )}

      {/* Player Error Overlay */}
      {playerError && (
        <div className="absolute inset-0 z-40 bg-[#030A11]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
          <p className="text-xs sm:text-sm text-slate-200 max-w-md leading-relaxed">
            {playerError}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setRetrySeed((s) => s + 1);
            }}
            className="px-4 py-2 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-xs font-bold transition-colors"
          >
            إعادة تحميل الفيديو
          </button>
        </div>
      )}

      {/* Dynamic Moving Watermark 1 */}
      {isProtected && (userEmail || userId) && (
        <div
          className="absolute pointer-events-none transition-all duration-1000 ease-in-out z-20"
          style={{
            top: watermarkPos.top,
            left: watermarkPos.left,
          }}
        >
          <div className="px-2.5 py-1 rounded bg-black/50 backdrop-blur-[2px] border border-white/15 text-white/50 text-[10px] sm:text-xs font-mono font-bold tracking-wider whitespace-nowrap shadow-md">
            {[userEmail, userId ? userId.slice(0, 8) : ""].filter(Boolean).join(" • ")}
          </div>
        </div>
      )}

      {/* Dynamic Moving Watermark 2 (Strict Paid Courses - Diagonal Ghost) */}
      {isProtected && isPaidCourse && userEmail && (
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

      {/* TOP OVERLAY BAR: Altura GIS Style (DRM Badge + Title on Right, Quality Pill on Left) */}
      <div
        style={{ direction: "ltr" }}
        className={`absolute top-0 inset-x-0 z-30 p-3 sm:p-4.5 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/85 via-black/40 to-transparent transition-all duration-300 ${
          showControls || !isPlaying
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {/* Left: Quality Quick Button & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsQualityMenuOpen((prev) => !prev);
              setIsSpeedMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
            title="جودة الفيديو"
          >
            <span>{getQualityShortLabel(quality)}</span>
            <Settings className="w-3.5 h-3.5 text-brand-cyan" />
          </button>

          {/* Quality Dropdown Popover (Exact Altura GIS Style) */}
          {isQualityMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full start-0 mt-2 w-36 sm:w-40 rounded-2xl bg-[#071322]/95 backdrop-blur-xl border border-white/15 p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95"
            >
              <div className="text-[11px] font-semibold text-slate-400 text-center py-1 border-b border-white/10 mb-1">
                جودة الفيديو
              </div>
              {[
                { key: "auto", label: "تلقائي (Auto)" },
                { key: "hd1080", label: "1080p HD" },
                { key: "hd720", label: "720p HD" },
                { key: "large", label: "480p SD" },
                { key: "medium", label: "360p SD" },
                { key: "small", label: "240p SD" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleQualitySelect(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    quality === item.key
                      ? "bg-brand-blue text-white shadow-md shadow-brand-blue/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  {quality === item.key && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Title & DRM Badge */}
        <div className="flex items-center gap-2 max-w-[70%] justify-end text-end" style={{ direction: "rtl" }}>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-blue/30 border border-brand-cyan/40 text-brand-cyan text-[10px] sm:text-[11px] font-bold tracking-wider whitespace-nowrap shadow-sm">
            <span>{drmLabel}</span>
            <Tv className="w-3 h-3 text-brand-cyan" />
          </div>
          {title && (
            <span className="text-xs sm:text-sm font-bold text-white drop-shadow truncate max-w-[200px] sm:max-w-[340px]">
              {title}
            </span>
          )}
        </div>
      </div>

      {/* Center Play Button & "Video Paused" Pill Badge (Altura GIS Style) */}
      {!isPlaying && !isBuffering && isReady && !playerError && (
        <div className="absolute inset-0 z-30 m-auto flex flex-col items-center justify-center pointer-events-none">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-brand-blue hover:bg-blue-600 text-white shadow-2xl shadow-brand-blue/50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all backdrop-blur-sm border-2 border-white/30 group/playbtn"
            aria-label="Play Video"
          >
            <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white drop-shadow-md" />
          </button>
          <div className="mt-3.5 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-brand-cream/90 text-xs sm:text-sm font-medium shadow-xl pointer-events-none select-none animate-in fade-in zoom-in-95">
            الفيديو موقّف مؤقتاً - انقر للمتابعة
          </div>
        </div>
      )}

      {/* MODERN GLASS CONTROLS BAR (Auto-fades on inactivity) */}
      <div
        style={{ direction: "ltr" }}
        className={`relative z-30 w-full bg-gradient-to-t from-black via-black/85 to-transparent px-3 py-2 sm:px-4 sm:py-3 space-y-1.5 sm:space-y-2 transition-all duration-300 ${
          showControls || !isPlaying
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Custom Sleek Progress Bar with Hover Preview Time */}
        <div
          ref={progressBarRef}
          style={{ direction: "ltr" }}
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
          <div className="relative w-full h-1 sm:h-1.5 group-hover/seek:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-200">
            {/* Played Solid Blue Fill */}
            <div
              className="h-full bg-gradient-to-r from-brand-blue to-brand-cyan rounded-full transition-[width] duration-75"
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

        {/* Controls Row (Matching Altura GIS Screenshot Layout) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 text-white text-xs">
          {/* Left: Fullscreen, Speed, Quality, Volume */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white active:scale-95 transition-all shrink-0"
              aria-label="Fullscreen"
              title={activeFullscreen ? "تصغير الشاشة (F)" : "تكبير الشاشة (F)"}
            >
              {activeFullscreen ? (
                <Minimize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              ) : (
                <Maximize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Playback Speed Pill Button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSpeedMenuOpen((prev) => !prev);
                  setIsQualityMenuOpen(false);
                }}
                className="px-2 py-1 rounded-lg hover:bg-white/10 text-white text-[10px] sm:text-[11px] font-bold font-mono transition-all"
                title="سرعة التشغيل"
              >
                {playbackRate}x
              </button>

              {/* Speed Popover */}
              {isSpeedMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full start-0 mb-2 w-28 rounded-2xl bg-[#071322]/95 backdrop-blur-xl border border-white/15 p-1.5 shadow-2xl z-50 space-y-0.5 animate-in fade-in zoom-in-95"
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedSelect(rate)}
                      className={`w-full flex items-center justify-between px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        playbackRate === rate
                          ? "bg-brand-blue text-white"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Pill Button (Bottom) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQualityMenuOpen((prev) => !prev);
                  setIsSpeedMenuOpen(false);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10 text-white text-[10px] sm:text-[11px] font-bold transition-all"
                title="جودة الفيديو"
              >
                <span>{getQualityShortLabel(quality)}</span>
                <Settings className="w-3 h-3 text-brand-cyan" />
              </button>
            </div>

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
                className="hidden md:block w-16 lg:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                style={{
                  background: `linear-gradient(to right, #1678D3 0%, #1678D3 ${
                    isMuted ? 0 : volume
                  }%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.2) 100%)`,
                }}
                title={`مستوى الصوت: ${isMuted ? 0 : volume}%`}
              />
            </div>
          </div>

          {/* Right Section: Time, Rewind, Forward, and Big Blue Play/Pause */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Time Display (LTR isolated) */}
            <span
              className="font-mono text-[10px] sm:text-xs text-white/90 whitespace-nowrap px-1 sm:px-2"
              style={{ direction: "ltr", unicodeBidi: "isolate" }}
            >
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Rewind 10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime - 10, true, "rewind")}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white/90 hover:text-white transition-all shrink-0"
              title="ترجيع 10 ثوانٍ (J)"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Forward 10s */}
            <button
              type="button"
              onClick={() => handleSeek(currentTime + 10, true, "forward")}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 active:scale-95 text-white/90 hover:text-white transition-all shrink-0"
              title="تقديم 10 ثوانٍ (L)"
            >
              <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Circular Solid Blue Play/Pause Button (Matching Altura GIS) */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-blue hover:bg-blue-600 text-white shadow-lg shadow-brand-blue/40 flex items-center justify-center active:scale-95 transition-all shrink-0 border border-white/20 ms-1"
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "إيقاف مؤقت (Space)" : "تشغيل (Space)"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
