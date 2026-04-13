import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/StatCard';
import { TicketTable } from '@/components/TicketTable';
import { getUserTickets, requireAuth } from '@/lib/data';

export default async function DashboardPage() {
  const current = await requireAuth();
  const tickets = await getUserTickets(current.user.id);

  const openTickets = tickets.filter((t) => t.status !== 'Closed').length;
  const overdueTickets = tickets.filter((t) => t.is_overdue).length;
  const closedTickets = tickets.filter((t) => t.status === 'Closed').length;

  return (
    <AppShell role={current.profile?.role} userName={current.profile?.full_name || current.user.email || ''}>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My tickets</h1>
          <p className="mt-1 text-slate-500">Track support issues, status updates, and historical activity.</p>
        </div>
        <Link href="/tickets/new" className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
          Submit new ticket
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Open tickets" value={openTickets} />
        <StatCard label="Closed tickets" value={closedTickets} />
        <StatCard label="Overdue tickets" value={overdueTickets} help="Tickets older than 2 days still needing action." />
      </div>

      <TicketTable tickets={tickets} />
    </AppShell>
  );
}
