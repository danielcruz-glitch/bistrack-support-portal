import { createAdminClient } from "@/lib/supabase/admin";
import EditUserForm from "./edit-user-form";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      department,
      role,
      hourly_rate,
      is_active
    `)
    .eq("id", id)
    .single();

  if (error || !user) {
    return (
      <div className="p-6">
        <p className="text-red-600">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Edit User</h1>
      <EditUserForm user={user} />
    </div>
  );
}