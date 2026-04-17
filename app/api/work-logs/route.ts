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

    const hoursWorked = Number(hours);
    const hourlyRate = Number(rate);

    if (Number.isNaN(hoursWorked) || hoursWorked <= 0) {
      return NextResponse.json(
        { error: "Hours must be a valid number greater than 0." },
        { status: 400 }
      );
    }

    if (Number.isNaN(hourlyRate) || hourlyRate < 0) {
      return NextResponse.json(
        { error: "Rate must be a valid number." },
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
        hours_worked: hoursWorked,
        rate: hourlyRate,
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