import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const VALID_ROLES = ["staff", "owner", "support", "admin"] as const;

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: currentProfile, error: currentProfileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", authUser.id)
      .single();

    if (currentProfileError || !currentProfile) {
      return NextResponse.json(
        { error: "Current user profile not found." },
        { status: 404 }
      );
    }

    if (!currentProfile.is_active) {
      return NextResponse.json(
        { error: "Inactive users cannot perform this action." },
        { status: 403 }
      );
    }

    if (currentProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const department = String(body.department ?? "").trim();
    const role = String(body.role ?? "").trim();
    let companyId =
      typeof body.company_id === "string" && body.company_id.trim() !== ""
        ? body.company_id.trim()
        : null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return NextResponse.json(
        { error: "Invalid role." },
        { status: 400 }
      );
    }

    const { data: existingUser } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .neq("id", id)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "A different user with that email already exists." },
        { status: 400 }
      );
    }

    let hourlyRate: number | null = null;

    if (role === "admin" || role === "support") {
      hourlyRate = Number(body.hourly_rate);

      if (!Number.isFinite(hourlyRate) || hourlyRate <= 0) {
        return NextResponse.json(
          { error: "Admin and support users must have a valid hourly rate." },
          { status: 400 }
        );
      }
    }

    const { data: erpCompany, error: erpCompanyError } = await adminSupabase
      .from("companies")
      .select("id, name")
      .ilike("name", "ERP Nexus")
      .maybeSingle();

    if (erpCompanyError) {
      return NextResponse.json(
        { error: erpCompanyError.message },
        { status: 500 }
      );
    }

    if (role === "admin" || role === "support") {
      if (!erpCompany) {
        return NextResponse.json(
          { error: "ERP Nexus company not found." },
          { status: 500 }
        );
      }

      companyId = erpCompany.id;
    } else {
      if (!companyId) {
        return NextResponse.json(
          { error: "Company is required for staff and owner users." },
          { status: 400 }
        );
      }

      const { data: companyExists, error: companyError } = await adminSupabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .maybeSingle();

      if (companyError || !companyExists) {
        return NextResponse.json(
          { error: "Selected company does not exist." },
          { status: 400 }
        );
      }
    }

    const { error } = await adminSupabase
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        department: department || null,
        role,
        hourly_rate: hourlyRate,
        is_active: Boolean(body.is_active),
        company_id: companyId,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}