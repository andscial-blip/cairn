/** Rule-level tests of the fiscal engine on synthetic data (safe to run in CI). */
import { describe, it, expect } from "vitest";
import { Engine, mergeCfg, tot } from "@/domain/engine";
import { isHoliday, workday, nextWork, nthLastFriday, addMonthsD, easter } from "@/domain/dates";
import type { Invoice, Snapshot } from "@/domain/types";

const base = (over: Partial<Snapshot> = {}): Snapshot => ({
  invoices: [], clients: [{ id: "c1", nome: "Cliente Uno", gg: 30 }], f24: [], contratti: [], missioni: [], promemoria: [],
  redditi: [], spese: [], risparmi: [], investimenti: [], cfg: mergeCfg({}), ...over,
});
const inv = (o: Partial<Invoice>): Invoice => ({ id: "i", cliente: "c1", anno: 2026, n: 1, data: "2026-03-10", righe: [{ tipo: "compenso", qta: 1, prezzo: 1000 }], bollo: 2, ...o });

describe("invoice maths", () => {
  it("splits fee, travel allowance, reimbursements and stamp duty", () => {
    const t = tot({ righe: [{ tipo: "compenso", qta: 2, prezzo: 3000 }, { tipo: "trasferta", qta: 17, prezzo: 40 }, { tipo: "rimborso", qta: 1, prezzo: 120.5 }], bollo: 2 });
    expect(t).toEqual({ comp: 6000, ind: 680, rimb: 120.5, bollo: 2, imponibile: 6682, documento: 6802.5, servizi: 6800.5 });
  });
  it("due dates follow the client's payment terms", () => {
    const e = new Engine(base({ clients: [
      { id: "a", nome: "A", termine: { giornoMese: 5 } }, { id: "b", nome: "B", termine: { fineMese: true, giorni: 30 } },
      { id: "c", nome: "C", termine: { giorni: 15 } }, { id: "d", nome: "D", gg: 3 } ] }), "2026-11-07");
    expect(e.dueDate(inv({ cliente: "a", data: "2026-10-23" }))).toBe("2026-11-05");
    expect(e.dueDate(inv({ cliente: "b", data: "2026-10-23" }))).toBe("2026-11-30");
    expect(e.dueDate(inv({ cliente: "c", data: "2026-10-23" }))).toBe("2026-11-07");
    expect(e.dueDate(inv({ cliente: "d", data: "2026-10-23" }))).toBe("2026-10-26");
  });
  it("status: proforma → sent → due → overdue → collected", () => {
    const e = new Engine(base(), "2026-05-01");
    expect(e.fase(inv({ statoTracking: true }))).toBe("Proforma");
    expect(e.fase(inv({ statoTracking: true, inviataCommercialista: "2026-03-10" }))).toBe("Inviata a Isabella");
    expect(e.fase(inv({ statoTracking: true, emessaSdi: "2026-03-11" }))).toBe("Scaduta");
    expect(e.fase(inv({ data: "2026-04-20" }))).toBe("Da incassare");
    expect(e.fase(inv({ incasso: "2026-04-01" }))).toBe("Incassata");
  });
  it("cash principle: an invoice counts in the year it is collected", () => {
    const e = new Engine(base(), "2026-11-07");
    expect(e.fy(inv({ data: "2025-12-20", incasso: "2026-01-05" }))).toBe(2026);
    expect(e.fy(inv({ data: "2025-12-20" }))).toBe(2026); // not collected: expected date = data + 30 gg
  });
});

describe("forfettario fiscal year", () => {
  it("computes taxable income, INPS and substitute tax on the cash basis", () => {
    const e = new Engine(base({ invoices: [inv({ id: "x", incasso: "2026-04-01", righe: [{ tipo: "compenso", qta: 1, prezzo: 29998 }] })] }), "2026-11-07");
    const f = e.fisco()[2026]!;
    expect(f.ric).toBe(30000);                         // 29,998 + 2 stamp duty
    expect(f.red).toBeCloseTo(20100, 6);               // × 67%
    expect(f.inps).toBeCloseTo(20100 * 0.2607, 6);     // Gestione Separata
    expect(f.imp).toBeCloseTo((20100 - f.inpsVers) * 0.05, 6);
    expect(f.netto).toBeCloseTo(f.ric - f.inps - f.imp, 6);
  });
  it("historic advance payments: none under 51.65 €, single in November up to 257.52 €, 40/60 above", () => {
    const mk = (amount: number) => new Engine(base({ invoices: [inv({ incasso: "2026-04-01", righe: [{ tipo: "compenso", qta: 1, prezzo: amount }] })] }), "2026-11-07").fisco()[2026]!;
    const small = mk(800), mid = mk(4000), big = mk(40000);
    expect(small.imp).toBeLessThanOrEqual(51.65);
    expect(small.novembre).toBeCloseTo(small.inps * 0.4, 6);
    expect(mid.imp).toBeGreaterThan(51.65); expect(mid.imp).toBeLessThanOrEqual(257.52);
    expect(mid.novembre).toBeCloseTo(mid.imp + mid.inps * 0.4, 6);
    expect(big.giugno).toBeCloseTo(big.imp + big.inps + big.imp * 0.4 + big.inps * 0.4, 6);
    expect(big.novembre).toBeCloseTo(big.imp * 0.6 + big.inps * 0.4, 6);
  });
  it("tax rate moves from 5% (new business) to 15% from 2027", () => {
    const e = new Engine(base(), "2026-11-07");
    expect(e.P(2026).imp).toBe(0.05); expect(e.P(2027).imp).toBe(0.15); expect(e.P(2040).imp).toBe(0.15);
  });
  it("manual overrides from the filed return take precedence", () => {
    const e = new Engine(base({ cfg: mergeCfg({ fisco: { "2025": { imposta: 796, inps: 4134.98 } } }) }), "2026-11-07");
    expect(e.fisco()[2025]).toMatchObject({ imp: 796, inps: 4134.98 });
  });
});

describe("calendar", () => {
  it("Italian holidays incl. Easter Monday", () => {
    expect(easter(2027).getMonth()).toBe(2); expect(easter(2027).getDate()).toBe(28);
    expect(isHoliday("2027-03-29")).toBe(true);   // Pasquetta
    expect(isHoliday("2026-12-08")).toBe(true);
    expect(isHoliday("2026-11-09")).toBe(false);
  });
  it("tax deadlines slide forward, invoice dates slide back", () => {
    expect(nextWork("2026-05-31")).toBe("2026-06-01");      // Sunday → Monday
    expect(workday("2026-11-01")).toBe("2026-10-30");       // holiday Sunday → Friday
    expect(nthLastFriday("2026-11", 2)).toBe("2026-11-20");
    expect(addMonthsD("2026-01-31", 1)).toBe("2026-02-28");
  });
});

describe("projections and F24 schedule", () => {
  const C = { id: "k", cliente: "c1", dal: "2026-07", al: "2026-12", importo: 6000, ogni: 2, regola: { n: 2 }, tariffa: 40 };
  it("bi-monthly contract produces one invoice per period, skipping covered months", () => {
    const e = new Engine(base({ contratti: [C], invoices: [inv({ id: "p", data: "2026-08-20", mesiCoperti: ["2026-07", "2026-08"] })] }), "2026-09-01");
    const p = e.projections();
    expect(p.map((x) => x.months)).toEqual([["2026-09", "2026-10"], ["2026-11", "2026-12"]]);
    expect(p[1]!.data).toBe("2026-12-18");                  // December rule: 18th
    expect(p[0]!.imponibile).toBe(6002);
  });
  it("missions add the daily allowance to the period they fall in", () => {
    const e = new Engine(base({ contratti: [C], missioni: [{ id: "m", cliente: "c1", dal: "2026-10-15", al: "2026-10-31" }] }), "2026-09-01");
    expect(e.projections().find((x) => x.months.includes("2026-10"))).toMatchObject({ gg: 17, ind: 680, imponibile: 6682 });
  });
  it("estimated June/November F24 appear only when no real F24 exists that month", () => {
    const s = base({ invoices: [inv({ incasso: "2026-04-01", righe: [{ tipo: "compenso", qta: 1, prezzo: 40000 }] })] });
    const e = new Engine(s, "2026-11-07");
    const rows = e.f24Rows(e.fisco());
    expect(rows.some((r) => r.id === "est-2027-06-30")).toBe(true);
    const e2 = new Engine({ ...s, f24: [{ id: "real", data: "2027-06-30", descrizione: "Saldo", importo: 1, versato: false }] }, "2026-11-07");
    expect(e2.f24Rows(e2.fisco()).some((r) => r.id === "est-2027-06-30")).toBe(false);
    // A stamp-duty-only payment in the same month does not replace the tax estimate.
    const e3 = new Engine({ ...s, f24: [{ id: "b", data: "2027-11-30", descrizione: "Bollo", tributi: "2521, 2522, 2523", importo: 6, versato: false }] }, "2026-11-07");
    expect(e3.f24Rows(e3.fisco()).some((r) => r.id === "est-2027-11-30")).toBe(true);
  });
  it("e-invoice stamp duty: Q1–Q3 grouped in November when under 5,000 €", () => {
    const e = new Engine(base({ invoices: [inv({ id: "a", data: "2026-02-10", incasso: "2026-03-01" }), inv({ id: "b", n: 2, data: "2026-08-10", incasso: "2026-09-01" })] }), "2026-06-01");
    const b = e.bolloRows();
    expect(b.find((r) => r.data === "2026-11-30")).toMatchObject({ importo: 4, tributi: "2521, 2522, 2523" });
  });
});

describe("compliance", () => {
  it("flags numbering gaps, missing stamp duty and late SdI submission", () => {
    const e = new Engine(base({ invoices: [
      inv({ id: "a", n: 1, num: "1/2026" }), inv({ id: "c", n: 3, num: "3/2026", bollo: 0 }),
      inv({ id: "d", n: 4, num: "4/2026", data: "2026-01-02", emessaSdi: "2026-01-20" }) ] }), "2026-11-07");
    const t = e.compliance().map((x) => x.k);
    expect(t).toContain("num-2026-2");
    expect(t).toContain("bollo-c");
    expect(t).toContain("sdi-d");
  });
});
