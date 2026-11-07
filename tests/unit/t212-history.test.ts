import { describe, it, expect } from "vitest";
import { normaliseTransactions, normaliseOrders, normaliseDividends, accountFromHistory, historyCovers, pacCheck, taxByYear, yearEndValues, type History } from "@/lib/t212-history";
import { snapshotOf } from "@/lib/invest";

const fill = (d: string, side: string, isin: string, qty: number, value: number, pl = 0, fx = 0) => ({
  order: { side, ticker: isin + "_EQ", instrument: { isin, ticker: isin.slice(-4) }, createdAt: d, initiatedFrom: "AUTOINVEST" },
  fill: { filledAt: d, quantity: qty, price: value / qty, type: "TRADE", walletImpact: { currency: "EUR", netValue: value, realisedProfitLoss: pl, taxes: fx ? [{ name: "CURRENCY_CONVERSION_FEE", quantity: -fx, currency: "EUR" }] : [] } },
});

describe("normalise", () => {
  it("reads pages of transactions, filled orders (skipping unfilled) and dividends", () => {
    const tx = normaliseTransactions([{ items: [{ type: "DEPOSIT", amount: 400, dateTime: "2026-10-01T08:00:00Z" }], nextPagePath: "x" }, { items: [{ type: "FEE", amount: -2.8, dateTime: "2026-10-01T08:00:00Z" }] }]);
    expect(tx).toEqual([{ d: "2026-10-01T08:00:00Z", type: "DEPOSIT", amount: 400 }, { d: "2026-10-01T08:00:00Z", type: "FEE", amount: -2.8 }]);
    const o = normaliseOrders([{ items: [fill("2026-10-02T09:00:00Z", "BUY", "IE00BKM4GZ66", 2, 60, 0, 0.09), { order: { side: "BUY", instrument: { isin: "X" } }, fill: null }] }]);
    expect(o).toHaveLength(1); expect(o[0]).toMatchObject({ side: "BUY", isin: "IE00BKM4GZ66", qty: 2, value: 60, fx: 0.09, fees: 0, kind: "TRADE" });
    const dv = normaliseDividends([{ items: [{ paidOn: "2026-10-31T00:00:00Z", amount: 1.2, amountInEuro: 1.2, type: "INTEREST", instrument: { isin: "" } }] }]);
    expect(dv[0]).toMatchObject({ amount: 1.2, type: "INTEREST" });
  });
});

const H: History = {
  transactions: [
    { d: "2025-06-28T10:00:00Z", type: "DEPOSIT", amount: 300 }, { d: "2025-07-10T10:00:00Z", type: "WITHDRAW", amount: -100 },
    { d: "2026-10-01T08:00:00Z", type: "DEPOSIT", amount: 400 }, { d: "2026-10-01T08:00:00Z", type: "FEE", amount: -2.8 },
  ],
  orders: normaliseOrders([{ items: [
    fill("2025-06-29T09:00:00Z", "BUY", "A", 10, 200), fill("2025-06-29T09:00:00Z", "BUY", "G", 5, 100, 0, 0.15),
    fill("2026-02-25T09:00:00Z", "SELL", "A", 5, 130, 30), fill("2026-02-25T09:00:00Z", "SELL", "G", 1, 18, -2),
    fill("2026-10-02T09:00:00Z", "BUY", "A", 2, 60),
  ] }]),
  dividends: [{ d: "2026-03-31T00:00:00Z", isin: "", ticker: "", amount: 1.5, type: "INTEREST" }],
};

describe("account from history", () => {
  it("monthly net deposits, totals, real fees, realised P/L and income", () => {
    const a = accountFromHistory(H);
    expect(a.mensile).toEqual({ "2025-06": 300, "2025-07": -100, "2026-10": 400 });
    expect([a.depositi, a.prelievi, a.commDeposito, a.commCambio]).toEqual([700, 100, 2.8, 0.15]);
    expect(a.realizzate).toEqual([{ data: "2026-02-25", isin: "A", importo: 30 }, { data: "2026-02-25", isin: "G", importo: -2 }]);
    expect(a.proventi).toEqual([{ data: "2026-03-31", isin: "", importo: 1.5, tipo: "INTEREST" }]);
  });
  it("replaces known data only when it covers it", () => {
    const a = accountFromHistory(H);
    expect(historyCovers(a, { depositi: 700 })).toBe(true);
    expect(historyCovers(a, { depositi: 5072 })).toBe(false);
  });
});

describe("PAC check", () => {
  it("flags missing and short months, waits for the current one", () => {
    const c = pacCheck({ "2026-08": 400, "2026-09": 0, "2026-10": 200 }, { importo: 400, giorno: 1, inizio: "2026-08-15" }, "2026-11-03");
    expect(c.map((x) => x.state)).toEqual(["ok", "missing", "short", "due"]);
    expect(pacCheck({}, { importo: 400, giorno: 1, inizio: "2026-11-01" }, "2026-11-09").map((x) => x.state)).toEqual(["missing"]);
  });
});

describe("tax by year", () => {
  const T = taxByYear(H, { isGov: (i) => i === "G", yearEnd: () => null, current: { A: 220, G: 90 }, today: "2026-11-07", tickers: { A: "AAA", G: "GOV" } });
  it("splits gains (RM) from losses (RT) and taxes the government-bond share at 12,5%", () => {
    const y26 = T.find((x) => x.year === 2026)!;
    expect([y26.gains, y26.govGains, y26.losses, y26.income]).toEqual([30, 0, 2, 1.5]);
    expect(y26.tax).toBeCloseTo(30 * 0.26 + 1.5 * 0.26, 2);
  });
  it("RW and IVAFE: units and cost at 31/12, value from cost for a closed year without snapshot, days held", () => {
    const y25 = T.find((x) => x.year === 2025)!;
    expect(y25.valueSource).toBe("cost");
    expect(y25.rw.map((r) => [r.isin, r.units, r.cost, r.days])).toEqual([["A", 10, 200, 186], ["G", 5, 100, 186]]);
    expect(y25.ivafe).toBeCloseTo(300 * 0.002 * 186 / 365, 2);
    const y26 = T.find((x) => x.year === 2026)!;
    expect(y26.valueSource).toBe("current"); expect(y26.rw.find((r) => r.isin === "A")!.units).toBe(7);
    expect(y26.ivafe).toBeCloseTo((220 + 90) * 0.002, 2);
  });
  it("uses the year-end snapshot when there is one", () => {
    const st = [snapshotOf([{ isin: "A", quote: 10, prezzoEur: 21, costo: 200 }, { isin: "G", quote: 5, prezzoEur: 19, costo: 100 }], 0, "2025-12-31"), snapshotOf([{ isin: "A", quote: 1, prezzoEur: 1, costo: 1 }], 0, "2026-03-01")];
    expect(st[1]!.p).toBeUndefined();
    expect(yearEndValues(st, 2025)).toEqual({ A: 210, G: 95 });
    const t = taxByYear(H, { isGov: () => false, yearEnd: (y) => yearEndValues(st, y), current: {}, today: "2026-11-07", tickers: {} });
    expect(t.find((x) => x.year === 2025)!.valueSource).toBe("snapshot");
  });
});
