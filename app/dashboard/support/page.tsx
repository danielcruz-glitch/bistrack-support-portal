import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SupportTicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["support", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Support Queue</h1>
            <p className="text-gray-600">
              Review and manage all submitted tickets.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          {error && (
            <p className="text-red-600">Could not load tickets: {error.message}</p>
          )}

          {!error && (!tickets || tickets.length === 0) && (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-600">
              No tickets found.
            </div>
          )}

          {!error && tickets && tickets.length > 0 && (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-xl border p-4">
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="text-lg font-semibold underline hover:no-underline"
                  >
                    {ticket.issue_title}
                  </Link>
                  <p className="mt-2 text-sm text-gray-600">
                    {ticket.issue_description}
                  </p>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><strong>Submitted By:</strong> {ticket.submitted_by_name}</p>
                    <p><strong>Status:</strong> {ticket.status}</p>
                    <p><strong>Priority:</strong> {ticket.priority_color}</p>
                    <p><strong>Assigned To:</strong> {ticket.assigned_to_name || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}