/**
 * Golden test for the view layer: the five ported tabs must produce exactly the HTML the original
 * app produced on the owner's real data, with the clock frozen at four different dates.
 * Fixture is private (personal data): skipped where absent.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { Engine, mergeCfg } from "@/domain/engine";
import { createLegacy } from "@/legacy/app";

const FILE = "private/golden-views.json";
const has = existsSync(FILE);
const G = has ? JSON.parse(readFileSync(FILE, "utf8")) : { snapshot: {}, runs: {} };
const VIEWS = ["vHome", "vInv", "vPrev", "vContr", "vMis", "vF24", "vTasse", "vFisco", "compliancePanel", "redditiPanel", "vEntrate", "vSpese", "vInvest", "vRisp", "vAnal", "vSet"] as const;

function firstDiff(a: string, b: string) {
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  return `at ${i}: «${a.slice(Math.max(0, i - 80), i + 80)}» vs «${b.slice(Math.max(0, i - 80), i + 80)}»`;
}

describe.skipIf(!has)("golden views: ported tabs = original app HTML", () => {
  for (const [today, R] of Object.entries(G.runs as Record<string, { views: Record<string, string> }>)) {
    describe(`at ${today}`, () => {
      beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(today + "T12:00:00")); });
      afterAll(() => { vi.useRealTimers(); });
      for (const v of VIEWS) it(v, () => {
        const s = G.snapshot;
        const snap = { invoices: s.invoices, clients: s.clients, f24: s.f24, contratti: s.contratti, missioni: s.missioni, promemoria: s.promemoria,
          redditi: s.redditi, spese: s.spese, risparmi: s.risparmi, investimenti: s.investimenti, cfg: mergeCfg(s.cfgRaw) };
        const e = new Engine(structuredClone(snap), today);
        const views = createLegacy({ S: { ...structuredClone(snap), year: +today.slice(0, 4), filter: { stato: "tutti", cliente: "", q: "" }, calsync: [], storico: [] },
          engine: () => e, render: () => undefined, setView: () => undefined, downloads: null, assetsCap: null, unavailable: () => undefined, v3Template: async () => null });
        const html = views[v](views._fisco());
        const want = R.views[v]!;
        if (html !== want) expect.fail(firstDiff(html, want));
      });
    });
  }
});
