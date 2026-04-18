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
  return lines
    .flatMap((line) =>
      String(line || "")
        .split("\n")
        .map((part) => part.trim())
    )
    .filter(Boolean);
}

function buildCustomerAddress(data: InvoicePdfData) {
  const cityStateZip = [data.customerCity, data.customerState, data.customerZip]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ");

  const hasStructuredCustomerAddress =
    !!(data.customerAddressLine1 || data.customerAddressLine2 || cityStateZip);

  if (hasStructuredCustomerAddress) {
    return formatAddressBlock([
      data.customerName,
      data.customerAddressLine1 || "",
      data.customerAddressLine2 || "",
      cityStateZip,
    ]);
  }

  if (data.billTo && data.billTo.trim()) {
    return formatAddressBlock([data.billTo]);
  }

  return formatAddressBlock([data.customerName]);
}

function buildPayToAddress(data: InvoicePdfData) {
  const cityStateZip = [data.payToCity, data.payToState, data.payToZip]
    .map((v) => (v || "").trim())
    .filter(Boolean)
    .join(", ");

  return formatAddressBlock([
    data.payToCompanyName || "",
    data.payToName || "Daniel Cruz",
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

function drawRightAlignedText(
  page: any,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: any,
  color = rgb(0.07, 0.07, 0.07)
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - textWidth,
    y,
    size,
    font,
    color,
  });
}

function wrapTextLines(params: {
  text: string;
  maxWidth: number;
  font: any;
  size: number;
}) {
  const { text, maxWidth, font, size } = params;

  const paragraphs = String(text || "").split("\n");
  const allLines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      allLines.push("");
      continue;
    }

    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);

      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) allLines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  return allLines.length > 0 ? allLines : [""];
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

  const lines = wrapTextLines({
    text,
    maxWidth,
    font,
    size,
  });

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

  return {
    bottomY: currentY,
    lineCount: lines.length,
  };
}

export async function generateInvoicePdf(data: InvoicePdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);

  const width = page.getWidth();
  const height = page.getHeight();

  const margin = 28;
  const contentWidth = width - margin * 2;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.08, 0.08, 0.1);
  const muted = rgb(0.4, 0.44, 0.52);
  const border = rgb(0.86, 0.88, 0.91);
  const lightBg = rgb(0.97, 0.98, 0.99);
  const lighterRow = rgb(0.985, 0.987, 0.992);
  const accent = rgb(0.35, 0.4, 0.5);
  const headerText = rgb(0.98, 0.98, 0.98);

  const currencySymbol = data.currencySymbol || "$";

  let y = height - margin;

  page.drawRectangle({
    x: 0,
    y: height - 14,
    width,
    height: 14,
    color: accent,
  });

  let logoDrawn = false;
  if (data.logoBytes && data.logoMimeType) {
    try {
      const image =
        data.logoMimeType === "image/png"
          ? await pdfDoc.embedPng(data.logoBytes)
          : await pdfDoc.embedJpg(data.logoBytes);

      const maxLogoWidth = 82;
      const maxLogoHeight = 46;
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

  const brandX = logoDrawn ? margin + 96 : margin;
  const companyName = (data.payToCompanyName || "").trim();
  const displayBrand = companyName || "Daniel Cruz";

  drawText(page, displayBrand, brandX, y - 6, 17, fontBold, dark);
  if (companyName) {
    drawText(page, data.payToName || "Daniel Cruz", brandX, y - 24, 9, fontRegular, muted);
  }

  const metaX = width - margin - 170;
  drawText(page, "INVOICE", metaX, y - 6, 21, fontBold, dark);

  drawText(page, "Invoice #", metaX, y - 30, 9, fontBold, muted);
  drawText(page, data.invoiceNumber, metaX + 72, y - 30, 9, fontRegular, dark);

  drawText(page, "Invoice Date", metaX, y - 46, 9, fontBold, muted);
  drawText(page, data.invoiceDate, metaX + 72, y - 46, 9, fontRegular, dark);

  drawText(page, "Due Date", metaX, y - 62, 9, fontBold, muted);
  drawText(page, data.dueDate || "-", metaX + 72, y - 62, 9, fontRegular, dark);

  y -= 92;

  const customerAddressLines = buildCustomerAddress(data);
  const payToLines = buildPayToAddress(data);

  const maxCardLines = Math.max(customerAddressLines.length, payToLines.length, 3);
  const cardPaddingTop = 34;
  const cardPaddingBottom = 14;
  const addressLineHeight = 13;
  const cardHeight = cardPaddingTop + cardPaddingBottom + maxCardLines * addressLineHeight;

  const cardY = y - cardHeight;
  const leftCardX = margin;
  const cardGap = 12;
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

  drawText(page, "Bill To", leftCardX + 10, cardY + cardHeight - 16, 10, fontBold, muted);
  drawText(
    page,
    "Make Payment To",
    rightCardX + 10,
    cardY + cardHeight - 16,
    10,
    fontBold,
    muted
  );

  let billToY = cardY + cardHeight - 34;
  for (const line of customerAddressLines) {
    drawText(page, line, leftCardX + 10, billToY, 9.5, fontRegular, dark);
    billToY -= addressLineHeight;
  }

  let payToY = cardY + cardHeight - 34;
  for (const line of payToLines) {
    drawText(page, line, rightCardX + 10, payToY, 9.5, fontRegular, dark);
    payToY -= addressLineHeight;
  }

  y = cardY - 18;

  const tableX = margin;
  const tableWidth = contentWidth;
  const headerHeight = 24;

  const colDate = 58;
  const colTicket = 82;
  const colHours = 44;
  const colRate = 58;
  const colAmount = 68;
  const colDescription = tableWidth - (colDate + colTicket + colHours + colRate + colAmount);

  page.drawRectangle({
    x: tableX,
    y: y - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: accent,
  });

  const dateX = tableX + 8;
  const ticketX = dateX + colDate;
  const descX = ticketX + colTicket;
  const hoursRightX = descX + colDescription + colHours - 8;
  const rateRightX = descX + colDescription + colHours + colRate - 8;
  const amountRightX = descX + colDescription + colHours + colRate + colAmount - 8;

  let hx = tableX + 8;
  drawText(page, "Date", hx, y - 16, 9, fontBold, headerText);
  hx += colDate;
  drawText(page, "Ticket", hx, y - 16, 9, fontBold, headerText);
  hx += colTicket;
  drawText(page, "Description", hx, y - 16, 9, fontBold, headerText);
  hx += colDescription;
  drawText(page, "Hours", hx, y - 16, 9, fontBold, headerText);
  hx += colHours;
  drawText(page, "Rate", hx, y - 16, 9, fontBold, headerText);
  hx += colRate;
  drawText(page, "Amount", hx, y - 16, 9, fontBold, headerText);

  y -= headerHeight + 12;

  let subtotal = 0;
  let totalHours = 0;

  for (let i = 0; i < data.lineItems.length; i++) {
    const item = data.lineItems[i];

    const amount =
      item.amount != null ? safeNumber(item.amount) : safeNumber(item.hours) * safeNumber(item.rate);

    subtotal += amount;
    totalHours += safeNumber(item.hours);

    const descLines = wrapTextLines({
      text: item.description || "-",
      maxWidth: colDescription - 10,
      font: fontRegular,
      size: 9,
    });

    const lineCount = Math.max(descLines.length, 1);
    const lineHeight = 11;
    const topPadding = 8;
    const bottomPadding = 6;
    const usedHeight = Math.max(26, topPadding + bottomPadding + lineCount * lineHeight);

    const rowTopY = y;
    const rowBottomY = rowTopY - usedHeight + 4;
    const textTopY = rowTopY - topPadding;

    page.drawRectangle({
      x: tableX,
      y: rowBottomY,
      width: tableWidth,
      height: usedHeight,
      color: i % 2 === 0 ? rgb(1, 1, 1) : lighterRow,
      borderColor: border,
      borderWidth: 0.6,
    });

    page.drawLine({
      start: { x: ticketX - 6, y: rowBottomY },
      end: { x: ticketX - 6, y: rowBottomY + usedHeight },
      thickness: 0.5,
      color: border,
    });

    page.drawLine({
      start: { x: descX - 6, y: rowBottomY },
      end: { x: descX - 6, y: rowBottomY + usedHeight },
      thickness: 0.5,
      color: border,
    });

    page.drawLine({
      start: { x: descX + colDescription - 6, y: rowBottomY },
      end: { x: descX + colDescription - 6, y: rowBottomY + usedHeight },
      thickness: 0.5,
      color: border,
    });

    page.drawLine({
      start: { x: descX + colDescription + colHours - 6, y: rowBottomY },
      end: { x: descX + colDescription + colHours - 6, y: rowBottomY + usedHeight },
      thickness: 0.5,
      color: border,
    });

    page.drawLine({
      start: { x: descX + colDescription + colHours + colRate - 6, y: rowBottomY },
      end: { x: descX + colDescription + colHours + colRate - 6, y: rowBottomY + usedHeight },
      thickness: 0.5,
      color: border,
    });

    drawText(page, item.date || "-", dateX, textTopY, 9, fontRegular, dark);
    drawText(page, item.ticket_number || "-", ticketX, textTopY, 9, fontRegular, dark);

    drawWrappedText({
      page,
      text: item.description || "-",
      x: descX,
      y: textTopY,
      maxWidth: colDescription - 10,
      lineHeight,
      font: fontRegular,
      size: 9,
      color: dark,
    });

    drawRightAlignedText(
      page,
      safeNumber(item.hours) ? safeNumber(item.hours).toFixed(2) : "-",
      hoursRightX,
      textTopY,
      9,
      fontRegular,
      dark
    );

    drawRightAlignedText(
      page,
      safeNumber(item.rate) ? money(item.rate, currencySymbol) : "-",
      rateRightX,
      textTopY,
      9,
      fontRegular,
      dark
    );

    drawRightAlignedText(
      page,
      money(amount, currencySymbol),
      amountRightX,
      textTopY,
      9,
      fontRegular,
      dark
    );

    y -= usedHeight;
  }

  y -= 14;

  const summaryWidth = 180;
  const summaryX = width - margin - summaryWidth;

  page.drawRectangle({
    x: summaryX,
    y: y - 60,
    width: summaryWidth,
    height: 60,
    color: lightBg,
    borderColor: border,
    borderWidth: 1,
  });

  drawText(page, "Total Hours", summaryX + 10, y - 18, 10, fontBold, muted);
  drawRightAlignedText(
    page,
    totalHours.toFixed(2),
    summaryX + 170,
    y - 18,
    10,
    fontRegular,
    dark
  );

  drawText(page, "Total Due", summaryX + 10, y - 40, 11, fontBold, dark);
  drawRightAlignedText(
    page,
    money(subtotal, currencySymbol),
    summaryX + 170,
    y - 40,
    11,
    fontBold,
    dark
  );

  y -= 82;

  if (data.notes && data.notes.trim()) {
    drawText(page, "Notes", margin, y, 10, fontBold, muted);
    y -= 14;

    const notesWrap = drawWrappedText({
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

    y = notesWrap.bottomY - 6;
  }

  page.drawLine({
    start: { x: margin, y: 40 },
    end: { x: width - margin, y: 40 },
    thickness: 1,
    color: border,
  });

  drawText(
    page,
    "Thank you for your business.",
    margin,
    27,
    9,
    fontRegular,
    muted
  );

  return await pdfDoc.save();
}