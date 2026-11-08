import { describe, it, expect } from "vitest";
import { addSnapshot, snapshotOf, dietz, xirr, pacFlows, splitContribution, idleCash, thin, rebalanceCheck } from "@/lib/invest";

describe("snapshots", () => {
  it("replaces today's snapshot and keeps dates sorted", () => {
    let l = addSnapshot([], { d: "2026-11-02", v: 100, c: 90, cash: 5 });
    l = addSnapshot(l, { d: "2026-11-01", v: 99, c: 90 });
    l = addSnapshot(l, { d: "2026-11-02", v: 101.239, c: 90, cash: null });
    expect(l).toEqual([{ d: "2026-11-01", v: 99, c: 90, cash: null }, { d: "2026-11-02", v: 101.24, c: 90, cash: null }]);
  });
  it("caps the length", () => {
    const l = Array.from({ length: 5 }, (_, i) => ({ d: `2026-01-0${i + 1}`, v: 1, c: 1 }));
    expect(addSnapshot(l, { d: "2026-01-09", v: 2, c: 2 }, 3).map((x) => x.d)).toEqual(["2026-01-04", "2026-01-05", "2026-01-09"]);
  });
  it("builds the snapshot from holdings", () => {
    expect(snapshotOf([{ quote: 2, prezzoEur: 10.5, costo: 20 }, { quote: 1, prezzoEur: 4, costo: 5 }], 12, "2026-11-07")).toEqual({ d: "2026-11-07", v: 25, c: 25, cash: 12 });
  });
});

describe("Modified Dietz", () => {
  it("is the plain return without flows", () => {
    const r = dietz([{ d: "2026-01-01", v: 1000, c: 900 }, { d: "2026-01-31", v: 1100, c: 900 }])!;
    expect(r.r).toBeCloseTo(0.1, 10); expect(r.annual).toBeNull(); expect(r.days).toBe(30);
  });
  it("does not count a purchase as gain", () => {
    // +400 bought on day 15 of 30, price flat: value grows by the purchase only → return 0
    const r = dietz([{ d: "2026-01-01", v: 1000, c: 1000 }, { d: "2026-01-16", v: 1400, c: 1400 }, { d: "2026-01-31", v: 1400, c: 1400 }])!;
    expect(r.r).toBeCloseTo(0, 10);
  });
  it("annualises from 90 days and needs a week of data", () => {
    expect(dietz([{ d: "2026-01-01", v: 1000, c: 1000 }, { d: "2026-01-04", v: 1010, c: 1000 }])).toBeNull();
    const r = dietz([{ d: "2026-01-01", v: 1000, c: 1000 }, { d: "2026-07-02", v: 1050, c: 1000 }])!;
    expect(r.annual!).toBeCloseTo(Math.pow(1.05, 365 / 182) - 1, 10);
  });
});

describe("XIRR and PAC flows", () => {
  it("finds a known rate", () => {
    // 1000 a year ago at 10% → 1100 today
    expect(xirr([{ d: "2025-11-07", v: 1000 }], 1100, "2026-11-07")!).toBeCloseTo(0.1, 6);
  });
  it("needs three months", () => {
    expect(xirr([{ d: "2026-10-01", v: 1000 }], 1010, "2026-11-07")).toBeNull();
  });
  it("assumes the regular PAC for months not recorded yet", () => {
    const { flows, estimated } = pacFlows({ "2026-10": 400, "2026-11": 400 }, 1, 400, "2027-01-15");
    expect(flows.map((f) => f.d)).toEqual(["2026-10-01", "2026-11-01", "2026-12-01", "2027-01-01"]);
    expect(estimated).toBe(2);
  });
});

describe("next contribution split", () => {
  const H = [{ isin: "A", valore: 700, target: 60 }, { isin: "B", valore: 100, target: 10 }, { isin: "C", valore: 100, target: 15 }, { isin: "D", valore: 100, target: 10 }, { isin: "E", valore: 0, target: 5 }];
  it("adds up to the amount in whole euros", () => {
    const s = splitContribution(H, 400);
    expect(s.reduce((a, x) => a + x.add, 0)).toBe(400);
    expect(s.every((x) => Number.isInteger(x.add) && x.add >= 0)).toBe(true);
  });
  it("fills the underweight ETFs first, never the overweight one beyond target", () => {
    const s = Object.fromEntries(splitContribution(H, 400).map((x) => [x.isin, x]));
    // total after 1400: targets A 840, B 140, C 210, D 140, E 70 → needs A 140, B 40, C 110, D 40, E 70 = 400
    expect(s.A!.add).toBe(140); expect(s.C!.add).toBe(110); expect(s.E!.add).toBe(70);
    expect(s.A!.after).toBeCloseTo(0.6, 6);
  });
  it("splits by target once everything is on target", () => {
    const s = splitContribution([{ isin: "A", valore: 600, target: 60 }, { isin: "B", valore: 400, target: 40 }], 100);
    expect(s.map((x) => x.add)).toEqual([60, 40]);
  });
});

describe("idle cash", () => {
  it("flags cash held for over a month", () => {
    const l = [{ d: "2026-09-20", v: 1, c: 1, cash: 10 }, { d: "2026-10-01", v: 1, c: 1, cash: 300 }, { d: "2026-11-05", v: 1, c: 1, cash: 280 }];
    expect(idleCash(l, "2026-11-07")).toEqual({ cash: 280, since: "2026-10-01" });
  });
  it("ignores cash invested in between or stale data", () => {
    expect(idleCash([{ d: "2026-10-01", v: 1, c: 1, cash: 300 }, { d: "2026-10-15", v: 1, c: 1, cash: 0 }, { d: "2026-11-05", v: 1, c: 1, cash: 300 }], "2026-11-07")).toBeNull();
    expect(idleCash([{ d: "2026-08-01", v: 1, c: 1, cash: 300 }, { d: "2026-09-15", v: 1, c: 1, cash: 300 }], "2026-11-07")).toBeNull();
  });
});

it("thins a series keeping both ends", () => {
  const l = Array.from({ length: 100 }, (_, i) => i);
  const t = thin(l, 10); expect(t.length).toBe(10); expect(t[0]).toBe(0); expect(t[9]).toBe(99);
});

import { addSavingsPoint, savingsYield } from "@/lib/invest";
describe("savings history", () => {
  it("records the state before the first update", () => {
    const l = addSavingsPoint([], { d: "2026-10-05", saldo: 300, guadagno: 3 }, { d: "2026-11-05", saldo: 321.28, guadagno: 3.97 });
    expect(l).toEqual([{ d: "2026-10-05", saldo: 300, guadagno: 3 }, { d: "2026-11-05", saldo: 321.28, guadagno: 3.97 }]);
    expect(addSavingsPoint(l, {}, { d: "2026-11-05", saldo: 322, guadagno: 4 })).toHaveLength(2);
  });
  it("effective yield on the time-weighted balance", () => {
    // 1000 flat for a year, 25 € gained → 2,5%
    const y = savingsYield([{ d: "2025-11-05", saldo: 1000, guadagno: 0 }, { d: "2026-11-05", saldo: 1000, guadagno: 25 }])!;
    expect(y.annual).toBeCloseTo(0.025, 6); expect(y.days).toBe(365);
    expect(savingsYield([{ d: "2026-11-01", saldo: 1000, guadagno: 0 }, { d: "2026-11-05", saldo: 1000, guadagno: 1 }])).toBeNull();
  });
});

describe("rebalanceCheck", () => {
  const H = (a: number, b: number) => [{ isin: "A", ticker: "AAA", valore: a, target: 70, costo: a * 0.8 }, { isin: "B", ticker: "BBB", valore: b, target: 30, costo: b }];
  it("in band: nothing to do", () => {
    expect(rebalanceCheck(H(7200, 2800), 350).action).toBe("none");
  });
  it("small drift that the next contributions fix: no sale", () => {
    const r = rebalanceCheck(H(7700, 2300), 350); // B at 23% vs 30%: out (7 pt)
    expect(r.action).toBe("contributions");
    expect(r.months).toBeLessThanOrEqual(3);
    expect(r.plan.every((p) => p.isin === "B")).toBe(true);
  });
  it("large drift: time to rebalance, with trades that sum to zero and tax on the gains sold", () => {
    const r = rebalanceCheck(H(85000, 15000), 350); // B at 15% vs 30%
    expect(r.action).toBe("sell");
    expect(r.trades.find((t) => t.isin === "A")!.amount).toBe(-15000);
    expect(r.trades.find((t) => t.isin === "B")!.amount).toBe(15000);
    expect(r.tax).toBe(Math.round(15000 * 0.2 * 0.26));
  });
  it("relative rule: a small target off by more than 25% is out of band", () => {
    const r = rebalanceCheck([{ isin: "A", ticker: "A", valore: 9300, target: 90 }, { isin: "B", ticker: "B", valore: 700, target: 10 }], 0);
    expect(r.out.map((x) => x.isin)).toContain("B");
    expect(r.action).toBe("sell");
  });
});
