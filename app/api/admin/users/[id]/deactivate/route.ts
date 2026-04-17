import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 403 }
      );
    }

    if (!profile.is_active) {
      return NextResponse.json(
        { error: "Inactive users cannot perform this action." },
        { status: 403 }
      );
    }

    // Only ERP Nexus admins can deactivate users
    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only admins can deactivate users." },
        { status: 403 }
      );
    }

    // Prevent admin from deactivating themselves (optional but smart)
    if (user.id === id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { error } = await adminSupabase
      .from("profiles")
      .update({
        is_active: false,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully.",
    });
  } catch (error) {
    console.error("Deactivate user error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate user." },
      { status: 500 }
    );
  }
}