import { NextResponse } from "next/server";
import { extractYouTubeId } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url") || "";
    const videoId = extractYouTubeId(url);

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube video URL" },
        { status: 400 }
      );
    }

    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const fallbackThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const maxresThumb = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
        {
          signal: AbortSignal.timeout(5000),
          cache: "no-store",
        }
      );

      if (oembedRes.ok) {
        const data = await oembedRes.json();
        return NextResponse.json({
          videoId,
          title: data?.title || null,
          author: data?.author_name || null,
          thumbnailUrl: data?.thumbnail_url || fallbackThumb,
          maxresThumbnailUrl: maxresThumb,
          canonicalUrl,
        });
      }
    } catch {
      // Fallback safely to deterministic YouTube thumbnail even if oEmbed times out
    }

    return NextResponse.json({
      videoId,
      title: null,
      author: null,
      thumbnailUrl: fallbackThumb,
      maxresThumbnailUrl: maxresThumb,
      canonicalUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch YouTube metadata" },
      { status: 500 }
    );
  }
}
