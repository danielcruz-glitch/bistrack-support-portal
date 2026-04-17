import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoiceLineItem = {
  date?: string | null;
  ticket_number?: string | null;
  description: string;
  hours?: number | null;
  rate?: number | null;
  amount?: number | null;
};

type InvoicePdfData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;

  customerName: string;
  billTo?: string | null;
  customerAddressLine1?: string | null;
  customerAddressLine2?: string | null;
  customerCity?: string | null;
  customerState?: string | null;
  customerZip?: string | null;

  payToName?: string | null;
  payToAddressLine1?: string | null;
  payToAddressLine2?: string | null;
  payToCity?: string | null;
  payToState?: string | null;
  payToZip?: string | null;
  payToCompanyName?: string | null;

  logoBytes?: Uint8Array | null;
  logoMimeType?: "image/png" | "image/jpeg" | null;

  lineItems: InvoiceLineItem[];

  notes?: string | null;
  currencySymbol?: string | null;
};

function money(value: number | null | undefined, currencySymbol = "$") {
  const safe = Number(value || 0);
  return `${currencySymbol}${safe.toFixed(2)}`;
}

function safeNumber(value: number | null | undefined) {
  return Number(value || 0);
}

function formatAddressBlock(lines: Array<string | null | undefined>) {
  return lines.map((line) => (line || "").trim()).filter(Boolean);
}

function buildCustomerAddress(data: InvoicePdfData) {
  const cityStateZip = [data.customerCity, data.customerState, data.customerZip]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ");

  return formatAddressBlock([
    data.customerName,
    data.customerAddressLine1 || data.billTo || "",
    data.customerAddressLine2 || "",
    cityStateZip,
  ]);
}

function buildPayToAddress(data: InvoicePdfData) {
  const cityStateZip = [data.payToCity, data.payToState, data.payToZip]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ");

  return formatAddressBlock([
    data.payToName || "Daniel Cruz",
    data.payToCompanyName || "",
    data.payToAddressLine1 || "",
    data.payToAddressLine2 || "",
    cityStateZip,
  ]);
}

function drawText(
  page: any,
  text: string,
  x: number,
  y: number,
  size: number,
  font: any,
  color = rgb(0.07, 0.07, 0.07)
) {
  page.drawText(text, { x, y, size, font, color });
}

function drawWrappedText(params: {
  page: any;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  font: any;
  size: number;
  color?: any;
}) {
  const { page, text, x, y, maxWidth, lineHeight, font, size, color } = params;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, size);

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      font,
      color: color || rgb(0.07, 0.07, 0.07),
    });
    currentY -= lineHeight;
  }

  return currentY;
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);

  const width = page.getWidth();
  const height = page.getHeight();

  const margin = 48;
  const contentWidth = width - margin * 2;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.08, 0.08, 0.1);
  const muted = rgb(0.4, 0.44, 0.52);
  const border = rgb(0.86, 0.88, 0.91);
  const lightBg = rgb(0.97, 0.98, 0.99);
  const accent = rgb(0.1, 0.12, 0.16);

  const currencySymbol = data.currencySymbol || "$";

  let y = height - margin;

  // Top accent bar
  page.drawRectangle({
    x: 0,
    y: height - 16,
    width,
    height: 16,
    color: accent,
  });

  // Optional logo
  let logoDrawn = false;
  if (data.logoBytes && data.logoMimeType) {
    try {
      const image =
        data.logoMimeType === "image/png"
          ? await pdfDoc.embedPng(data.logoBytes)
          : await pdfDoc.embedJpg(data.logoBytes);

      const maxLogoWidth = 90;
      const maxLogoHeight = 50;
      const dims = image.scale(1);

      const widthRatio = maxLogoWidth / dims.width;
      const heightRatio = maxLogoHeight / dims.height;
      const ratio = Math.min(widthRatio, heightRatio, 1);

      const logoWidth = dims.width * ratio;
      const logoHeight = dims.height * ratio;

      page.drawImage(image, {
        x: margin,
        y: y - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });

      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }

  const brandX = logoDrawn ? margin + 110 : margin;
  const companyName = (data.payToCompanyName || "").trim();
  const displayBrand = companyName || "Daniel Cruz";

  drawText(page, displayBrand, brandX, y - 8, 18, fontBold, dark);
  if (companyName) {
    drawText(page, data.payToName || "Daniel Cruz", brandX, y - 28, 10, fontRegular, muted);
  }

  // Invoice meta block
  const metaX = width - margin - 170;
  drawText(page, "INVOICE", metaX, y - 8, 22, fontBold, dark);

  drawText(page, "Invoice #", metaX, y - 34, 9, fontBold, muted);
  drawText(page, data.invoiceNumber, metaX + 72, y - 34, 9, fontRegular, dark);

  drawText(page, "Invoice Date", metaX, y - 50, 9, fontBold, muted);
  drawText(page, data.invoiceDate, metaX + 72, y - 50, 9, fontRegular, dark);

  drawText(page, "Due Date", metaX, y - 66, 9, fontBold, muted);
  drawText(page, data.dueDate || "-", metaX + 72, y - 66, 9, fontRegular, dark);

  y -= 100;

  // Bill To + Make Payment To cards
  const cardY = y - 90;
  const cardHeight = 90;
  const leftCardX = margin;
  const cardGap = 16;
  const cardWidth = (contentWidth - cardGap) / 2;
  const rightCardX = leftCardX + cardWidth + cardGap;

  page.drawRectangle({
    x: leftCardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: lightBg,
    borderColor: border,
    borderWidth: 1,
  });

  page.drawRectangle({
    x: rightCardX,
    y: cardY,
    width: cardWidth,
    height: cardHeight,
    color: lightBg,
    borderColor: border,
    borderWidth: 1,
  });

  drawText(page, "Bill To", leftCardX + 12, cardY + cardHeight - 18, 10, fontBold, muted);
  drawText(
    page,
    "Make Payment To",
    rightCardX + 12,
    cardY + cardHeight - 18,
    10,
    fontBold,
    muted
  );

  const customerAddressLines = buildCustomerAddress(data);
  let billToY = cardY + cardHeight - 36;
  for (const line of customerAddressLines) {
    drawText(page, line, leftCardX + 12, billToY, 10, fontRegular, dark);
    billToY -= 14;
  }

  const payToLines = buildPayToAddress(data);
  let payToY = cardY + cardHeight - 36;
  for (const line of payToLines) {
    drawText(page, line, rightCardX + 12, payToY, 10, fontRegular, dark);
    payToY -= 14;
  }

  y = cardY - 24;

  // Table header
  const tableX = margin;
  const tableWidth = contentWidth;
  const rowHeight = 22;
  const headerHeight = 24;

  const colDate = 62;
  const colTicket = 64;
  const colHours = 52;
  const colRate = 64;
  const colAmount = 74;
  const colDescription = tableWidth - (colDate + colTicket + colHours + colRate + colAmount);

  page.drawRectangle({
    x: tableX,
    y: y - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: accent,
  });

  let hx = tableX + 8;
  drawText(page, "Date", hx, y - 16, 9, fontBold, rgb(1, 1, 1));
  hx += colDate;
  drawText(page, "Ticket", hx, y - 16, 9, fontBold, rgb(1, 1, 1));
  hx += colTicket;
  drawText(page, "Description", hx, y - 16, 9, fontBold, rgb(1, 1, 1));
  hx += colDescription;
  drawText(page, "Hours", hx, y - 16, 9, fontBold, rgb(1, 1, 1));
  hx += colHours;
  drawText(page, "Rate", hx, y - 16, 9, fontBold, rgb(1, 1, 1));
  hx += colRate;
  drawText(page, "Amount", hx, y - 16, 9, fontBold, rgb(1, 1, 1));

  y -= headerHeight + 6;

  let subtotal = 0;
  let totalHours = 0;

  for (const item of data.lineItems) {
    const amount =
      item.amount != null ? safeNumber(item.amount) : safeNumber(item.hours) * safeNumber(item.rate);

    subtotal += amount;
    totalHours += safeNumber(item.hours);

    const descX = tableX + 8 + colDate + colTicket;
    const descWidth = colDescription - 10;

    const wrappedBottomY = drawWrappedText({
      page,
      text: item.description || "-",
      x: descX,
      y,
      maxWidth: descWidth,
      lineHeight: 11,
      font: fontRegular,
      size: 9,
      color: dark,
    });

    const usedHeight = Math.max(rowHeight, y - wrappedBottomY + 8);

    page.drawRectangle({
      x: tableX,
      y: y - usedHeight + 4,
      width: tableWidth,
      height: usedHeight,
      borderColor: border,
      borderWidth: 0.6,
    });

    drawText(page, item.date || "-", tableX + 8, y, 9, fontRegular, dark);
    drawText(page, item.ticket_number || "-", tableX + 8 + colDate, y, 9, fontRegular, dark);
    drawText(
      page,
      safeNumber(item.hours) ? safeNumber(item.hours).toFixed(2) : "-",
      tableX + 8 + colDate + colTicket + colDescription,
      y,
      9,
      fontRegular,
      dark
    );
    drawText(
      page,
      safeNumber(item.rate) ? money(item.rate, currencySymbol) : "-",
      tableX + 8 + colDate + colTicket + colDescription + colHours,
      y,
      9,
      fontRegular,
      dark
    );
    drawText(
      page,
      money(amount, currencySymbol),
      tableX + 8 + colDate + colTicket + colDescription + colHours + colRate,
      y,
      9,
      fontRegular,
      dark
    );

    y -= usedHeight;
  }

  y -= 16;

  // Summary box
  const summaryWidth = 190;
  const summaryX = width - margin - summaryWidth;

  page.drawRectangle({
    x: summaryX,
    y: y - 62,
    width: summaryWidth,
    height: 62,
    color: lightBg,
    borderColor: border,
    borderWidth: 1,
  });

  drawText(page, "Total Hours", summaryX + 12, y - 18, 10, fontBold, muted);
  drawText(page, totalHours.toFixed(2), summaryX + 120, y - 18, 10, fontRegular, dark);

  drawText(page, "Total Due", summaryX + 12, y - 40, 11, fontBold, dark);
  drawText(
    page,
    money(subtotal, currencySymbol),
    summaryX + 120,
    y - 40,
    11,
    fontBold,
    dark
  );

  y -= 86;

  // Notes
  if (data.notes && data.notes.trim()) {
    drawText(page, "Notes", margin, y, 10, fontBold, muted);
    y -= 16;

    y = drawWrappedText({
      page,
      text: data.notes.trim(),
      x: margin,
      y,
      maxWidth: contentWidth,
      lineHeight: 12,
      font: fontRegular,
      size: 9,
      color: dark,
    });

    y -= 8;
  }

  // Footer line
  page.drawLine({
    start: { x: margin, y: 44 },
    end: { x: width - margin, y: 44 },
    thickness: 1,
    color: border,
  });

  drawText(
    page,
    "Thank you for your business.",
    margin,
    30,
    9,
    fontRegular,
    muted
  );

  return await pdfDoc.save();
}