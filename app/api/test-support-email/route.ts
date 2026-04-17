import { NextResponse } from "next/server";
import { sendSupportEmail } from "@/lib/sendSupportEmail";

async function handleRequest() {
  const notificationEmail = process.env.SUPPORT_NOTIFICATION_EMAIL;

  if (!notificationEmail) {
    return NextResponse.json(
      { error: "Missing SUPPORT_NOTIFICATION_EMAIL in environment variables." },
      { status: 500 }
    );
  }

  try {
    const result = await sendSupportEmail({
      to: notificationEmail,
      subject: "Test Support Email from ERP Nexus",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; line-height: 1.6;">
          <h1 style="margin-bottom: 12px;">Support Email Test</h1>
          <p>This is a test support email from your ERP Nexus support app.</p>
          <p>If you received this, ticket emails are correctly sending from <strong>support@erpnexus.net</strong>.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Support email sent successfully.",
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown support email error";

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