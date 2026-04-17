import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import InvoiceGenerator from "./invoice-generator";
import OpenInvoicePdfButton from "@/components/invoices/OpenInvoicePdfButton";
import EmailInvoiceButton from "@/components/invoices/EmailInvoiceButton";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
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

  const { data: invoices, error } = await adminSupabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      customer_name,
      customer_email,
      bill_to,
      billing_period_start,
      billing_period_end,
      subtotal,
      tax,
      total,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Invoices</h1>
        <p className="mb-4 text-sm text-gray-600">
          Admin-only invoice management across the entire ERP Nexus system.
        </p>
        <InvoiceGenerator />
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold">Invoice History</h2>

        {error ? (
          <p className="text-red-600">Error loading invoices: {error.message}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Invoice #</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Billing Period</th>
                  <th className="p-3 text-left">Subtotal</th>
                  <th className="p-3 text-left">Tax</th>
                  <th className="p-3 text-left">Total</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">PDF</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">View</th>
                </tr>
              </thead>
              <tbody>
                {(invoices ?? []).map((invoice) => (
                  <tr key={invoice.id} className="border-t">
                    <td className="p-3 font-medium">
                      {invoice.invoice_number || "-"}
                    </td>
                    <td className="p-3">
                      {invoice.bill_to || invoice.customer_name || "-"}
                    </td>
                    <td className="p-3">{invoice.customer_email ?? "-"}</td>
                    <td className="p-3">
                      {invoice.billing_period_start && invoice.billing_period_end
                        ? `${invoice.billing_period_start} to ${invoice.billing_period_end}`
                        : "-"}
                    </td>
                    <td className="p-3">
                      ${Number(invoice.subtotal ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      ${Number(invoice.tax ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3 font-semibold">
                      ${Number(invoice.total ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium capitalize">
                        {invoice.status || "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <OpenInvoicePdfButton invoiceId={invoice.id} />
                    </td>
                    <td className="p-3">
                      <EmailInvoiceButton invoiceId={invoice.id} />
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/invoices/${invoice.id}`}
                        className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}

                {(invoices ?? []).length === 0 && (
                  <tr>
                    <td colSpan={11} className="p-6 text-center text-gray-500">
                      No invoices yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}