import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, fullName, email, phone, notes } = body;

    if (!courseId || !email) {
      return NextResponse.json(
        { error: "Course ID and email are required" },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName || cleanEmail.split("@")[0]).trim();
    const cleanPhone = phone ? String(phone).trim() : null;

    const adminClient = createAdminClient();

    // 1. Check if course exists
    const { data: course, error: cErr } = await adminClient
      .from("courses")
      .select("id, title_ar, title_en, price, currency")
      .eq("id", courseId)
      .maybeSingle();

    if (cErr || !course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    // 2. Resolve or create user profile in public.profiles
    let targetUserId: string | null = null;

    // Check in auth.users first
    const { data: usersData } = await adminClient.auth.admin.listUsers();
    const matchedAuthUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (matchedAuthUser) {
      targetUserId = matchedAuthUser.id;
      // Ensure profile exists
      await adminClient.from("profiles").upsert(
        {
          id: matchedAuthUser.id,
          full_name: cleanName || matchedAuthUser.user_metadata?.full_name || "طالب جديد",
          email: cleanEmail,
          phone: cleanPhone,
          role: "student",
        },
        { onConflict: "id" }
      );
    } else {
      // Check in public.profiles
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        targetUserId = existingProfile.id;
      } else {
        // Create new profile record with generated UUID
        const newId = crypto.randomUUID();
        const { error: insProfErr } = await adminClient.from("profiles").insert({
          id: newId,
          full_name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          role: "student",
          language: "ar",
        });

        if (!insProfErr) {
          targetUserId = newId;
        }
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Could not create or resolve student profile" },
        { status: 500 }
      );
    }

    // 3. Insert into enrollment_requests
    const { data: newRequest, error: reqErr } = await adminClient
      .from("enrollment_requests")
      .insert({
        user_id: targetUserId,
        course_id: course.id,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        status: "pending",
        notes: notes || `طلب اشتراك في دورة: ${course.title_ar} (${course.price} ${course.currency})`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reqErr) {
      console.error("Insert enrollment_requests error:", reqErr);
      throw reqErr;
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: "تم حفظ طلب الاشتراك بنجاح وفي انتظار مراجعة وتفعيل الإدارة",
    });
  } catch (err: any) {
    console.error("enroll-request API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit enrollment request" },
      { status: 500 }
    );
  }
}
