import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import StatCard from "@/components/dashboard/StatCard";
import { APP_NAME } from "@/lib/constants";

type TicketRow = {
  id: string;
  issue_title?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: string | null;
};

type InvoiceRow = {
  id: string;
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
    normalized.includes("resolved") ||
    normalized.includes("closed") ||
    normalized.includes("complete")
  ) {
    return "status-badge status-success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("in progress") ||
    normalized.includes("open")
  ) {
    return "status-badge status-warning";
  }

  if (
    normalized.includes("urgent") ||
    normalized.includes("overdue") ||
    normalized.includes("blocked")
  ) {
    return "status-badge status-danger";
  }

  return "status-badge status-open";
}

function getPriorityClass(priority: string | null | undefined) {
  const normalized = (priority ?? "").toLowerCase();

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return "status-badge status-danger";
  }

  if (normalized.includes("medium")) {
    return "status-badge status-warning";
  }

  if (normalized.includes("low")) {
    return "status-badge status-success";
  }

  return "status-badge status-open";
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  const isSupportOrAdmin = ["support", "admin"].includes(profile.role);
  const isAdmin = profile.role === "admin";

  const { data: myTickets } = await supabase
    .from("tickets")
    .select("id, issue_title, status, priority, created_at")
    .eq("submitted_by_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentTickets = (myTickets ?? []) as TicketRow[];

  const { data: allTickets } = await supabase
    .from("tickets")
    .select("id")
    .limit(2000);

  const { data: allInvoices } = await supabase
    .from("invoices")
    .select("id, status, total_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const invoiceRows = (allInvoices ?? []) as InvoiceRow[];

  const myTicketCount = recentTickets.length;
  const totalTicketCount = allTickets?.length ?? 0;
  const totalInvoiceCount = invoiceRows.length;

  const totalInvoiceValue = invoiceRows.reduce((sum, invoice) => {
    return sum + Number(invoice.total_amount ?? 0);
  }, 0);

  const paidInvoiceCount = invoiceRows.filter((invoice) =>
    (invoice.status ?? "").toLowerCase().includes("paid")
  ).length;

  return (
    <div className="space-y-6">
      <section className="panel-premium relative overflow-hidden">
        <div className="absolute inset-0 nexus-grid-bg opacity-20" />

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
                ERP Nexus
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-nexus-900">
                {APP_NAME}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-nexus-600">
                Operational support, ticket visibility, and billing control in
                one place. Because apparently humans need one dashboard instead
                of seventeen tabs.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-nexus-200 bg-white/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Full Name
                </p>
                <p className="mt-2 text-sm font-medium text-nexus-900">
                  {profile.full_name || "Not set"}
                </p>
              </div>

              <div className="rounded-xl border border-nexus-200 bg-white/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Email
                </p>
                <p className="mt-2 text-sm font-medium text-nexus-900">
                  {user.email || "Not set"}
                </p>
              </div>

              <div className="rounded-xl border border-nexus-200 bg-white/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Department
                </p>
                <p className="mt-2 text-sm font-medium text-nexus-900">
                  {profile.department || "Not set"}
                </p>
              </div>

              <div className="rounded-xl border border-nexus-200 bg-white/90 p-4 shadow-soft">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Role
                </p>
                <p className="mt-2 text-sm font-medium capitalize text-nexus-900">
                  {profile.role || "Not set"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row lg:flex-col">
            <Link href="/dashboard/tickets/new" className="button-primary">
              Submit Ticket
            </Link>

            <Link href="/dashboard/tickets" className="button-secondary">
              View My Tickets
            </Link>

            <LogoutButton />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="My Recent Tickets"
          value={myTicketCount}
          subtext="Most recent 5 loaded"
        />

        <StatCard
          label="Total Tickets"
          value={totalTicketCount}
          subtext="System-wide snapshot"
          tone="warning"
        />

        <StatCard
          label="Invoices"
          value={totalInvoiceCount}
          subtext="Billing records"
        />

        <StatCard
          label="Invoice Value"
          value={formatCurrency(totalInvoiceValue)}
          subtext={`${paidInvoiceCount} paid`}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="panel-premium xl:col-span-2">
          <div className="border-b border-nexus-200 px-6 py-5">
            <div className="section-header mb-0">
              <div>
                <h2 className="section-title">Recent Tickets</h2>
                <p className="section-subtitle">
                  Your latest submitted support activity.
                </p>
              </div>

              <Link href="/dashboard/tickets" className="button-secondary">
                View All
              </Link>
            </div>
          </div>

          <div className="p-6">
            {recentTickets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-nexus-300 bg-nexus-50 p-10 text-center">
                <h3 className="text-lg font-semibold text-nexus-900">
                  No tickets yet
                </h3>
                <p className="mt-2 text-sm text-nexus-500">
                  Submit your first ticket to start tracking ERP support work.
                </p>
                <div className="mt-6">
                  <Link href="/dashboard/tickets/new" className="button-primary">
                    Create Ticket
                  </Link>
                </div>
              </div>
            ) : (
              <div className="table-shell">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="table-header">
                      <tr>
                        <th className="px-4 py-3">Issue</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((ticket) => (
                        <tr key={ticket.id} className="table-row">
                          <td className="px-4 py-3 font-medium text-nexus-900">
                            {ticket.issue_title || "Untitled issue"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={getStatusClass(ticket.status)}>
                              {ticket.status || "Unknown"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={getPriorityClass(ticket.priority)}>
                              {ticket.priority || "Not set"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-nexus-500">
                            {formatDate(ticket.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel-premium">
            <div className="border-b border-nexus-200 px-6 py-5">
              <h2 className="section-title">Workspace</h2>
              <p className="section-subtitle">
                Common actions for support and administration.
              </p>
            </div>

            <div className="grid gap-3 p-6">
              <Link
                href="/dashboard/tickets/new"
                className="rounded-xl border border-nexus-200 bg-white p-4 transition hover:border-brand hover:bg-blue-50/40"
              >
                <h3 className="text-base font-semibold text-nexus-900">
                  Submit a Ticket
                </h3>
                <p className="mt-1 text-sm text-nexus-600">
                  Log a new issue for support to review.
                </p>
              </Link>

              <Link
                href="/dashboard/tickets"
                className="rounded-xl border border-nexus-200 bg-white p-4 transition hover:border-brand hover:bg-blue-50/40"
              >
                <h3 className="text-base font-semibold text-nexus-900">
                  My Tickets
                </h3>
                <p className="mt-1 text-sm text-nexus-600">
                  View your submitted tickets and status.
                </p>
              </Link>

              <Link
                href="/dashboard/invoices"
                className="rounded-xl border border-nexus-200 bg-white p-4 transition hover:border-brand hover:bg-blue-50/40"
              >
                <h3 className="text-base font-semibold text-nexus-900">
                  Invoices
                </h3>
                <p className="mt-1 text-sm text-nexus-600">
                  Review billing history and invoice totals.
                </p>
              </Link>

              {isSupportOrAdmin && (
                <Link
                  href="/dashboard/support"
                  className="rounded-xl border border-nexus-200 bg-white p-4 transition hover:border-brand hover:bg-blue-50/40"
                >
                  <h3 className="text-base font-semibold text-nexus-900">
                    Support Queue
                  </h3>
                  <p className="mt-1 text-sm text-nexus-600">
                    Review, assign, and manage all tickets.
                  </p>
                </Link>
              )}

              {isAdmin && (
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-nexus-200 bg-white p-4 transition hover:border-brand hover:bg-blue-50/40"
                >
                  <h3 className="text-base font-semibold text-nexus-900">
                    User Management
                  </h3>
                  <p className="mt-1 text-sm text-nexus-600">
                    Manage users, companies, and role assignments.
                  </p>
                </Link>
              )}
            </div>
          </section>

          <section className="panel-premium">
            <div className="border-b border-nexus-200 px-6 py-5">
              <h2 className="section-title">Account Snapshot</h2>
              <p className="section-subtitle">
                Current user profile information.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Full Name
                </p>
                <p className="mt-1 text-sm font-medium text-nexus-900">
                  {profile.full_name || "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Email
                </p>
                <p className="mt-1 text-sm font-medium text-nexus-900">
                  {user.email || "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Department
                </p>
                <p className="mt-1 text-sm font-medium text-nexus-900">
                  {profile.department || "Not set"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
                  Role
                </p>
                <p className="mt-1 text-sm font-medium capitalize text-nexus-900">
                  {profile.role || "Not set"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}