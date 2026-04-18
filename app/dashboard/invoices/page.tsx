import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatCard from "@/components/dashboard/StatCard";

type InvoiceRow = {
  id: string;
  invoice_number?: string | null;
  bill_to?: string | null;
  customer_name?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  created_at?: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(status: string | null | undefined) {
  const normalized = (status ?? "").toLowerCase();

  if (
    normalized.includes("paid") ||
    normalized.includes("complete") ||
    normalized.includes("sent")
  ) {
    return "status-badge status-success";
  }

  if (normalized.includes("draft") || normalized.includes("pending")) {
    return "status-badge status-warning";
  }

  if (normalized.includes("overdue") || normalized.includes("void")) {
    return "status-badge status-danger";
  }

  return "status-badge status-open";
}

export default async function DashboardInvoicesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (invoices ?? []) as InvoiceRow[];

  const totalInvoices = rows.length;

  const totalAmount = rows.reduce((sum, inv) => {
    return sum + Number(inv.total_amount ?? 0);
  }, 0);

  const draftCount = rows.filter((invoice) =>
    (invoice.status ?? "").toLowerCase().includes("draft")
  ).length;

  const paidCount = rows.filter((invoice) =>
    (invoice.status ?? "").toLowerCase().includes("paid")
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Invoices"
          value={totalInvoices}
          subtext="All invoices in system"
        />

        <StatCard
          label="Total Value"
          value={formatCurrency(totalAmount)}
          subtext="Combined invoice value"
        />

        <StatCard
          label="Draft"
          value={draftCount}
          subtext="Still being prepared"
          tone="warning"
        />

        <StatCard
          label="Paid"
          value={paidCount}
          subtext="Completed billing"
          tone="success"
        />
      </div>

      <section className="panel-premium overflow-hidden">
        <div className="relative border-b border-nexus-200 px-6 py-5">
          <div className="absolute inset-0 nexus-grid-bg opacity-20" />

          <div className="relative section-header mb-0">
            <div>
              <h1 className="section-title">Invoices</h1>
              <p className="section-subtitle">
                Review generated invoices, billing totals, and current status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/admin/invoices" className="button-secondary">
                Admin View
              </Link>

              <Link href="/admin/invoices" className="button-primary">
                Open Invoice Generator
              </Link>
            </div>
          </div>
        </div>

        <div className="p-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load invoices: {error.message}
            </div>
          ) : rows.length === 0 ? (
            <div className="relative overflow-hidden rounded-xl border border-dashed border-nexus-300 bg-nexus-50 p-12 text-center">
              <div className="absolute inset-0 nexus-grid-bg opacity-20" />

              <div className="relative">
                <h2 className="text-lg font-semibold text-nexus-900">
                  No invoices yet
                </h2>

                <p className="mt-2 text-sm text-nexus-500">
                  Start by logging work and generating your first invoice.
                </p>

                <div className="mt-6">
                  <Link href="/admin/invoices" className="button-primary">
                    Create Your First Invoice
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="table-shell">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="table-header">
                    <tr>
                      <th className="px-4 py-3">Invoice #</th>
                      <th className="px-4 py-3">Bill To</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((invoice) => {
                      const displayNumber =
                        invoice.invoice_number || invoice.id.slice(0, 8);

                      const billTo =
                        invoice.bill_to || invoice.customer_name || "—";

                      const amount = formatCurrency(invoice.total_amount);

                      return (
                        <tr key={invoice.id} className="table-row">
                          <td className="px-4 py-3 font-medium text-nexus-900">
                            {displayNumber}
                          </td>

                          <td className="px-4 py-3 text-nexus-700">
                            {billTo}
                          </td>

                          <td className="px-4 py-3">
                            <span className={getStatusClass(invoice.status)}>
                              {invoice.status || "Unknown"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-medium text-nexus-900">
                            {amount}
                          </td>

                          <td className="px-4 py-3 text-nexus-500">
                            {formatDate(invoice.created_at)}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/admin/invoices/${invoice.id}`}
                              className="button-ghost"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}