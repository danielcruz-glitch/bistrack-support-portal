"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  invoiceId: string;
  label?: string;
};

export default function EmailInvoiceButton({
  invoiceId,
  label = "Email Invoice",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
        throw new Error(text || "Failed to email invoice.");
      }

      setMessage(text || "Invoice emailed successfully.");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while emailing the invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  const isSuccess =
    message.toLowerCase().includes("success") ||
    message.toLowerCase().includes("emailed");

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleEmail}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Sending..." : label}
      </button>

      {message ? (
        <span className={`text-xs ${isSuccess ? "text-emerald-700" : "text-red-600"}`}>
          {message}
        </span>
      ) : null}
    </div>
  );
}