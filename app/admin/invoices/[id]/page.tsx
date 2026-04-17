import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InvoiceActions from "./invoice-actions";
import OpenInvoicePdfButton from "@/components/invoices/OpenInvoicePdfButton";
import EmailInvoiceButton from "@/components/invoices/EmailInvoiceButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard?error=forbidden");
  }

  const adminSupabase = createAdminClient();

  const { data: invoice, error: invoiceError } = await adminSupabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  const { data: items, error: itemsError } = await adminSupabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("item_date", { ascending: true });

  if (invoiceError || !invoice) {
    return (
      <div className="p-6">
        <p className="text-red-600">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Invoice {invoice.invoice_number || invoice.id}
          </h1>
          <p className="text-gray-600">
            {invoice.billing_period_start && invoice.billing_period_end
              ? `${invoice.billing_period_start} to ${invoice.billing_period_end}`
              : "-"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <OpenInvoicePdfButton invoiceId={invoice.id} />
          <EmailInvoiceButton invoiceId={invoice.id} />
          <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Customer</h2>
        <p>{invoice.bill_to || invoice.customer_name || "-"}</p>
        <p className="text-sm text-gray-500">
          {invoice.customer_email || "-"}
        </p>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Line Items</h2>

        {itemsError ? (
          <p className="text-red-600">{itemsError.message}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-left">Hours</th>
                  <th className="p-3 text-left">Rate</th>
                  <th className="p-3 text-left">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {(items ?? []).map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-3">{item.item_date || "-"}</td>
                    <td className="p-3">{item.description || "-"}</td>
                    <td className="p-3">
                      {Number(item.hours ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      ${Number(item.rate ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3 font-medium">
                      ${Number(item.line_total ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {(items ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No line items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-semibold">Totals</h2>
        <p>Subtotal: ${Number(invoice.subtotal ?? 0).toFixed(2)}</p>
        <p>Tax: ${Number(invoice.tax ?? 0).toFixed(2)}</p>
        <p className="font-bold">
          Total: ${Number(invoice.total ?? 0).toFixed(2)}
        </p>
      </div>
    </div>
  );
}