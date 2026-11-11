import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/admin-auth";
import {
  PROJECT_IMAGE_BUCKET,
  extractStoragePathFromUrl,
  projectInputSchema,
  type ProjectMediaItem,
} from "@/lib/projects";

export const dynamic = "force-dynamic";

function revalidateProjectRoutes(slug?: string | null) {
  try {
    revalidateTag("projects");
    revalidatePath("/ar");
    revalidatePath("/en");
    revalidatePath("/ar/projects");
    revalidatePath("/en/projects");
    revalidatePath("/sitemap.xml");
    if (slug) {
      revalidatePath(`/ar/projects/${slug}`);
      revalidatePath(`/en/projects/${slug}`);
    }
  } catch (err) {
    console.warn("Revalidate project routes warning:", err);
  }
}

async function removeStorageUrls(
  adminClient: any,
  urls: Array<string | null | undefined>
) {
  const paths = Array.from(
    new Set(
      urls
        .map((u) => extractStoragePathFromUrl(u, PROJECT_IMAGE_BUCKET))
        .filter((p): p is string => Boolean(p))
    )
  );
  if (paths.length === 0) return;
  try {
    await adminClient.storage.from(PROJECT_IMAGE_BUCKET).remove(paths);
  } catch (err) {
    console.warn("Storage cleanup warning:", err);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const { data, error } = await auth.adminClient
      .from("projects")
      .select(`*, project_media (*)`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    const projects = (data || []).map((p: any) => ({
      ...p,
      tools: Array.isArray(p.tools) ? p.tools : [],
      project_media: (p.project_media || []).sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    }));

    return NextResponse.json({ projects });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const body = await request.json();

    // Duplicate existing project
    if (body?.action === "duplicate" && body?.sourceId) {
      const { data: source, error: srcErr } = await adminClient
        .from("projects")
        .select(`*, project_media (*)`)
        .eq("id", body.sourceId)
        .single();

      if (srcErr || !source) {
        return NextResponse.json({ error: "Source project not found" }, { status: 404 });
      }

      const copySlug = `${source.slug}-copy-${Date.now().toString(36)}`;
      const { data: maxOrderRow } = await adminClient
        .from("projects")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (maxOrderRow?.sort_order ?? -1) + 1;

      const { data: duplicated, error: dupErr } = await adminClient
        .from("projects")
        .insert({
          slug: copySlug,
          title_ar: source.title_ar ? `${source.title_ar} (نسخة)` : "",
          title_en: source.title_en ? `${source.title_en} (Copy)` : "",
          short_description_ar: source.short_description_ar,
          short_description_en: source.short_description_en,
          details_ar: source.details_ar,
          details_en: source.details_en,
          category: source.category,
          client_name: source.client_name,
          location: source.location,
          project_date: source.project_date,
          tools: source.tools || [],
          cover_image_url: source.cover_image_url,
          is_published: false,
          is_featured: false,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (dupErr || !duplicated) throw dupErr;

      if (Array.isArray(source.project_media) && source.project_media.length > 0) {
        const mediaRows = source.project_media.map((m: any, idx: number) => ({
          project_id: duplicated.id,
          type: m.type,
          url: m.url,
          caption_ar: m.caption_ar || "",
          caption_en: m.caption_en || "",
          sort_order: m.sort_order ?? idx,
        }));
        await adminClient.from("project_media").insert(mediaRows);
      }

      revalidateProjectRoutes(duplicated.slug);
      return NextResponse.json({ project: duplicated });
    }

    const parsed = projectInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid project payload",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Ensure unique slug
    const { data: existingSlug } = await adminClient
      .from("projects")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existingSlug) {
      return NextResponse.json(
        { error: `Slug "${data.slug}" is already used by another project.` },
        { status: 400 }
      );
    }

    const { data: maxOrderRow } = await adminClient
      .from("projects")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder =
      data.sort_order > 0 ? data.sort_order : (maxOrderRow?.sort_order ?? -1) + 1;

    const { data: created, error: createErr } = await adminClient
      .from("projects")
      .insert({
        slug: data.slug,
        title_ar: data.title_ar,
        title_en: data.title_en,
        short_description_ar: data.short_description_ar,
        short_description_en: data.short_description_en,
        details_ar: data.details_ar,
        details_en: data.details_en,
        category: data.category,
        client_name: data.client_name || null,
        location: data.location || null,
        project_date: data.project_date || null,
        tools: data.tools,
        cover_image_url: data.cover_image_url || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        sort_order: nextSortOrder,
      })
      .select()
      .single();

    if (createErr || !created) throw createErr;

    if (data.media.length > 0) {
      const mediaInserts = data.media.map((item: ProjectMediaItem, idx: number) => ({
        project_id: created.id,
        type: item.type,
        url: item.url,
        caption_ar: item.caption_ar || "",
        caption_en: item.caption_en || "",
        sort_order: idx,
      }));
      const { error: mediaErr } = await adminClient
        .from("project_media")
        .insert(mediaInserts);
      if (mediaErr) throw mediaErr;
    }

    revalidateProjectRoutes(created.slug);
    return NextResponse.json({ project: created }, { status: 201 });
  } catch (err: any) {
    console.error("Admin projects POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const body = await request.json();

    // 1. Reorder projects
    if (body?.action === "reorder") {
      const reorderSchema = z.object({
        items: z.array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number().int().min(0),
          })
        ),
      });
      const parsed = reorderSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid reorder payload" }, { status: 400 });
      }
      await Promise.all(
        parsed.data.items.map((item) =>
          adminClient
            .from("projects")
            .update({ sort_order: item.sort_order })
            .eq("id", item.id)
        )
      );
      revalidateProjectRoutes();
      return NextResponse.json({ success: true });
    }

    // 2. Quick toggle publish/feature
    if (body?.action === "toggle_publish" || body?.action === "toggle_feature") {
      const toggleSchema = z.object({
        id: z.string().uuid(),
        value: z.boolean(),
      });
      const parsed = toggleSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid toggle payload" }, { status: 400 });
      }
      const field =
        body.action === "toggle_publish" ? "is_published" : "is_featured";
      const { data: updated, error } = await adminClient
        .from("projects")
        .update({ [field]: parsed.data.value })
        .eq("id", parsed.data.id)
        .select("slug")
        .single();
      if (error) throw error;
      revalidateProjectRoutes(updated?.slug);
      return NextResponse.json({ success: true });
    }

    // 3. Full update
    const projectId = body?.id;
    if (!projectId) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    const parsed = projectInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Invalid project payload",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Verify slug uniqueness against other projects
    const { data: conflictSlug } = await adminClient
      .from("projects")
      .select("id")
      .eq("slug", data.slug)
      .neq("id", projectId)
      .maybeSingle();

    if (conflictSlug) {
      return NextResponse.json(
        { error: `Slug "${data.slug}" is already used by another project.` },
        { status: 400 }
      );
    }

    // Snapshot previous media/cover so removed images are cleaned up from Storage
    const { data: previousProject } = await adminClient
      .from("projects")
      .select(`slug, cover_image_url, project_media (url, type)`)
      .eq("id", projectId)
      .single();

    const { data: updated, error: updErr } = await adminClient
      .from("projects")
      .update({
        slug: data.slug,
        title_ar: data.title_ar,
        title_en: data.title_en,
        short_description_ar: data.short_description_ar,
        short_description_en: data.short_description_en,
        details_ar: data.details_ar,
        details_en: data.details_en,
        category: data.category,
        client_name: data.client_name || null,
        location: data.location || null,
        project_date: data.project_date || null,
        tools: data.tools,
        cover_image_url: data.cover_image_url || null,
        is_published: data.is_published,
        is_featured: data.is_featured,
        sort_order: data.sort_order,
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updErr || !updated) throw updErr;

    // Replace project_media atomically
    await adminClient.from("project_media").delete().eq("project_id", projectId);

    if (data.media.length > 0) {
      const mediaInserts = data.media.map((item: ProjectMediaItem, idx: number) => ({
        project_id: projectId,
        type: item.type,
        url: item.url,
        caption_ar: item.caption_ar || "",
        caption_en: item.caption_en || "",
        sort_order: idx,
      }));
      const { error: mediaErr } = await adminClient
        .from("project_media")
        .insert(mediaInserts);
      if (mediaErr) throw mediaErr;
    }

    // Clean up orphaned images from Storage (excluding URLs still referenced anywhere on other duplicated projects)
    if (previousProject) {
      const prevUrls: string[] = [];
      if (previousProject.cover_image_url) {
        prevUrls.push(previousProject.cover_image_url);
      }
      for (const m of (previousProject.project_media as any[]) || []) {
        if (m.type === "image" && m.url) prevUrls.push(m.url);
      }

      const keptUrls = new Set<string>();
      if (data.cover_image_url) keptUrls.add(data.cover_image_url);
      for (const m of data.media) {
        if (m.type === "image" && m.url) keptUrls.add(m.url);
      }

      const candidateRemoved = prevUrls.filter((u) => !keptUrls.has(u));
      if (candidateRemoved.length > 0) {
        // Check if any other project still references these URLs (e.g. after Duplicate)
        const [{ data: otherCovers }, { data: otherMedia }] = await Promise.all([
          adminClient
            .from("projects")
            .select("cover_image_url")
            .in("cover_image_url", candidateRemoved),
          adminClient
            .from("project_media")
            .select("url")
            .in("url", candidateRemoved),
        ]);
        const stillUsed = new Set<string>([
          ...(otherCovers || []).map((r: any) => r.cover_image_url),
          ...(otherMedia || []).map((r: any) => r.url),
        ]);
        const safeToDelete = candidateRemoved.filter((u) => !stillUsed.has(u));
        await removeStorageUrls(adminClient, safeToDelete);
      }

      if (previousProject.slug !== updated.slug) {
        revalidateProjectRoutes(previousProject.slug);
      }
    }

    revalidateProjectRoutes(updated.slug);
    return NextResponse.json({ project: updated });
  } catch (err: any) {
    console.error("Admin projects PATCH error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Project id is required" }, { status: 400 });
    }

    const { data: project } = await adminClient
      .from("projects")
      .select(`slug, cover_image_url, project_media (url, type)`)
      .eq("id", id)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { error: delErr } = await adminClient.from("projects").delete().eq("id", id);
    if (delErr) throw delErr;

    const urlsToClean: string[] = [];
    if (project.cover_image_url) urlsToClean.push(project.cover_image_url);
    for (const m of (project.project_media as any[]) || []) {
      if (m.type === "image" && m.url) urlsToClean.push(m.url);
    }

    if (urlsToClean.length > 0) {
      // Do not remove files still shared by a duplicated project
      const [{ data: otherCovers }, { data: otherMedia }] = await Promise.all([
        adminClient
          .from("projects")
          .select("cover_image_url")
          .in("cover_image_url", urlsToClean),
        adminClient.from("project_media").select("url").in("url", urlsToClean),
      ]);
      const stillUsed = new Set<string>([
        ...(otherCovers || []).map((r: any) => r.cover_image_url),
        ...(otherMedia || []).map((r: any) => r.url),
      ]);
      const safeToDelete = urlsToClean.filter((u) => !stillUsed.has(u));
      await removeStorageUrls(adminClient, safeToDelete);
    }

    revalidateProjectRoutes(project.slug);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin projects DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
