import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import EditUserForm from "./edit-user-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CompanyOption = {
  id: string;
  name: string;
};

type UserData = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  role: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  company_id: string | null;
};

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", authUser.id)
    .single();

  if (currentProfileError || !currentProfile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!currentProfile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  if (currentProfile.role !== "admin") {
    redirect("/dashboard?error=unauthorized");
  }

  const { data: user, error: userError } = await adminSupabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      department,
      role,
      hourly_rate,
      is_active,
      company_id
    `)
    .eq("id", id)
    .single();

  const { data: companies, error: companiesError } = await adminSupabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (userError || !user) {
    return (
      <div className="p-6">
        <p className="text-red-600">User not found.</p>
      </div>
    );
  }

  if (companiesError) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load companies.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit User</h1>
      <EditUserForm
        user={user as UserData}
        companies={(companies ?? []) as CompanyOption[]}
      />
    </div>
  );
}