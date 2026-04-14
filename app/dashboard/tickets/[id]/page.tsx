import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket || error) {
    return (
      <main className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
          <p className="text-red-600">Ticket not found.</p>
        </div>
      </main>
    );
  }

  async function markResolved(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const resolutionNotes = String(formData.get("resolution_notes") || "").trim();

    const { error } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolved_by_user: true,
        resolution_notes: resolutionNotes || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      const encoded = encodeURIComponent(error.message);
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${id}`);
    redirect("/dashboard/tickets");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{ticket.issue_title}</h1>
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to My Tickets
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="mb-4 text-gray-700">{ticket.issue_description}</p>

          <div className="grid gap-2 text-sm">
            <p><strong>Status:</strong> {ticket.status}</p>
            <p><strong>Category:</strong> {ticket.issue_category}</p>
            <p><strong>Importance:</strong> {ticket.importance}</p>
            <p><strong>Urgency:</strong> {ticket.urgency}</p>
            <p><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
            <p><strong>Resolved:</strong> {ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : "-"}</p>
          </div>
        </div>

        {ticket.status !== "resolved" && ticket.status !== "closed" && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-3 text-lg font-semibold">Mark as Resolved</h2>

            <form action={markResolved} className="space-y-4">
              <textarea
                name="resolution_notes"
                rows={4}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Optional: describe what fixed the issue"
              />

              <button className="rounded-lg bg-green-600 px-4 py-2 text-white">
                Mark Resolved
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}