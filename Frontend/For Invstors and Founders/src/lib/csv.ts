// Minimal RFC-4180 CSV reader for admin bulk import. A dependency isn't worth it for one screen,
// but the naive `split(",")` version is: it breaks on the first quoted "San Francisco, CA".

export type CsvRow = Record<string, string>;

// Splits on commas, respecting double quotes and "" escapes. Handles \r\n, \n and quoted newlines.
export function parseCsv(text: string): CsvRow[] {
  const src = text.replace(/^﻿/, ""); // strip BOM — Excel writes one
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (nonEmpty.length < 2) return [];

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return nonEmpty.slice(1).map((cells) => {
    const o: CsvRow = {};
    headers.forEach((h, i) => { o[h] = (cells[i] ?? "").trim(); });
    return o;
  });
}

// "$1.2B" / "850M" / "250k" / "2,000,000" → number. Spreadsheets carry all four.
export function parseMoney(v: string): number | null {
  const s = (v || "").trim().replace(/[$,\s]/g, "");
  if (!s) return null;
  const m = s.match(/^(-?\d*\.?\d+)([kmb])?$/i);
  if (!m) return null;
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] || "").toLowerCase() as "k" | "m" | "b"] ?? 1;
  return Number(m[1]) * mult;
}

// Multi-value cells arrive as "AI; Fintech", "AI|Fintech" or a quoted "AI, Fintech".
export function parseList(v: string): string[] {
  return (v || "").split(/[;|,]/).map((s) => s.trim()).filter(Boolean);
}

export function parseBool(v: string): boolean {
  return /^(y|yes|true|1)$/i.test((v || "").trim());
}

export function toCsv(headers: string[], rows: string[][]): string {
  const esc = (c: string) => (/[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c);
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}
