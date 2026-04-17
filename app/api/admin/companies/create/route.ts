import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function normalizeCompanyName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Current user profile not found." },
        { status: 404 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Inactive users cannot perform this action." },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const rawName = String(body.name ?? "");
    const name = normalizeCompanyName(rawName);

    if (!name) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    if (name.length > 120) {
      return NextResponse.json(
        { error: "Company name is too long." },
        { status: 400 }
      );
    }

    const { data: allCompanies, error: existingError } = await adminSupabase
      .from("companies")
      .select("id, name");

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message },
        { status: 500 }
      );
    }

    const duplicate = (allCompanies ?? []).find(
      (company) =>
        normalizeCompanyName(company.name).toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "A company with that name already exists." },
        { status: 400 }
      );
    }

    const { error } = await adminSupabase.from("companies").insert({
      name,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create company error:", error);
    return NextResponse.json(
      { error: "Failed to create company." },
      { status: 500 }
    );
  }
}