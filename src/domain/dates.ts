// Date helpers on "YYYY-MM-DD" / "YYYY-MM" strings (local calendar, no time zones involved).
export const pad = (n: number) => String(n).padStart(2, "0");
export const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y!, m! - 1, d!); };
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export const dmy = (s?: string | null) => { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
export const r2 = (v: unknown) => Math.round((Number(v) || 0) * 100) / 100;
export const ym = (d: string) => d.slice(0, 7);
export const addMonths = (m: string, n: number) => { const [y, mm] = m.split("-").map(Number); const d = new Date(y!, mm! - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const lastDay = (m: string) => { const [y, mm] = m.split("-").map(Number); return iso(new Date(y!, mm!, 0)); };
/** Adds months to a full date, clamping the day to the end of the target month. */
export const addMonthsD = (s: string, n: number) => {
  const [y, m, d] = s.split("-").map(Number); const x = new Date(y!, m! - 1 + n, 1);
  const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(Math.min(d!, last))}`;
};
export const MESI = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
export const mLabel = (m: string) => { const [y, mm] = m.split("-").map(Number); return `${MESI[mm! - 1]!.toLowerCase()} ${y}`; };

export function easter(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mo - 1, da);
}
/** Italian bank holidays + weekends (+ 24 and 31 December, closed for payments). */
export function isHoliday(s: string): boolean {
  const d = parse(s), y = d.getFullYear(), md = s.slice(5);
  if (d.getDay() === 0 || d.getDay() === 6) return true;
  if (["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-24", "12-25", "12-26", "12-31"].includes(md)) return true;
  const em = easter(y); em.setDate(em.getDate() + 1); return iso(em) === s;
}
/** Previous working day (used for issuing invoices). */
export function workday(s: string): string { let d = s, i = 0; while (isHoliday(d) && i < 10) { d = addDays(d, -1); i++; } return d; }
/** Next working day (used for tax deadlines that slide forward). */
export function nextWork(s: string): string { let d = s, i = 0; while (isHoliday(d) && i < 6) { d = addDays(d, 1); i++; } return d; }
export function nthLastFriday(m: string, n: number): string {
  const d = parse(lastDay(m)); while (d.getDay() !== 5) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() - 7 * ((+n || 1) - 1)); return iso(d);
}
