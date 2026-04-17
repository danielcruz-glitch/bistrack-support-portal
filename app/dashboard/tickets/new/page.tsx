import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TICKET_CATEGORIES } from "@/lib/ticket-categories";
import { sendSupportEmail } from "@/lib/sendSupportEmail";

export default async function NewTicketPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, department, company_id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/dashboard?error=inactive-or-missing-profile");
  }

  async function createTicket(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, email, department, company_id, role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || !profile.is_active) {
      redirect("/dashboard?error=inactive-or-missing-profile");
    }

    if (!profile.company_id) {
      redirect("/dashboard/tickets/new?error=missing-company");
    }

    const issueTitle = String(formData.get("issue_title") || "").trim();
    const issueDescription = String(formData.get("issue_description") || "").trim();
    const issueCategory = String(formData.get("issue_category") || "").trim();
    const otherCategory = String(formData.get("other_category") || "").trim();
    const importance = String(formData.get("importance") || "").trim().toLowerCase();
    const urgency = String(formData.get("urgency") || "").trim().toLowerCase();

    if (!issueTitle || !issueDescription || !issueCategory || !importance || !urgency) {
      redirect("/dashboard/tickets/new?error=missing-fields");
    }

    if (issueCategory === "other" && !otherCategory) {
      redirect("/dashboard/tickets/new?error=missing-other-category");
    }

    const submittedByName = profile.full_name || user.email || "Unknown User";
    const submittedByEmail = profile.email || user.email || "";
    const department = profile.department || "";
    const finalCategory = issueCategory === "other" ? otherCategory : issueCategory;

    // 1) Try Dan first
    const { data: danUser, error: danLookupError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .eq("email", "dan@erpnexus.net")
      .eq("is_active", true)
      .maybeSingle();

    if (danLookupError) {
      console.error("Dan lookup failed:", danLookupError.message);
    }

    // 2) Fallback to any active support/admin if Dan is missing
    let fallbackAssignee: {
      id: string;
      full_name: string | null;
      email: string | null;
      role: string | null;
      is_active: boolean;
    } | null = null;

    if (!danUser) {
      const { data: internalUsers, error: internalUsersError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .in("role", ["support", "admin"])
        .eq("is_active", true)
        .order("full_name", { ascending: true });

      if (internalUsersError) {
        console.error("Fallback assignee lookup failed:", internalUsersError.message);
      }

      fallbackAssignee = internalUsers?.[0] ?? null;

      if (!fallbackAssignee) {
        console.error("No active support/admin assignee found. Ticket will be created unassigned.");
      }
    }

    const assignedUser = danUser ?? fallbackAssignee ?? null;

    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      submitted_by_user_id: user.id,
      company_id: profile.company_id,
      assigned_to_user_id: assignedUser?.id || null,
      submitted_by_name: submittedByName,
      submitted_by_email: submittedByEmail || null,
      department: department || null,
      issue_title: issueTitle,
      issue_description: issueDescription,
      issue_category: issueCategory,
      other_category: issueCategory === "other" ? otherCategory : null,
      importance,
      urgency,
      status: "open",
      resolved_by_user: false,
    });

    if (error) {
      const encoded = encodeURIComponent(error.message);
      redirect(`/dashboard/tickets/new?error=${encoded}`);
    }

    try {
      const supportNotificationEmail = process.env.SUPPORT_NOTIFICATION_EMAIL;

      if (supportNotificationEmail) {
        await sendSupportEmail({
          to: supportNotificationEmail,
          subject: `New Support Ticket: ${issueTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #111827;">
              <h1 style="margin: 0 0 16px; font-size: 24px;">New Support Ticket Submitted</h1>

              <p style="margin: 0 0 12px;">
                A new support ticket was submitted through ERP Nexus.
              </p>

              <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
                <p style="margin: 0 0 8px;"><strong>Submitted By:</strong> ${submittedByName}</p>
                <p style="margin: 0 0 8px;"><strong>Email:</strong> ${submittedByEmail || "Not provided"}</p>
                <p style="margin: 0 0 8px;"><strong>Department:</strong> ${department || "Not provided"}</p>
                <p style="margin: 0 0 8px;"><strong>Issue Title:</strong> ${issueTitle}</p>
                <p style="margin: 0 0 8px;"><strong>Category:</strong> ${finalCategory}</p>
                <p style="margin: 0 0 8px;"><strong>Importance:</strong> ${importance}</p>
                <p style="margin: 0 0 8px;"><strong>Urgency:</strong> ${urgency}</p>
                <p style="margin: 0;"><strong>Assigned To:</strong> ${assignedUser?.full_name || "Unassigned"}</p>
              </div>

              <div style="margin-top: 20px;">
                <p style="margin: 0 0 8px;"><strong>Description:</strong></p>
                <div style="padding: 16px; background: #f3f4f6; border-radius: 10px; white-space: pre-wrap;">
                  ${issueDescription}
                </div>
              </div>
            </div>
          `,
          replyTo: submittedByEmail ? [submittedByEmail] : undefined,
        });
      }
    } catch (emailError) {
      console.error("Support notification email failed:", emailError);
    }

    try {
      if (submittedByEmail) {
        await sendSupportEmail({
          to: submittedByEmail,
          subject: `We received your support ticket: ${issueTitle}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.6; color: #111827;">
              <h1 style="margin: 0 0 16px; font-size: 24px;">Support Ticket Received</h1>

              <p style="margin: 0 0 12px;">
                Your support ticket has been submitted successfully. We will review it and follow up as needed.
              </p>

              <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
                <p style="margin: 0 0 8px;"><strong>Issue Title:</strong> ${issueTitle}</p>
                <p style="margin: 0 0 8px;"><strong>Category:</strong> ${finalCategory}</p>
                <p style="margin: 0 0 8px;"><strong>Importance:</strong> ${importance}</p>
                <p style="margin: 0 0 8px;"><strong>Urgency:</strong> ${urgency}</p>
                <p style="margin: 0;"><strong>Assigned To:</strong> ${assignedUser?.full_name || "Support Team"}</p>
              </div>

              <div style="margin-top: 20px;">
                <p style="margin: 0 0 8px;"><strong>Description:</strong></p>
                <div style="padding: 16px; background: #f3f4f6; border-radius: 10px; white-space: pre-wrap;">
                  ${issueDescription}
                </div>
              </div>

              <p style="margin-top: 20px;">
                Thank you,<br />
                ERP Nexus Support
              </p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("Ticket confirmation email failed:", emailError);
    }

    revalidatePath("/dashboard/tickets");
    revalidatePath("/dashboard");
    redirect("/dashboard/tickets?created=1");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Submit a Ticket</h1>
            <p className="text-gray-600">
              Enter the issue details so support can review it.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow">
          <form action={createTicket} className="space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium">Submitted By</label>
              <input
                type="text"
                defaultValue={profile.full_name || user.email || ""}
                readOnly
                className="w-full rounded-lg border bg-gray-50 px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="issue_title" className="mb-1 block text-sm font-medium">
                Issue Title
              </label>
              <input
                id="issue_title"
                name="issue_title"
                type="text"
                required
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Example: Unable to post invoice in ERP system"
              />
            </div>

            <div>
              <label htmlFor="issue_description" className="mb-1 block text-sm font-medium">
                Issue Description
              </label>
              <textarea
                id="issue_description"
                name="issue_description"
                required
                rows={5}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Describe the problem, when it started, and any error messages."
              />
            </div>

            <div>
              <label htmlFor="issue_category" className="mb-1 block text-sm font-medium">
                Issue Category
              </label>
              <select
                id="issue_category"
                name="issue_category"
                required
                className="w-full rounded-lg border px-3 py-2"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a category
                </option>
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "erp"
                      ? "ERP"
                      : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="other_category" className="mb-1 block text-sm font-medium">
                Other Category Details
              </label>
              <input
                id="other_category"
                name="other_category"
                type="text"
                className="w-full rounded-lg border px-3 py-2"
                placeholder='Only fill this in if you chose "Other"'
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="importance" className="mb-1 block text-sm font-medium">
                  Importance
                </label>
                <select
                  id="importance"
                  name="importance"
                  required
                  className="w-full rounded-lg border px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select importance
                  </option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgency" className="mb-1 block text-sm font-medium">
                  Urgency
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  required
                  className="w-full rounded-lg border px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select urgency
                  </option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              Tickets with both high importance and high urgency are automatically
              marked with a red priority color in the database.
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-black px-5 py-2 text-white hover:opacity-90"
              >
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}