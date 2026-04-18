"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyOption = {
  id: string;
  name: string;
  billingEmail: string;
};

type CompaniesResponse = {
  companies: CompanyOption[];
};

export default function InvoiceGenerator() {
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const [form, setForm] = useState({
    company_id: "",
    customer_name: "",
    customer_email: "",
    billing_period_start: "",
    billing_period_end: "",
    tax_rate: "0",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoadingCompanies(true);

        const res = await fetch("/api/invoices/generate?lookup=companies");
        const data: CompaniesResponse = await res.json();

        if (!res.ok) {
          throw new Error("Failed to load companies.");
        }

        setCompanies(data.companies ?? []);
      } catch (error) {
        console.error(error);
        alert("Failed to load companies.");
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);

  const selectedCompany = useMemo(() => {
    return companies.find((company) => company.id === form.company_id) || null;
  }, [companies, form.company_id]);

  function handleCompanyChange(companyId: string) {
    const company = companies.find((item) => item.id === companyId);

    setForm((prev) => ({
      ...prev,
      company_id: companyId,
      customer_name: company?.name || "",
      customer_email: company?.billingEmail || "",
    }));
  }

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
          company_id: form.company_id,
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
        company_id: "",
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
      className="panel-premium grid gap-4 p-6 md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <h2 className="section-title">Create Invoice</h2>
        <p className="section-subtitle">
          Select a company, confirm the billing email, and generate an invoice
          from unbilled work logs in the chosen date range.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Company
        </label>
        <select
          required
          className="input-nexus"
          value={form.company_id}
          onChange={(e) => handleCompanyChange(e.target.value)}
          disabled={loadingCompanies}
        >
          <option value="">
            {loadingCompanies ? "Loading companies..." : "Select a company"}
          </option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Billing Email
        </label>
        <input
          type="email"
          className="input-nexus"
          value={form.customer_email}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, customer_email: e.target.value }))
          }
          placeholder="Auto-filled from company owner"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Billing Period Start
        </label>
        <input
          required
          type="date"
          className="input-nexus"
          value={form.billing_period_start}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              billing_period_start: e.target.value,
            }))
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Billing Period End
        </label>
        <input
          required
          type="date"
          className="input-nexus"
          value={form.billing_period_end}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              billing_period_end: e.target.value,
            }))
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Tax Rate %
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          className="input-nexus"
          value={form.tax_rate}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, tax_rate: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Customer Name
        </label>
        <input
          required
          className="input-nexus"
          value={form.customer_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, customer_name: e.target.value }))
          }
          placeholder="Auto-filled from company"
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-nexus-700">
          Notes
        </label>
        <textarea
          rows={4}
          className="input-nexus"
          value={form.notes}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, notes: e.target.value }))
          }
        />
      </div>

      <div className="md:col-span-2 flex items-center justify-between gap-3">
        <div className="text-sm text-nexus-500">
          {selectedCompany
            ? `Selected company: ${selectedCompany.name}`
            : "Select a company before generating an invoice."}
        </div>

        <button
          type="submit"
          disabled={loading || loadingCompanies}
          className="button-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Invoice"}
        </button>
      </div>
    </form>
  );
}