/**
 * Redesign safety net: the redesigned views may show FEWER figures (less clutter) but never different ones.
 * Every euro amount and percentage in the new HTML must appear in the original (pre-redesign) HTML of the same view,
 * rendered on the owner's real data at 4 dates. Private fixture: skipped where absent.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { Engine, mergeCfg } from "@/domain/engine";
import { createLegacy as createNew } from "@/legacy/app";
import { createLegacy as createOld } from "../fixtures/legacy-original";

const FILE = "private/golden-views.json";
const has = existsSync(FILE);
const G = has ? JSON.parse(readFileSync(FILE, "utf8")) : { snapshot: {}, runs: {} };
const VIEWS = ["vHome", "vInv", "vPrev", "vContr", "vMis", "vF24", "vTasse", "vFisco", "compliancePanel", "redditiPanel", "vEntrate", "vSpese", "vInvest", "vRisp", "vAnal", "vSet"] as const;
/** Panels moved between sections by the redesign: their figures may appear in the destination view. */
const MOVED: Partial<Record<(typeof VIEWS)[number], (typeof VIEWS)[number][]>> = { vTasse: ["vRisp"] };
const figures = (html: string) => new Set((html.replace(/<[^>]+>/g, " ").match(/-?\d{1,3}(?:\.\d{3})*(?:,\d+)?\s?(?:€|%)/g) ?? []).map((x) => x.replace(/\s/g, "")));

describe.skipIf(!has)("redesign keeps every figure identical", () => {
  for (const today of Object.keys(G.runs as object)) {
    describe(`at ${today}`, () => {
      beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(today + "T12:00:00")); });
      afterAll(() => { vi.useRealTimers(); });
      for (const v of VIEWS) it(v, () => {
        const s = G.snapshot;
        const snap = { invoices: s.invoices, clients: s.clients, f24: s.f24, contratti: s.contratti, missioni: s.missioni, promemoria: s.promemoria,
          redditi: s.redditi, spese: s.spese, risparmi: s.risparmi, investimenti: s.investimenti, cfg: mergeCfg(s.cfgRaw) };
        const env = (S: object, e: Engine) => ({ S, engine: () => e, render: () => undefined, setView: () => undefined, downloads: null, assetsCap: null, unavailable: () => undefined, v3Template: async () => null });
        const ui = () => ({ year: +today.slice(0, 4), filter: { stato: "tutti", cliente: "", q: "" }, calsync: [], storico: [] });
        const eo = new Engine(structuredClone(snap), today), en = new Engine(structuredClone(snap), today);
        const O = createOld(env({ ...structuredClone(snap), ...ui() }, eo)), N = createNew(env({ ...structuredClone(snap), ...ui() }, en));
        const before = figures(O[v](O._fisco())), after = figures(N[v](N._fisco()));
        for (const m of MOVED[v] ?? []) for (const x of figures(O[m](O._fisco()))) before.add(x);
        const invented = [...after].filter((x) => !before.has(x));
        expect(invented, `figures not in the original ${v}`).toEqual([]);
        if (before.size) expect(after.size).toBeGreaterThan(0);
      });
    });
  }
});
