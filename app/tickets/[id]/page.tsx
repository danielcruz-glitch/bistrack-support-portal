import { AppShell } from '@/components/AppShell';
import {
  addTimeEntryAction,
  confirmResolvedAction,
  reopenTicketAction,
  updateTicketStatusAction
} from '@/app/actions';
import { getTicketById, requireAuth } from '@/lib/data';
import { priorityClass, statusClass, urgencyClass, currency, hoursDecimal } from '@/lib/utils';

export default async function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await requireAuth();
  const ticket = await getTicketById(id);

  if (!ticket) {
    return <div className="p-8">Ticket not found.</div>;
  }

  const isSupport = current.profile?.role === 'support' || current.profile?.role === 'admin';
  const totalHours = (ticket.time_entries ?? []).reduce((sum: number, item: any) => sum + Number(item.hours_worked), 0);
  const totalAmount = (ticket.time_entries ?? []).reduce(
    (sum: number, item: any) => sum + Number(item.hours_worked) * Number(item.billing_rate || 0),
    0
  );

  return (
    <AppShell role={current.profile?.role} userName={current.profile?.full_name || current.user.email || ''}>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{ticket.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Submitted by {ticket.requester_name} ({ticket.requester_email})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
                <span className={`badge ${urgencyClass(ticket.urgency)}`}>{ticket.urgency}</span>
                <span className={`badge ${statusClass(ticket.status)}`}>{ticket.status}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Department</div>
                <div className="mt-1 text-sm text-slate-700">{ticket.departments?.name}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issue Type</div>
                <div className="mt-1 text-sm text-slate-700">
                  {ticket.issue_categories?.name}
                  {ticket.other_issue_text ? ` - ${ticket.other_issue_text}` : ''}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{ticket.issue_description}</p>
            </div>

            {!isSupport && ticket.status === 'Resolved - Awaiting Confirmation' && (
              <div className="mt-6 flex flex-wrap gap-3">
                <form action={confirmResolvedAction}>
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <button className="rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
                    Mark issue resolved
                  </button>
                </form>
                <form action={reopenTicketAction}>
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <button className="rounded-xl bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700">
                    Still need help
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-slate-900">Activity history</h2>
            <div className="mt-4 space-y-4">
              {(ticket.ticket_updates ?? []).map((update: any) => (
                <div key={update.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`badge ${statusClass(update.status)}`}>{update.status}</span>
                    <span className="text-xs text-slate-500">{new Date(update.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{update.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-slate-900">Support summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Created</span><span>{new Date(ticket.created_at).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Updated</span><span>{new Date(ticket.updated_at).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Hours logged</span><span>{hoursDecimal(totalHours)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Billable value</span><span>{currency(totalAmount)}</span></div>
            </div>
          </div>

          {isSupport && (
            <>
              <div className="card">
                <h2 className="text-xl font-bold text-slate-900">Update status</h2>
                <form action={updateTicketStatusAction} className="mt-4 space-y-4">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <div>
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" defaultValue={ticket.status}>
                      <option>New</option>
                      <option>In Progress</option>
                      <option>Waiting on User</option>
                      <option>Resolved - Awaiting Confirmation</option>
                      <option>Closed</option>
                      <option>Overdue</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="note">Internal note</label>
                    <textarea id="note" name="note" rows={4} placeholder="Add a progress update or resolution note" />
                  </div>
                  <button className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
                    Save update
                  </button>
                </form>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-slate-900">Log work time</h2>
                <form action={addTimeEntryAction} className="mt-4 space-y-4">
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <div>
                    <label htmlFor="workDate">Work date</label>
                    <input id="workDate" name="workDate" type="date" required defaultValue={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="hoursWorked">Hours worked</label>
                      <input id="hoursWorked" name="hoursWorked" type="number" min="0.25" step="0.25" required />
                    </div>
                    <div>
                      <label htmlFor="billingRate">Billing rate</label>
                      <input id="billingRate" name="billingRate" type="number" min="0" step="0.01" defaultValue={process.env.DEFAULT_HOURLY_RATE || 125} required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="billable">Billable?</label>
                    <select id="billable" name="billable" defaultValue="yes">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="notes">Work notes</label>
                    <textarea id="notes" name="notes" rows={4} placeholder="Describe what was fixed or investigated" required />
                  </div>
                  <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800">
                    Add time entry
                  </button>
                </form>
              </div>
            </>
          )}

          <div className="card">
            <h2 className="text-xl font-bold text-slate-900">Time entries</h2>
            <div className="mt-4 space-y-3">
              {(ticket.time_entries ?? []).length === 0 && <p className="text-sm text-slate-500">No time entries logged yet.</p>}
              {(ticket.time_entries ?? []).map((entry: any) => (
                <div key={entry.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-800">{entry.work_date}</div>
                    <div>{hoursDecimal(entry.hours_worked)} hrs</div>
                  </div>
                  <div className="mt-1 text-slate-500">Rate: {currency(Number(entry.billing_rate || 0))}</div>
                  <p className="mt-2 text-slate-700">{entry.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
