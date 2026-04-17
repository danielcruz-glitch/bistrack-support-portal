import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CompanyRow = {
  id: string;
  name: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  company_id: string | null;
  is_active?: boolean;
};

type TicketRow = {
  id: string;
  company_id: string | null;
  issue_title: string | null;
  issue_description: string | null;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  submitted_by_user_id: string | null;
  user_id: string | null;
  department: string | null;
  issue_category: string | null;
  other_category: string | null;
  importance: string | null;
  urgency: string | null;
  priority_color: string | null;
  assigned_to_user_id: string | null;
  status: string;
  created_at: string | null;
  company_name?: string | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
};

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

function getPageTitle(role: string) {
  switch (role) {
    case "admin":
      return "All Tickets";
    case "support":
      return "Support Tickets";
    case "owner":
      return "Company Tickets";
    default:
      return "My Tickets";
  }
}

function getPageDescription(role: string) {
  switch (role) {
    case "admin":
      return "Review and manage all tickets across the entire system.";
    case "support":
      return "Review and manage support tickets across all customer businesses.";
    case "owner":
      return "Review all support tickets submitted by your business.";
    default:
      return "Review the support issues you have submitted.";
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  const role = profile.role;
  const isStaff = role === "staff";
  const isOwner = role === "owner";
  const isSupport = role === "support";
  const isAdmin = role === "admin";

  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from("tickets")
    .select(`
      id,
      company_id,
      issue_title,
      issue_description,
      submitted_by_name,
      submitted_by_email,
      submitted_by_user_id,
      user_id,
      department,
      issue_category,
      other_category,
      importance,
      urgency,
      priority_color,
      assigned_to_user_id,
      status,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (isStaff) {
    const safeEmail = (profile.email || "").replace(/,/g, "");
    query = query.or(
      `submitted_by_user_id.eq.${user.id},user_id.eq.${user.id},submitted_by_email.eq.${safeEmail}`
    );
  } else if (isOwner) {
    if (!profile.company_id) {
      return (
        <main className="min-h-screen bg-gray-100 p-6">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-white p-6 shadow">
              <p className="text-red-600">
                Your account is missing a company assignment. Please contact ERP
                Nexus admin.
              </p>
            </div>
          </div>
        </main>
      );
    }

    query = query.eq("company_id", profile.company_id);
  } else if (isSupport || isAdmin) {
    // support/admin can see all tickets
  } else {
    redirect("/dashboard?error=invalid-role");
  }

  const { data: ticketsData, error } = await query;
  const ticketsRaw = (ticketsData ?? []) as TicketRow[];

  const companyIds = Array.from(
    new Set(
      ticketsRaw
        .map((ticket) => ticket.company_id)
        .filter(Boolean) as string[]
    )
  );

  const assigneeIds = Array.from(
    new Set(
      ticketsRaw
        .map((ticket) => ticket.assigned_to_user_id)
        .filter(Boolean) as string[]
    )
  );

  const { data: companiesData, error: companiesError } =
    companyIds.length > 0
      ? await adminSupabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds)
          .order("name", { ascending: true })
      : { data: [], error: null };

  const { data: assigneeProfilesData, error: assigneeProfilesError } =
    assigneeIds.length > 0
      ? await adminSupabase
          .from("profiles")
          .select("id, full_name, email, role, company_id, is_active")
          .in("id", assigneeIds)
      : { data: [], error: null };

  const { data: assignableUsersData, error: assignableUsersError } =
    isAdmin || isSupport
      ? await adminSupabase
          .from("profiles")
          .select("id, full_name, email, role, company_id, is_active")
          .in("role", ["support", "admin"])
          .eq("is_active", true)
          .order("full_name", { ascending: true })
      : { data: [], error: null };

  const companiesMap = new Map<string, CompanyRow>(
    ((companiesData ?? []) as CompanyRow[]).map((company) => [company.id, company])
  );

  const assigneeProfilesMap = new Map<string, ProfileRow>(
    ((assigneeProfilesData ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  const assignableUsers = (assignableUsersData ?? []) as ProfileRow[];

  async function updateTicketAssignee(formData: FormData) {
    "use server";

    const ticketId = String(formData.get("ticket_id") || "").trim();
    const assignedToUserId = String(formData.get("assigned_to_user_id") || "").trim();

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (
      !currentProfile ||
      !currentProfile.is_active ||
      !["admin", "support"].includes(currentProfile.role)
    ) {
      redirect("/dashboard?error=forbidden");
    }

    if (!ticketId || !assignedToUserId) {
      redirect("/dashboard/tickets?error=missing-ticket-or-assignee");
    }

    const adminSupabase = createAdminClient();

    const { data: assigneeExists } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("id", assignedToUserId)
      .in("role", ["support", "admin"])
      .eq("is_active", true)
      .maybeSingle();

    if (!assigneeExists) {
      redirect("/dashboard/tickets?error=invalid-assignee");
    }

    const { error } = await adminSupabase
      .from("tickets")
      .update({ assigned_to_user_id: assignedToUserId })
      .eq("id", ticketId);

    if (error) {
      const encoded = encodeURIComponent(error.message);
      redirect(`/dashboard/tickets?error=${encoded}`);
    }

    redirect("/dashboard/tickets");
  }

  const tickets: TicketRow[] = ticketsRaw.map((ticket) => {
    const assignedProfile = ticket.assigned_to_user_id
      ? assigneeProfilesMap.get(ticket.assigned_to_user_id) ?? null
      : null;

    return {
      ...ticket,
      company_name: ticket.company_id
        ? companiesMap.get(ticket.company_id)?.name ?? null
        : null,
      assigned_to_name: assignedProfile?.full_name ?? null,
      assigned_to_email: assignedProfile?.email ?? null,
    };
  });

  const showCompanyColumn = isAdmin || isSupport;
  const canAssignAssignee = isAdmin || isSupport;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{getPageTitle(role)}</h1>
            <p className="text-gray-600">{getPageDescription(role)}</p>
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

          {!error && companiesError && (
            <p className="mb-4 text-red-600">
              Could not load company names: {companiesError.message}
            </p>
          )}

          {!error && assigneeProfilesError && (
            <p className="mb-4 text-red-600">
              Could not load assignee profiles: {assigneeProfilesError.message}
            </p>
          )}

          {!error && assignableUsersError && (
            <p className="mb-4 text-red-600">
              Could not load assignable users: {assignableUsersError.message}
            </p>
          )}

          {!error && tickets.length === 0 && (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-600">
              No tickets found.
            </div>
          )}

          {!error && tickets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="px-3 py-3">Title</th>
                    {showCompanyColumn && <th className="px-3 py-3">Company</th>}
                    <th className="px-3 py-3">Submitted By</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Importance</th>
                    <th className="px-3 py-3">Urgency</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Assigned To</th>
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

                      {showCompanyColumn && (
                        <td className="px-3 py-4">
                          {ticket.company_name ?? "Unassigned"}
                        </td>
                      )}

                      <td className="px-3 py-4">
                        <div>{ticket.submitted_by_name || "-"}</div>
                        <div className="mt-1 text-gray-500">
                          {ticket.submitted_by_email || "-"}
                        </div>
                      </td>

                      <td className="px-3 py-4">{ticket.department || "-"}</td>

                      <td className="px-3 py-4">
                        <div>{ticket.issue_category || "-"}</div>
                        {ticket.other_category && (
                          <div className="mt-1 text-gray-500">
                            Other: {ticket.other_category}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 capitalize">{ticket.importance || "-"}</td>
                      <td className="px-3 py-4 capitalize">{ticket.urgency || "-"}</td>

                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getPriorityBadgeColor(
                            ticket.priority_color
                          )}`}
                        >
                          {ticket.priority_color || "green"}
                        </span>
                      </td>

                      <td className="px-3 py-4">
                        {canAssignAssignee ? (
                          <form action={updateTicketAssignee} className="space-y-2">
                            <input type="hidden" name="ticket_id" value={ticket.id} />
                            <select
                              name="assigned_to_user_id"
                              defaultValue={ticket.assigned_to_user_id ?? ""}
                              className="w-full rounded border px-2 py-1"
                            >
                              <option value="">Select Assignee</option>
                              {assignableUsers.map((internalUser) => (
                                <option key={internalUser.id} value={internalUser.id}>
                                  {(internalUser.full_name || internalUser.email || "Unknown") +
                                    ` - ${internalUser.email || "no email"}`}
                                </option>
                              ))}
                            </select>
                            <button className="rounded bg-indigo-600 px-2 py-1 text-xs text-white">
                              Save
                            </button>
                          </form>
                        ) : ticket.assigned_to_name ? (
                          <div>
                            <div>{ticket.assigned_to_name}</div>
                            <div className="mt-1 text-gray-500">
                              {ticket.assigned_to_email || "-"}
                            </div>
                          </div>
                        ) : (
                          "Unassigned"
                        )}
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
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleString()
                          : "-"}
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