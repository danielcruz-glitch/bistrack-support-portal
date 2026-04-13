import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: overdueTickets, error } = await admin
    .from('tickets')
    .select('id, title, requester_name, requester_email, created_at, status, is_overdue')
    .lt('created_at', cutoff)
    .not('status', 'in', '("Closed","Resolved - Awaiting Confirmation")');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ids = (overdueTickets ?? []).map((ticket) => ticket.id);
  if (ids.length > 0) {
    await admin.from('tickets').update({ is_overdue: true, status: 'Overdue' }).in('id', ids);
  }

  if (resend && process.env.SUPPORT_NOTIFICATION_EMAIL && ids.length > 0) {
    const rows = overdueTickets!
      .map(
        (ticket) => `<li><strong>${ticket.title}</strong> - ${ticket.requester_name} - created ${new Date(ticket.created_at).toLocaleString()} - <a href="${process.env.NEXT_PUBLIC_SITE_URL}/tickets/${ticket.id}">Open</a></li>`
      )
      .join('');

    await resend.emails.send({
      from: 'BisTrack Support Portal <onboarding@resend.dev>',
      to: process.env.SUPPORT_NOTIFICATION_EMAIL,
      subject: `Overdue Ticket Alert (${ids.length})`,
      html: `<p>The following support tickets are older than 2 days and still open:</p><ul>${rows}</ul>`
    });
  }

  return NextResponse.json({ updated: ids.length, overdueTicketIds: ids });
}
