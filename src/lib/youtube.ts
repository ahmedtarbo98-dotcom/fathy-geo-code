/**
 * Utilities for parsing YouTube video URLs and deriving official YouTube thumbnails.
 */

export function extractYouTubeId(input?: string | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Allow direct 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const vParam = url.searchParams.get("v");
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        ["shorts", "embed", "live", "v"].includes(parts[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    // Fallback regex for malformed URLs
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match?.[1]) return match[1];
  }

  return null;
}

export function getYouTubeThumbnails(urlOrId?: string | null): {
  videoId: string | null;
  maxres: string | null;
  hq: string | null;
} {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) {
    return { videoId: null, maxres: null, hq: null };
  }
  return {
    videoId,
    maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}
