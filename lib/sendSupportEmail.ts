import { resend } from "@/lib/resend";

type SendSupportEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  replyTo?: string | string[];
};

export async function sendSupportEmail({
  to,
  subject,
  html,
  cc,
  replyTo,
}: SendSupportEmailArgs) {
  const from = process.env.SUPPORT_FROM_EMAIL;

  if (!from) {
    throw new Error("Missing SUPPORT_FROM_EMAIL in environment variables.");
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
    throw new Error(`Support email failed: ${error.message}`);
  }

  return data;
}