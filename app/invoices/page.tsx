import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { createInvoiceAction } from '@/app/actions';
import { getInvoices, requireRole } from '@/lib/data';
import { currency, hoursDecimal } from '@/lib/utils';

export default async function InvoicesPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const current = await requireRole(['support', 'admin']);
  const invoices = await getInvoices();
  const params = await searchParams;

  return (
    <AppShell role={current.profile?.role} userName={current.profile?.full_name || current.user.email || ''}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_2fr]">
        <div className="card h-fit">
          <h1 className="text-2xl font-bold text-slate-900">Create invoice</h1>
          <p className="mt-1 text-sm text-slate-500">Generate a bill from unbilled time entries for a date range.</p>
          {params.error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{params.error}</div>}
          <form action={createInvoiceAction} className="mt-5 space-y-4">
            <div>
              <label htmlFor="billTo">Bill to</label>
              <input id="billTo" name="billTo" defaultValue={process.env.INVOICE_BILL_TO || ''} required />
            </div>
            <div>
              <label htmlFor="start">Billing period start</label>
              <input id="start" name="start" type="date" required />
            </div>
            <div>
              <label htmlFor="end">Billing period end</label>
              <input id="end" name="end" type="date" required />
            </div>
            <button className="rounded-xl bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-dark">
              Generate invoice
            </button>
          </form>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Bill To</th>
                <th>Period</th>
                <th>Hours</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice: any) => (
                <tr key={invoice.id}>
                  <td>
                    <Link href={`/invoices/${invoice.id}/print`} className="font-semibold text-brand hover:underline">
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td>{invoice.bill_to}</td>
                  <td>{invoice.billing_period_start} to {invoice.billing_period_end}</td>
                  <td>{hoursDecimal(invoice.total_hours)}</td>
                  <td>{currency(invoice.total_amount)}</td>
                  <td>{invoice.status}</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-slate-500">No invoices generated yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
