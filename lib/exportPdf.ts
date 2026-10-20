/**
 * PDF export for contribution/payout history.
 *
 * Goes through the browser's own print-to-PDF via a sandboxed iframe, which
 * keeps the bundle free of a PDF library while still producing a paginated,
 * styled document.
 *
 * This module is imported on demand (`import("@/lib/exportPdf")`) from the
 * pages that offer a PDF download, so none of it is in the initial bundle.
 */

import { COLUMNS, type ExportRow } from "./export";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPrintableHtml(
  rows: ExportRow[],
  title: string,
  subtitle: string
): string {
  const head = COLUMNS.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
  const body =
    rows.length === 0
      ? `<tr><td colspan="${COLUMNS.length}" class="empty">No records to export.</td></tr>`
      : rows
          .map(
            (row) =>
              `<tr>${COLUMNS.map(
                (c) =>
                  `<td class="${c.key === "transactionHash" ? "hash" : ""}">${escapeHtml(
                    row[c.key]
                  )}</td>`
              ).join("")}</tr>`
          )
          .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  p.sub { font-size: 11px; color: #555; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  thead { display: table-header-group; }
  th { text-align: left; text-transform: uppercase; letter-spacing: .06em; font-size: 9px;
       color: #444; border-bottom: 1.5px solid #333; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: .5px solid #ddd; }
  tr { page-break-inside: avoid; }
  td.hash { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8.5px; word-break: break-all; }
  td.empty { text-align: center; color: #777; padding: 24px; }
</style></head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="sub">${escapeHtml(subtitle)}</p>
  <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

/**
 * Opens the browser print dialog (→ "Save as PDF") for the given rows.
 * Uses a hidden same-origin iframe so the current page is never replaced and
 * no popup blocker is involved.
 */
export function exportPdf(
  rows: ExportRow[],
  title: string,
  subtitle: string
): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    win.addEventListener("afterprint", cleanup, { once: true });
    win.focus();
    win.print();
    // Safety net for browsers that never fire afterprint.
    window.setTimeout(cleanup, 60000);
  };

  iframe.srcdoc = buildPrintableHtml(rows, title, subtitle);
}
