"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CompanyRow = {
  id: string;
  name: string;
  created_at: string | null;
};

export default function CompaniesManager({
  companies,
}: {
  companies: CompanyRow[];
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const normalizedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const aIsErp = a.name.trim().toLowerCase() === "erp nexus";
      const bIsErp = b.name.trim().toLowerCase() === "erp nexus";

      if (aIsErp && !bIsErp) return -1;
      if (!aIsErp && bIsErp) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [companies]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const trimmedName = name.trim();

      if (!trimmedName) {
        throw new Error("Company name is required.");
      }

      const res = await fetch("/api/admin/companies/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create company.");
      }

      setName("");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-4"
      >
        <div>
          <h2 className="text-lg font-semibold">Create Company</h2>
          <p className="text-sm text-gray-600">
            Add a company so users and tickets can be assigned correctly.
          </p>
        </div>

        <div>
          <label className="mb-1 block font-medium">Company Name</label>
          <input
            className="w-full rounded border p-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter company name"
            required
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Company"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Company Name</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {normalizedCompanies.map((company) => {
              const isErpNexus =
                company.name.trim().toLowerCase() === "erp nexus";

              return (
                <tr key={company.id} className="border-t">
                  <td className="p-3 font-medium">{company.name}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        isErpNexus
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isErpNexus ? "Internal" : "Customer"}
                    </span>
                  </td>
                  <td className="p-3">
                    {company.created_at
                      ? new Date(company.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              );
            })}

            {normalizedCompanies.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}