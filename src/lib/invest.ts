/**
 * Investment account maths that the Trading 212 sync makes possible:
 * daily snapshots, money-weighted return, next-contribution split, idle-cash check.
 * Pure functions (no DOM, no clock): the caller passes "today".
 */
export interface Snapshot { d: string; v: number; c: number; cash?: number | null }

const DAY = 86_400_000;
const t = (d: string) => Date.parse(d + "T00:00:00Z");
const days = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Adds today's snapshot (replacing one already taken today), keeps dates sorted and at most `max` entries. */
export function addSnapshot(list: Snapshot[] | undefined, s: Snapshot, max = 1500): Snapshot[] {
  const clean = { d: s.d, v: r2(s.v), c: r2(s.c), cash: s.cash == null ? null : r2(s.cash) };
  const out = (list ?? []).filter((x) => x && x.d !== s.d).concat(clean).sort((a, b) => a.d.localeCompare(b.d));
  return out.length > max ? out.slice(out.length - max) : out;
}

/** Snapshot from the holdings after a sync: value and cost basis of the ETFs, plus uninvested cash. */
export function snapshotOf(holdings: { quote: number; prezzoEur: number; costo: number }[], cash: number | null | undefined, d: string): Snapshot {
  return { d, v: holdings.reduce((s, h) => s + (+h.quote || 0) * (+h.prezzoEur || 0), 0), c: holdings.reduce((s, h) => s + (+h.costo || 0), 0), cash: cash ?? null };
}

/**
 * Modified Dietz return between the first and the last snapshot. Cash flows are the changes in cost basis
 * (a purchase adds its cost; a sale removes the cost of the units sold), so price moves are what is left.
 * Returns null with fewer than two snapshots or under `minDays` of history.
 */
export function dietz(list: Snapshot[] | undefined, minDays = 7): { r: number; annual: number | null; days: number; from: string; to: string } | null {
  const s = (list ?? []).filter((x) => x && Number.isFinite(x.v) && Number.isFinite(x.c));
  if (s.length < 2) return null;
  const a = s[0]!, z = s[s.length - 1]!, T = days(a.d, z.d);
  if (T < minDays || !(a.v > 0)) return null;
  let cf = 0, wcf = 0;
  for (let i = 1; i < s.length; i++) { const f = s[i]!.c - s[i - 1]!.c; cf += f; wcf += f * (T - days(a.d, s[i]!.d)) / T; }
  const den = a.v + wcf; if (!(den > 0)) return null;
  const r = (z.v - a.v - cf) / den;
  return { r, annual: T >= 90 ? Math.pow(1 + r, 365 / T) - 1 : null, days: T, from: a.d, to: z.d };
}

/** Annual money-weighted return (XIRR) of dated flows (deposits positive) ending in value `end` on `endDate`. */
export function xirr(flows: { d: string; v: number }[], end: number, endDate: string): number | null {
  const f = flows.filter((x) => x.v && x.d <= endDate);
  if (!f.length || !(end > 0)) return null;
  const yrs = (d: string) => days(d, endDate) / 365;
  if (yrs(f[0]!.d) < 0.25) return null; // under three months an annual rate says nothing
  const npv = (r: number) => f.reduce((s, x) => s + x.v * Math.pow(1 + r, yrs(x.d)), 0) - end;
  let lo = -0.99, hi = 5;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (npv(lo) * npv(m) <= 0) hi = m; else lo = m; }
  return (lo + hi) / 2;
}

/**
 * Monthly deposits as dated flows (on the PAC day). Months after the last recorded one, up to the current month,
 * are assumed at the regular PAC amount: the API key cannot read the deposit history yet.
 */
export function pacFlows(monthly: Record<string, number>, pacDay: number, pac: number, today: string): { flows: { d: string; v: number }[]; estimated: number } {
  const day = String(Math.min(28, Math.max(1, pacDay || 1))).padStart(2, "0");
  const keys = Object.keys(monthly ?? {}).sort();
  const flows = keys.map((m) => ({ d: `${m}-${day}`, v: +monthly[m]! || 0 })).filter((x) => x.d <= today);
  let estimated = 0;
  if (keys.length && pac > 0) {
    let [y, m] = keys[keys.length - 1]!.split("-").map(Number) as [number, number];
    for (;;) { m++; if (m > 12) { m = 1; y++; } const d = `${y}-${String(m).padStart(2, "0")}-${day}`; if (d > today) break; flows.push({ d, v: pac }); estimated++; }
  }
  return { flows, estimated };
}

/**
 * How to split the next contribution so the weights move toward target without selling:
 * first fill the gaps of the underweight ETFs (pro rata if the money is not enough), then split what is left by target.
 * Amounts are whole euros that add up exactly to `amount`.
 */
export function splitContribution(holdings: { isin: string; valore: number; target: number }[], amount: number): { isin: string; add: number; after: number }[] {
  const P = Math.max(0, Math.round(amount)), V = holdings.reduce((s, h) => s + Math.max(0, h.valore), 0);
  const W = holdings.reduce((s, h) => s + Math.max(0, +h.target || 0), 0) || 1;
  const w = holdings.map((h) => Math.max(0, +h.target || 0) / W);
  const need = holdings.map((h, i) => Math.max(0, (V + P) * w[i]! - Math.max(0, h.valore)));
  const N = need.reduce((s, x) => s + x, 0);
  const raw = N >= P ? need.map((x) => (N ? (x / N) * P : 0)) : need.map((x, i) => x + (P - N) * w[i]!);
  const flo = raw.map(Math.floor); let rest = P - flo.reduce((s, x) => s + x, 0);
  raw.map((x, i) => [x - flo[i]!, i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0) { flo[i]!++; rest--; } });
  return holdings.map((h, i) => ({ isin: h.isin, add: flo[i]!, after: V + P ? (Math.max(0, h.valore) + flo[i]!) / (V + P) : 0 }));
}

/** Cash left uninvested for over `minDays`: every snapshot from `minDays` ago to now holds more than `min`. */
export function idleCash(list: Snapshot[] | undefined, today: string, min = 50, minDays = 30): { cash: number; since: string } | null {
  const s = (list ?? []).filter((x) => x && x.cash != null);
  if (!s.length) return null;
  const last = s[s.length - 1]!; if (!(last.cash! > min) || days(last.d, today) > 10) return null;
  let since = last.d;
  for (let i = s.length - 1; i >= 0 && s[i]!.cash! > min; i--) since = s[i]!.d;
  return days(since, last.d) >= minDays ? { cash: last.cash!, since } : null;
}

/** Thins a daily series to at most `n` points, always keeping the first and the last. */
export function thin<T>(list: T[], n = 24): T[] {
  if (list.length <= n) return list;
  const out: T[] = []; const step = (list.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(list[Math.round(i * step)]!);
  return out;
}
