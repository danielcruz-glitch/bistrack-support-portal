import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ROLES = ["staff", "owner", "support", "admin"] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 400 }
      );
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

      if (erpCompany && companyId === erpCompany.id) {
        return NextResponse.json(
          {
            error:
              "Customer staff and owner users must be assigned to a customer company, not ERP Nexus.",
          },
          { status: 400 }
        );
      }
    }

    const { error } = await adminSupabase.from("profiles").insert({
      full_name: fullName,
      email,
      department: department || null,
      role,
      company_id: companyId,
      is_active: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}