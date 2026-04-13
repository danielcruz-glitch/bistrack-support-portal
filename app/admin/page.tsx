import { AppShell } from '@/components/AppShell';
import { StatCard } from '@/components/StatCard';
import { TicketTable } from '@/components/TicketTable';
import { getAllTickets, requireRole } from '@/lib/data';
import { currency } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function AdminPage() {
  const current = await requireRole(['support', 'admin']);
  const tickets = await getAllTickets();
  const admin = createAdminClient();

  const { data: timeEntries } = await admin.from('time_entries').select('hours_worked, billing_rate').eq('billable', true);

  const totalHours = (timeEntries ?? []).reduce((sum, item) => sum + Number(item.hours_worked), 0);
  const totalRevenue = (timeEntries ?? []).reduce(
    (sum, item) => sum + Number(item.hours_worked) * Number(item.billing_rate),
    0
  );

  return (
    <AppShell role={current.profile?.role} userName={current.profile?.full_name || current.user.email || ''}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Support admin dashboard</h1>
        <p className="mt-1 text-slate-500">View all tickets, aging issues, and billable support activity.</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <StatCard label="All tickets" value={tickets.length} />
        <StatCard label="Open tickets" value={tickets.filter((t) => t.status !== 'Closed').length} />
        <StatCard label="Overdue tickets" value={tickets.filter((t) => t.is_overdue).length} />
        <StatCard label="Billable revenue logged" value={currency(totalRevenue)} help={`${totalHours.toFixed(2)} hours logged`} />
      </div>

      <TicketTable tickets={tickets} />
    </AppShell>
  );
}
