import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    error?: string;
    updated?: string;
  }>;
};

function getRoleBadgeClass(role: string | null) {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "support":
      return "bg-blue-100 text-blue-700 border-blue-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatErrorMessage(error?: string) {
  if (!error) return null;

  switch (error) {
    case "forbidden":
      return "You do not have permission to perform that action.";
    case "missing-assignee":
      return "Please select an assignee.";
    case "invalid-assignee":
      return "The selected assignee is invalid or inactive.";
    case "ticket-not-found":
      return "Ticket not found.";
    case "missing-hours":
      return "Please enter hours worked greater than zero.";
    case "missing-billing-staff":
      return "Please select the ERP Nexus employee whose time is being billed.";
    case "invalid-billing-staff":
      return "The selected ERP Nexus employee is invalid or inactive.";
    case "missing-rate":
      return "The selected ERP Nexus employee does not have an hourly rate set.";
    case "cannot-delete-billed-log":
      return "Billed work logs cannot be deleted.";
    default:
      return decodeURIComponent(error);
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatDateOnly(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default async function TicketDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, company_id, is_active, hourly_rate")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

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

  const isStaff = profile.role === "staff";
  const isOwner = profile.role === "owner";
  const isSupport = profile.role === "support";
  const isAdmin = profile.role === "admin";

  const isOwnTicket =
    ticket.submitted_by_user_id === user.id ||
    ticket.user_id === user.id ||
    ticket.submitted_by_email === profile.email;

  const isCompanyTicket =
    !!profile.company_id &&
    !!ticket.company_id &&
    profile.company_id === ticket.company_id;

  const canViewTicket =
    isAdmin ||
    isSupport ||
    (isOwner && isCompanyTicket) ||
    (isStaff && isOwnTicket);

  if (!canViewTicket) {
    redirect("/dashboard?error=forbidden");
  }

  const canResolveTicket =
    isAdmin ||
    isSupport ||
    (isOwner && isCompanyTicket) ||
    (isStaff && isOwnTicket);

  const canAssignTicket = isAdmin || isSupport;
  const canManageWorkLogs = isAdmin || isSupport;

  const { data: company } = ticket.company_id
    ? await supabase
        .from("companies")
        .select("name")
        .eq("id", ticket.company_id)
        .maybeSingle()
    : { data: null };

  const { data: assigneeProfile } = ticket.assigned_to_user_id
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role, hourly_rate")
        .eq("id", ticket.assigned_to_user_id)
        .maybeSingle()
    : { data: null };

  const { data: billableStaff } = canManageWorkLogs
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active, hourly_rate")
        .in("role", ["support", "admin"])
        .eq("is_active", true)
        .order("full_name", { ascending: true })
    : { data: null };

  const { data: assignableUsers } = canAssignTicket
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .in("role", ["support", "admin"])
        .eq("is_active", true)
        .order("full_name", { ascending: true })
    : { data: null };

  const { data: workLogs } = await supabase
    .from("work_logs")
    .select(
      "id, ticket_id, support_user_id, support_staff_id, work_date, hours_worked, notes, billable, created_at, invoice_id, user_id, hours, rate, description, billed"
    )
    .eq("ticket_id", id)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });

  const workLogStaffIds = Array.from(
    new Set(
      (workLogs ?? [])
        .flatMap((log) => [log.support_user_id, log.support_staff_id, log.user_id])
        .filter(Boolean)
    )
  );

  const { data: workLogProfiles } =
    workLogStaffIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email, role")
          .in("id", workLogStaffIds)
      : { data: [] };

  const workLogProfileMap = new Map(
    (workLogProfiles ?? []).map((item) => [item.id, item])
  );

  async function updateAssignee(formData: FormData) {
    "use server";

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

    if (profileError || !profile || !profile.is_active) {
      redirect("/dashboard?error=forbidden");
    }

    const canAssign = profile.role === "admin" || profile.role === "support";

    if (!canAssign) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const assignedToUserId = String(formData.get("assigned_to_user_id") || "").trim();

    if (!assignedToUserId) {
      redirect(`/dashboard/tickets/${id}?error=missing-assignee`);
    }

    const { data: selectedAssignee, error: assigneeError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .eq("id", assignedToUserId)
      .in("role", ["support", "admin"])
      .eq("is_active", true)
      .single();

    if (assigneeError || !selectedAssignee) {
      redirect(`/dashboard/tickets/${id}?error=invalid-assignee`);
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        assigned_to_user_id: selectedAssignee.id,
      })
      .eq("id", id);

    if (updateError) {
      const encoded = encodeURIComponent(updateError.message);
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${id}`);
    redirect(`/dashboard/tickets/${id}?updated=assignee`);
  }

  async function markResolved(formData: FormData) {
    "use server";

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

    if (profileError || !profile || !profile.is_active) {
      redirect("/dashboard?error=forbidden");
    }

    const { data: currentTicket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single();

    if (ticketError || !currentTicket) {
      redirect("/dashboard/tickets?error=ticket-not-found");
    }

    const isStaff = profile.role === "staff";
    const isOwner = profile.role === "owner";
    const isSupport = profile.role === "support";
    const isAdmin = profile.role === "admin";

    const isOwnTicket =
      currentTicket.submitted_by_user_id === user.id ||
      currentTicket.user_id === user.id ||
      currentTicket.submitted_by_email === profile.email;

    const isCompanyTicket =
      !!profile.company_id &&
      !!currentTicket.company_id &&
      profile.company_id === currentTicket.company_id;

    const canResolve =
      isAdmin ||
      isSupport ||
      (isOwner && isCompanyTicket) ||
      (isStaff && isOwnTicket);

    if (!canResolve) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const resolutionNotes = String(formData.get("resolution_notes") || "").trim();

    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "resolved",
        resolved_by_user: true,
        resolution_notes: resolutionNotes || null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      const encoded = encodeURIComponent(updateError.message);
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${id}`);
    redirect(`/dashboard/tickets/${id}?updated=resolved`);
  }

  async function createManualWorkLog(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: actingProfile, error: actingProfileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (actingProfileError || !actingProfile || !actingProfile.is_active) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const canManage = actingProfile.role === "admin" || actingProfile.role === "support";

    if (!canManage) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const billingStaffId = String(formData.get("billing_staff_id") || "").trim();
    const workDate = String(formData.get("work_date") || "").trim();
    const description = String(formData.get("work_description") || "").trim();
    const notes = String(formData.get("work_notes") || "").trim();
    const hoursWorked = Number(String(formData.get("hours_worked") || "").trim() || 0);
    const isBillable = formData.get("billable") === "on";

    if (!billingStaffId) {
      redirect(`/dashboard/tickets/${id}?error=missing-billing-staff`);
    }

    if (!hoursWorked || hoursWorked <= 0) {
      redirect(`/dashboard/tickets/${id}?error=missing-hours`);
    }

    const { data: billingStaff, error: billingStaffError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active, hourly_rate")
      .eq("id", billingStaffId)
      .in("role", ["support", "admin"])
      .eq("is_active", true)
      .single();

    if (billingStaffError || !billingStaff) {
      redirect(`/dashboard/tickets/${id}?error=invalid-billing-staff`);
    }

    if (!billingStaff.hourly_rate || Number(billingStaff.hourly_rate) <= 0) {
      redirect(`/dashboard/tickets/${id}?error=missing-rate`);
    }

    const { error: insertError } = await supabase.from("work_logs").insert({
      ticket_id: id,
      support_user_id: billingStaff.id,
      support_staff_id: billingStaff.id,
      user_id: billingStaff.id,
      work_date: workDate || new Date().toISOString().slice(0, 10),
      hours_worked: hoursWorked,
      hours: hoursWorked,
      rate: Number(billingStaff.hourly_rate),
      description: description || "ERP Nexus support work",
      notes: notes || null,
      billable: isBillable,
      billed: false,
      invoice_id: null,
    });

    if (insertError) {
      const encoded = encodeURIComponent(insertError.message);
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    revalidatePath(`/dashboard/tickets/${id}`);
    revalidatePath("/admin/invoices");
    redirect(`/dashboard/tickets/${id}?updated=worklog`);
  }

  async function deleteWorkLog(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: actingProfile, error: actingProfileError } = await supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", user.id)
      .single();

    if (actingProfileError || !actingProfile || !actingProfile.is_active) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const canManage = actingProfile.role === "admin" || actingProfile.role === "support";

    if (!canManage) {
      redirect(`/dashboard/tickets/${id}?error=forbidden`);
    }

    const workLogId = String(formData.get("work_log_id") || "").trim();

    const { data: existingLog, error: existingLogError } = await supabase
      .from("work_logs")
      .select("id, billed, invoice_id")
      .eq("id", workLogId)
      .eq("ticket_id", id)
      .single();

    if (existingLogError || !existingLog) {
      const encoded = encodeURIComponent("Work log not found.");
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    if (existingLog.billed || existingLog.invoice_id) {
      redirect(`/dashboard/tickets/${id}?error=cannot-delete-billed-log`);
    }

    const { error: deleteError } = await supabase
      .from("work_logs")
      .delete()
      .eq("id", workLogId)
      .eq("ticket_id", id);

    if (deleteError) {
      const encoded = encodeURIComponent(deleteError.message);
      redirect(`/dashboard/tickets/${id}?error=${encoded}`);
    }

    revalidatePath(`/dashboard/tickets/${id}`);
    revalidatePath("/admin/invoices");
    redirect(`/dashboard/tickets/${id}?updated=worklog-deleted`);
  }

  const errorMessage = formatErrorMessage(resolvedSearchParams.error);

  const updatedMessage =
    resolvedSearchParams.updated === "assignee"
      ? "Ticket assignee updated successfully."
      : resolvedSearchParams.updated === "resolved"
      ? "Ticket marked resolved successfully."
      : resolvedSearchParams.updated === "worklog"
      ? "Work log created successfully."
      : resolvedSearchParams.updated === "worklog-deleted"
      ? "Work log deleted successfully."
      : null;

  const defaultBillingStaffId =
    ticket.assigned_to_user_id ||
    (profile.role === "admin" || profile.role === "support" ? profile.id : "");

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{ticket.issue_title}</h1>
          <Link
            href="/dashboard/tickets"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Tickets
          </Link>
        </div>

        {updatedMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {updatedMessage}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="mb-4 text-gray-700">{ticket.issue_description}</p>

          <div className="grid gap-2 text-sm">
            <p>
              <strong>Status:</strong> {ticket.status}
            </p>
            <p>
              <strong>Company:</strong> {company?.name || "Unassigned"}
            </p>
            <p>
              <strong>Category:</strong> {ticket.issue_category}
            </p>
            <p>
              <strong>Importance:</strong> {ticket.importance}
            </p>
            <p>
              <strong>Urgency:</strong> {ticket.urgency}
            </p>
            <p>
              <strong>Submitted By:</strong> {ticket.submitted_by_name || "-"}
            </p>
            <p>
              <strong>Email:</strong> {ticket.submitted_by_email || "-"}
            </p>
            <p>
              <strong>Department:</strong> {ticket.department || "-"}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <strong>Assigned To:</strong>
              {assigneeProfile ? (
                <>
                  <span>
                    {assigneeProfile.full_name || "Unknown"} ({assigneeProfile.email || "no email"})
                  </span>
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium capitalize ${getRoleBadgeClass(
                      assigneeProfile.role
                    )}`}
                  >
                    {assigneeProfile.role || "unknown"}
                  </span>
                </>
              ) : (
                <span>Unassigned</span>
              )}
            </div>

            <p>
              <strong>Created:</strong> {formatDateTime(ticket.created_at)}
            </p>
            <p>
              <strong>Resolved:</strong> {formatDateTime(ticket.resolved_at)}
            </p>
          </div>
        </div>

        {canAssignTicket && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-2 text-lg font-semibold">Assign Ticket</h2>
            <p className="mb-4 text-sm text-gray-600">
              Assign this ticket to an active ERP Nexus support or admin user.
            </p>

            <form action={updateAssignee} className="space-y-4">
              <select
                name="assigned_to_user_id"
                defaultValue={ticket.assigned_to_user_id || ""}
                className="w-full rounded-lg border px-3 py-2"
                required
              >
                <option value="" disabled>
                  Select support/admin assignee
                </option>
                {(assignableUsers ?? []).map((internalUser) => (
                  <option key={internalUser.id} value={internalUser.id}>
                    {(internalUser.full_name || internalUser.email) +
                      ` - ${internalUser.email || "no email"} (${internalUser.role})`}
                  </option>
                ))}
              </select>

              <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:opacity-90">
                Update Assignee
              </button>
            </form>
          </div>
        )}

        {ticket.resolution_notes && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-3 text-lg font-semibold">Resolution Notes</h2>
            <p className="whitespace-pre-wrap text-gray-700">
              {ticket.resolution_notes}
            </p>
          </div>
        )}

        {canManageWorkLogs && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-3 text-lg font-semibold">Manual Work Log</h2>
            <p className="mb-4 text-sm text-gray-600">
              ERP Nexus support/admin controls billable labor. Select the ERP Nexus employee
              whose time should be billed. This defaults to the assigned employee when available.
            </p>

            <form action={createManualWorkLog} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Billing Staff
                  </label>
                  <select
                    name="billing_staff_id"
                    defaultValue={defaultBillingStaffId}
                    className="w-full rounded-lg border px-3 py-2"
                    required
                  >
                    <option value="" disabled>
                      Select ERP Nexus employee
                    </option>
                    {(billableStaff ?? []).map((internalUser) => (
                      <option key={internalUser.id} value={internalUser.id}>
                        {(internalUser.full_name || internalUser.email) +
                          ` - ${internalUser.email || "no email"} (${internalUser.role})` +
                          ` | Rate: ${
                            internalUser.hourly_rate
                              ? `$${Number(internalUser.hourly_rate).toFixed(2)}`
                              : "Not set"
                          }`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Work Date
                  </label>
                  <input
                    type="date"
                    name="work_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-lg border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Hours Worked
                  </label>
                  <input
                    type="number"
                    name="hours_worked"
                    step="0.25"
                    min="0"
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="e.g. 1.50"
                    required
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="billable"
                      defaultChecked
                    />
                    Mark as billable
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Work Description
                  </label>
                  <input
                    type="text"
                    name="work_description"
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Describe the ERP work performed"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium">
                    Internal Notes
                  </label>
                  <textarea
                    name="work_notes"
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Optional internal note"
                  />
                </div>
              </div>

              <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:opacity-90">
                Create Work Log
              </button>
            </form>
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-3 text-lg font-semibold">Work Log History</h2>

          {(workLogs ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">
              No work logs exist for this ticket yet.
            </p>
          ) : (
            <div className="space-y-3">
              {workLogs?.map((log) => {
                const staffProfile =
                  workLogProfileMap.get(log.support_user_id) ||
                  workLogProfileMap.get(log.support_staff_id) ||
                  workLogProfileMap.get(log.user_id);

                return (
                  <div key={log.id} className="rounded-xl border p-4 text-sm">
                    <div className="grid gap-2 md:grid-cols-2">
                      <p>
                        <strong>Date:</strong> {formatDateOnly(log.work_date)}
                      </p>
                      <p>
                        <strong>Created:</strong> {formatDateTime(log.created_at)}
                      </p>
                      <p>
                        <strong>Billing Staff:</strong>{" "}
                        {staffProfile
                          ? `${staffProfile.full_name || "Unknown"} (${staffProfile.email || "no email"})`
                          : "Unknown"}
                      </p>
                      <p>
                        <strong>Hours:</strong>{" "}
                        {Number(log.hours_worked ?? log.hours ?? 0).toFixed(2)}
                      </p>
                      <p>
                        <strong>Rate:</strong> ${Number(log.rate ?? 0).toFixed(2)}
                      </p>
                      <p>
                        <strong>Billable:</strong> {log.billable ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Billed:</strong> {log.billed ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Invoice ID:</strong> {log.invoice_id || "-"}
                      </p>
                    </div>

                    <p className="mt-2">
                      <strong>Description:</strong> {log.description || "-"}
                    </p>

                    {log.notes && (
                      <p className="mt-2 whitespace-pre-wrap">
                        <strong>Notes:</strong> {log.notes}
                      </p>
                    )}

                    {canManageWorkLogs && !log.billed && !log.invoice_id && (
                      <form action={deleteWorkLog} className="mt-4">
                        <input type="hidden" name="work_log_id" value={log.id} />
                        <button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:opacity-90">
                          Delete Work Log
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canResolveTicket &&
          ticket.status !== "resolved" &&
          ticket.status !== "closed" && (
            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-3 text-lg font-semibold">Mark as Resolved</h2>

              <form action={markResolved} className="space-y-4">
                <textarea
                  name="resolution_notes"
                  rows={4}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Describe what fixed the issue"
                />

                <button className="rounded-lg bg-green-600 px-4 py-2 text-white hover:opacity-90">
                  Mark Resolved
                </button>
              </form>
            </div>
          )}
      </div>
    </main>
  );
}