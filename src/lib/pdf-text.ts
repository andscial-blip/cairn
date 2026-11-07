/**
 * PDF → text lines in reading layout (like `pdftotext -layout`): items on the same baseline are joined, each placed at
 * a column proportional to its x position, so table columns stay aligned across lines of the same page.
 * The PDF is read in the browser: the file never leaves the device.
 */
export interface PdfTextItem { str: string; transform: number[]; width: number; hasEOL?: boolean }
export interface PdfLib {
  getDocument(src: { data: Uint8Array; isEvalSupported?: boolean; useSystemFonts?: boolean }): { promise: Promise<{ numPages: number; getPage(n: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }> }> }> };
}

export interface PdfRow { page: number; y: number; text: string }

/** One page of text items → lines. `cw` = width of one character column in PDF units (median glyph width on the page). */
export function itemsToLines(raw: unknown[]): string[] { return itemsToRows(raw, 0).map((r) => r.text); }

/** Same, keeping the baseline of each line (PDF units, larger = higher on the page) for parsers that need vertical distance. */
export function itemsToRows(raw: unknown[], page: number): PdfRow[] {
  const items = (raw as PdfTextItem[]).filter((i) => typeof i.str === "string" && i.str.length && Array.isArray(i.transform));
  if (!items.length) return [];
  const widths = items.filter((i) => i.str.trim().length >= 2 && i.width > 0).map((i) => i.width / i.str.length).sort((a, b) => a - b);
  const cw = widths.length ? widths[Math.floor(widths.length / 2)]! : 4.5;
  // Group by baseline (y), tolerant to small offsets (superscripts, bold runs).
  const rows: { y: number; items: PdfTextItem[] }[] = [];
  for (const it of [...items].sort((a, b) => b.transform[5]! - a.transform[5]! || a.transform[4]! - b.transform[4]!)) {
    const y = it.transform[5]!; const row = rows.find((r) => Math.abs(r.y - y) <= 2);
    if (row) row.items.push(it); else rows.push({ y, items: [it] });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    let line = "";
    for (const it of r.items.sort((a, b) => a.transform[4]! - b.transform[4]!)) {
      const col = Math.max(0, Math.round(it.transform[4]! / cw));
      if (line.length < col) line += " ".repeat(col - line.length);
      else if (line.length && !line.endsWith(" ") && !it.str.startsWith(" ")) line += " ";
      line += it.str;
    }
    return { page, y: r.y, text: line.replace(/\s+$/, "") };
  });
}

export async function pdfToRows(lib: PdfLib, data: ArrayBuffer | Uint8Array): Promise<PdfRow[]> {
  const doc = await lib.getDocument({ data: data instanceof Uint8Array && data.constructor === Uint8Array ? data : new Uint8Array(data), isEvalSupported: false, useSystemFonts: false }).promise;
  const out: PdfRow[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    out.push(...itemsToRows((await page.getTextContent()).items, p));
  }
  return out;
}
export const pdfToLines = async (lib: PdfLib, data: ArrayBuffer | Uint8Array) => (await pdfToRows(lib, data)).map((r) => r.text);

/** Browser loader: pdf.js and its worker are fetched only when a PDF is imported. */
export async function loadPdfLib(): Promise<PdfLib> {
  // Legacy build: runs on older Safari too. The worker is served from /vendor (copied from pdfjs-dist, same version).
  const lib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  lib.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
  return lib as unknown as PdfLib;
}
