import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedEmail = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const fullName = String(body?.fullName || "").trim();
    const locale = body?.locale === "en" ? "en" : "ar";

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { error: locale === "ar" ? "يرجى إدخال بريد إلكتروني صحيح." : "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        { error: locale === "ar" ? "يرجى إدخال الاسم الكامل." : "Please enter your full name." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            locale === "ar"
              ? "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
              : "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if auth user already exists
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      console.error("List users error:", listError);
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const existingUser = (usersData?.users || []).find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    let userId = "";

    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        return NextResponse.json(
          {
            error:
              locale === "ar"
                ? "هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة."
                : "This email is already registered. Please sign in directly.",
            code: "EMAIL_EXISTS",
          },
          { status: 400 }
        );
      }

      // Existing unconfirmed account: confirm and set chosen password/name
      const { data: updatedData, error: updateError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            language: locale,
          },
        });

      if (updateError || !updatedData?.user) {
        console.error("Update unconfirmed user error:", updateError);
        return NextResponse.json(
          { error: updateError?.message || "Failed to activate account." },
          { status: 400 }
        );
      }

      userId = updatedData.user.id;
    } else {
      // Create new user already confirmed so immediate login works cleanly
      const { data: createdData, error: createError } =
        await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            language: locale,
          },
        });

      if (createError || !createdData?.user) {
        console.error("Create user error:", createError);
        return NextResponse.json(
          { error: createError?.message || "Failed to create account." },
          { status: 400 }
        );
      }

      userId = createdData.user.id;
    }

    // Preserve admin role if applicable
    const adminEmail = (process.env.ADMIN_EMAIL || "ahmedtarbo98@gmail.com").toLowerCase();
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();

    const role =
      existingProfile?.role === "admin" || normalizedEmail === adminEmail
        ? "admin"
        : "student";

    const { error: upsertError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email: normalizedEmail,
        role,
        language: locale,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      console.error("Upsert profile error during register:", upsertError);
    }

    // Migrate any pre-existing email-matched profile records (e.g., created manually or prior temp records)
    const { data: duplicateProfiles } = await adminClient
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .neq("id", userId);

    if (duplicateProfiles && duplicateProfiles.length > 0) {
      const oldIds = duplicateProfiles.map((p) => p.id);
      await adminClient
        .from("enrollments")
        .update({ user_id: userId })
        .in("user_id", oldIds);
      await adminClient
        .from("enrollment_requests")
        .update({ user_id: userId })
        .in("user_id", oldIds);
    }

    try {
      revalidateTag("public-stats");
      revalidatePath("/ar");
      revalidatePath("/en");
    } catch (e) {
      console.warn("Revalidate public-stats warning:", e);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        full_name: fullName,
      },
    });
  } catch (err: any) {
    console.error("Register API error:", err);
    return NextResponse.json(
      { error: err?.message || "Unexpected registration error." },
      { status: 500 }
    );
  }
}
