import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; error?: string }>;
};

export default async function EditUserPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (myProfileError || !myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: targetUser, error: targetUserError } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, role, created_at")
    .eq("id", id)
    .single();

  if (targetUserError || !targetUser) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow">
          <p className="text-red-600">User not found.</p>
        </div>
      </main>
    );
  }

  async function updateUser(formData: FormData) {
    "use server";

    const { id } = await params;

    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (!myProfile || myProfile.role !== "admin") {
      redirect("/dashboard");
    }

    const fullName = String(formData.get("full_name") || "").trim();
    const department = String(formData.get("department") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const role = String(formData.get("role") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();

    const allowedRoles = ["staff", "support", "admin"];

    if (!fullName || !department || !email) {
      redirect(`/dashboard/admin/users/${id}?error=Please fill in all required fields.`);
    }

    if (!allowedRoles.includes(role)) {
      redirect(`/dashboard/admin/users/${id}?error=Invalid role selected.`);
    }

    const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
      id,
      {
        email,
        password: password ? password : undefined,
        user_metadata: {
          full_name: fullName,
          department,
        },
      }
    );

    if (authUpdateError) {
      redirect(
        `/dashboard/admin/users/${id}?error=${encodeURIComponent(authUpdateError.message)}`
      );
    }

    const { error: profileUpdateError } = await adminSupabase
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        department,
        role,
      })
      .eq("id", id);

    if (profileUpdateError) {
      redirect(
        `/dashboard/admin/users/${id}?error=${encodeURIComponent(profileUpdateError.message)}`
      );
    }

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${id}`);
    redirect(`/dashboard/admin/users/${id}?updated=1`);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Edit User</h1>
            <p className="text-gray-600">
              Update account details, role, and optionally reset password.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/admin/users"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Back to User Management
            </Link>

            <Link
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {query.updated === "1" && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            User updated successfully.
          </div>
        )}

        {query.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {query.error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-8 shadow">
          <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
            <p>
              <strong>User ID:</strong> {targetUser.id}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(targetUser.created_at).toLocaleString()}
            </p>
          </div>

          <form action={updateUser} className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                defaultValue={targetUser.full_name || ""}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="department" className="mb-1 block text-sm font-medium">
                Department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                required
                defaultValue={targetUser.department || ""}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={targetUser.email || ""}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                name="role"
                defaultValue={targetUser.role}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="staff">Staff</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                minLength={6}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-2 text-white hover:opacity-90"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}