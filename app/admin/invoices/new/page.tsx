import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InvoiceBrandingSection from "@/components/invoices/InvoiceBrandingSection";

export default async function NewInvoicePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect("/dashboard");
  }

  if (profile.role !== "admin" && profile.role !== "support") {
    redirect("/dashboard");
  }

  async function createInvoice(formData: FormData) {
    "use server";

    const supabase = await createClient();

    // Basic fields (you likely already have these)
    const customerName = String(formData.get("customer_name") || "").trim();
    const billTo = String(formData.get("bill_to") || "").trim();
    const totalAmount = Number(formData.get("total_amount") || 0);

    // NEW Payment / Branding fields
    const payToName = String(formData.get("pay_to_name") || "").trim();
    const payToAddressLine1 = String(formData.get("pay_to_address_line_1") || "").trim();
    const payToAddressLine2 = String(formData.get("pay_to_address_line_2") || "").trim();
    const payToCity = String(formData.get("pay_to_city") || "").trim();
    const payToState = String(formData.get("pay_to_state") || "").trim();
    const payToZip = String(formData.get("pay_to_zip") || "").trim();
    const payToCompanyName = String(formData.get("pay_to_company_name") || "").trim();
    const payToLogoUrl = String(formData.get("pay_to_logo_url") || "").trim();

    const { error } = await supabase.from("invoices").insert({
      customer_name: customerName || null,
      bill_to: billTo || null,
      total_amount: totalAmount || 0,

      pay_to_name: payToName || null,
      pay_to_address_line_1: payToAddressLine1 || null,
      pay_to_address_line_2: payToAddressLine2 || null,
      pay_to_city: payToCity || null,
      pay_to_state: payToState || null,
      pay_to_zip: payToZip || null,
      pay_to_company_name: payToCompanyName || null,
      pay_to_logo_url: payToLogoUrl || null,
    });

    if (error) {
      redirect(`/admin/invoices/new?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/admin/invoices");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold">Create Invoice</h1>

        <form action={createInvoice} className="space-y-6">
          {/* STEP 3: Your new branding/payment section */}
          <InvoiceBrandingSection
            defaultValues={{
              pay_to_name: "Daniel Cruz",
              pay_to_address_line_1: "",
              pay_to_address_line_2: "",
              pay_to_city: "",
              pay_to_state: "",
              pay_to_zip: "",
              pay_to_company_name: "",
              pay_to_logo_url: "",
            }}
          />

          {/* Basic invoice info */}
          <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium">Customer Name</label>
              <input
                name="customer_name"
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="C.S. Brown Company Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Bill To</label>
              <textarea
                name="bill_to"
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="Customer address..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Total Amount</label>
              <input
                name="total_amount"
                type="number"
                step="0.01"
                className="mt-1 w-full rounded border px-3 py-2"
                placeholder="175.00"
              />
            </div>
          </div>

          <button className="rounded-lg bg-black px-6 py-2 text-white">
            Create Invoice
          </button>
        </form>
      </div>
    </main>
  );
}