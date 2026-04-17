import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoiceRecord = {
  id: string;
  invoice_number: string | null;
  bill_to?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  billing_period_start?: string | null;
  billing_period_end?: string | null;
  subtotal?: number | string | null;
  tax?: number | string | null;
  total?: number | string | null;
  status?: string | null;
  notes?: string | null;
};

type InvoiceItemRecord = {
  id: string;
  item_date?: string | null;
  description?: string | null;
  hours?: number | string | null;
  rate?: number | string | null;
  line_total?: number | string | null;
};

function money(value: number | string | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export async function buildInvoicePdf(
  invoice: InvoiceRecord,
  items: InvoiceItemRecord[]
) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = height - 50;

  function drawText(
    text: string,
    x: number,
    size = 11,
    useBold = false,
    color = rgb(0, 0, 0)
  ) {
    page.drawText(text, {
      x,
      y,
      size,
      font: useBold ? bold : font,
      color,
    });
  }

  function nextLine(amount = 18) {
    y -= amount;
  }

  drawText("INVOICE", 50, 22, true);
  drawText(`Invoice #: ${invoice.invoice_number ?? "-"}`, 400, 11, true);
  nextLine(28);

  drawText(`Bill To: ${invoice.bill_to || invoice.customer_name || "-"}`, 50, 12, true);
  nextLine();
  drawText(`Email: ${invoice.customer_email || "-"}`, 50);
  nextLine();
  drawText(
    `Billing Period: ${invoice.billing_period_start || "-"} to ${invoice.billing_period_end || "-"}`,
    50
  );
  nextLine();
  drawText(`Status: ${invoice.status || "draft"}`, 50);
  nextLine(28);

  drawText("Date", 50, 11, true);
  drawText("Description", 130, 11, true);
  drawText("Hours", 360, 11, true);
  drawText("Rate", 430, 11, true);
  drawText("Line Total", 500, 11, true);
  nextLine(12);

  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.75, 0.75, 0.75),
  });

  nextLine(18);

  for (const item of items) {
    if (y < 120) {
      break;
    }

    drawText(String(item.item_date || "-"), 50, 10);
    drawText(String(item.description || "-").slice(0, 38), 130, 10);
    drawText(Number(item.hours ?? 0).toFixed(2), 360, 10);
    drawText(money(item.rate), 430, 10);
    drawText(money(item.line_total), 500, 10);
    nextLine(16);
  }

  nextLine(16);

  drawText(`Subtotal: ${money(invoice.subtotal)}`, 400, 11, true);
  nextLine();
  drawText(`Tax: ${money(invoice.tax)}`, 400, 11, true);
  nextLine();
  drawText(`Total: ${money(invoice.total)}`, 400, 13, true);

  if (invoice.notes) {
    nextLine(36);
    drawText("Notes", 50, 11, true);
    nextLine();
    drawText(String(invoice.notes).slice(0, 100), 50, 10);
  }

  return await pdfDoc.save();
}