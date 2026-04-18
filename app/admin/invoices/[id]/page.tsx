import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InvoiceActions from "./invoice-actions";
import OpenInvoicePdfButton from "@/components/invoices/OpenInvoicePdfButton";
import EmailInvoiceButton from "@/components/invoices/EmailInvoiceButton";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value ?? 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(status: string | null | undefined) {
  const s = (status ?? "").toLowerCase();

  if (s.includes("paid")) return "status-badge status-success";
  if (s.includes("draft")) return "status-badge status-warning";
  if (s.includes("overdue")) return "status-badge status-danger";

  return "status-badge status-open";
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/dashboard");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard?error=forbidden");
  }

  const adminSupabase = createAdminClient();

  const { data: invoice } = await adminSupabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  const { data: items } = await adminSupabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("item_date", { ascending: true });

  if (!invoice) {
    return (
      <div className="p-6">
        <p className="text-red-600">Invoice not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <section className="panel-premium overflow-hidden">
        <div className="relative border-b border-nexus-200 px-6 py-5">
          <div className="absolute inset-0 nexus-grid-bg opacity-20" />

          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-nexus-900">
                Invoice {invoice.invoice_number || invoice.id}
              </h1>

              <p className="mt-1 text-sm text-nexus-500">
                {invoice.billing_period_start && invoice.billing_period_end
                  ? `${invoice.billing_period_start} → ${invoice.billing_period_end}`
                  : "No billing period"}
              </p>

              <div className="mt-3">
                <span className={getStatusClass(invoice.status)}>
                  {invoice.status || "Unknown"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <OpenInvoicePdfButton invoiceId={invoice.id} />
              <EmailInvoiceButton invoiceId={invoice.id} />
              <InvoiceActions
                invoiceId={invoice.id}
                status={invoice.status}
              />
            </div>
          </div>
        </div>

        {/* CUSTOMER */}
        <div className="p-6">
          <div className="rounded-xl border border-nexus-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-nexus-500">
              Bill To
            </p>

            <p className="mt-2 text-base font-medium text-nexus-900">
              {invoice.bill_to || invoice.customer_name || "-"}
            </p>

            <p className="text-sm text-nexus-500">
              {invoice.customer_email || "-"}
            </p>
          </div>
        </div>
      </section>

      {/* LINE ITEMS */}
      <section className="panel-premium">
        <div className="border-b border-nexus-200 px-6 py-5">
          <h2 className="section-title">Line Items</h2>
          <p className="section-subtitle">
            Work performed and billed for this invoice.
          </p>
        </div>

        <div className="p-6">
          <div className="table-shell">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="table-header">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Hours</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {(items ?? []).map((item) => (
                    <tr key={item.id} className="table-row">
                      <td className="px-4 py-3 text-nexus-600">
                        {formatDate(item.item_date)}
                      </td>

                      <td className="px-4 py-3 text-nexus-900">
                        {item.description || "-"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {Number(item.hours ?? 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.rate)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium text-nexus-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))}

                  {(items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-nexus-500">
                        No line items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* TOTALS */}
      <section className="panel-premium">
        <div className="border-b border-nexus-200 px-6 py-5">
          <h2 className="section-title">Totals</h2>
        </div>

        <div className="p-6 flex justify-end">
          <div className="w-full max-w-sm space-y-2 text-sm">
            <div className="flex justify-between text-nexus-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            <div className="flex justify-between text-nexus-600">
              <span>Tax</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>

            <div className="border-t border-nexus-200 pt-2 flex justify-between text-base font-semibold text-nexus-900">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}