"use client";

import { useMemo, useState } from "react";

type Props = {
  defaultValues?: {
    pay_to_name?: string | null;
    pay_to_address_line_1?: string | null;
    pay_to_address_line_2?: string | null;
    pay_to_city?: string | null;
    pay_to_state?: string | null;
    pay_to_zip?: string | null;
    pay_to_company_name?: string | null;
    pay_to_logo_url?: string | null;
  };
};

export default function InvoiceBrandingSection({ defaultValues }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues?.pay_to_logo_url || null
  );

  const addressPreview = useMemo(() => {
    const city = defaultValues?.pay_to_city || "";
    const state = defaultValues?.pay_to_state || "";
    const zip = defaultValues?.pay_to_zip || "";

    return [city, state, zip].filter(Boolean).join(", ").replace(", ,", ",");
  }, [defaultValues?.pay_to_city, defaultValues?.pay_to_state, defaultValues?.pay_to_zip]);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
  }

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Invoice Branding & Payment Info</h2>
        <p className="mt-1 text-sm text-gray-600">
          Enter the information that should appear in the invoice header and in the
          “Make Payment To” section. Company name and logo can be left blank for now.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="pay_to_name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Pay To Name
            </label>
            <input
              id="pay_to_name"
              name="pay_to_name"
              type="text"
              defaultValue={defaultValues?.pay_to_name || "Daniel Cruz"}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Daniel Cruz"
            />
          </div>

          <div>
            <label
              htmlFor="pay_to_company_name"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Company Name (optional)
            </label>
            <input
              id="pay_to_company_name"
              name="pay_to_company_name"
              type="text"
              defaultValue={defaultValues?.pay_to_company_name || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="ERP Nexus"
            />
          </div>

          <div>
            <label
              htmlFor="pay_to_address_line_1"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Address Line 1
            </label>
            <input
              id="pay_to_address_line_1"
              name="pay_to_address_line_1"
              type="text"
              defaultValue={defaultValues?.pay_to_address_line_1 || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label
              htmlFor="pay_to_address_line_2"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Address Line 2 (optional)
            </label>
            <input
              id="pay_to_address_line_2"
              name="pay_to_address_line_2"
              type="text"
              defaultValue={defaultValues?.pay_to_address_line_2 || ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Suite, Floor, Apt, etc."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="pay_to_city"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                City
              </label>
              <input
                id="pay_to_city"
                name="pay_to_city"
                type="text"
                defaultValue={defaultValues?.pay_to_city || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Bronx"
              />
            </div>

            <div>
              <label
                htmlFor="pay_to_state"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                State
              </label>
              <input
                id="pay_to_state"
                name="pay_to_state"
                type="text"
                defaultValue={defaultValues?.pay_to_state || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="NY"
              />
            </div>

            <div>
              <label
                htmlFor="pay_to_zip"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                ZIP
              </label>
              <input
                id="pay_to_zip"
                name="pay_to_zip"
                type="text"
                defaultValue={defaultValues?.pay_to_zip || ""}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="10461"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="pay_to_logo_file"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Logo Upload (optional)
            </label>
            <input
              id="pay_to_logo_file"
              name="pay_to_logo_file"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleLogoChange}
              className="block w-full rounded-lg border px-3 py-2 file:mr-4 file:rounded-md file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <p className="mt-1 text-xs text-gray-500">
              Upload a logo to preview it in the form. Later this can be stored and shown
              in the invoice PDF.
            </p>
          </div>

          <input
            type="hidden"
            name="pay_to_logo_url"
            defaultValue={defaultValues?.pay_to_logo_url || ""}
          />
        </div>

        <div className="rounded-2xl border bg-gray-50 p-5">
          <h3 className="mb-4 text-lg font-semibold">Preview</h3>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
              <div>
                <div className="text-sm uppercase tracking-wide text-gray-500">
                  Invoice Header Preview
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {defaultValues?.pay_to_company_name || "Company Name (optional)"}
                </div>
                <div className="text-sm text-gray-600">
                  {defaultValues?.pay_to_name || "Daniel Cruz"}
                </div>
              </div>

              <div className="flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="px-2 text-center text-xs text-gray-400">
                    Logo will appear here
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Make Payment To
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-800">
                <div className="font-medium">
                  {defaultValues?.pay_to_name || "Daniel Cruz"}
                </div>

                {defaultValues?.pay_to_company_name ? (
                  <div>{defaultValues.pay_to_company_name}</div>
                ) : null}

                <div>
                  {defaultValues?.pay_to_address_line_1 || "Address Line 1"}
                </div>

                {defaultValues?.pay_to_address_line_2 ? (
                  <div>{defaultValues.pay_to_address_line_2}</div>
                ) : null}

                <div>{addressPreview || "City, State ZIP"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}