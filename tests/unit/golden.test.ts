/**
 * Golden test: the new engine must reproduce, number by number, what the original approved
 * app computes on the owner's real data. The fixture contains personal financial data, so it
 * lives in /private (git-ignored) and this suite is skipped where it is absent (e.g. CI).
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { Engine, mergeCfg, tot } from "@/domain/engine";
import type { Snapshot } from "@/domain/types";

const FILE = "private/golden.json";
const has = existsSync(FILE);
const G = has ? JSON.parse(readFileSync(FILE, "utf8")) : { snapshot: {}, runs: {} };

function snapshot(): Snapshot {
  const s = G.snapshot;
  return { invoices: s.invoices, clients: s.clients, f24: s.f24, contratti: s.contratti, missioni: s.missioni, promemoria: s.promemoria,
    redditi: s.redditi, spese: s.spese, risparmi: s.risparmi, investimenti: s.investimenti, cfg: mergeCfg(s.cfgRaw) };
}
/** JSON round-trip with the same Infinity encoding used by the generator. */
const norm = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) => (x === Infinity ? "Infinity" : x)));
/** Deep equality with a 1e-9 relative tolerance on numbers (floating-point summation order). */
function close(a: unknown, b: unknown, path = "$"): string | null {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)) ? null : `${path}: ${a} ≠ ${b}`;
  if (Array.isArray(a) && Array.isArray(b)) { if (a.length !== b.length) return `${path}: length ${a.length} ≠ ${b.length}`; for (let i = 0; i < a.length; i++) { const e = close(a[i], b[i], `${path}[${i}]`); if (e) return e; } return null; }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object).sort(), kb = Object.keys(b as object).sort();
    if (ka.join() !== kb.join()) return `${path}: keys [${ka}] ≠ [${kb}]`;
    for (const k of ka) { const e = close((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`); if (e) return e; }
    return null;
  }
  return Object.is(a, b) ? null : `${path}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`;
}

describe.skipIf(!has)("golden: new engine = original app on real data", () => {
  for (const [today, R] of Object.entries(G.runs as Record<string, Record<string, unknown>>)) {
    describe(`at ${today}`, () => {
      const e = new Engine(snapshot(), today);
      const FX = e.fisco();
      const cases: [string, () => unknown][] = [
        ["fisco", () => FX],
        ["fiscoMin", () => e.fiscoMin()],
        ["projections", () => e.projections()],
        ["f24", () => e.f24Rows(FX)],
        ["reminders", () => e.reminders().map((r) => ({ ...r, due: e.remDue(r) }))],
        ["invoices", () => e.s.invoices.map((v) => ({ id: v.id, tot: tot(v), due: e.dueDate(v), eff: e.effDate(v), fy: e.fy(v), fase: e.fase(v), stato: e.stato(v), oneri: e.oneriInv(v, FX) }))],
        ["compliance", () => e.compliance()],
        ["cash12", () => e.cash12(FX)],
        ["flow12", () => e.flow12(FX)],
        ["spese", () => e.speseStats()],
        ["risp", () => e.rispCalc()],
        ["inv", () => e.mainInvestment()],
        ["ct", () => e.ctPlan(FX)],
        ["next", () => e.nextF24(FX) ?? null],
        ["nextNumber", () => e.nextNumber(+today.slice(0, 4))],
      ];
      for (const [name, fn] of cases) {
        it(name, () => { const err = close(norm(fn()), R[name]); expect(err).toBeNull(); });
      }
    });
  }
});
