import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminRequest } from "@/lib/admin-auth";
import {
  TESTIMONIAL_BUCKET,
  adminTestimonialSchema,
  normalizeTestimonialInput,
} from "@/lib/testimonials";
import { extractStoragePathFromUrl } from "@/lib/projects";

export const dynamic = "force-dynamic";

function revalidateHomeRoutes() {
  try {
    revalidatePath("/ar");
    revalidatePath("/en");
  } catch (err) {
    console.warn("Revalidate home routes warning:", err);
  }
}

async function removeStorageIfOwned(
  adminClient: any,
  urls: Array<string | null | undefined>
) {
  const paths = Array.from(
    new Set(
      urls
        .map((u) => extractStoragePathFromUrl(u, TESTIMONIAL_BUCKET))
        .filter((p): p is string => Boolean(p))
    )
  );
  if (paths.length === 0) return;
  try {
    await adminClient.storage.from(TESTIMONIAL_BUCKET).remove(paths);
  } catch (err) {
    console.warn("Testimonial storage cleanup warning:", err);
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const [testimonialsRes, coursesRes] = await Promise.all([
      auth.adminClient
        .from("testimonials")
        .select(
          `
          *,
          course:courses (
            id,
            title_ar,
            title_en,
            slug
          )
        `
        )
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false }),
      auth.adminClient
        .from("courses")
        .select("id, title_ar, title_en, slug")
        .order("order_index", { ascending: true }),
    ]);

    if (testimonialsRes.error) throw testimonialsRes.error;

    return NextResponse.json({
      testimonials: testimonialsRes.data || [],
      courses: coursesRes.data || [],
    });
  } catch (err: any) {
    console.error("Admin testimonials GET error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to load testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = adminTestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid testimonial payload" },
        { status: 400 }
      );
    }

    const row = normalizeTestimonialInput(parsed.data);

    const { data, error } = await auth.adminClient
      .from("testimonials")
      .insert(row)
      .select(
        `
        *,
        course:courses (
          id,
          title_ar,
          title_en,
          slug
        )
      `
      )
      .single();

    if (error) throw error;

    revalidateHomeRoutes();
    return NextResponse.json({ testimonial: data }, { status: 201 });
  } catch (err: any) {
    console.error("Admin testimonials POST error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create testimonial" },
      { status: 500 }
    );
  }
}

const patchActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_status"),
    id: z.string().uuid(),
    status: z.enum(["pending", "published", "hidden"]),
  }),
  z.object({
    action: z.literal("toggle_feature"),
    id: z.string().uuid(),
    value: z.boolean(),
  }),
  z.object({
    action: z.literal("reorder"),
    items: z
      .array(
        z.object({
          id: z.string().uuid(),
          order_index: z.number().int().min(0),
        })
      )
      .min(1),
  }),
]);

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();

    // Quick action dispatch
    if (body?.action) {
      const actionParsed = patchActionSchema.safeParse(body);
      if (!actionParsed.success) {
        return NextResponse.json(
          { error: actionParsed.error.issues[0]?.message || "Invalid action payload" },
          { status: 400 }
        );
      }

      const payload = actionParsed.data;
      if (payload.action === "set_status") {
        const { error } = await auth.adminClient
          .from("testimonials")
          .update({
            status: payload.status,
            is_published: payload.status === "published",
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else if (payload.action === "toggle_feature") {
        const { error } = await auth.adminClient
          .from("testimonials")
          .update({ is_featured: payload.value })
          .eq("id", payload.id);
        if (error) throw error;
      } else if (payload.action === "reorder") {
        await Promise.all(
          payload.items.map((item) =>
            auth.adminClient
              .from("testimonials")
              .update({ order_index: item.order_index })
              .eq("id", item.id)
          )
        );
      }

      revalidateHomeRoutes();
      return NextResponse.json({ success: true });
    }

    // Full update
    const id = body?.id;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

    const parsed = adminTestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid testimonial data" },
        { status: 400 }
      );
    }

    const row = normalizeTestimonialInput(parsed.data);

    const { data, error } = await auth.adminClient
      .from("testimonials")
      .update(row)
      .eq("id", id)
      .select(
        `
        *,
        course:courses (
          id,
          title_ar,
          title_en,
          slug
        )
      `
      )
      .single();

    if (error) throw error;

    revalidateHomeRoutes();
    return NextResponse.json({ testimonial: data });
  } catch (err: any) {
    console.error("Admin testimonials PATCH error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

    const { data: existing } = await auth.adminClient
      .from("testimonials")
      .select("avatar_url, media_url")
      .eq("id", id)
      .maybeSingle();

    const { error } = await auth.adminClient
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (existing) {
      await removeStorageIfOwned(auth.adminClient, [
        existing.avatar_url,
        existing.media_url,
      ]);
    }

    revalidateHomeRoutes();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Admin testimonials DELETE error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
