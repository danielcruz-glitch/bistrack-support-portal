"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Company = {
  id: string;
  name: string;
};

type FormState = {
  full_name: string;
  email: string;
  department: string;
  role: "staff" | "owner" | "support" | "admin";
  company_id: string;
};

export default function UserForm({ companies }: { companies: Company[] }) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    department: "",
    role: "staff",
    company_id: "",
  });

  const [saving, setSaving] = useState(false);

  const requiresCompany = form.role === "staff" || form.role === "owner";
  const internalRole = form.role === "support" || form.role === "admin";

  const erpNexusCompany = useMemo(() => {
    return (
      companies.find(
        (company) => company.name.trim().toLowerCase() === "erp nexus"
      ) ?? null
    );
  }, [companies]);

  const customerCompanies = useMemo(() => {
    return companies.filter(
      (company) => company.name.trim().toLowerCase() !== "erp nexus"
    );
  }, [companies]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        role: form.role,
        company_id: requiresCompany ? form.company_id : "",
      };

      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded border p-4">
      <div>
        <label className="mb-1 block font-medium">Full Name</label>
        <input
          value={form.full_name}
          className="w-full rounded border p-2"
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Email</label>
        <input
          type="email"
          value={form.email}
          className="w-full rounded border p-2"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Department</label>
        <input
          value={form.department}
          className="w-full rounded border p-2"
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Role</label>
        <select
          className="w-full rounded border p-2"
          value={form.role}
          onChange={(e) =>
            setForm({
              ...form,
              role: e.target.value as FormState["role"],
              company_id:
                e.target.value === "support" || e.target.value === "admin"
                  ? ""
                  : form.company_id,
            })
          }
        >
          <option value="staff">staff</option>
          <option value="owner">owner</option>
          <option value="support">support</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {requiresCompany && (
        <div>
          <label className="mb-1 block font-medium">Company</label>
          <select
            className="w-full rounded border p-2"
            value={form.company_id}
            onChange={(e) => setForm({ ...form, company_id: e.target.value })}
            required
          >
            <option value="">Select Company</option>
            {customerCompanies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Required for customer staff and owner users.
          </p>
        </div>
      )}

      {internalRole && (
        <div>
          <label className="mb-1 block font-medium">Company</label>
          <input
            value={erpNexusCompany?.name ?? "ERP Nexus (not found in companies)"}
            readOnly
            className="w-full rounded border bg-gray-50 p-2 text-gray-700"
          />
          <p className="mt-1 text-sm text-gray-500">
            Support and admin users are automatically assigned to ERP Nexus.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}