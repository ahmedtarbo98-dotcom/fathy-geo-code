import { NextResponse } from "next/server";
import { getPublishedProjects } from "@/lib/projects-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const featuredOnly = url.searchParams.get("featured") === "true";
    const projects = await getPublishedProjects({ featuredOnly });
    return NextResponse.json({ projects });
  } catch {
    return NextResponse.json({ projects: [] });
  }
}
