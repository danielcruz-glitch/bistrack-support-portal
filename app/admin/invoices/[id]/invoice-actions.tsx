"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  async function updateStatus(newStatus: string) {
    try {
      setLoading(true);

      const res = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update status.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error updating status.");
    } finally {
      setLoading(false);
    }
  }

  async function emailInvoice() {
    try {
      setEmailing(true);

      const res = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to email invoice.");
      }

      alert("Invoice emailed successfully.");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Email failed.");
    } finally {
      setEmailing(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-3">
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noreferrer"
        className="rounded bg-black px-3 py-1 text-white"
      >
        Download PDF
      </a>

      <button
        onClick={emailInvoice}
        disabled={emailing}
        className="rounded bg-purple-600 px-3 py-1 text-white disabled:opacity-50"
      >
        {emailing ? "Sending..." : "Email Invoice"}
      </button>

      {status === "draft" && (
        <button
          onClick={() => updateStatus("sent")}
          disabled={loading}
          className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
        >
          Mark as Sent
        </button>
      )}

      {status === "sent" && (
        <button
          onClick={() => updateStatus("paid")}
          disabled={loading}
          className="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
        >
          Mark as Paid
        </button>
      )}

      <span className="self-center text-sm text-gray-500">
        Current status: {status}
      </span>
    </div>
  );
}