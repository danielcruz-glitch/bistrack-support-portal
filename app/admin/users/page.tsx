import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UsersTable from "./users-table";

export const dynamic = "force-dynamic";

type CompanyRow = {
  id: string;
  name: string;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  role: string | null;
  company_id: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  created_at: string;
  companies?: {
    id: string;
    name: string;
  } | null;
};

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  if (profile.role !== "admin") {
    redirect("/dashboard?error=forbidden");
  }

  const adminSupabase = createAdminClient();

  const { data: usersData, error: usersError } = await adminSupabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      department,
      role,
      company_id,
      hourly_rate,
      is_active,
      created_at
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const { data: companiesData, error: companiesError } = await adminSupabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (usersError) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold">User Management</h1>
        <p className="text-red-600">Error loading users: {usersError.message}</p>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold">User Management</h1>
        <p className="text-red-600">
          Error loading companies: {companiesError.message}
        </p>
      </div>
    );
  }

  const companiesMap = new Map<string, CompanyRow>(
    ((companiesData ?? []) as CompanyRow[]).map((company) => [
      company.id,
      company,
    ])
  );

  const users: UserRow[] = ((usersData ?? []) as Omit<UserRow, "companies">[]).map(
    (user) => ({
      ...user,
      companies: user.company_id ? companiesMap.get(user.company_id) ?? null : null,
    })
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold">User Management</h1>
          <p className="mb-2 text-sm text-gray-600">
            Admin-only access to all ERP Nexus and customer users.
          </p>
          <p className="text-sm text-gray-500">
            Support and admin users should always belong to ERP Nexus. Customer
            staff and owners should always belong to a customer company.
          </p>
        </div>

        <Link
          href="/admin/users/new"
          className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Create User
        </Link>
      </div>

      <UsersTable users={users} />
    </div>
  );
}