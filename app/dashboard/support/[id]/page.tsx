import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupportTicketDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !["support", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket || error) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
          <p className="text-red-600">Ticket not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">Support Ticket Detail</h1>
          <Link
            href="/dashboard/support"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Support Queue
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-bold">{ticket.issue_title}</h2>
          <p className="mb-4 text-gray-700">{ticket.issue_description}</p>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <p><strong>Status:</strong> {ticket.status}</p>
            <p><strong>Category:</strong> {ticket.issue_category}</p>
            <p><strong>Importance:</strong> {ticket.importance}</p>
            <p><strong>Urgency:</strong> {ticket.urgency}</p>
            <p><strong>Submitted By:</strong> {ticket.submitted_by_name}</p>
            <p><strong>Email:</strong> {ticket.submitted_by_email || "-"}</p>
          </div>
        </div>
      </div>
    </main>
  );
}