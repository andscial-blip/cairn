/**
 * Trading 212 (read-only): normalises the public API's open positions and turns them into Cairn holdings.
 * API: GET /api/v0/equity/positions (scope "portfolio"), GET /api/v0/equity/account/summary (scope "account").
 * Values in walletImpact are in the account currency (EUR for Andrea's Invest account).
 */
export interface T212Position {
  instrument?: { ticker?: string; isin?: string; name?: string; currency?: string };
  quantity?: number; averagePricePaid?: number; currentPrice?: number;
  walletImpact?: { currency?: string; currentValue?: number; totalCost?: number; unrealizedProfitLoss?: number; fxImpact?: number | null };
}
export interface Holding { isin: string; ticker: string; nome: string; classe?: string; quote: number; costo: number; prezzoEur: number; valuta?: string; target?: number; [k: string]: unknown }
export interface SyncPosition { isin: string; ticker: string; name: string; currency: string; quantity: number; value: number; cost: number; pl: number; walletCurrency: string }
export interface SyncResult { positions: SyncPosition[]; cash: number | null; total: number | null; currency: string | null; at: string }

const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;

export function normalisePositions(raw: unknown): SyncPosition[] {
  if (!Array.isArray(raw)) throw new Error("Risposta inattesa da Trading 212");
  return raw.flatMap((p: T212Position) => {
    const isin = p.instrument?.isin, q = Number(p.quantity), w = p.walletImpact;
    if (!isin || !(q > 0) || !w || !(Number(w.currentValue) >= 0)) return [];
    return [{ isin, ticker: String(p.instrument?.ticker ?? isin), name: String(p.instrument?.name ?? isin), currency: String(p.instrument?.currency ?? ""),
      quantity: q, value: Number(w.currentValue), cost: Number(w.totalCost ?? 0), pl: Number(w.unrealizedProfitLoss ?? 0), walletCurrency: String(w.currency ?? "EUR") }];
  });
}

/** Short ticker as shown in Cairn ("EUNLd_EQ" → "EUNL"). */
export const shortTicker = (t: string) => t.split("_")[0]!.replace(/[a-z]+$/, "");

export interface HoldingsDiff { next: Holding[]; changed: { isin: string; ticker: string; before: Holding | null; after: Holding | null }[] }

/** Applies the positions to the current holdings: same ISIN → units, cost and EUR price updated; new ISIN → added; ISIN no longer held → removed. */
export function applyPositions(current: Holding[], positions: SyncPosition[]): HoldingsDiff {
  if (!positions.length) throw new Error("Nessuna posizione ricevuta: non aggiorno nulla");
  const byIsin = new Map(current.map((h) => [h.isin, h]));
  const next: Holding[] = positions.map((p) => {
    const old = byIsin.get(p.isin);
    const upd = { quote: r(p.quantity, 6), costo: r(p.cost, 2), prezzoEur: r(p.value / p.quantity, 4) };
    return old ? { ...old, ...upd } : { isin: p.isin, ticker: shortTicker(p.ticker), nome: p.name, classe: "", valuta: p.currency || "EUR", target: 0, ...upd };
  });
  const changed: HoldingsDiff["changed"] = [];
  for (const h of next) { const o = byIsin.get(h.isin) ?? null; if (!o || o.quote !== h.quote || o.costo !== h.costo || o.prezzoEur !== h.prezzoEur) changed.push({ isin: h.isin, ticker: h.ticker, before: o, after: h }); }
  for (const o of current) if (!next.some((h) => h.isin === o.isin)) changed.push({ isin: o.isin, ticker: o.ticker, before: o, after: null });
  return { next, changed };
}
