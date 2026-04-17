"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  role: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  company_id?: string | null;
  companies?:
    | {
        id: string;
        name: string;
      }
    | null;
};

export default function UsersTable({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aCompany = a.companies?.name ?? "Unassigned";
      const bCompany = b.companies?.name ?? "Unassigned";

      if (aCompany !== bCompany) {
        return aCompany.localeCompare(bCompany);
      }

      return (a.full_name ?? "").localeCompare(b.full_name ?? "");
    });
  }, [users]);

  async function deactivateUser(id: string) {
    const confirmed = window.confirm("Deactivate this user?");
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/admin/users/${id}/deactivate`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to deactivate user.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteUser(id: string) {
    const confirmed = window.confirm(
      "Delete this user? This will remove the user profile."
    );
    if (!confirmed) return;

    try {
      setLoadingId(id);

      const res = await fetch(`/api/admin/users/${id}/delete`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user.");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  }

  function getRoleBadgeClasses(role: string | null) {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "support":
        return "bg-blue-100 text-blue-700";
      case "owner":
        return "bg-green-100 text-green-700";
      case "staff":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getCompanyBadgeClasses(companyName: string) {
    if (companyName.trim().toLowerCase() === "erp nexus") {
      return "bg-purple-100 text-purple-700";
    }

    if (companyName === "Unassigned") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Name</th>
            <th className="p-3 text-left">Email</th>
            <th className="p-3 text-left">Department</th>
            <th className="p-3 text-left">Company</th>
            <th className="p-3 text-left">Role</th>
            <th className="p-3 text-left">Hourly Rate</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody>
          {sortedUsers.map((user) => {
            const isBusy = loadingId === user.id;
            const companyName = user.companies?.name ?? "Unassigned";

            return (
              <tr key={user.id} className="border-t align-top">
                <td className="p-3">{user.full_name ?? "-"}</td>
                <td className="p-3">{user.email ?? "-"}</td>
                <td className="p-3">{user.department ?? "-"}</td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${getCompanyBadgeClasses(
                      companyName
                    )}`}
                  >
                    {companyName}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium capitalize ${getRoleBadgeClasses(
                      user.role
                    )}`}
                  >
                    {user.role ?? "-"}
                  </span>
                </td>
                <td className="p-3">
                  {user.role === "admin" || user.role === "support"
                    ? user.hourly_rate != null
                      ? `$${Number(user.hourly_rate).toFixed(2)}`
                      : "-"
                    : "N/A"}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      user.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/users/${user.id}/edit`}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      Edit
                    </Link>

                    <button
                      onClick={() => deactivateUser(user.id)}
                      disabled={isBusy || !user.is_active}
                      className="rounded bg-yellow-600 px-3 py-1 text-white hover:bg-yellow-700 disabled:opacity-50"
                    >
                      {isBusy ? "Working..." : "Deactivate"}
                    </button>

                    <button
                      onClick={() => deleteUser(user.id)}
                      disabled={isBusy}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {isBusy ? "Working..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}

          {sortedUsers.length === 0 && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-gray-500">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}