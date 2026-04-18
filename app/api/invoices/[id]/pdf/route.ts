import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoicePdf } from "@/lib/invoices/generateInvoicePdf";

type InvoiceRow = {
  id: string;
  invoice_number: string | null;
  created_at: string | null;
  customer_name: string | null;
  bill_to: string | null;
  total_amount: number | null;
  company_id?: string | null;

  pay_to_name: string | null;
  pay_to_address_line_1: string | null;
  pay_to_address_line_2: string | null;
  pay_to_city: string | null;
  pay_to_state: string | null;
  pay_to_zip: string | null;
  pay_to_company_name: string | null;
  pay_to_logo_url: string | null;
};

type WorkLogRow = {
  id: string;
  work_date: string | null;
  description: string | null;
  hours_worked: number | null;
  ticket_id: string | null;
  tickets?: {
    id: string | null;
    issue_title: string | null;
  } | null;
};

async function loadLogoBytes(
  logoUrl: string | null
): Promise<{ logoBytes: Uint8Array | null; logoMimeType: "image/png" | "image/jpeg" | null }> {
  if (!logoUrl) {
    return { logoBytes: null, logoMimeType: null };
  }

  try {
    const response = await fetch(logoUrl);

    if (!response.ok) {
      return { logoBytes: null, logoMimeType: null };
    }

    const contentType = response.headers.get("content-type") || "";
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    if (contentType.includes("png")) {
      return { logoBytes: bytes, logoMimeType: "image/png" };
    }

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      return { logoBytes: bytes, logoMimeType: "image/jpeg" };
    }

    return { logoBytes: null, logoMimeType: null };
  } catch {
    return { logoBytes: null, logoMimeType: null };
  }
}

function formatInvoiceDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US");
}

function safeNumber(value: number | null | undefined) {
  return Number(value || 0);
}

function makeTicketDisplay(ticketId: string | null) {
  if (!ticketId) return "";
  return `TKT-${ticketId.slice(0, 8).toUpperCase()}`;
}

function makeLineDescription(log: WorkLogRow) {
  const issueTitle = log.tickets?.issue_title?.trim() || "";
  const workLogDescription = log.description?.trim() || "";

  if (issueTitle && workLogDescription) {
    if (issueTitle.toLowerCase() === workLogDescription.toLowerCase()) {
      return issueTitle;
    }
    return `${issueTitle} - ${workLogDescription}`;
  }

  if (issueTitle) return issueTitle;
  if (workLogDescription) return workLogDescription;

  return "ERP support services";
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const rawParams = await context.params;
  const id = String(rawParams.id || "").trim();

  if (!id) {
    return new NextResponse("Missing invoice id", { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("id, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (currentProfileError || !currentProfile || !currentProfile.is_active) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const isAdmin = currentProfile.role === "admin";
  const isSupport = currentProfile.role === "support";
  const isOwner = currentProfile.role === "owner";

  const adminSupabase = createAdminClient();

  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      created_at,
      customer_name,
      bill_to,
      total_amount,
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
    .eq("id", id)
    .maybeSingle<InvoiceRow>();

  if (invoiceError) {
    return new NextResponse(`Invoice lookup error: ${invoiceError.message}`, {
      status: 500,
    });
  }

  if (!invoice) {
    return new NextResponse(`Invoice not found for id: ${id}`, { status: 404 });
  }

  if (!isAdmin && !isSupport) {
    if (!isOwner) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (invoice.company_id && currentProfile.company_id !== invoice.company_id) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  let workLogs: WorkLogRow[] = [];
  let workLogsColumnMissing = false;

  const { data: workLogsData, error: workLogsError } = await adminSupabase
    .from("work_logs")
    .select(`
      id,
      work_date,
      description,
      hours_worked,
      ticket_id,
      tickets (
        id,
        issue_title
      )
    `)
    .eq("invoice_id", id)
    .order("work_date", { ascending: true });

  if (workLogsError) {
    if (workLogsError.message.toLowerCase().includes("invoice_id")) {
      workLogsColumnMissing = true;
    } else {
      return new NextResponse(`Error loading work logs: ${workLogsError.message}`, {
        status: 500,
      });
    }
  } else {
    workLogs = (workLogsData ?? []) as WorkLogRow[];
  }

  const { logoBytes, logoMimeType } = await loadLogoBytes(invoice.pay_to_logo_url);

  const invoiceTotal = safeNumber(invoice.total_amount);
  const totalHours = workLogs.reduce((sum, log) => sum + safeNumber(log.hours_worked), 0);
  const derivedRate = totalHours > 0 ? invoiceTotal / totalHours : 0;

  const lineItems =
    !workLogsColumnMissing && workLogs.length > 0
      ? workLogs.map((log) => {
          const hours = safeNumber(log.hours_worked);
          const amount = totalHours > 0 ? hours * derivedRate : 0;

          return {
            date: log.work_date ? formatInvoiceDate(log.work_date) : "",
            ticket_number: makeTicketDisplay(log.ticket_id),
            description: makeLineDescription(log),
            hours,
            rate: totalHours > 0 ? derivedRate : null,
            amount,
          };
        })
      : [
          {
            date: invoice.created_at ? formatInvoiceDate(invoice.created_at) : "",
            ticket_number: "",
            description: "ERP support services",
            hours: null,
            rate: null,
            amount: invoiceTotal,
          },
        ];

  const pdfBytes = await generateInvoicePdf({
    invoiceNumber: invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
    invoiceDate: formatInvoiceDate(invoice.created_at),
    dueDate: "",

    customerName: invoice.customer_name || "Customer",
    billTo: invoice.bill_to || "",

    payToName: invoice.pay_to_name || "Daniel Cruz",
    payToAddressLine1: invoice.pay_to_address_line_1 || "",
    payToAddressLine2: invoice.pay_to_address_line_2 || "",
    payToCity: invoice.pay_to_city || "",
    payToState: invoice.pay_to_state || "",
    payToZip: invoice.pay_to_zip || "",
    payToCompanyName: invoice.pay_to_company_name || "",

    logoBytes,
    logoMimeType,

    lineItems,
    notes: "Thank you for your business.",
  });

  const fileName = `${invoice.invoice_number || `invoice-${invoice.id}`}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}