import { TicketPriority, TicketStatus, TicketUrgency } from './types';

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function priorityClass(priority: TicketPriority) {
  return {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-700'
  }[priority];
}

export function urgencyClass(urgency: TicketUrgency) {
  return {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-orange-100 text-orange-800',
    Urgent: 'bg-red-100 text-red-700'
  }[urgency];
}

export function statusClass(status: TicketStatus) {
  return {
    New: 'bg-sky-100 text-sky-700',
    'In Progress': 'bg-indigo-100 text-indigo-700',
    'Waiting on User': 'bg-purple-100 text-purple-700',
    'Resolved - Awaiting Confirmation': 'bg-emerald-100 text-emerald-700',
    Closed: 'bg-slate-200 text-slate-700',
    Overdue: 'bg-red-100 text-red-700'
  }[status];
}

export function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

export function hoursDecimal(value: number) {
  return Number(value || 0).toFixed(2);
}
