/**
 * Saheli 11.6 — Genuine PDF-1.4 Binary Generator
 *
 * Produces standard-compliant, standalone %PDF-1.4 binary documents without external dependencies.
 * Visual Layout:
 * - Clean clinical summary typography (Helvetica / Helvetica-Bold)
 * - Metadata header, patient statistics, cycle history, and symptoms table
 * - Embedded lossless machine-readable payload stream for full two-way diary re-import
 */

import { exportJSON } from "./exportImport.js";
import { formatInteger, formatDate } from "./locale.js";

function escapePdfString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function generateClinicalSummaryPDF(
  record: any,
  analysis: any,
  options: { lang?: string; today?: string } = {},
): Uint8Array {
  const lang = options.lang || record?.settings?.lang || "en";
  const jsonPayload = exportJSON(record);
  let base64Payload = "";
  try {
    if (typeof Buffer !== "undefined") {
      base64Payload = Buffer.from(jsonPayload, "utf-8").toString("base64");
    } else if (typeof btoa !== "undefined") {
      base64Payload = btoa(unescape(encodeURIComponent(jsonPayload)));
    }
  } catch {}

  const periodDays = Object.values(record?.days || {}).filter((d: any) => d?.period);
  const cycleCount = analysis?.cycles?.length || 0;
  const avgLength = analysis?.stats?.meanLength ? Math.round(analysis.stats.meanLength) : "N/A";
  const exportedAt = formatDate(new Date(), lang, { dateStyle: "medium" });

  const role = record?.settings?.role || "Owner";
  const ageGroup = record?.settings?.ageGroup === "under18" ? "Adolescent (<18)" : "Adult (18+)";

  // Build stream drawing operations
  const contentOps: string[] = [];

  // Top banner / header
  contentOps.push("0.61 0.09 0.30 rg"); // Saheli primary plum (#9d174d)
  contentOps.push("36 780 523 26 re f"); // Header bar
  contentOps.push("1 1 1 rg"); // White text
  contentOps.push("BT /F2 14 Tf 46 789 Td (SAHELI - CLINICAL HEALTH SUMMARY) Tj ET");

  // Document metadata
  contentOps.push("0.12 0.16 0.22 rg"); // Dark slate (#1f2937)
  contentOps.push(
    "BT /F2 11 Tf 36 754 Td (Patient Diary Summary & Medical Consultation Record) Tj ET",
  );
  contentOps.push(
    `BT /F1 9 Tf 36 740 Td (Generated: ${escapePdfString(exportedAt)}   |   Role: ${escapePdfString(role)}   |   Classification: ${escapePdfString(ageGroup)}) Tj ET`,
  );
  contentOps.push("0.85 0.85 0.88 RG 1 w 36 732 m 559 732 l S");

  // Statistics Box
  contentOps.push("0.98 0.95 0.97 rg 36 676 523 48 re f");
  contentOps.push("0.92 0.82 0.89 RG 1 w 36 676 523 48 re S");

  contentOps.push("0.55 0.08 0.27 rg");
  contentOps.push("BT /F2 16 Tf 50 696 Td (" + escapePdfString(String(cycleCount)) + ") Tj ET");
  contentOps.push(
    "BT /F2 16 Tf 220 696 Td (" +
      escapePdfString(typeof avgLength === "number" ? `${avgLength} days` : avgLength) +
      ") Tj ET",
  );
  contentOps.push(
    "BT /F2 16 Tf 400 696 Td (" + escapePdfString(String(periodDays.length)) + ") Tj ET",
  );

  contentOps.push("0.42 0.45 0.50 rg");
  contentOps.push("BT /F1 8 Tf 50 684 Td (COMPLETED CYCLES) Tj ET");
  contentOps.push("BT /F1 8 Tf 220 684 Td (AVERAGE CYCLE LENGTH) Tj ET");
  contentOps.push("BT /F1 8 Tf 400 684 Td (TOTAL PERIOD DAYS LOGGED) Tj ET");

  // Recent Period Log Table Section
  contentOps.push("0.12 0.16 0.22 rg");
  contentOps.push("BT /F2 11 Tf 36 654 Td (Recent Menstrual Diary Entries) Tj ET");

  // Table header
  contentOps.push("0.94 0.95 0.96 rg 36 634 523 16 re f");
  contentOps.push("0.85 0.85 0.88 RG 1 w 36 634 523 16 re S");
  contentOps.push("0.30 0.35 0.40 rg");
  contentOps.push("BT /F2 8 Tf 44 638 Td (DATE) Tj ET");
  contentOps.push("BT /F2 8 Tf 130 638 Td (PERIOD) Tj ET");
  contentOps.push("BT /F2 8 Tf 200 638 Td (FLOW) Tj ET");
  contentOps.push("BT /F2 8 Tf 270 638 Td (PAIN) Tj ET");
  contentOps.push("BT /F2 8 Tf 330 638 Td (SYMPTOMS / NOTES) Tj ET");

  // Table rows (up to 14 recent entries to fit on page 1 cleanly)
  const sortedDates = Object.keys(record?.days || {})
    .sort()
    .reverse()
    .slice(0, 14);

  let currentY = 618;
  sortedDates.forEach((dateKey) => {
    const d = record.days[dateKey];
    if (currentY < 180) return;

    // Row alternating background
    contentOps.push("0.90 0.90 0.92 RG 0.5 w");
    contentOps.push(`36 ${currentY - 3} m 559 ${currentY - 3} l S`);

    contentOps.push("0.15 0.18 0.24 rg");
    contentOps.push(`BT /F2 8 Tf 44 ${currentY} Td (${escapePdfString(dateKey)}) Tj ET`);

    if (d.period) {
      contentOps.push("0.75 0.10 0.35 rg");
      contentOps.push(`BT /F2 8 Tf 130 ${currentY} Td (Period) Tj ET`);
    } else {
      contentOps.push("0.55 0.55 0.60 rg");
      contentOps.push(`BT /F1 8 Tf 130 ${currentY} Td (-) Tj ET`);
    }

    contentOps.push("0.25 0.28 0.32 rg");
    contentOps.push(`BT /F1 8 Tf 200 ${currentY} Td (${escapePdfString(d.flow || "-")}) Tj ET`);
    contentOps.push(
      `BT /F1 8 Tf 270 ${currentY} Td (${escapePdfString(d.pain > 0 ? `${d.pain}/5` : "0")}) Tj ET`,
    );

    const symStr = (d.symptoms || []).slice(0, 4).join(", ") || "-";
    contentOps.push(
      `BT /F1 8 Tf 330 ${currentY} Td (${escapePdfString(symStr.substring(0, 38))}) Tj ET`,
    );

    currentY -= 17;
  });

  if (sortedDates.length === 0) {
    contentOps.push("0.50 0.50 0.55 rg");
    contentOps.push("BT /F1 9 Tf 44 600 Td (No diary entries recorded yet.) Tj ET");
    currentY = 580;
  }

  // Clinical Notice / Disclaimer Box
  contentOps.push("0.96 0.97 0.98 rg 36 90 523 58 re f");
  contentOps.push("0.85 0.88 0.92 RG 1 w 36 90 523 58 re S");
  contentOps.push("0.20 0.25 0.30 rg");
  contentOps.push(
    "BT /F2 8 Tf 46 134 Td (CLINICAL NOTICE & TWO-WAY DIARY RESTORATION SAFEGUARD:) Tj ET",
  );
  contentOps.push(
    "BT /F1 7.5 Tf 46 122 Td (This summary is generated from patient-recorded on-device observations for medical consultations.) Tj ET",
  );
  contentOps.push(
    "BT /F1 7.5 Tf 46 112 Td (Saheli operates 100% locally on-device without remote tracking. Ovulation predictions are educational.) Tj ET",
  );
  contentOps.push(
    "BT /F1 7.5 Tf 46 102 Td (This genuine PDF file embeds a machine-readable payload stream for lossless two-way diary re-import.) Tj ET",
  );

  // Footer branding
  contentOps.push(
    "BT /F2 8 Tf 36 70 Td (Saheli - Your Cycle, Your Rhythm  |  Local-First Privacy Architecture) Tj ET",
  );

  const streamContent = contentOps.join("\n");
  const streamLength = new TextEncoder().encode(streamContent).length;

  // Metadata object containing machine-readable payload stream
  const payloadStreamContent = `SAHELI_RECORD_PAYLOAD_V1:${base64Payload}`;
  const payloadLength = new TextEncoder().encode(payloadStreamContent).length;

  // Build PDF structure
  const pdfParts: string[] = [];
  const byteOffsets: number[] = [];

  function addPart(str: string) {
    pdfParts.push(str);
  }

  // PDF Header
  addPart("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Obj 1: Catalog
  byteOffsets[1] = calculateCurrentLength(pdfParts);
  addPart("1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n  /Metadata 7 0 R\n>>\nendobj\n");

  // Obj 2: Pages
  byteOffsets[2] = calculateCurrentLength(pdfParts);
  addPart("2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n");

  // Obj 3: Page
  byteOffsets[3] = calculateCurrentLength(pdfParts);
  addPart(
    "3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n      /F2 5 0 R\n    >>\n  >>\n  /MediaBox [0 0 595.28 841.89]\n  /Contents 6 0 R\n>>\nendobj\n",
  );

  // Obj 4: Font F1 (Helvetica)
  byteOffsets[4] = calculateCurrentLength(pdfParts);
  addPart("4 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n>>\nendobj\n");

  // Obj 5: Font F2 (Helvetica-Bold)
  byteOffsets[5] = calculateCurrentLength(pdfParts);
  addPart(
    "5 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica-Bold\n>>\nendobj\n",
  );

  // Obj 6: Content Stream
  byteOffsets[6] = calculateCurrentLength(pdfParts);
  addPart(
    `6 0 obj\n<<\n  /Length ${streamLength}\n>>\nstream\n${streamContent}\nendstream\nendobj\n`,
  );

  // Obj 7: Embedded Metadata Stream (lossless two-way restore payload)
  byteOffsets[7] = calculateCurrentLength(pdfParts);
  addPart(
    `7 0 obj\n<<\n  /Type /Metadata\n  /Subtype /XML\n  /Length ${payloadLength}\n>>\nstream\n${payloadStreamContent}\nendstream\nendobj\n`,
  );

  // Xref table
  const startXref = calculateCurrentLength(pdfParts);
  let xref = `xref\n0 8\n0000000000 65535 f \n`;
  for (let i = 1; i <= 7; i++) {
    xref += `${String(byteOffsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  addPart(xref);

  // Trailer
  addPart(`trailer\n<<\n  /Size 8\n  /Root 1 0 R\n>>\nstartxref\n${startXref}\n%%EOF\n`);

  const fullPdfString = pdfParts.join("");
  return new TextEncoder().encode(fullPdfString);
}

function calculateCurrentLength(parts: string[]): number {
  let len = 0;
  const enc = new TextEncoder();
  for (const p of parts) {
    len += enc.encode(p).length;
  }
  return len;
}
