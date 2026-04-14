import { createAdminClient } from "@/lib/supabase/admin";
import UsersTable from "./users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      department,
      role,
      hourly_rate,
      is_active,
      created_at
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>

      {error ? (
        <p className="text-red-600">Error loading users: {error.message}</p>
      ) : (
        <UsersTable users={users ?? []} />
      )}
    </div>
  );
}