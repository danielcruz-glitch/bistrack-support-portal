import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import { APP_NAME } from "@/lib/constants";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl bg-white p-8 shadow">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{APP_NAME}</h1>
              <p className="text-gray-600">
                Welcome to the ERP Support portal.
              </p>
            </div>
            <LogoutButton />
          </div>

          <hr className="my-6" />

          {error && (
            <p className="text-red-600">
              Could not load profile: {error.message}
            </p>
          )}

          {profile && (
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <strong>Full Name:</strong> {profile.full_name || "Not set"}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Department:</strong> {profile.department || "Not set"}
              </p>
              <p>
                <strong>Role:</strong> {profile.role}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/tickets/new"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold mb-2">Submit a Ticket</h2>
            <p className="text-gray-600">
              Log a new issue for support to review.
            </p>
          </Link>

          <Link
            href="/dashboard/tickets"
            className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
          >
            <h2 className="text-xl font-semibold mb-2">My Tickets</h2>
            <p className="text-gray-600">
              View the tickets you have submitted.
            </p>
          </Link>

          {profile?.role && ["support", "admin"].includes(profile.role) && (
            <Link
              href="/dashboard/support"
              className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">Support Queue</h2>
              <p className="text-gray-600">
                Review, assign, and manage all tickets.
              </p>
            </Link>
          )}

          {profile?.role === "admin" && (
            <Link
              href="/dashboard/admin/users"
              className="rounded-2xl bg-white p-6 shadow hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">User Management</h2>
              <p className="text-gray-600">
                Create users and assign roles.
              </p>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}