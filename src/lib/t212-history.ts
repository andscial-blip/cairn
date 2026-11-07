/**
 * Trading 212 history (read-only, permission "History"): deposits and withdrawals, filled orders, dividends and interest.
 * Turns it into what Cairn keeps on the investment account and into per-year tax figures.
 * API: GET /api/v0/equity/history/{transactions,orders,dividends} — cursor pagination via nextPagePath, max 50 per page.
 * Pure functions: the server route normalises, the app summarises.
 */

/** Compact items sent from the server to the app. Dates are ISO date-times. Amounts in the account currency (EUR). */
export interface HTx { d: string; type: "DEPOSIT" | "WITHDRAW" | "FEE" | "TRANSFER" | string; amount: number }
export interface HFill { d: string; side: "BUY" | "SELL" | string; isin: string; ticker: string; qty: number; value: number; pl: number; fx: number; fees: number; kind: string; from: string }
export interface HDiv { d: string; isin: string; ticker: string; amount: number; type: string }
export interface History { transactions: HTx[]; orders: HFill[]; dividends: HDiv[] }

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const s = (v: unknown) => (typeof v === "string" ? v : "");
const r2 = (x: number) => Math.round(x * 100) / 100;
const items = (raw: unknown): Record<string, unknown>[] => (Array.isArray((raw as { items?: unknown })?.items) ? ((raw as { items: Record<string, unknown>[] }).items) : []);

export function normaliseTransactions(pages: unknown[]): HTx[] {
  return pages.flatMap(items).map((t) => ({ d: s(t.dateTime), type: s(t.type), amount: n(t.amount) })).filter((t) => t.d && t.type);
}

export function normaliseOrders(pages: unknown[]): HFill[] {
  return pages.flatMap(items).flatMap((it) => {
    const o = (it.order ?? {}) as Record<string, unknown>, f = (it.fill ?? null) as Record<string, unknown> | null;
    if (!f || !(n(f.quantity) > 0)) return [];
    const ins = (o.instrument ?? {}) as Record<string, unknown>, w = (f.walletImpact ?? {}) as Record<string, unknown>;
    const taxes = Array.isArray(w.taxes) ? (w.taxes as Record<string, unknown>[]) : [];
    const fx = taxes.filter((t) => t.name === "CURRENCY_CONVERSION_FEE").reduce((a, t) => a + Math.abs(n(t.quantity)), 0);
    const fees = taxes.filter((t) => t.name !== "CURRENCY_CONVERSION_FEE").reduce((a, t) => a + Math.abs(n(t.quantity)), 0);
    const isin = s(ins.isin); if (!isin) return [];
    return [{ d: s(f.filledAt) || s(o.createdAt), side: s(o.side), isin, ticker: s(ins.ticker) || s(o.ticker), qty: n(f.quantity),
      value: Math.abs(n(w.netValue)), pl: n(w.realisedProfitLoss), fx, fees, kind: s(f.type) || "TRADE", from: s(o.initiatedFrom) }];
  });
}

export function normaliseDividends(pages: unknown[]): HDiv[] {
  return pages.flatMap(items).map((x) => {
    const ins = (x.instrument ?? {}) as Record<string, unknown>;
    return { d: s(x.paidOn), isin: s(ins.isin), ticker: s(ins.ticker) || s(x.ticker), amount: typeof x.amountInEuro === "number" ? x.amountInEuro : n(x.amount), type: s(x.type) };
  }).filter((x) => x.d && x.amount);
}

export interface AccountFromHistory {
  mensile: Record<string, number>; depositi: number; prelievi: number; commDeposito: number; commCambio: number;
  realizzate: { data: string; isin: string; importo: number }[];
  proventi: { data: string; isin: string; importo: number; tipo: string }[];
}

/** What the history says about the account: monthly net deposits, totals, real fees, realised P/L per sale, interest and dividends. */
export function accountFromHistory(h: History): AccountFromHistory {
  const mensile: Record<string, number> = {}; let depositi = 0, prelievi = 0, commDeposito = 0;
  for (const t of h.transactions) {
    const m = t.d.slice(0, 7), a = Math.abs(t.amount);
    if (t.type === "DEPOSIT") { depositi += a; mensile[m] = (mensile[m] ?? 0) + a; }
    else if (t.type === "WITHDRAW") { prelievi += a; mensile[m] = (mensile[m] ?? 0) - a; }
    else if (t.type === "FEE") commDeposito += a;
  }
  for (const k of Object.keys(mensile)) mensile[k] = r2(mensile[k]!);
  const trades = h.orders.filter((o) => o.kind === "TRADE");
  const commCambio = trades.reduce((a, o) => a + o.fx, 0);
  const realizzate = trades.filter((o) => o.side === "SELL" && o.pl).map((o) => ({ data: o.d.slice(0, 10), isin: o.isin, importo: r2(o.pl) })).sort((a, b) => a.data.localeCompare(b.data));
  const proventi = h.dividends.map((x) => ({ data: x.d.slice(0, 10), isin: x.isin, importo: r2(x.amount), tipo: x.type })).sort((a, b) => a.data.localeCompare(b.data));
  return { mensile, depositi: r2(depositi), prelievi: r2(prelievi), commDeposito: r2(commDeposito), commCambio: r2(commCambio), realizzate, proventi };
}

/**
 * Is the history complete enough to replace what Cairn has (imported earlier from the CSV export)?
 * It must cover at least the deposits already known: otherwise a short or paginated-away history would erase data.
 */
export function historyCovers(h: AccountFromHistory, known: { depositi?: number }): boolean {
  return h.depositi > 0 && h.depositi + 1 >= (known.depositi ?? 0) * 0.98;
}

export type PacMonth = { m: string; amount: number; state: "ok" | "short" | "missing" | "due" | "extra" };
/** Month-by-month check of the plan: did (about) the PAC amount arrive? `due` = this month, before day + grace. */
export function pacCheck(mensile: Record<string, number>, pac: { importo?: number; giorno?: number; inizio?: string }, today: string, grace = 5): PacMonth[] {
  const P = +(pac.importo ?? 0), start = (pac.inizio ?? "").slice(0, 7); if (!(P > 0) || !start) return [];
  const out: PacMonth[] = []; let [y, m] = start.split("-").map(Number) as [number, number];
  const cur = today.slice(0, 7), dueDay = Math.min(28, Math.max(1, +(pac.giorno ?? 1))) + grace;
  for (;;) {
    const k = `${y}-${String(m).padStart(2, "0")}`; if (k > cur) break;
    const a = r2(mensile[k] ?? 0);
    // 85%: tolerates the months before a small increase of the plan (e.g. 350 → 400) without calling them partial.
    const state: PacMonth["state"] = a >= P * 0.85 ? (a > P * 1.5 ? "extra" : "ok") : k === cur && +today.slice(8, 10) <= dueDay ? "due" : a > 0 ? "short" : "missing";
    out.push({ m: k, amount: a, state });
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

export interface YearTax { year: number; gains: number; govGains: number; losses: number; income: number; tax: number; fx: number; depFees: number; valueEnd: number | null; valueSource: "snapshot" | "cost" | "current" | null; ivafe: number | null; rw: { isin: string; ticker: string; units: number; cost: number; value: number | null; days: number }[] }

/**
 * Per-year tax figures for the Redditi PF (Trading 212 is not a withholding agent):
 * - gains on ETF (OICR armonizzati) = redditi di capitale, quadro RM (26%, 12,5% on the government-bond share);
 * - losses = redditi diversi, quadro RT (they offset only other redditi diversi, not ETF gains);
 * - interest and dividends = redditi di capitale, quadro RM, 26%;
 * - quadro RW + IVAFE 2‰ on the value at 31/12, pro rata of the days held.
 * The value at 31/12 comes from a year-end snapshot (per-ETF values) when there is one; otherwise, for the current year,
 * from today's values; otherwise from the cost basis (an estimate, labelled as such).
 */
export function taxByYear(h: History, opts: { isGov: (isin: string) => boolean; yearEnd: (year: number) => Record<string, number> | null; current: Record<string, number>; today: string; tickers: Record<string, string> }): YearTax[] {
  const trades = [...h.orders].sort((a, b) => a.d.localeCompare(b.d));
  const firstYear = Math.min(...[...trades.map((o) => +o.d.slice(0, 4)), ...h.dividends.map((d) => +d.d.slice(0, 4)), +opts.today.slice(0, 4)]);
  const lastYear = +opts.today.slice(0, 4);
  const pos = new Map<string, { units: number; cost: number; since: string | null }>();
  let i = 0; const out: YearTax[] = [];
  for (let y = firstYear; y <= lastYear; y++) {
    const yStart = `${y}-01-01`, yEnd = `${y}-12-31`;
    const held = new Map<string, string>(); // isin → first day held this year
    for (const [isin, p] of pos) if (p.units > 1e-9) held.set(isin, yStart);
    let gains = 0, govGains = 0, losses = 0, fx = 0;
    for (; i < trades.length && trades[i]!.d.slice(0, 10) <= yEnd; i++) {
      const o = trades[i]!; const p = pos.get(o.isin) ?? { units: 0, cost: 0, since: null };
      if (o.side === "BUY" || (o.kind !== "TRADE" && o.side !== "SELL")) { p.units += o.qty; p.cost += o.kind === "TRADE" ? o.value : 0; if (!held.has(o.isin)) held.set(o.isin, o.d.slice(0, 10)); }
      else if (o.side === "SELL") { const avg = p.units > 0 ? p.cost / p.units : 0; p.units = Math.max(0, p.units - o.qty); p.cost = Math.max(0, p.cost - avg * o.qty); if (o.pl > 0) { gains += o.pl; if (opts.isGov(o.isin)) govGains += o.pl; } else losses += -o.pl; }
      fx += o.fx; pos.set(o.isin, p);
    }
    const income = h.dividends.filter((d) => d.d.startsWith(String(y))).reduce((a, d) => a + d.amount, 0);
    const depFees = h.transactions.filter((t) => t.type === "FEE" && t.d.startsWith(String(y))).reduce((a, t) => a + Math.abs(t.amount), 0);
    const snap = opts.yearEnd(y), isCur = y === lastYear;
    const daysInYear = (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1)) / 864e5;
    const rw = [...pos].filter(([, p]) => p.units > 1e-9).map(([isin, p]) => {
      const value = snap?.[isin] ?? (isCur ? opts.current[isin] ?? null : null);
      const from = held.get(isin) ?? yStart; const days = Math.round((Date.UTC(y, 11, 31) - Date.parse(from + "T00:00:00Z")) / 864e5) + 1;
      return { isin, ticker: opts.tickers[isin] ?? isin, units: Math.round(p.units * 1e6) / 1e6, cost: r2(p.cost), value: value == null ? null : r2(value), days: Math.min(days, daysInYear) };
    });
    const src: YearTax["valueSource"] = !rw.length ? null : snap ? "snapshot" : isCur && rw.every((x) => x.value != null) ? "current" : "cost";
    const valueEnd = rw.length ? r2(rw.reduce((a, x) => a + (src === "cost" ? x.cost : x.value ?? x.cost), 0)) : null;
    const ivafe = rw.length ? r2(rw.reduce((a, x) => a + (src === "cost" ? x.cost : x.value ?? x.cost) * 0.002 * x.days / daysInYear, 0)) : null;
    const tax = r2((gains - govGains) * 0.26 + govGains * 0.125 + income * 0.26);
    if (gains || losses || income || rw.length || fx || depFees)
      out.push({ year: y, gains: r2(gains), govGains: r2(govGains), losses: r2(losses), income: r2(income), tax, fx: r2(fx), depFees: r2(depFees), valueEnd, valueSource: src, ivafe, rw });
  }
  return out;
}

/** Keeps the per-ETF values in the snapshots only around the turn of the year (20/12–10/01), for the RW values at 31/12. */
export const isYearEndWindow = (d: string) => { const md = d.slice(5); return md >= "12-20" || md <= "01-10"; };

/** Per-ETF values at 31/12 of `year` from the closest year-end snapshot (on or before 31/12 first, else early January). */
export function yearEndValues(storico: { d: string; p?: Record<string, number> }[] | undefined, year: number): Record<string, number> | null {
  const w = (storico ?? []).filter((x) => x.p && ((x.d >= `${year}-12-20` && x.d <= `${year}-12-31`) || (x.d >= `${year + 1}-01-01` && x.d <= `${year + 1}-01-10`)));
  if (!w.length) return null;
  const before = w.filter((x) => x.d <= `${year}-12-31`);
  return (before.length ? before[before.length - 1]! : w[0]!).p!;
}
