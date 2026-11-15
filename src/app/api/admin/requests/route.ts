import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAdminRequest(request);
    if (!auth.ok) return auth.response;
    const { adminClient } = auth;

    // 1. Fetch courses
    const { data: coursesData } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, price, currency");

    const coursesMap = new Map();
    (coursesData || []).forEach((c) => {
      coursesMap.set(c.id, c);
    });

    // 2. Fetch enrollment_requests
    const { data: reqData, error: reqErr } = await adminClient
      .from("enrollment_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (reqErr) throw reqErr;

    // 3. Fetch profiles for user IDs so names and emails are never blank
    const userIds = Array.from(
      new Set((reqData || []).map((r) => r.user_id).filter(Boolean))
    );

    const profilesMap = new Map();
    if (userIds.length > 0) {
      const { data: profilesData } = await adminClient
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      (profilesData || []).forEach((p) => {
        profilesMap.set(p.id, p);
      });
    }

    const mapped = (reqData || []).map((r) => {
      const c = coursesMap.get(r.course_id);
      const p = profilesMap.get(r.user_id);
      return {
        ...r,
        full_name: p?.full_name || "طالب جديد",
        email: p?.email || "—",
        phone: r.phone || p?.phone || null,
        course_title: c ? c.title_ar : "دورة تدريبية",
        course_title_en: c ? c.title_en : "GIS Course",
        course_price: c ? c.price : 0,
        course_currency: c ? c.currency : "USD",
      };
    });

    return NextResponse.json({ requests: mapped });
  } catch (err: any) {
    console.error("Admin requests GET error:", err);
    return NextResponse.json(
      { error: "Failed to load requests" },
      { status: 500 }
    );
  }
}
