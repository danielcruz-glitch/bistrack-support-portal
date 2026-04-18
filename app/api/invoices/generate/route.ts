import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CompanyBaseRow = {
  id: string;
  name: string | null;
};

type CompanyAddressRow = {
  bill_to_address_line_1?: string | null;
  bill_to_address_line_2?: string | null;
  bill_to_city?: string | null;
  bill_to_state?: string | null;
  bill_to_zip?: string | null;
  bill_to_email?: string | null;
};

function formatInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${random}`;
}

function buildBillTo(company: {
  name: string | null;
  bill_to_address_line_1?: string | null;
  bill_to_address_line_2?: string | null;
  bill_to_city?: string | null;
  bill_to_state?: string | null;
  bill_to_zip?: string | null;
}) {
  const cityStateZip = [
    company.bill_to_city,
    company.bill_to_state,
    company.bill_to_zip,
  ]
    .filter((value) => value && String(value).trim() !== "")
    .join(", ");

  return [
    company.name || "",
    company.bill_to_address_line_1 || "",
    company.bill_to_address_line_2 || "",
    cityStateZip || "",
  ]
    .filter((line) => line.trim() !== "")
    .join("\n");
}

async function requireAdminOrSupport() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      error: NextResponse.json(
        {
          error: "Unauthorized.",
          details: userError.message,
          step: "auth.getUser",
        },
        { status: 401 }
      ),
    };
  }

  if (!user) {
    return {
      error: NextResponse.json(
        {
          error: "Unauthorized.",
          details: "No authenticated user found in server route.",
          step: "auth.getUser",
        },
        { status: 401 }
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        {
          error: "User profile not found.",
          details: profileError?.message || "No profile row returned.",
          user_id: user.id,
          step: "profiles lookup",
        },
        { status: 403 }
      ),
    };
  }

  if (!profile.is_active) {
    return {
      error: NextResponse.json(
        { error: "Inactive users cannot generate invoices." },
        { status: 403 }
      ),
    };
  }

  if (!["admin", "support"].includes(profile.role)) {
    return {
      error: NextResponse.json(
        { error: "Forbidden. Only admin/support users can generate invoices." },
        { status: 403 }
      ),
    };
  }

  if (!profile.company_id) {
    return {
      error: NextResponse.json(
        { error: "Your profile is missing a company assignment." },
        { status: 400 }
      ),
    };
  }

  return { profile, user };
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminOrSupport();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(req.url);
    const lookup = searchParams.get("lookup");

    if (lookup !== "companies") {
      return NextResponse.json({ error: "Invalid lookup." }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    const { data: companies, error: companiesError } = await adminSupabase
      .from("companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (companiesError) {
      return NextResponse.json(
        { error: companiesError.message },
        { status: 500 }
      );
    }

    const companyIds = (companies ?? []).map((company) => company.id);

    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select("company_id, email, role, is_active")
      .in("company_id", companyIds)
      .eq("is_active", true);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const companiesWithBilling = (companies ?? []).map((company) => {
      const companyProfiles = (profiles ?? []).filter(
        (profile) => profile.company_id === company.id
      );

      const ownerProfile =
        companyProfiles.find((profile) => profile.role === "owner") ||
        companyProfiles.find((profile) => profile.role === "admin") ||
        companyProfiles.find((profile) => profile.email);

      return {
        id: company.id,
        name: company.name,
        billingEmail: ownerProfile?.email || "",
      };
    });

    return NextResponse.json({ companies: companiesWithBilling });
  } catch (error) {
    console.error("Load companies error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load companies.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminOrSupport();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const adminSupabase = createAdminClient();

    const {
      company_id,
      customer_name,
      customer_email,
      billing_period_start,
      billing_period_end,
      tax_rate = 0,
      notes = "",
    } = body;

    const normalizedCompanyId =
      typeof company_id === "string" ? company_id.trim() : company_id;

    if (
      !normalizedCompanyId ||
      !customer_name ||
      !billing_period_start ||
      !billing_period_end
    ) {
      return NextResponse.json(
        { error: "Missing required invoice fields." },
        { status: 400 }
      );
    }

    const { data: billedCompany, error: companyError } = await adminSupabase
      .from("companies")
      .select(`
        id,
        name,
        bill_to_address_line_1,
        bill_to_address_line_2,
        bill_to_city,
        bill_to_state,
        bill_to_zip,
        bill_to_email
      `)
      .eq("id", normalizedCompanyId)
      .maybeSingle<(CompanyBaseRow & CompanyAddressRow)>();

    if (companyError) {
      return NextResponse.json(
        {
          error: "Failed loading selected customer company.",
          details: companyError.message,
          step: "company lookup",
          company_id: normalizedCompanyId,
        },
        { status: 500 }
      );
    }

    if (!billedCompany) {
      return NextResponse.json(
        {
          error: "Selected customer company was not found.",
          company_id: normalizedCompanyId,
        },
        { status: 400 }
      );
    }

    const { data: billingCompanySettings, error: settingsError } =
      await adminSupabase
        .from("invoice_settings")
        .select(`
          id,
          company_id,
          pay_to_name,
          pay_to_address_line_1,
          pay_to_address_line_2,
          pay_to_city,
          pay_to_state,
          pay_to_zip,
          pay_to_company_name,
          pay_to_logo_url
        `)
        .eq("company_id", auth.profile.company_id)
        .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        { error: settingsError.message },
        { status: 500 }
      );
    }

    const { data: logs, error: logsError } = await adminSupabase
      .from("work_logs")
      .select(`
        id,
        work_date,
        description,
        hours_worked,
        rate,
        billable,
        ticket_id,
        tickets!inner (
          id,
          company_id
        )
      `)
      .eq("billed", false)
      .eq("billable", true)
      .eq("tickets.company_id", normalizedCompanyId)
      .gte("work_date", billing_period_start)
      .lte("work_date", billing_period_end)
      .order("work_date", { ascending: true });

    if (logsError) {
      return NextResponse.json(
        { error: logsError.message },
        { status: 500 }
      );
    }

    const usableLogs = (logs ?? []).filter(
      (log) => Number(log.hours_worked ?? 0) > 0
    );

    if (usableLogs.length === 0) {
      return NextResponse.json(
        {
          error:
            "No unbilled work logs found for the selected company and date range.",
        },
        { status: 400 }
      );
    }

    const subtotal = usableLogs.reduce((sum, log) => {
      return sum + Number(log.hours_worked) * Number(log.rate);
    }, 0);

    const tax = subtotal * (Number(tax_rate) / 100);
    const total = subtotal + tax;
    const invoiceNumber = formatInvoiceNumber();
    const billTo = buildBillTo(billedCompany);

    const invoiceCustomerEmail =
      customer_email ||
      billedCompany.bill_to_email ||
      null;

    const { data: invoice, error: invoiceError } = await adminSupabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        customer_name,
        customer_email: invoiceCustomerEmail,
        bill_to: billTo,
        company_id: normalizedCompanyId,
        billing_period_start,
        billing_period_end,
        subtotal,
        tax,
        total,
        total_amount: total,
        notes,
        status: "draft",

        pay_to_name: billingCompanySettings?.pay_to_name || null,
        pay_to_address_line_1:
          billingCompanySettings?.pay_to_address_line_1 || null,
        pay_to_address_line_2:
          billingCompanySettings?.pay_to_address_line_2 || null,
        pay_to_city: billingCompanySettings?.pay_to_city || null,
        pay_to_state: billingCompanySettings?.pay_to_state || null,
        pay_to_zip: billingCompanySettings?.pay_to_zip || null,
        pay_to_company_name:
          billingCompanySettings?.pay_to_company_name || null,
        pay_to_logo_url: billingCompanySettings?.pay_to_logo_url || null,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: invoiceError?.message || "Failed to create invoice." },
        { status: 500 }
      );
    }

    const items = usableLogs.map((log) => ({
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

    const logIds = usableLogs.map((log) => log.id);

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
      bill_to_preview: billTo,
    });
  } catch (error) {
    console.error("Generate invoice error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate invoice.",
      },
      { status: 500 }
    );
  }
}