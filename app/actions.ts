'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, requireRole } from '@/lib/data';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendNotificationEmail(subject: string, html: string) {
  if (!resend || !process.env.SUPPORT_NOTIFICATION_EMAIL) return;

  await resend.emails.send({
    from: 'BisTrack Support Portal <onboarding@resend.dev>',
    to: process.env.SUPPORT_NOTIFICATION_EMAIL,
    subject,
    html
  });
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();
  const fullName = String(formData.get('fullName') || '').trim();
  const departmentId = String(formData.get('departmentId') || '').trim();

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: fullName,
        department_id: departmentId
      }
    }
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/login?message=Check your email to confirm your account.');
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '').trim();
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function createTicketAction(formData: FormData) {
  const current = await requireAuth();
  const admin = createAdminClient();

  const title = String(formData.get('title') || '').trim();
  const issueDescription = String(formData.get('issueDescription') || '').trim();
  const categoryId = String(formData.get('categoryId') || '').trim();
  const departmentId = String(formData.get('departmentId') || current.profile?.department_id || '').trim();
  const priority = String(formData.get('priority') || 'Medium');
  const urgency = String(formData.get('urgency') || 'Medium');
  const otherIssueText = String(formData.get('otherIssueText') || '').trim();

  const { data: ticket, error } = await admin
    .from('tickets')
    .insert({
      user_id: current.user.id,
      department_id: departmentId,
      category_id: categoryId,
      title,
      issue_description: issueDescription,
      priority,
      urgency,
      other_issue_text: otherIssueText || null,
      requester_name: current.profile?.full_name || current.user.user_metadata.full_name || current.user.email,
      requester_email: current.user.email,
      status: 'New'
    })
    .select('id')
    .single();

  if (error || !ticket) {
    redirect(`/tickets/new?error=${encodeURIComponent(error?.message || 'Could not create ticket')}`);
  }

  await admin.from('ticket_updates').insert({
    ticket_id: ticket.id,
    created_by: current.user.id,
    status: 'New',
    note: 'Ticket created'
  });

  await sendNotificationEmail(
    `New Support Ticket: ${title}`,
    `<p><strong>User:</strong> ${current.profile?.full_name || current.user.email}</p>
     <p><strong>Email:</strong> ${current.user.email}</p>
     <p><strong>Priority:</strong> ${priority}</p>
     <p><strong>Urgency:</strong> ${urgency}</p>
     <p><strong>Description:</strong><br/>${issueDescription}</p>
     <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/tickets/${ticket.id}">Open Ticket</a></p>`
  );

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicketStatusAction(formData: FormData) {
  await requireRole(['support', 'admin']);
  const current = await requireAuth();
  const admin = createAdminClient();

  const ticketId = String(formData.get('ticketId') || '');
  const status = String(formData.get('status') || '');
  const note = String(formData.get('note') || '').trim();

  const resolvedAt = status === 'Closed' ? new Date().toISOString() : null;

  await admin
    .from('tickets')
    .update({ status, resolved_at: resolvedAt, is_overdue: status === 'Overdue' })
    .eq('id', ticketId);

  await admin.from('ticket_updates').insert({
    ticket_id: ticketId,
    created_by: current.user.id,
    status,
    note: note || `Status changed to ${status}`
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath('/admin');
}

export async function confirmResolvedAction(formData: FormData) {
  const current = await requireAuth();
  const admin = createAdminClient();
  const ticketId = String(formData.get('ticketId') || '');

  await admin
    .from('tickets')
    .update({ status: 'Closed', resolved_at: new Date().toISOString(), is_overdue: false })
    .eq('id', ticketId)
    .eq('user_id', current.user.id);

  await admin.from('ticket_updates').insert({
    ticket_id: ticketId,
    created_by: current.user.id,
    status: 'Closed',
    note: 'User confirmed issue resolved'
  });

  revalidatePath('/dashboard');
  revalidatePath(`/tickets/${ticketId}`);
}

export async function reopenTicketAction(formData: FormData) {
  const current = await requireAuth();
  const admin = createAdminClient();
  const ticketId = String(formData.get('ticketId') || '');

  await admin
    .from('tickets')
    .update({ status: 'In Progress', resolved_at: null })
    .eq('id', ticketId)
    .eq('user_id', current.user.id);

  await admin.from('ticket_updates').insert({
    ticket_id: ticketId,
    created_by: current.user.id,
    status: 'In Progress',
    note: 'User reported issue still needs help'
  });

  revalidatePath('/dashboard');
  revalidatePath(`/tickets/${ticketId}`);
}

export async function addTimeEntryAction(formData: FormData) {
  const current = await requireRole(['support', 'admin']);
  const admin = createAdminClient();

  const ticketId = String(formData.get('ticketId') || '');
  const workDate = String(formData.get('workDate') || '').trim();
  const hoursWorked = Number(formData.get('hoursWorked') || 0);
  const billingRate = Number(formData.get('billingRate') || process.env.DEFAULT_HOURLY_RATE || 125);
  const notes = String(formData.get('notes') || '').trim();
  const billable = String(formData.get('billable') || 'yes') === 'yes';

  await admin.from('time_entries').insert({
    ticket_id: ticketId,
    work_date: workDate,
    hours_worked: hoursWorked,
    billing_rate: billingRate,
    notes,
    billable,
    created_by: current.user.id
  });

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath('/admin');
}

export async function createInvoiceAction(formData: FormData) {
  await requireRole(['support', 'admin']);
  const admin = createAdminClient();

  const start = String(formData.get('start') || '').trim();
  const end = String(formData.get('end') || '').trim();
  const billTo = String(formData.get('billTo') || process.env.INVOICE_BILL_TO || '').trim();

  const { data: timeEntries } = await admin
    .from('time_entries')
    .select('id, ticket_id, hours_worked, billing_rate, work_date, tickets(title)')
    .eq('billable', true)
    .is('invoice_id', null)
    .gte('work_date', start)
    .lte('work_date', end);

  if (!timeEntries || timeEntries.length === 0) {
    redirect('/invoices?error=No billable time entries found for that date range.');
  }

  const totalHours = timeEntries.reduce((sum, item) => sum + Number(item.hours_worked), 0);
  const totalAmount = timeEntries.reduce(
    (sum, item) => sum + Number(item.hours_worked) * Number(item.billing_rate),
    0
  );

  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 900 + 100)}`;

  const { data: invoice } = await admin
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      bill_to: billTo,
      billing_period_start: start,
      billing_period_end: end,
      total_hours: totalHours,
      total_amount: totalAmount,
      status: 'Draft'
    })
    .select('id')
    .single();

  if (!invoice) {
    redirect('/invoices?error=Could not create invoice.');
  }

  const items = timeEntries.map((entry) => ({
    invoice_id: invoice.id,
    ticket_id: entry.ticket_id,
    time_entry_id: entry.id,
    description: entry.tickets?.title || 'Support work',
    hours: entry.hours_worked,
    rate: entry.billing_rate,
    amount: Number(entry.hours_worked) * Number(entry.billing_rate)
  }));

  await admin.from('invoice_items').insert(items);
  await admin.from('time_entries').update({ invoice_id: invoice.id }).in('id', timeEntries.map((x) => x.id));

  revalidatePath('/invoices');
  redirect(`/invoices/${invoice.id}/print`);
}
