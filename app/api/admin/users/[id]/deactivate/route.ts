import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = createAdminClient();

    const { error } = await supabase
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