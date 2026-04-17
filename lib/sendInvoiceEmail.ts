import { resend } from "@/lib/resend";

type SendInvoiceEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  replyTo?: string | string[];
};

export async function sendInvoiceEmail({
  to,
  subject,
  html,
  cc,
  replyTo,
}: SendInvoiceEmailArgs) {
  const from = process.env.INVOICE_FROM_EMAIL;

  if (!from) {
    throw new Error("Missing INVOICE_FROM_EMAIL in environment variables.");
  }

  const { data, error } = await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
    ...(replyTo
      ? { replyTo: Array.isArray(replyTo) ? replyTo : [replyTo] }
      : {}),
  });

  if (error) {
    throw new Error(`Invoice email failed: ${error.message}`);
  }

  return data;
}