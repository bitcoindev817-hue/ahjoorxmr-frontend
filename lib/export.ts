/**
 * Client-side export helpers for contribution/payout history.
 *
 * CSV is generated as a blob download. PDF goes through the browser's own
 * print-to-PDF via a sandboxed iframe, which keeps the bundle free of a PDF
 * library while still producing a paginated, styled document.
 *
 * The PDF half lives in `lib/exportPdf.ts` and is imported on demand, so the
 * printable-document code is not part of the initial bundle of the pages that
 * only offer a CSV download.
 */

export type ExportFormat = "csv" | "pdf";

/** One row of exported history. Columns are fixed by the export spec. */
export interface ExportRow {
  date: string;
  circleName: string;
  round: number | string;
  amount: string;
  type: string;
  transactionHash: string;
}

export const COLUMNS: { key: keyof ExportRow; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "circleName", label: "Circle Name" },
  { key: "round", label: "Round #" },
  { key: "amount", label: "Amount" },
  { key: "type", label: "Type" },
  { key: "transactionHash", label: "Transaction Hash" },
];

/**
 * Escapes a CSV field. Wraps in quotes when the value contains a delimiter,
 * quote, or newline, and doubles any embedded quotes.
 *
 * The leading apostrophe on formula-triggering characters stops spreadsheet
 * apps from evaluating a pasted value as a formula.
 */
function escapeCsvField(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;

  if (/[",\n\r]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export function buildCsv(rows: ExportRow[]): string {
  const header = COLUMNS.map((c) => escapeCsvField(c.label)).join(",");
  const body = rows.map((row) =>
    COLUMNS.map((c) => escapeCsvField(row[c.key])).join(",")
  );
  // Leading BOM so Excel reads UTF-8 correctly.
  return `﻿${[header, ...body].join("\r\n")}`;
}

/** `contributions-family-savings-2026-07-28.csv` */
export function buildFilename(
  prefix: string,
  scope: string,
  format: ExportFormat,
  date = new Date()
): string {
  const slug = scope
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const stamp = date.toISOString().slice(0, 10);
  return [prefix, slug, stamp].filter(Boolean).join("-") + `.${format}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the download a tick to start before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(rows: ExportRow[], filename: string) {
  const blob = new Blob([buildCsv(rows)], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, filename);
}
