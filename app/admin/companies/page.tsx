import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import CompaniesManager from "./companies-manager";

export const dynamic = "force-dynamic";

type CompanyRow = {
  id: string;
  name: string;
  created_at: string | null;
};

export default async function AdminCompaniesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
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

  const { data: companies, error } = await adminSupabase
    .from("companies")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold">Company Management</h1>
        <p className="text-red-600">Error loading companies: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-bold">Company Management</h1>
      <p className="mb-2 text-sm text-gray-600">
        Create companies so users and tickets can be assigned properly.
      </p>
      <p className="mb-6 text-sm text-gray-500">
        Internal ERP Nexus admin and support users are automatically assigned to
        the ERP Nexus company.
      </p>

      <CompaniesManager companies={(companies ?? []) as CompanyRow[]} />
    </div>
  );
}