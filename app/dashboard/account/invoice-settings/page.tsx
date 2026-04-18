import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import InvoiceBrandingSection from "@/components/invoices/InvoiceBrandingSection";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    updated?: string;
    error?: string;
  }>;
};

function getFlashMessage(updated?: string, error?: string) {
  if (error) {
    return {
      type: "error" as const,
      text: decodeURIComponent(error),
    };
  }

  if (updated === "branding") {
    return {
      type: "success" as const,
      text: "Invoice branding settings saved successfully.",
    };
  }

  return null;
}

export default async function InvoiceSettingsPage({
  searchParams,
}: PageProps) {
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
    .select("id, full_name, email, role, company_id, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/dashboard?error=profile-not-found");
  }

  if (!profile.is_active) {
    redirect("/dashboard?error=inactive-user");
  }

  if (!profile.company_id) {
    redirect("/dashboard?error=missing-company");
  }

  if (!["admin", "support"].includes(profile.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", profile.company_id)
    .maybeSingle();

  const { data: invoiceSettings } = await supabase
    .from("invoice_settings")
    .select(
      `
        id,
        company_id,
        pay_to_name,
        pay_to_address_line_1,
        pay_to_address_line_2,
        pay_to_city,
        pay_to_state,
        pay_to_zip,
        pay_to_company_name,
        pay_to_logo_url
      `
    )
    .eq("company_id", profile.company_id)
    .maybeSingle();

  async function saveInvoiceSettings(formData: FormData) {
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
      .select("id, role, company_id, is_active")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      redirect("/dashboard?error=forbidden");
    }

    if (!profile.company_id) {
      redirect("/dashboard?error=missing-company");
    }

    if (!["admin", "support"].includes(profile.role)) {
      redirect("/dashboard?error=forbidden");
    }

    const payload = {
      company_id: profile.company_id,
      pay_to_name: String(formData.get("pay_to_name") || "").trim() || null,
      pay_to_address_line_1:
        String(formData.get("pay_to_address_line_1") || "").trim() || null,
      pay_to_address_line_2:
        String(formData.get("pay_to_address_line_2") || "").trim() || null,
      pay_to_city: String(formData.get("pay_to_city") || "").trim() || null,
      pay_to_state: String(formData.get("pay_to_state") || "").trim() || null,
      pay_to_zip: String(formData.get("pay_to_zip") || "").trim() || null,
      pay_to_company_name:
        String(formData.get("pay_to_company_name") || "").trim() || null,
      pay_to_logo_url:
        String(formData.get("pay_to_logo_url") || "").trim() || null,
    };

    const { error: upsertError } = await supabase
      .from("invoice_settings")
      .upsert(payload, {
        onConflict: "company_id",
      });

    if (upsertError) {
      const encoded = encodeURIComponent(upsertError.message);
      redirect(`/dashboard/account/invoice-settings?error=${encoded}`);
    }

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard/account/invoice-settings");
    redirect("/dashboard/account/invoice-settings?updated=branding");
  }

  const message = getFlashMessage(
    resolvedSearchParams.updated,
    resolvedSearchParams.error
  );

  return (
    <div className="space-y-6">
      <section className="panel-premium overflow-hidden">
        <div className="relative border-b border-nexus-200 px-6 py-5">
          <div className="absolute inset-0 nexus-grid-bg opacity-20" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="section-title">Invoice Settings</h1>
              <p className="section-subtitle">
                Manage the branding and payment information used by your support
                company when billing clients.
              </p>
              <p className="mt-2 text-sm text-nexus-500">
                Billing company: <strong>{company?.name || "Unknown Company"}</strong>
              </p>
            </div>

            <Link href="/dashboard/account" className="button-secondary">
              Back to Account
            </Link>
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

          <form action={saveInvoiceSettings} className="space-y-6">
            <InvoiceBrandingSection defaultValues={invoiceSettings ?? undefined} />

            <div className="flex items-center justify-end">
              <button type="submit" className="button-primary">
                Save Invoice Settings
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="panel-premium overflow-hidden">
        <div className="border-b border-nexus-200 px-6 py-5">
          <h2 className="section-title">How this works</h2>
          <p className="section-subtitle">
            These settings belong to the billing support company, not an individual user.
          </p>
        </div>

        <div className="space-y-3 p-6 text-sm text-nexus-600">
          <p>
            This page now stores invoice branding defaults at the company level,
            so any authorized admin/support user from the same support company
            can manage the billing identity.
          </p>

          <p>
            That means ERPNexus can maintain one invoice branding profile today,
            and future support companies can have their own separate invoice
            branding rows later without changing the model again.
          </p>
        </div>
      </section>
    </div>
  );
}