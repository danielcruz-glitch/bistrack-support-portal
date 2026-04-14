"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserOption = {
  id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number | null;
};

export default function WorkLogForm({ users }: { users: UserOption[] }) {
  const router = useRouter();

  const [form, setForm] = useState({
    support_staff_id: "",
    work_date: new Date().toISOString().slice(0, 10),
    hours: "",
    rate: "50.00",
    description: "",
  });

  const [loading, setLoading] = useState(false);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === form.support_staff_id) ?? null;
  }, [users, form.support_staff_id]);

  function handleStaffChange(value: string) {
    const user = users.find((u) => u.id === value);

    setForm((prev) => ({
      ...prev,
      support_staff_id: value,
      rate:
        user?.hourly_rate != null
          ? Number(user.hourly_rate).toFixed(2)
          : prev.rate,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await fetch("/api/work-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          support_staff_id: form.support_staff_id || null,
          work_date: form.work_date,
          hours: Number(form.hours),
          rate: Number(form.rate),
          description: form.description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save work log.");
      }

      setForm({
        support_staff_id: "",
        work_date: new Date().toISOString().slice(0, 10),
        hours: "",
        rate: "50.00",
        description: "",
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
        <label className="mb-1 block font-medium">Support Staff</label>
        <select
          className="w-full rounded border p-2"
          value={form.support_staff_id}
          onChange={(e) => handleStaffChange(e.target.value)}
        >
          <option value="">Select support staff</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name || user.email || "Unnamed User"}
            </option>
          ))}
        </select>
        {selectedUser && (
          <p className="mt-1 text-xs text-gray-500">
            Rate auto-filled from profile: $
            {Number(selectedUser.hourly_rate ?? 50).toFixed(2)}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block font-medium">Work Date</label>
        <input
          type="date"
          required
          className="w-full rounded border p-2"
          value={form.work_date}
          onChange={(e) => setForm({ ...form, work_date: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Hours</label>
        <input
          type="number"
          step="0.25"
          min="0.25"
          required
          className="w-full rounded border p-2"
          value={form.hours}
          onChange={(e) => setForm({ ...form, hours: e.target.value })}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">Rate</label>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded border p-2"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <label className="mb-1 block font-medium">Description</label>
        <textarea
          required
          rows={4}
          className="w-full rounded border p-2"
          placeholder="Describe the support work performed..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Work Log"}
        </button>
      </div>
    </form>
  );
}