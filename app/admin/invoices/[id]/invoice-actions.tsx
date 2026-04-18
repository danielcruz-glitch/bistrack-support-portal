"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type InvoiceActionsProps = {
  invoiceId: string;
  status: string;
};

function getStatusBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("paid")) {
    return "status-badge status-success";
  }

  if (normalized.includes("draft")) {
    return "status-badge status-warning";
  }

  if (normalized.includes("overdue") || normalized.includes("void")) {
    return "status-badge status-danger";
  }

  return "status-badge status-open";
}

export default function InvoiceActions({
  invoiceId,
  status,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const normalizedStatus = useMemo(() => (status || "unknown").toLowerCase(), [status]);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/api/invoices/${invoiceId}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="button-secondary"
        >
          Download PDF
        </a>

        <button
          onClick={emailInvoice}
          disabled={emailing}
          className="button-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {emailing ? "Sending..." : "Email Invoice"}
        </button>

        {normalizedStatus === "draft" && (
          <button
            onClick={() => updateStatus("sent")}
            disabled={loading}
            className="button-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Mark as Sent"}
          </button>
        )}

        {normalizedStatus === "sent" && (
          <button
            onClick={() => updateStatus("paid")}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Mark as Paid"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-nexus-500">
          Current Status
        </span>

        <span className={getStatusBadgeClass(normalizedStatus)}>
          {status || "Unknown"}
        </span>
      </div>
    </div>
  );
}