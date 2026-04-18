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
    description: entry.tickets?.[0]?.title || 'Support work',
    hours: entry.hours_worked,
    rate: entry.billing_rate,
    amount: Number(entry.hours_worked) * Number(entry.billing_rate)
  }));

  await admin.from('invoice_items').insert(items);
  await admin.from('time_entries').update({ invoice_id: invoice.id }).in('id', timeEntries.map((x) => x.id));

  revalidatePath('/invoices');
  redirect(`/invoices/${invoice.id}/print`);
}