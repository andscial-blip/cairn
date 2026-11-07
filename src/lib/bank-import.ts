/**
 * Bank statements → monthly personal expenses by category (Finanze › Spese).
 * Reads UniCredit statements (PDF) and Revolut statements (PDF or CSV) on the device; only monthly totals are saved.
 * Same rules used for the April–September 2026 figures already in Cairn: transfers between own accounts, F24 and
 * investments are excluded from expenses; investments and savings go to "investito".
 */
import type { PdfRow } from "./pdf-text";

export type Source = "UniCredit" | "Revolut";
export interface Tx { date: string; amount: number; text: string; source: Source; kind?: string }

const MON: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const itNum = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

/** UniCredit "Estratto conto" PDF. Each movement has a row with the two dates (Data, Valuta) and the amount; its description
 *  lines may sit above and below that row: each one goes to the nearest movement row on the same page. */
export function parseUniCredit(rows: PdfRow[]): Tx[] {
  const out: (Tx & { page: number; y: number; parts: { y: number; t: string }[] })[] = [];
  const descs: { page: number; y: number; t: string }[] = [];
  let uc = -1, en = -1, inMov = false, page = -1;
  for (const r of rows) {
    if (r.page !== page) { page = r.page; inMov = false; }
    const ln = r.text;
    if (/Descrizione/.test(ln) && /Uscite/.test(ln) && /Entrate/.test(ln)) { uc = ln.indexOf("Uscite") + 6; en = ln.indexOf("Entrate") + 7; inMov = true; continue; }
    if (/Per il blocco della sua carta|UniCredit S\.?p\.?A\.? - Sede|^\s*Pagina \d/.test(ln)) { inMov = false; continue; }
    if (!inMov || uc < 0 || !ln.trim() || /SALDO (FINALE|INIZIALE)/.test(ln)) continue;
    const d = ln.match(/^\s*(\d\d)\.(\d\d)\.(\d\d)\s+(\d\d\.\d\d\.\d\d)/);
    const amts = [...ln.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})(?=\s|$)/g)];
    const m = amts[amts.length - 1];
    if (d && m && m.index! + m[0].length > uc - 40) {
      const end = m.index! + m[0].length, sign = Math.abs(end - uc) <= Math.abs(end - en) ? -1 : 1;
      const t = ln.slice(d[0].length, m.index).trim();
      out.push({ date: `20${d[3]}-${d[2]}-${d[1]}`, amount: sign * itNum(m[1]!), text: "", source: "UniCredit", page: r.page, y: r.y, parts: t ? [{ y: r.y, t }] : [] });
    } else descs.push({ page: r.page, y: r.y, t: ln.trim() });
  }
  for (const s of descs) {
    let best: (typeof out)[number] | null = null;
    for (const o of out) if (o.page === s.page && (!best || Math.abs(o.y - s.y) < Math.abs(best.y - s.y))) best = o;
    if (best && Math.abs(best.y - s.y) < 30) best.parts.push({ y: s.y, t: s.t });
  }
  return out.map((o) => ({ date: o.date, amount: o.amount, source: o.source, text: o.parts.sort((a, b) => b.y - a.y).map((p) => p.t).join(" ").replace(/\s+/g, " ").trim() }));
}

/** Revolut statement PDF: current account section only (savings and investment sections are other accounts). */
export function parseRevolutPdf(lines: string[]): Tx[] {
  const out: Tx[] = []; let sec = "", cur: Tx | null = null;
  for (const ln of lines) {
    if (/Current Accounts Transaction Statements/.test(ln)) sec = "cc";
    else if (/(Savings|Investment Services) (Accounts )?Transaction Statements/.test(ln)) sec = "other";
    if (sec !== "cc") continue;
    const m = ln.match(/^\s*(\w{3}) (\d{1,2}), (\d{4})\s+(.+?)\s+(Merchant|Others|Top up|Transfers?|Cash|ATM|Exchange|Refund|Fee|[A-Z][a-z]+(?: [a-z]+)?)\s+(-?€[\d,]+\.\d\d)\s+(-?€[\d,]+\.\d\d)/);
    if (m && MON[m[1]!]) {
      cur = { date: `${m[3]}-${String(MON[m[1]!]).padStart(2, "0")}-${m[2]!.padStart(2, "0")}`, text: m[4]!.trim(), kind: m[5], amount: Number(m[6]!.replace(/[€,]/g, "")), source: "Revolut" };
      out.push(cur);
    } else if (cur && /^\s{15,}\S/.test(ln) && ln.trim().length < 40 && !/Custom|Generated|Money|\/out|Jan 1|Report lost|Revolut Bank|^\s*Page/.test(ln)) cur.text += " " + ln.trim();
  }
  return out;
}

/** Splits a CSV line, honouring quotes. Delimiter: comma or semicolon (detected on the header). */
function splitCsv(line: string, sep: string): string[] {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === sep && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur); return out.map((x) => x.trim());
}

/** Revolut CSV export (Type, Product, Started Date, Completed Date, Description, Amount, Fee, Currency, State, Balance). */
export function parseRevolutCsv(text: string): Tx[] {
  const L = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!L.length) return [];
  const sep = (L[0]!.match(/;/g)?.length ?? 0) > (L[0]!.match(/,/g)?.length ?? 0) ? ";" : ",";
  const H = splitCsv(L[0]!, sep).map((h) => h.toLowerCase());
  const col = (n: string) => H.indexOf(n);
  const [iT, iP, iD, iC, iDs, iA, iF, iS] = [col("type"), col("product"), col("started date"), col("completed date"), col("description"), col("amount"), col("fee"), col("state")];
  if (iDs < 0 || iA < 0 || (iD < 0 && iC < 0)) throw new Error("Questo CSV non sembra un estratto Revolut");
  return L.slice(1).map((l) => splitCsv(l, sep)).filter((r) => (iP < 0 || /current/i.test(r[iP] ?? "")) && (iS < 0 || /completed/i.test(r[iS] ?? "")))
    .map((r) => {
      const n = (s?: string) => Number(String(s ?? "0").replace(/\s/g, "").replace(/,(?=\d{2}$)/, ".")) || 0;
      return { date: (r[iC >= 0 && r[iC] ? iC : iD] ?? "").slice(0, 10), text: r[iDs] ?? "", kind: iT >= 0 ? r[iT] : undefined, amount: Math.round((n(r[iA]) - Math.abs(n(r[iF]))) * 100) / 100, source: "Revolut" as const };
    }).filter((t) => /^\d{4}-\d\d-\d\d$/.test(t.date) && t.amount);
}

/** Which statement is it? */
export function detect(name: string, firstText: string): "unicredit-pdf" | "revolut-pdf" | "revolut-csv" | null {
  if (/\.csv$/i.test(name)) return /started date|completed date/i.test(firstText) ? "revolut-csv" : null;
  if (/Revolut Bank/i.test(firstText) || /Current Accounts Transaction Statements/.test(firstText)) return "revolut-pdf";
  if (/UNCRITM|UniCredit/i.test(firstText) && /Estratto conto/i.test(firstText)) return "unicredit-pdf";
  return null;
}

/* ---------------- categories ---------------- */

/** Not expenses: moved between own accounts, paid to the State (F24 section), invested. */
export const EXCLUDED = new Set(["Interno", "Investimenti e risparmio", "Tasse e contributi", "Entrate da lavoro", "Altre entrate"]);
export const INVEST = "Investimenti e risparmio";
export const CATEGORIES = ["Ristoranti, bar e spesa", "Abbonamenti e digitale", "Acquisti e sport", "Auto e trasporti locali", "Casa e lavori", "Commissioni bancarie",
  "Contanti", "Famiglia e regali", "Rimesse", "Salute", "Viaggi", "Carta di credito (senza dettaglio)", "Altro", INVEST, "Interno", "Tasse e contributi"];

const RULES: [string, RegExp][] = [
  // Bank fees charged on a direct debit carry the debit's description too: they stay fees.
  ["Commissioni bancarie", /^COMMISSIONI - PROVVIGIONI|Comm 0[.,]\d\d\s*$/],
  // Satispay top-ups by direct debit: money moved to the Satispay wallet, not spent yet.
  ["Interno", /Revolut\*\*\d{4}|Top-up by \*|^Top Up$|Satispay Europe S\.A\. mandato.*Ricarica|SDD da \S+ .*Satispay Europe|PAYPAL EUROPE S|^To investment account/],
  [INVEST, /Trading ?212|Conto deposito|To investment/],
  ["Tasse e contributi", /DELEGHE F2[34]|PAGAMENTI P\.A\.|IMPOSTA BOLLO CONTO/],
  ["Rimesse", /Taptap/],
  ["Casa e lavori", /LEROY|IKEA|Ikea|GAITA|Gaita|E-DISTRIBUZIONE|Miele|Elettroforno|Frigorifero|Leroy/],
  ["Famiglia e regali", /A: GIUSEPPE SCIALABBA|Regalo|Parrocchia|ALBERTO SCIALABBA/],
  ["Contanti", /^PRELIEVO|^CARTA \*\d{4} DI MGA|Cash withdrawal|ADDEBITO CARTA .*BLOCCATA|EDIT ATM/],
  ["Commissioni bancarie", /^COMM|COMM\. PRELIEVI|COMMISSIONE PER OPERAZIONE|MY GENIUS|COSTO FISSO|Comm 0\.5|plan fee|Premium plan|Plan termination|Revpoints/],
  ["Viaggi", /gotogate|wizz|WIZZ|RYANAIR|BOOKING|BKG\*|ITA airways|EASYJET|Volotea|TRENITALIA|Trenitalia|TRENORD|HEYMONDO|COOLTRA|UZBEK|UZS|TOSHKENT|SAMARQAND|Khiva|Muynak|Arhi Oilaviy|Sher Shox|Mchj|Palermo Airport|Autogrill|DUFRITAL|Carrefour Arrivi/],
  ["Salute", /UNOBRAVO|Farmacia|Dr Giovanni|Incos Cosmeceutica/],
  ["Abbonamenti e digitale", /Amazon Prime|NOW |NOW$|Microsoft|APPLE\.COM|^Apple|CLAUDE\.AI|OPENAI|EXPRESSVPN|LIBERO|TIM$|Il Post|Express Software|Servizio Spid|UNDERMEDIA/],
  ["Auto e trasporti locali", /ECO ENERCY|Eco Energy|Mecatronica|EasyPark|ATM - Azienda|GTT|Cicloservice/],
  ["Acquisti e sport", /AMZN|AMAZON|eBay|DECATHLON|Decathlon|sportler|Nencini|UNIQLO|FELTRINELLI|BELLUCCI|Tutto Per Lo Sport|ENDU|Paccofacile|ENGAGIGO|Ls Milano|Bonsaj|Linearetta|Runaway|PicoBrew/],
  ["Carta di credito (senza dettaglio)", /UTILIZZO CARTE DI CREDITO/],
  ["Ristoranti, bar e spesa", /MOTTA|SumUp|RISTORANTE|LA BRACE|Lidl|Carrefour/],
];

/** A rule learned from a correction: the merchant key ("LEROY MERLIN PALERMO" → "LEROY MERLIN") and the category chosen. */
export interface LearnedRule { k: string; c: string }

/** Merchant key used for learned rules: the description without card numbers, dates and amounts, first three words. */
export function merchantKey(text: string): string {
  return text.toUpperCase()
    .replace(/PAGAMENTO\s+(MASTERCARD|MAESTRO|VISA)\s+\S+(\s+DEL\s+\d\d\/\d\d\/\d{4})?/g, " ")
    .replace(/CARTA \*\d{4} DI (EUR|USD|MGA) [\d.,]+/g, " ").replace(/\d{2}\/\d{2}\/\d{2,4}|\d+[.,]\d+|\*+\d+|\b\d{4,}\b/g, " ")
    .replace(/[^A-ZÀ-Ü0-9&' ]+/g, " ").split(/\s+/).filter((w) => w.length > 1).slice(0, 3).join(" ");
}

export function categorize(t: Tx, learned: LearnedRule[] = []): string {
  const s = t.text;
  if (t.amount > 0) {
    if (/YOUSUD|ALTROMERCATO/i.test(s)) return "Entrate da lavoro";
    if (/Top-up by|^Top Up|PAYPAL/.test(s)) return "Interno";
    return "Altre entrate";
  }
  const k = merchantKey(s); const l = k && learned.find((r) => r.k === k); if (l) return l.c;
  if (t.source === "Revolut" && t.kind === "ATM") return "Contanti";
  for (const [c, re] of RULES) if (re.test(s)) return c;
  if (t.source === "Revolut" && (t.kind === "Merchant" || t.kind === "CARD_PAYMENT")) return "Ristoranti, bar e spesa";
  if (/Transfer to|To [A-Z]/.test(s)) return "Famiglia e regali";
  return "Altro";
}

export interface MonthSpend { mese: string; cat: Record<string, number>; investito: number; n: number }
/** Monthly totals: expenses by category (outflows only), investito = net amount sent to investments and savings. */
export function aggregate(txs: (Tx & { c: string })[]): MonthSpend[] {
  const M = new Map<string, MonthSpend>();
  for (const t of txs) {
    const k = t.date.slice(0, 7); const m = M.get(k) ?? { mese: k, cat: {}, investito: 0, n: 0 }; M.set(k, m);
    if (t.c === INVEST) m.investito -= t.amount;
    else if (t.amount < 0 && !EXCLUDED.has(t.c)) { m.cat[t.c] = (m.cat[t.c] ?? 0) - t.amount; m.n++; }
  }
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return [...M.values()].map((m) => ({ ...m, investito: r2(m.investito), cat: Object.fromEntries(Object.entries(m.cat).map(([k, v]) => [k, r2(v)])) })).sort((a, b) => a.mese.localeCompare(b.mese));
}

/** Months fully covered by the imported files of one source (first and last month of a statement are often partial). */
export function coveredMonths(txs: Tx[]): string[] {
  const ms = [...new Set(txs.map((t) => t.date.slice(0, 7)))].sort();
  return ms;
}

/* ---------------- merge into the saved months ---------------- */

export interface SavedMonth { mese: string; cat: Record<string, number>; investito?: number; fonti?: string; perFonte?: Record<string, { cat: Record<string, number>; investito: number; al?: string }> }
export type PlanState = "new" | "update" | "same" | "partial" | "needs-other";
export interface MonthPlan { mese: string; state: PlanState; next: SavedMonth | null; before: SavedMonth | null; missing?: string[]; total: number; prevTotal: number | null }

const sumCat = (c: Record<string, number>) => Object.values(c).reduce((a, b) => a + (+b || 0), 0);
const r2 = (x: number) => Math.round(x * 100) / 100;

/**
 * For every month found in the imported statements: what would be saved.
 * - A source counts for a month only if its statement covers the whole month (`coveredTo` ≥ last day): partial months are skipped.
 * - Months saved before the import, without per-source detail, are replaced only when every source they listed is imported
 *   together (otherwise one bank's figures would overwrite both): state "needs-other".
 * - The month's totals are the sum of its sources.
 */
export interface Imported { months: MonthSpend[]; periods: { from: string; to: string }[] }
export function planMonths(imported: Partial<Record<Source, Imported>>, saved: SavedMonth[], today: string): MonthPlan[] {
  const months = new Set<string>(); for (const v of Object.values(imported)) v?.months.forEach((m) => months.add(m.mese));
  const lastDay = (m: string) => { const [y, mo] = m.split("-").map(Number) as [number, number]; return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); };
  return [...months].sort().map((mese) => {
    const before = saved.find((s) => s.mese === mese) ?? null;
    // Statements of the same bank may be consecutive (two quarters): the month is covered if their union covers it.
    const covers = (ps: { from: string; to: string }[]) => { let d = `${mese}-01`; const end = lastDay(mese);
      for (const p of [...ps].sort((a, b) => a.from.localeCompare(b.from))) { if (p.from <= d && p.to >= d) d = p.to >= end ? "9999" : new Date(Date.parse(p.to + "T00:00:00Z") + 864e5).toISOString().slice(0, 10); }
      return d === "9999"; };
    const full = (Object.entries(imported) as [Source, Imported][]).filter(([, v]) => covers(v.periods) && lastDay(mese) < today);
    const prevTotal = before ? r2(sumCat(before.cat)) : null;
    if (!full.length) return { mese, state: "partial" as const, next: null, before, total: 0, prevTotal };
    const per = { ...(before?.perFonte ?? {}) };
    if (before && !Object.keys(before.perFonte ?? {}).length) {
      const listed = (before.fonti ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      const missing = listed.filter((s) => !full.some(([src]) => src === s));
      if (missing.length) return { mese, state: "needs-other" as const, next: null, before, missing, total: 0, prevTotal };
    }
    for (const [src, v] of full) { const m = v.months.find((x) => x.mese === mese) ?? { cat: {}, investito: 0 }; per[src] = { cat: m.cat, investito: m.investito, al: v.periods.map((p) => p.to).sort().pop() }; }
    const cat: Record<string, number> = {}; let investito = 0;
    for (const p of Object.values(per)) { for (const [k, v] of Object.entries(p.cat)) cat[k] = r2((cat[k] ?? 0) + v); investito += p.investito; }
    const next: SavedMonth = { mese, cat, investito: r2(investito), fonti: Object.keys(per).sort().reverse().join(", "), perFonte: per };
    // Sources usually present in the saved months but not in this one (e.g. October with Revolut only): saved, flagged.
    const usual = [...new Set(saved.flatMap((x) => (x.fonti ?? "").split(",").map((y) => y.trim()).filter(Boolean)))];
    const lacking = usual.filter((u) => !per[u]);
    const same = !!before && JSON.stringify(Object.entries(before.cat).filter(([, v]) => v).sort()) === JSON.stringify(Object.entries(cat).filter(([, v]) => v).sort()) && Math.abs((before.investito ?? 0) - next.investito!) < 0.01;
    return { mese, state: !before ? "new" as const : same ? "same" as const : "update" as const, next, before, total: r2(sumCat(cat)), prevTotal, ...(lacking.length ? { missing: lacking } : {}) };
  });
}

/** Statement period from its own header: UniCredit "Estratto conto al 30.09.2026" (quarter), Revolut "Jan 1, 2026 - Dec 31, 2026 … Generated on the Nov 4, 2026". */
export function statementPeriod(kind: "unicredit-pdf" | "revolut-pdf" | "revolut-csv", text: string, txs: Tx[]): { from: string; to: string } {
  const ds = txs.map((t) => t.date).sort(); const first = ds[0] ?? "9999-12-31", last = ds[ds.length - 1] ?? "0000-01-01";
  const minus1 = (d: string) => new Date(Date.parse(d + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
  if (kind === "unicredit-pdf") {
    const m = text.match(/Estratto conto al (\d\d)\.(\d\d)\.(\d{4})/); const s = text.match(/(\d\d)\.(\d\d)\.(\d\d)\s+SALDO INIZIALE/);
    const to = m ? `${m[3]}-${m[2]}-${m[1]}` : last;
    return { from: s ? new Date(Date.parse(`20${s[3]}-${s[2]}-${s[1]}T00:00:00Z`) + 864e5).toISOString().slice(0, 10) : first, to };
  }
  if (kind === "revolut-pdf") {
    const r = text.match(/(\w{3}) (\d{1,2}), (\d{4}) - (\w{3}) (\d{1,2}), (\d{4})/), g = text.match(/Generated on the (\w{3}) (\d{1,2}), (\d{4})/);
    const iso = (mo: string, d: string, y: string) => `${y}-${String(MON[mo] ?? 1).padStart(2, "0")}-${d.padStart(2, "0")}`;
    const from = r ? iso(r[1]!, r[2]!, r[3]!) : first; let to = r ? iso(r[4]!, r[5]!, r[6]!) : last;
    if (g) { const gen = minus1(iso(g[1]!, g[2]!, g[3]!)); if (gen < to) to = gen; }
    return { from, to };
  }
  return { from: first, to: last };
}
