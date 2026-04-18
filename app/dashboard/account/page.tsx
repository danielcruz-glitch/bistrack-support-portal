import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

function formatMessage(updated?: string, error?: string) {
  if (error) {
    return {
      type: "error" as const,
      text: decodeURIComponent(error),
    };
  }

  if (updated === "profile") {
    return {
      type: "success" as const,
      text: "Account profile updated successfully.",
    };
  }

  return null;
}

export default async function AccountPage({ searchParams }: PageProps) {
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
    .select("id, full_name, email, department, role, company_id, is_active, hourly_rate")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  async function updateAccount(formData: FormData) {
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
      .select("id, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      redirect("/dashboard?error=forbidden");
    }

    const full_name = String(formData.get("full_name") || "").trim();
    const department = String(formData.get("department") || "").trim();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: full_name || null,
        department: department || null,
      })
      .eq("id", user.id);

    if (updateError) {
      const encoded = encodeURIComponent(updateError.message);
      redirect(`/dashboard/account?error=${encoded}`);
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");
    redirect("/dashboard/account?updated=profile");
  }

  const message = formatMessage(
    resolvedSearchParams.updated,
    resolvedSearchParams.error
  );

  return (
    <div className="space-y-6">
      <section className="panel-premium overflow-hidden">
        <div className="relative border-b border-nexus-200 px-6 py-5">
          <div className="absolute inset-0 nexus-grid-bg opacity-20" />
          <div className="relative">
            <h1 className="section-title">Account Settings</h1>
            <p className="section-subtitle">
              Manage your account profile information used throughout ERP Nexus.
            </p>
          </div>
        </div>

        <div className="p-6">
          {message ? (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <form action={updateAccount} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-nexus-700">
                Full Name
              </label>
              <input
                name="full_name"
                defaultValue={profile.full_name || ""}
                className="input-nexus"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-nexus-700">
                Email
              </label>
              <input
                value={profile.email || user.email || ""}
                readOnly
                className="input-nexus bg-nexus-50"
              />
              <p className="mt-1 text-xs text-nexus-500">
                Email is currently read-only here.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-nexus-700">
                Department
              </label>
              <input
                name="department"
                defaultValue={profile.department || ""}
                className="input-nexus"
                placeholder="Department"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-nexus-700">
                Role
              </label>
              <input
                value={profile.role || ""}
                readOnly
                className="input-nexus bg-nexus-50 capitalize"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-nexus-700">
                Hourly Rate
              </label>
              <input
                value={
                  profile.hourly_rate != null
                    ? `$${Number(profile.hourly_rate).toFixed(2)}`
                    : "Not set"
                }
                readOnly
                className="input-nexus bg-nexus-50"
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button type="submit" className="button-primary">
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel-premium overflow-hidden">
        <div className="border-b border-nexus-200 px-6 py-5">
          <h2 className="section-title">Invoice Appearance Settings</h2>
          <p className="section-subtitle">
            The fields that appear on generated invoices are not yet editable
            from this page.
          </p>
        </div>

        <div className="p-6 space-y-3 text-sm text-nexus-600">
          <p>
            Your current invoice email/PDF flow reads pay-to values from the
            invoice record itself, such as:
          </p>

          <div className="rounded-xl border border-nexus-200 bg-nexus-50 p-4">
            <p>• pay_to_name</p>
            <p>• pay_to_address_line_1</p>
            <p>• pay_to_address_line_2</p>
            <p>• pay_to_city</p>
            <p>• pay_to_state</p>
            <p>• pay_to_zip</p>
            <p>• pay_to_company_name</p>
            <p>• pay_to_logo_url</p>
          </div>

          <p>
            So this page now fixes the broken Account navigation and gives you a
            proper place to edit your user profile, but the invoice-specific
            pay-to settings still need to be wired to a real settings source.
          </p>
        </div>
      </section>
    </div>
  );
}