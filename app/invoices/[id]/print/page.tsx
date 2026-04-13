import Link from 'next/link';
import { getInvoiceWithItems, requireRole } from '@/lib/data';
import { currency, hoursDecimal } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['support', 'admin']);
  const { id } = await params;
  const invoice = await getInvoiceWithItems(id);

  if (!invoice) {
    return <div className="p-8">Invoice not found.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 print:px-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/invoices" className="text-brand hover:underline">Back to invoices</Link>
        <PrintButton />
      </div>

      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 print:shadow-none print:ring-0">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Invoice</h1>
            <p className="mt-2 text-sm text-slate-500">{invoice.invoice_number}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <div><strong>Bill To:</strong> {invoice.bill_to}</div>
            <div><strong>Period:</strong> {invoice.billing_period_start} to {invoice.billing_period_end}</div>
            <div><strong>Created:</strong> {new Date(invoice.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Hours</th>
                <th className="px-4 py-3 text-left">Rate</th>
                <th className="px-4 py-3 text-left">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.invoice_items ?? []).map((item: any) => (
                <tr key={item.id} className="border-t border-slate-200">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{hoursDecimal(item.hours)}</td>
                  <td className="px-4 py-3">{currency(item.rate)}</td>
                  <td className="px-4 py-3">{currency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 ml-auto max-w-sm space-y-3 text-sm">
          <div className="flex justify-between"><span>Total Hours</span><span>{hoursDecimal(invoice.total_hours)}</span></div>
          <div className="flex justify-between text-xl font-bold"><span>Total Due</span><span>{currency(invoice.total_amount)}</span></div>
        </div>
      </div>
    </div>
  );
}
