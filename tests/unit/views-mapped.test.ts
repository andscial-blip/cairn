/**
 * The tabs must look the same on the data as Cairn stores it (UUIDs, rows → snapshot) as on the original
 * data. Renders every view from imported rows, maps UUIDs back to the original ids, and compares with
 * the original app's HTML. Catches lookups that depended on the old readable ids. Private fixture.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { Engine, mergeCfg } from "@/domain/engine";
import { createLegacy } from "@/legacy/app";
import { legacyToRows, rowsToSnapshot } from "@/data/mapping";

const FILE = "private/golden-views.json";
const has = existsSync(FILE);
const G = has ? JSON.parse(readFileSync(FILE, "utf8")) : { snapshot: {}, runs: {} };
const VIEWS = ["vHome", "vInv", "vPrev", "vContr", "vMis", "vF24", "vTasse", "vFisco", "compliancePanel", "redditiPanel", "vEntrate", "vSpese", "vInvest", "vRisp", "vAnal", "vSet"] as const;

function firstDiff(a: string, b: string) { let i = 0; while (i < a.length && a[i] === b[i]) i++; return `at ${i}: «${a.slice(Math.max(0, i - 100), i + 80)}» vs «${b.slice(Math.max(0, i - 100), i + 80)}»`; }

describe.skipIf(!has)("views on Cairn-stored data = original", async () => {
  const s = G.snapshot;
  // PDFs live in Storage now and are linked differently: compare without them.
  const legacy = { ...s, invoices: s.invoices.map((v: Record<string, unknown>) => { const o = { ...v }; delete o.pdf; return o; }), config: s.cfgRaw };
  const { rows, ids } = has ? await legacyToRows(legacy) : { rows: {}, ids: {} };
  const back = new Map(Object.entries(ids as Record<string, string>).map(([k, u]) => [u, k.slice(k.indexOf(":") + 1)]));
  const unmap = (h: string) => h.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, (u) => back.get(u) ?? u);
  for (const [today, R] of Object.entries(G.runs as Record<string, unknown>)) {
    describe(`at ${today}`, () => {
      beforeAll(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date(today + "T12:00:00")); });
      afterAll(() => { vi.useRealTimers(); });
      for (const v of VIEWS) it(v, () => {
        void R;
        const want = (() => { // original HTML recomputed without PDFs, on original ids
          const snap = { ...legacy, cfg: mergeCfg(s.cfgRaw) }; const e = new Engine(structuredClone(snap) as never, today);
          const L = createLegacy({ S: { ...structuredClone(snap), year: +today.slice(0, 4), filter: { stato: "tutti", cliente: "", q: "" }, calsync: [], storico: [] }, engine: () => e, render: () => undefined, setView: () => undefined, downloads: null, assetsCap: null, unavailable: () => undefined });
          return L[v](L._fisco());
        })();
        const snap = rowsToSnapshot(rows as never, mergeCfg); const e = new Engine(snap, today);
        const L = createLegacy({ S: { ...snap, year: +today.slice(0, 4), filter: { stato: "tutti", cliente: "", q: "" }, calsync: [], storico: [] }, engine: () => e, render: () => undefined, setView: () => undefined, downloads: null, assetsCap: null, unavailable: () => undefined });
        const got = unmap(L[v](L._fisco()));
        if (got !== want) expect.fail(firstDiff(got, want));
      });
    });
  }
});
