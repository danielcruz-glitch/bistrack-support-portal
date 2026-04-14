import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getPriorityBadgeColor(priorityColor: string | null) {
  switch (priorityColor) {
    case "red":
      return "bg-red-100 text-red-700 border-red-200";
    case "orange":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-green-100 text-green-700 border-green-200";
  }
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "in_progress":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "resolved":
      return "bg-green-100 text-green-700 border-green-200";
    case "closed":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default async function MyTicketsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Tickets</h1>
            <p className="text-gray-600">
              Review the support issues you have submitted.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/tickets/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              New Ticket
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          {error && (
            <p className="text-red-600">Could not load tickets: {error.message}</p>
          )}

          {!error && (!tickets || tickets.length === 0) && (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-600">
              No tickets yet.
            </div>
          )}

          {!error && tickets && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Importance</th>
                    <th className="px-3 py-3">Urgency</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b align-top text-sm">
                      <td className="px-3 py-4">
                        <Link href={`/dashboard/tickets/${ticket.id}`}>
  <div className="font-medium underline hover:no-underline">
    {ticket.issue_title}
  </div>
</Link>
                        <div className="mt-1 text-gray-600">
                          {ticket.issue_description}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <div>{ticket.issue_category}</div>
                        {ticket.other_category && (
                          <div className="mt-1 text-gray-500">
                            Other: {ticket.other_category}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-4 capitalize">{ticket.importance}</td>
                      <td className="px-3 py-4 capitalize">{ticket.urgency}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(
                            ticket.priority_color
                          )}`}
                        >
                          {ticket.priority_color}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-3 py-4">
                        {new Date(ticket.created_at).toLocaleString()}
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