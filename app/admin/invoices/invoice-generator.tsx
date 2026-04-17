"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceGenerator() {
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    billing_period_start: "",
    billing_period_end: "",
    tax_rate: "0",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          billing_period_start: form.billing_period_start,
          billing_period_end: form.billing_period_end,
          tax_rate: Number(form.tax_rate),
          notes: form.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate invoice.");
      }

      alert(`Invoice ${data.invoice.invoice_number} created successfully.`);

      setForm({
        customer_name: "",
        customer_email: "",
        billing_period_start: "",
        billing_period_end: "",
        tax_rate: "0",
        notes: "",
      });

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-lg border p-4 md:grid-cols-2"
    >
      <div>
        <label className="mb-1 block font-medium">Customer Name</label>
        <input
          required
          className="w-full rounded border p-2"
          value={form.customer_name}
          onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Customer Email</label>
        <input
          type="email"
          className="w-full rounded border p-2"
          value={form.customer_email}
          onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Billing Period Start</label>
        <input
          required
          type="date"
          className="w-full rounded border p-2"
          value={form.billing_period_start}
          onChange={(e) =>
            setForm({ ...form, billing_period_start: e.target.value })
          }
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Billing Period End</label>
        <input
          required
          type="date"
          className="w-full rounded border p-2"
          value={form.billing_period_end}
          onChange={(e) =>
            setForm({ ...form, billing_period_end: e.target.value })
          }
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Tax Rate %</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="w-full rounded border p-2"
          value={form.tax_rate}
          onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block font-medium">Notes</label>
        <textarea
          rows={4}
          className="w-full rounded border p-2"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
      </div>
    </form>
  );
}