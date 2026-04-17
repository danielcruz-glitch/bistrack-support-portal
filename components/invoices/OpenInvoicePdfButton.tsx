"use client";

import { useState } from "react";

type Props = {
  invoiceId: string;
  label?: string;
};

export default function OpenInvoicePdfButton({
  invoiceId,
  label = "Open PDF",
}: Props) {
  const [loading, setLoading] = useState(false);

  function handleOpen() {
    if (!invoiceId) return;

    setLoading(true);

    const url = `/api/invoices/${invoiceId}/pdf`;

    // Open in new tab
    window.open(url, "_blank");

    // Small delay so user sees feedback
    setTimeout(() => setLoading(false), 500);
  }

  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {loading ? "Opening..." : label}
    </button>
  );
}