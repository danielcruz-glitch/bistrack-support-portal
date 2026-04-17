import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvoiceEmail } from "@/lib/sendInvoiceEmail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
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
        { error: "Inactive users cannot update invoices." },
        { status: 403 }
      );
    }

    // Invoice status changes are admin-only for now
    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Only admins can update invoice status." },
        { status: 403 }
      );
    }

    const { status } = await req.json();
    const adminSupabase = createAdminClient();

    const allowed = ["draft", "sent", "paid", "void"];

    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value." },
        { status: 400 }
      );
    }

    // If status is being changed to "sent", send the invoice email first.
    // Only update the invoice to sent if the email succeeds.
    if (status === "sent") {
      const { data: invoice, error: invoiceError } = await adminSupabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError || !invoice) {
        return NextResponse.json(
          { error: invoiceError?.message || "Invoice not found." },
          { status: 500 }
        );
      }

      const billToEmail =
        invoice.bill_to_email ||
        invoice.customer_email ||
        invoice.recipient_email ||
        null;

      if (!billToEmail) {
        return NextResponse.json(
          {
            error:
              "Invoice cannot be sent because no bill-to email address was found.",
          },
          { status: 400 }
        );
      }

      const invoiceNumber = invoice.invoice_number || invoice.id;
      const billToName =
        invoice.bill_to ||
        invoice.customer_name ||
        invoice.company_name ||
        "Customer";
      const hoursWorked =
        invoice.hours_worked ??
        invoice.total_hours ??
        invoice.hours ??
        "N/A";
      const invoiceTotal =
        invoice.total_amount ??
        invoice.amount ??
        invoice.invoice_total ??
        invoice.total ??
        "N/A";

      try {
        await sendInvoiceEmail({
          to: billToEmail,
          cc: process.env.SUPPORT_NOTIFICATION_EMAIL || undefined,
          subject: `Invoice ${invoiceNumber}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #111827;">
              <h1 style="margin: 0 0 16px; font-size: 24px;">Invoice ${invoiceNumber}</h1>

              <p style="margin: 0 0 12px;">Hello,</p>

              <p style="margin: 0 0 12px;">
                Please find your invoice details below.
              </p>

              <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
                <p style="margin: 0 0 8px;"><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                <p style="margin: 0 0 8px;"><strong>Bill To:</strong> ${billToName}</p>
                <p style="margin: 0 0 8px;"><strong>Total Hours:</strong> ${hoursWorked}</p>
                <p style="margin: 0;"><strong>Total Amount:</strong> $${invoiceTotal}</p>
              </div>

              <p style="margin-top: 20px;">
                Thank you,<br />
                ERP Nexus Billing
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Invoice email failed:", emailError);
        return NextResponse.json(
          { error: "Invoice email failed to send. Status was not updated." },
          { status: 500 }
        );
      }

      const updatePayload: Record<string, string> = {
        status: "sent",
      };

      // If your invoices table has this column, keep this.
      // If Supabase complains that the column does not exist, remove this line
      // or add the column in the database.
      updatePayload.email_sent_at = new Date().toISOString();

      const { error: updateError } = await adminSupabase
        .from("invoices")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // For any status other than "sent", just update normally
    const { error } = await adminSupabase
      .from("invoices")
      .update({ status })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update invoice status error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice status." },
      { status: 500 }
    );
  }
}