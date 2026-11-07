/**
 * Import fidelity: legacy export → Postgres rows → domain snapshot must give the engine
 * exactly the same results as the original app (golden data, local only) and preserve
 * every field on synthetic data (CI).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { legacyToRows, rowsToSnapshot, type LegacyExport } from "@/data/mapping";
import { uuidv5 } from "@/data/uuid";
import { Engine, mergeCfg } from "@/domain/engine";

describe("uuid v5", () => {
  it("is deterministic and RFC-shaped", async () => {
    const a = await uuidv5("invoice:2026-16"), b = await uuidv5("invoice:2026-16");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(await uuidv5("python.org", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe("886313e1-3b8a-5372-9b90-0c9aee199e5d"); // RFC test vector
  });
});

const legacy: LegacyExport = {
  clients: [{ id: "acme", nome: "Acme", ragione: "Acme S.r.l.", idFiscale: "P.IVA 1", indirizzo: "Via 1", pec: "a@pec.it", ordine: 1, gg: 11,
    termine: { fineMese: true, giorni: 30 }, compenso: 3000, tariffa: 40, desc: "Consulenza {MESE}", descTrasf: "Trasferta {DAL}-{AL}" }],
  contratti: [{ id: "acme-2026", cliente: "acme", dal: "2026-07", al: "2027-06", importo: 6000, ogni: 2, offset: -13, regola: { n: 2 }, tariffa: 40, ipotesi: false, attivo: true, note: "firmato" }],
  missioni: [{ id: "m1", cliente: "acme", dal: "2026-10-15", al: "2026-11-30", ipotesi: false }, { id: "q1", cliente: "acme", tipo: "quota", anno: 2027, giorni: 30, ipotesi: true }],
  invoices: [{ id: "2026-16", cliente: "acme", anno: 2026, n: 16, num: "16/2026", data: "2026-10-23", incasso: "2026-11-06", emessaSdi: "2026-10-26",
    inviataCommercialista: "2026-10-23", numeroSdi: "16", statoTracking: true, bollo: 2, bolloAuto: true, mesiCoperti: ["2026-09", "2026-10"],
    trasf: { dal: "2026-10-15", al: "2026-10-31", tariffa: 40 }, note: "",
    righe: [{ tipo: "compenso", qta: 1, prezzo: 3000, desc: "Sett" }, { tipo: "compenso", qta: 1, prezzo: 3000, desc: "Ott" }, { tipo: "trasferta", qta: 17, prezzo: 40, desc: "Trasf" }] }],
  f24: [{ id: "f1", data: "2026-09-16", descrizione: "Rata I", tributi: "1792, 1790, PXXR", importo: 963.7, versato: true }],
  promemoria: [{ id: "p1", data: "2026-12-10", titolo: "Rimborso", dettaglio: "x", preavviso: 14, cliente: "acme", fatto: true }],
  spese: [{ id: "2026-04", mese: "2026-04", cat: { Casa: 800, "Casa e lavori": 1200 }, investito: 374, fonti: "UniCredit, Revolut", note: "n" }],
  redditi: [{ id: "r1", data: "2026-05-01", tipo: "amministratore", importo: 1000 }],
  risparmi: [{ id: "sat", nome: "Satispay", prodotto: "Salvadanaio", logo: "satispay", ordine: 1, saldo: 321.28, guadagno: 3.97, aggiornato: "2026-11-05",
    tassoLordo: 2.82, costi: 0.21, bollo: 0.2, aliquota: 26, versamento: { importo: 25, giorno: 25 }, note: ["a"], fondo: "Amundi" },
    { id: "tax", nome: "Revolut", prodotto: "Tasse", ruolo: "tasse", saldo: 12.08, aggiornato: "2026-11-05", tassoLordo: 2.5, versamento: { importo: 1000, giorno: 1 }, copreDal: "2027-01-01" }],
  investimenti: [{ id: "trading212", nome: "Trading 212", aggiornato: "2026-11-02", depositi: 5072, prelievi: 100, commDeposito: 21.51, commCambio: 4.07,
    realizzate: [{ data: "2026-02-25", isin: "IE00B4L5Y983", importo: 140.24 }], mensile: { "2026-10": 400 },
    pac: { importo: 400, giorno: 1, inizio: "2025-06-28", anni: 20, revisioneMesi: 6, soglia: 5, ultimaRevisione: "2026-11-05" },
    titoli: [{ isin: "IE00B4L5Y983", ticker: "EUNL", nome: "MSCI World", classe: "Azioni", quote: 25.098, costo: 2969.3, prezzoEur: 129.5, valuta: "EUR", target: 60 }] }],
  config: { ack: ["sdi-2026-16", "num-2025-3"], fisco: { "2025": { imposta: 796 } }, params: { "2026": { coef: 0.67, inps: 0.2607, imp: 0.05, margine: 0.1 } } },
};

describe("legacy → rows → domain (synthetic)", () => {
  it("keeps every field the engine uses", async () => {
    const { rows, ids } = await legacyToRows(legacy);
    const s = rowsToSnapshot(rows, mergeCfg);
    const inv = s.invoices[0]!;
    expect(inv).toMatchObject({ anno: 2026, n: 16, num: "16/2026", data: "2026-10-23", incasso: "2026-11-06", emessaSdi: "2026-10-26", statoTracking: true, bollo: 2, mesiCoperti: ["2026-09", "2026-10"] });
    expect(inv.righe.map((r) => [r.tipo, r.qta, r.prezzo])).toEqual([["compenso", 1, 3000], ["compenso", 1, 3000], ["trasferta", 17, 40]]);
    expect(s.clients[0]).toMatchObject({ nome: "Acme", gg: 11, termine: { fineMese: true, giorni: 30 }, compenso: 3000, tariffa: 40, desc: "Consulenza {MESE}" });
    expect(s.contratti[0]).toMatchObject({ dal: "2026-07", al: "2027-06", importo: 6000, ogni: 2, offset: -13, regola: { n: 2 }, tariffa: 40, ipotesi: false });
    expect(s.missioni.find((m) => m.tipo === "quota")).toMatchObject({ anno: 2027, giorni: 30, ipotesi: true });
    expect(s.f24[0]).toMatchObject({ data: "2026-09-16", importo: 963.7, versato: true, tributi: "1792, 1790, PXXR" });
    expect(s.promemoria[0]).toMatchObject({ fatto: true, preavviso: 14, cliente: ids["client:acme"] });
    expect(s.risparmi.find((r) => r.ruolo === "tasse")).toMatchObject({ saldo: 12.08, copreDal: "2027-01-01", versamento: { importo: 1000, giorno: 1 } });
    expect(s.investimenti[0]!.titoli[0]).toMatchObject({ isin: "IE00B4L5Y983", quote: 25.098, target: 60 });
    expect(s.redditi[0]).toMatchObject({ tipo: "amministratore", importo: 1000 });
    expect(s.cfg.ack).toEqual([`sdi-${ids["invoice:2026-16"]}`, "num-2025-3"]);   // remapped to new ids
    expect(s.cfg.fisco?.["2025"]).toEqual({ imposta: 796 });
  });
  it("re-importing yields identical ids (idempotent)", async () => {
    const a = await legacyToRows(legacy), b = await legacyToRows(legacy);
    expect(JSON.stringify(a.rows)).toBe(JSON.stringify(b.rows));
  });
});

const FILE = "private/golden.json";
describe.skipIf(!existsSync(FILE))("legacy → rows → domain reproduces the original app on real data", () => {
  const G = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : null;
  for (const today of Object.keys(G?.runs ?? {})) {
    it(`at ${today}: fiscal year, F24, projections, cash flow, savings, PAC, tax account`, async () => {
      const g = G.snapshot;
      const { rows } = await legacyToRows({ ...g, config: g.cfgRaw });
      const e = new Engine(rowsToSnapshot(rows, mergeCfg), today);
      const R = G.runs[today]; const FX = e.fisco();
      const pick = (o: Record<string, unknown>, ks: string[]) => Object.fromEntries(ks.map((k) => [k, o[k]]));
      expect(JSON.parse(JSON.stringify(FX))).toEqual(R.fisco);
      expect(JSON.parse(JSON.stringify(e.fiscoMin()))).toEqual(R.fiscoMin);
      const pk = ["months", "data", "incasso", "anno", "comp", "ind", "gg", "imponibile", "ipotesi"];
      expect(e.projections().map((x) => pick(x as never, pk))).toEqual(R.projections.map((x: never) => pick(x, pk)));
      const fk = ["data", "descrizione", "tributi", "importo", "versato", "stima"];
      expect(e.f24Rows(FX).map((x) => pick(x as never, fk))).toEqual(R.f24.map((x: never) => pick(x, fk)));
      expect(e.cash12(FX)).toEqual(R.cash12);
      const fl = e.flow12(FX);
      expect(fl.rows.map((r) => [r.m, r.in, r.f24, r.saldo, r.cum])).toEqual(R.flow12.rows.map((r: { m: string; in: number; f24: number; saldo: number; cum: number }) => [r.m, r.in, r.f24, r.saldo, r.cum]));
      const rk = ["tot", "gain", "mens", "netto", "reale", "lordo", "avg", "mesi"];
      expect(pick(e.rispCalc() as never, rk)).toEqual(pick(R.risp, rk));
      const ik = ["tot", "costo", "pl", "netDep", "fine", "n", "rev", "pac"];
      expect(pick(e.mainInvestment() as never, ik)).toEqual(pick(R.inv, ik));
      const inf = (v: number) => (v === Infinity ? "Infinity" : v); const ct = e.ctPlan(FX)!; expect([inf(ct.min), ct.minD, inf(ct.need), ct.tot]).toEqual([R.ct.min, R.ct.minD, R.ct.need, R.ct.tot]);
      expect(e.compliance().map((c) => c.t)).toEqual(R.compliance.map((c: { t: string }) => c.t));
      expect(e.reminders().map((r) => [r.data, r.titolo, e.remDue(r)])).toEqual(R.reminders.map((r: { data: string; titolo: string; due: boolean }) => [r.data, r.titolo, r.due]));
    });
  }
});
