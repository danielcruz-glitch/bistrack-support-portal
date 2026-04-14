import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SearchParams = Promise<{
  created?: string;
  error?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile, error: myProfileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single();

  if (myProfileError || !myProfile || myProfile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, role, created_at")
    .order("created_at", { ascending: false });

  async function createUser(formData: FormData) {
    "use server";

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
    const password = String(formData.get("password") || "").trim();
    const role = String(formData.get("role") || "staff").trim().toLowerCase();

    const allowedRoles = ["staff", "support", "admin"];

    if (!fullName || !department || !email || !password) {
      redirect("/dashboard/admin/users?error=Please fill in all fields.");
    }

    if (!allowedRoles.includes(role)) {
      redirect("/dashboard/admin/users?error=Invalid role selected.");
    }

    if (password.length < 6) {
      redirect("/dashboard/admin/users?error=Password must be at least 6 characters.");
    }

    const { data: createdUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          department,
        },
      });

    if (createUserError) {
      redirect(
        `/dashboard/admin/users?error=${encodeURIComponent(createUserError.message)}`
      );
    }

    if (!createdUser.user?.id) {
      redirect("/dashboard/admin/users?error=User creation failed.");
    }

    const { error: profileUpdateError } = await adminSupabase
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        department,
        role,
      })
      .eq("id", createdUser.user.id);

    if (profileUpdateError) {
      redirect(
        `/dashboard/admin/users?error=${encodeURIComponent(profileUpdateError.message)}`
      );
    }

    revalidatePath("/dashboard/admin/users");
    redirect("/dashboard/admin/users?created=1");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600">
              Create users, assign roles, and edit existing accounts.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        {params.created === "1" && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            User created successfully.
          </div>
        )}

        {params.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-8 shadow">
          <h2 className="mb-4 text-xl font-semibold">Create User</h2>

          <form action={createUser} className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="mb-1 block text-sm font-medium">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
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
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium">
                Temporary Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
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
                defaultValue="staff"
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="staff">Staff</option>
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-2 text-white hover:opacity-90"
              >
                Create User
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Existing Users</h2>

          {profilesError && (
            <p className="text-red-600">
              Could not load users: {profilesError.message}
            </p>
          )}

          {!profilesError && (!profiles || profiles.length === 0) && (
            <p className="text-gray-600">No users found.</p>
          )}

          {!profilesError && profiles && profiles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="px-3 py-3">Name</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.id} className="border-b text-sm">
                      <td className="px-3 py-4">{profile.full_name || "-"}</td>
                      <td className="px-3 py-4">{profile.email || "-"}</td>
                      <td className="px-3 py-4">{profile.department || "-"}</td>
                      <td className="px-3 py-4 capitalize">{profile.role}</td>
                      <td className="px-3 py-4">
                        {new Date(profile.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-4">
                        <Link
                          href={`/dashboard/admin/users/${profile.id}`}
                          className="rounded-lg border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}