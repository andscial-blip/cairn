const EUR = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", useGrouping: "always" } as unknown as Intl.NumberFormatOptions);
const EUR0 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" } as unknown as Intl.NumberFormatOptions);
export const eur = (v: unknown) => EUR.format(Number(v) || 0);
export const eur0 = (v: unknown) => EUR0.format(Number(v) || 0);
export const pct = (v: number, d = 1) => `${((Number(v) || 0) * 100).toLocaleString("it-IT", { minimumFractionDigits: d, maximumFractionDigits: d })}%`;
export const dmy = (s?: string | null) => { if (!s) return ""; const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const daysFrom = (a: string, b: string) => Math.round((new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime()) / 864e5);
