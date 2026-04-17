"use client";

import { useState } from "react";

type Props = {
  invoiceId: string;
  label?: string;
};

export default function EmailInvoiceButton({
  invoiceId,
  label = "Email Invoice",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  async function handleEmail() {
    if (!invoiceId || loading) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/email`, {
        method: "POST",
      });

      const text = await response.text();

      if (!response.ok) {
        setMessage(text || "Failed to email invoice.");
      } else {
        setMessage("Invoice emailed successfully.");
      }
    } catch {
      setMessage("Something went wrong while emailing the invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleEmail}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? "Sending..." : label}
      </button>

      {message ? (
        <span
          className={`text-xs ${
            message.toLowerCase().includes("success")
              ? "text-emerald-700"
              : "text-red-600"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}