import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const {
      ticket_id,
      user_id,
      support_staff_id,
      work_date,
      hours,
      rate,
      description,
    } = body;

    if (!work_date || !hours || !rate || !description) {
      return NextResponse.json(
        { error: "Missing required work log fields." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("work_logs")
      .insert({
        ticket_id: ticket_id || null,
        user_id: user_id || null,
        support_staff_id: support_staff_id || null,
        work_date,
        hours: Number(hours),
        rate: Number(rate),
        description,
        billed: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, workLog: data });
  } catch (error) {
    console.error("Create work log error:", error);
    return NextResponse.json(
      { error: "Failed to create work log." },
      { status: 500 }
    );
  }
}