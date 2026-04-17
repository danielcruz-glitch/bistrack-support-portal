import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function formatInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${random}`;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, company_id, is_active")
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
        { error: "Inactive users cannot generate invoices." },
        { status: 403 }
      );
    }

    // Invoice generation is ERP Nexus admin only
    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only admins can generate invoices." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const adminSupabase = createAdminClient();

    const {
      customer_name,
      customer_email,
      billing_period_start,
      billing_period_end,
      tax_rate = 0,
      notes = "",
    } = body;

    if (!customer_name || !billing_period_start || !billing_period_end) {
      return NextResponse.json(
        { error: "Missing required invoice fields." },
        { status: 400 }
      );
    }

    const { data: logs, error: logsError } = await adminSupabase
      .from("work_logs")
      .select("id, work_date, description, hours_worked, rate")
      .eq("billed", false)
      .gte("work_date", billing_period_start)
      .lte("work_date", billing_period_end)
      .order("work_date", { ascending: true });

    if (logsError) {
      return NextResponse.json(
        { error: logsError.message },
        { status: 500 }
      );
    }

    if (!logs || logs.length === 0) {
      return NextResponse.json(
        { error: "No unbilled work logs found for this date range." },
        { status: 400 }
      );
    }

    const subtotal = logs.reduce((sum, log) => {
      return sum + Number(log.hours_worked) * Number(log.rate);
    }, 0);

    const tax = subtotal * (Number(tax_rate) / 100);
    const total = subtotal + tax;
    const invoiceNumber = formatInvoiceNumber();

    const { data: invoice, error: invoiceError } = await adminSupabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_name,
        customer_email: customer_email || null,
        bill_to: customer_name,
        billing_period_start,
        billing_period_end,
        subtotal,
        tax,
        total,
        notes,
        status: "draft",
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: invoiceError?.message || "Failed to create invoice." },
        { status: 500 }
      );
    }

    const items = logs.map((log) => ({
      invoice_id: invoice.id,
      work_log_id: log.id,
      item_date: log.work_date,
      description: log.description,
      hours: log.hours_worked,
      rate: log.rate,
      line_total: Number(log.hours_worked) * Number(log.rate),
    }));

    const { error: itemsError } = await adminSupabase
      .from("invoice_items")
      .insert(items);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    const logIds = logs.map((log) => log.id);

    const { error: updateLogsError } = await adminSupabase
      .from("work_logs")
      .update({
        billed: true,
        invoice_id: invoice.id,
      })
      .in("id", logIds);

    if (updateLogsError) {
      return NextResponse.json(
        { error: updateLogsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice,
      item_count: items.length,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice." },
      { status: 500 }
    );
  }
}