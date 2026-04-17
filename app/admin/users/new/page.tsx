import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UserForm from "./user-form";

type Company = {
  id: string;
  name: string;
};

export default async function NewUserPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const adminSupabase = createAdminClient();

  const { data: companies, error: companiesError } = await adminSupabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (companiesError) {
    return (
      <div className="max-w-xl p-6">
        <h1 className="mb-4 text-2xl font-bold">Create User</h1>
        <p className="text-red-600">
          Failed to load companies: {companiesError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Create User</h1>
      <p className="mb-6 text-sm text-gray-600">
        Customer staff and owners must be assigned to a customer company.
        Internal support and admin users are automatically assigned to ERP Nexus.
      </p>

      <UserForm companies={(companies ?? []) as Company[]} />
    </div>
  );
}