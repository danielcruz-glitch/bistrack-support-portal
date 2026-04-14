"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type UserData = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  role: string | null;
  hourly_rate: number | null;
  is_active: boolean;
};

export default function EditUserForm({ user }: { user: UserData }) {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    department: user.department ?? "",
    role: user.role ?? "staff",
    hourly_rate:
      user.hourly_rate != null ? Number(user.hourly_rate).toFixed(2) : "",
    is_active: user.is_active,
  });

  const [saving, setSaving] = useState(false);

  const roleNeedsRate = form.role === "admin" || form.role === "support";

  useEffect(() => {
    if (!roleNeedsRate) {
      setForm((prev) => ({
        ...prev,
        hourly_rate: "",
      }));
    }
  }, [form.role, roleNeedsRate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);

      const payload = {
        full_name: form.full_name,
        email: form.email,
        department: form.department,
        role: form.role,
        hourly_rate: roleNeedsRate ? Number(form.hourly_rate) : null,
        is_active: form.is_active,
      };

      const res = await fetch(`/api/admin/users/${user.id}/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user.");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div>
        <label className="mb-1 block font-medium">Full Name</label>
        <input
          className="w-full rounded border p-2"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Email</label>
        <input
          type="email"
          className="w-full rounded border p-2"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Department</label>
        <input
          className="w-full rounded border p-2"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Role</label>
        <select
          className="w-full rounded border p-2"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="staff">staff</option>
          <option value="support">support</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {roleNeedsRate && (
        <div>
          <label className="mb-1 block font-medium">Hourly Rate</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required={roleNeedsRate}
            className="w-full rounded border p-2"
            value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
          />
        </div>
      )}

      <div>
        <label className="mb-1 block font-medium">Status</label>
        <select
          className="w-full rounded border p-2"
          value={form.is_active ? "active" : "inactive"}
          onChange={(e) =>
            setForm({ ...form, is_active: e.target.value === "active" })
          }
        >
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}