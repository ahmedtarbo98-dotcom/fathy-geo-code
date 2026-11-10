import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    let {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: tokenUser } = await supabase.auth.getUser(token);
        user = tokenUser.user;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Verify admin
    const isAdmin =
      user.email === "ahmedtarbo98@gmail.com" ||
      user.email === process.env.ADMIN_EMAIL;

    if (!isAdmin) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("role, is_blocked")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin" || profile?.is_blocked) {
        return NextResponse.json(
          { error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }
    }

    // 1. Fetch all courses
    const { data: coursesData } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, price, currency");

    const coursesMap = new Map();
    (coursesData || []).forEach((c) => {
      coursesMap.set(c.id, c);
    });

    // 2. Fetch all enrollment_requests
    const { data: reqData, error: reqErr } = await adminClient
      .from("enrollment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (reqErr) throw reqErr;

    const mapped = (reqData || []).map((r) => {
      const c = coursesMap.get(r.course_id);
      return {
        ...r,
        course_title: c ? c.title_ar : "GIS Course",
        course_title_en: c ? c.title_en : "GIS Course",
        course_price: c ? c.price : 0,
        course_currency: c ? c.currency : "USD",
      };
    });

    return NextResponse.json({ requests: mapped });
  } catch (err: any) {
    console.error("Admin requests GET error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load requests" },
      { status: 500 }
    );
  }
}
