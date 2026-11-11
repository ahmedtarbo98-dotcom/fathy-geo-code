import { NextResponse } from "next/server";
import { getPublicPlatformStats } from "@/lib/public-stats";

export const revalidate = 300;

export async function GET() {
  const stats = await getPublicPlatformStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
