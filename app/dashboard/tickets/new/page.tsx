import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TICKET_CATEGORIES } from "@/lib/ticket-categories";

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
    .select("id, full_name, email, department")
    .eq("id", user.id)
    .single();

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
      .select("id, full_name, email, department")
      .eq("id", user.id)
      .single();

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

    const { error } = await supabase.from("tickets").insert({
      user_id: user.id,
      submitted_by_name: profile?.full_name || user.email || "Unknown User",
      submitted_by_email: profile?.email || user.email || null,
      department: profile?.department || null,
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
                value={profile?.full_name || user.email || ""}
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