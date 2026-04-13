import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { TicketRow, UserRole } from '@/lib/types';

export async function getCurrentUserProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email, department_id, role')
    .eq('id', user.id)
    .single();

  return { user, profile };
}

export async function requireAuth() {
  const current = await getCurrentUserProfile();
  if (!current?.user) redirect('/login');
  return current;
}

export async function requireRole(roles: UserRole[]) {
  const current = await requireAuth();
  if (!current.profile || !roles.includes(current.profile.role)) {
    redirect('/dashboard');
  }
  return current;
}

export async function getDepartments() {
  const admin = createAdminClient();
  const { data } = await admin.from('departments').select('id, name').order('name');
  return data ?? [];
}

export async function getCategories() {
  const admin = createAdminClient();
  const { data } = await admin.from('issue_categories').select('id, name').order('name');
  return data ?? [];
}

export async function getUserTickets(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.rpc('get_ticket_list', { p_user_id: userId, p_include_all: false });
  return (data ?? []) as TicketRow[];
}

export async function getAllTickets() {
  const admin = createAdminClient();
  const { data } = await admin.rpc('get_ticket_list', { p_user_id: null, p_include_all: true });
  return (data ?? []) as TicketRow[];
}

export async function getTicketById(ticketId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('tickets')
    .select(
      `
      *,
      departments(name),
      issue_categories(name),
      profiles!tickets_user_id_fkey(full_name, email),
      ticket_updates(id, note, status, created_at, created_by),
      time_entries(id, work_date, hours_worked, billing_rate, notes, billable, created_by)
    `
    )
    .eq('id', ticketId)
    .single();

  return data;
}

export async function getInvoiceWithItems(invoiceId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('invoices')
    .select('*, invoice_items(*, tickets(title))')
    .eq('id', invoiceId)
    .single();
  return data;
}

export async function getInvoices() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('invoices')
    .select('id, invoice_number, bill_to, billing_period_start, billing_period_end, total_hours, total_amount, status, created_at')
    .order('created_at', { ascending: false });
  return data ?? [];
}
