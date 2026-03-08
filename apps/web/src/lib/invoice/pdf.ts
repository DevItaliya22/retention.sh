import type { BillInvoice } from "@/lib/schemas/invoice";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const PAGE_MARGIN = 40;

function sanitizePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function fit(value: string, max = 50): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 3)}...`;
}

function wrapText(value: string, maxChars: number): string[] {
  const text = value.trim();
  if (!text) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines;
}

function amountLabel(value: number, currencyCode: string): string {
  return `${currencyCode} ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function estimateTextWidth(
  text: string,
  fontSize: number,
  isBold = false,
): number {
  const ratio = isBold ? 0.56 : 0.52;
  return text.length * fontSize * ratio;
}

function buildPdfContent(invoice: BillInvoice): string {
  const ops: string[] = [];
  const rightEdge = PAGE_WIDTH - PAGE_MARGIN;

  const addText = (
    text: string,
    x: number,
    y: number,
    size = 10,
    bold = false,
    gray = 0,
  ) => {
    ops.push(
      `BT /F${bold ? "2" : "1"} ${size} Tf ${gray} g 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${sanitizePdfText(text)}) Tj ET`,
    );
  };

  const addRightText = (
    text: string,
    xRight: number,
    y: number,
    size = 10,
    bold = false,
    gray = 0,
  ) => {
    const width = estimateTextWidth(text, size, bold);
    const x = Math.max(PAGE_MARGIN, xRight - width);
    addText(text, x, y, size, bold, gray);
  };

  const strokeRect = (x: number, y: number, width: number, height: number) => {
    ops.push(
      `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`,
    );
  };

  const fillRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    gray = 0.95,
  ) => {
    ops.push(
      `q ${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f Q`,
    );
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    ops.push(
      `${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`,
    );
  };

  const issuedAt = new Date(invoice.issuedAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Header
  const headerTop = PAGE_HEIGHT - PAGE_MARGIN;
  const headerHeight = 72;
  const headerBottom = headerTop - headerHeight;
  fillRect(
    PAGE_MARGIN,
    headerBottom,
    rightEdge - PAGE_MARGIN,
    headerHeight,
    0.96,
  );
  strokeRect(PAGE_MARGIN, headerBottom, rightEdge - PAGE_MARGIN, headerHeight);

  addText(invoice.business.name, PAGE_MARGIN + 12, headerTop - 24, 16, true);
  addText(
    `Bill Number: ${invoice.invoiceNumber}`,
    PAGE_MARGIN + 12,
    headerTop - 42,
    11,
    true,
  );
  addText(
    `Issued: ${issuedAt}`,
    PAGE_MARGIN + 12,
    headerTop - 58,
    10,
    false,
    0.2,
  );

  addRightText("BILL", rightEdge - 12, headerTop - 24, 14, true);
  addRightText(
    invoice.business.currencyCode,
    rightEdge - 12,
    headerTop - 42,
    10,
    false,
    0.25,
  );

  // Details section
  const sectionTop = headerBottom - 14;
  const cardGap = 10;
  const cardWidth = (rightEdge - PAGE_MARGIN - cardGap) / 2;
  const cardHeight = 92;

  const leftCardX = PAGE_MARGIN;
  const rightCardX = leftCardX + cardWidth + cardGap;
  const cardY = sectionTop - cardHeight;

  fillRect(leftCardX, cardY, cardWidth, cardHeight, 0.985);
  strokeRect(leftCardX, cardY, cardWidth, cardHeight);
  addText("Bill Details", leftCardX + 10, sectionTop - 18, 10, true, 0.25);

  const leftRows: Array<[string, string]> = [
    ["Bill Number", invoice.invoiceNumber],
    ["Issued At", issuedAt],
    ["Currency", invoice.business.currencyCode],
  ];

  leftRows.forEach(([label, value], index) => {
    const y = sectionTop - 36 - index * 18;
    addText(label, leftCardX + 10, y, 9, false, 0.35);
    addRightText(fit(value, 28), leftCardX + cardWidth - 10, y, 9, true);
  });

  fillRect(rightCardX, cardY, cardWidth, cardHeight, 0.985);
  strokeRect(rightCardX, cardY, cardWidth, cardHeight);
  addText("Customer", rightCardX + 10, sectionTop - 18, 10, true, 0.25);

  const customerRows: Array<[string, string]> = [
    ["Name", invoice.customer.name],
    ["Phone", invoice.customer.phone ?? "-"],
    ["Email", invoice.customer.email ?? "-"],
  ];

  customerRows.forEach(([label, value], index) => {
    const y = sectionTop - 36 - index * 18;
    addText(label, rightCardX + 10, y, 9, false, 0.35);
    addRightText(fit(value, 30), rightCardX + cardWidth - 10, y, 9, true);
  });

  // Items table
  const tableTop = cardY - 16;
  const tableHeaderHeight = 24;
  const rowHeight = 18;
  const maxItemRows = 13;

  const displayedItems = invoice.items.slice(0, maxItemRows);
  const hiddenCount = Math.max(0, invoice.items.length - displayedItems.length);

  const tableRowsCount = displayedItems.length + (hiddenCount > 0 ? 1 : 0);
  const tableHeight = tableHeaderHeight + tableRowsCount * rowHeight;
  const tableBottom = tableTop - tableHeight;

  strokeRect(PAGE_MARGIN, tableBottom, rightEdge - PAGE_MARGIN, tableHeight);
  fillRect(
    PAGE_MARGIN,
    tableTop - tableHeaderHeight,
    rightEdge - PAGE_MARGIN,
    tableHeaderHeight,
    0.94,
  );

  const colItemX = PAGE_MARGIN + 10;
  const colQtyRight = PAGE_MARGIN + 320;
  const colUnitRight = PAGE_MARGIN + 420;
  const colTotalRight = rightEdge - 12;

  addText("Item", colItemX, tableTop - 16, 9, true, 0.25);
  addRightText("Qty", colQtyRight, tableTop - 16, 9, true, 0.25);
  addRightText("Unit Price", colUnitRight, tableTop - 16, 9, true, 0.25);
  addRightText("Total", colTotalRight, tableTop - 16, 9, true, 0.25);

  displayedItems.forEach((item, index) => {
    const rowY = tableTop - tableHeaderHeight - index * rowHeight;
    line(PAGE_MARGIN, rowY, rightEdge, rowY);

    const description = fit(
      item.skuCode ? `${item.description} (${item.skuCode})` : item.description,
      42,
    );

    addText(description, colItemX, rowY - 13, 9, false, 0.05);
    addRightText(String(item.quantity), colQtyRight, rowY - 13, 9, true);
    addRightText(
      amountLabel(item.unitPrice, invoice.business.currencyCode),
      colUnitRight,
      rowY - 13,
      9,
      false,
    );
    addRightText(
      amountLabel(item.total, invoice.business.currencyCode),
      colTotalRight,
      rowY - 13,
      9,
      true,
    );
  });

  if (hiddenCount > 0) {
    const hiddenRowIndex = displayedItems.length;
    const rowY = tableTop - tableHeaderHeight - hiddenRowIndex * rowHeight;
    line(PAGE_MARGIN, rowY, rightEdge, rowY);
    addText(
      `... and ${hiddenCount} more item(s)`,
      colItemX,
      rowY - 13,
      9,
      false,
      0.35,
    );
  }

  // Totals box
  const totalsTop = tableBottom - 16;
  const totalsWidth = 250;
  const totalsX = rightEdge - totalsWidth;
  const totalsRows: Array<[string, string, boolean]> = [
    [
      "Subtotal",
      amountLabel(invoice.totals.subtotal, invoice.business.currencyCode),
      false,
    ],
    [
      "Store Discount",
      `-${amountLabel(invoice.totals.storeDiscount, invoice.business.currencyCode)}`,
      false,
    ],
    [
      "Tax",
      amountLabel(invoice.totals.tax, invoice.business.currencyCode),
      false,
    ],
    [
      "Cashback Redeemed",
      `-${amountLabel(invoice.totals.cashbackRedeemed, invoice.business.currencyCode)}`,
      false,
    ],
    [
      "Cashback Earned",
      amountLabel(invoice.totals.cashbackEarned, invoice.business.currencyCode),
      false,
    ],
    [
      "Amount Paid",
      amountLabel(invoice.totals.amountPaid, invoice.business.currencyCode),
      true,
    ],
  ];

  const totalsHeight = 28 + totalsRows.length * 18;
  const totalsBottom = totalsTop - totalsHeight;

  fillRect(totalsX, totalsBottom, totalsWidth, totalsHeight, 0.985);
  strokeRect(totalsX, totalsBottom, totalsWidth, totalsHeight);
  addText("Totals", totalsX + 10, totalsTop - 18, 10, true, 0.25);

  totalsRows.forEach(([label, value, emphasize], index) => {
    const y = totalsTop - 36 - index * 18;
    addText(label, totalsX + 10, y, 9, false, 0.35);
    addRightText(value, totalsX + totalsWidth - 10, y, 9, emphasize);
  });

  // Additional details
  const detailLines: string[] = [];
  if (invoice.paymentMethod) {
    detailLines.push(`Payment Method: ${invoice.paymentMethod}`);
  }
  if (invoice.notes) {
    detailLines.push(...wrapText(`Notes: ${invoice.notes}`, 96));
  }

  if (detailLines.length > 0) {
    const detailTop = totalsBottom - 14;
    const detailHeight = 24 + detailLines.length * 14;
    const detailBottom = detailTop - detailHeight;

    fillRect(
      PAGE_MARGIN,
      detailBottom,
      rightEdge - PAGE_MARGIN,
      detailHeight,
      0.985,
    );
    strokeRect(
      PAGE_MARGIN,
      detailBottom,
      rightEdge - PAGE_MARGIN,
      detailHeight,
    );
    addText(
      "Additional Details",
      PAGE_MARGIN + 10,
      detailTop - 16,
      10,
      true,
      0.25,
    );

    detailLines.forEach((lineText, index) => {
      addText(
        fit(lineText, 105),
        PAGE_MARGIN + 10,
        detailTop - 34 - index * 14,
        9,
        false,
        0.1,
      );
    });
  }

  return ops.join("\n");
}

function buildPdfDocument(invoice: BillInvoice): string {
  const contentStream = buildPdfContent(invoice);

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  );
  objects.push(
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  );
  objects.push(
    `6 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  );

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let i = 1; i <= objects.length; i += 1) {
    const offset = offsets[i]!.toString().padStart(10, "0");
    pdf += `${offset} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function buildInvoiceFileName(invoice: BillInvoice): string {
  const cleaned = invoice.invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, "-");
  return `invoice-${cleaned || invoice.billId}.pdf`;
}

export async function downloadBillInvoicePdf(
  invoice: BillInvoice,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Invoice PDF can only be generated in browser");
  }

  const pdfDocument = buildPdfDocument(invoice);
  const blob = new Blob([pdfDocument], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildInvoiceFileName(invoice);
    anchor.style.display = "none";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
