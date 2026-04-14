import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const supabase = createAdminClient();

    const role = body.role;
    const hourlyRate =
      role === "admin" || role === "support"
        ? Number(body.hourly_rate)
        : null;

    if ((role === "admin" || role === "support") && (!hourlyRate || hourlyRate <= 0)) {
      return NextResponse.json(
        { error: "Admin and support users must have a valid hourly rate." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name,
        email: body.email,
        department: body.department,
        role,
        hourly_rate: hourlyRate,
        is_active: Boolean(body.is_active),
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