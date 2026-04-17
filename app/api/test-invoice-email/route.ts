import { NextResponse } from "next/server";
import { sendInvoiceEmail } from "@/lib/sendInvoiceEmail";

async function handleRequest() {
  const notificationEmail = process.env.SUPPORT_NOTIFICATION_EMAIL;

  if (!notificationEmail) {
    return NextResponse.json(
      { error: "Missing SUPPORT_NOTIFICATION_EMAIL in environment variables." },
      { status: 500 }
    );
  }

  try {
    const result = await sendInvoiceEmail({
      to: notificationEmail,
      subject: "Test Invoice Email from ERP Nexus",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.6;">
          <h1 style="margin-bottom: 12px;">Invoice Email Test</h1>
          <p>This is a test invoice email from your ERP Nexus billing workflow.</p>
          <p>If you received this, invoice emails are correctly sending from <strong>billing@erpnexus.net</strong>.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Invoice email sent successfully.",
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown invoice email error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return handleRequest();
}

export async function POST() {
  return handleRequest();
}