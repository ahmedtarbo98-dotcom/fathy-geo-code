import { createClient } from "@supabase/supabase-js";
import type { ProjectRecord } from "@/lib/projects";

function getPublicClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey || supabaseUrl.includes("placeholder-project")) {
    return null;
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getPublishedProjects(options?: {
  featuredOnly?: boolean;
  limit?: number;
}): Promise<ProjectRecord[]> {
  const client = getPublicClient();
  if (!client) return [];

  try {
    let query = client
      .from("projects")
      .select(`*, project_media (*)`)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (options?.featuredOnly) {
      query = query.eq("is_featured", true);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as ProjectRecord[]).map((p) => ({
      ...p,
      tools: Array.isArray(p.tools) ? p.tools : [],
      project_media: (p.project_media || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));
  } catch {
    return [];
  }
}

export async function getPublishedProjectBySlug(
  slug: string
): Promise<ProjectRecord | null> {
  const client = getPublicClient();
  if (!client) return null;

  try {
    const cleanSlug = decodeURIComponent(slug).trim();
    const { data, error } = await client
      .from("projects")
      .select(`*, project_media (*)`)
      .eq("slug", cleanSlug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) return null;
    const project = data as ProjectRecord;
    return {
      ...project,
      tools: Array.isArray(project.tools) ? project.tools : [],
      project_media: (project.project_media || []).sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    };
  } catch {
    return null;
  }
}
