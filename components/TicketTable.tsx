import Link from 'next/link';
import { TicketRow } from '@/lib/types';
import { priorityClass, statusClass, urgencyClass } from '@/lib/utils';

export function TicketTable({ tickets }: { tickets: TicketRow[] }) {
  if (tickets.length === 0) {
    return <div className="card text-sm text-slate-500">No tickets found.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>
                <Link href={`/tickets/${ticket.id}`} className="font-semibold text-brand hover:underline">
                  {ticket.title}
                </Link>
                <div className="mt-1 text-xs text-slate-500">{ticket.category_name}</div>
              </td>
              <td>
                <div className="font-medium text-slate-700">{ticket.requester_name}</div>
                <div className="text-xs text-slate-500">{ticket.requester_email}</div>
              </td>
              <td>{ticket.department_name}</td>
              <td><span className={`badge ${priorityClass(ticket.priority)}`}>{ticket.priority}</span></td>
              <td><span className={`badge ${urgencyClass(ticket.urgency)}`}>{ticket.urgency}</span></td>
              <td><span className={`badge ${statusClass(ticket.status)}`}>{ticket.status}</span></td>
              <td>
                {new Date(ticket.created_at).toLocaleDateString()}
                {ticket.is_overdue && <div className="mt-1 text-xs font-semibold text-red-600">Older than 2 days</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
