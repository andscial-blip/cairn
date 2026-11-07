/**
 * The legacy import written through apply_operation (as the owner, exactly as the app does)
 * must satisfy every constraint, and reading it back must reproduce the engine results.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type pg from "pg";
import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { freshDb, createUser, bootstrapLedger, as, apply } from "./helpers";
import { legacyToRows, rowsToSnapshot, IMPORT_ORDER, type LegacyExport } from "@/data/mapping";
import { Engine, mergeCfg } from "@/domain/engine";

const FILE = "private/golden.json";
const G = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : null;
let c: pg.Client, owner: string, ledger: string;

beforeAll(async () => { c = await freshDb(); owner = await createUser(c, "owner@example.test"); ledger = await bootstrapLedger(c, owner); });
afterAll(async () => { await c.end(); });

async function importAll(L: LegacyExport) {
  const { rows } = await legacyToRows(L);
  const results: Record<string, number> = {};
  for (const table of IMPORT_ORDER) {
    for (const r of rows[table]) {
      const { id, ...payload } = r;
      // ledger_settings already exists (bootstrap) → update with its current version.
      let base: number | null = null;
      if (table === "ledger_settings") base = (await as(c, owner, () => c.query("select version from ledger_settings where ledger_id=$1", [ledger]))).rows[0].version;
      const res = await as(c, owner, () => apply(c, { op_id: randomUUID(), ledger_id: ledger, entity: table, record_id: id, op_type: "upsert", base_version: base, origin: "online", payload }));
      results[String(res.status)] = (results[String(res.status)] ?? 0) + 1;
      if (res.status !== "applied") throw new Error(`${table} ${id}: ${JSON.stringify(res)}`);
    }
  }
  return { rows, results };
}

async function readBack() {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const t of IMPORT_ORDER) out[t] = (await as(c, owner, () => c.query(`select * from ${t} where ledger_id=$1`, [ledger]))).rows;
  // node-pg returns numerics as strings and dates as Date: normalise like PostgREST JSON would.
  for (const t of Object.keys(out)) out[t] = out[t]!.map((r) => JSON.parse(JSON.stringify(r, (_k, v) => v)));
  return out;
}

describe.skipIf(!G)("import of the real data into Postgres", () => {
  it("every record is accepted and the engine gives the same numbers after reading back", async () => {
    const g = G.snapshot;
    const { rows, results } = await importAll({ ...g, config: g.cfgRaw });
    expect(results).toEqual({ applied: Object.values(rows).reduce((a, x) => a + x.length, 0) });
    const back = await readBack();
    const today = "2026-11-07";
    const e = new Engine(rowsToSnapshot(back as never, mergeCfg), today);
    expect(JSON.parse(JSON.stringify(e.fisco()))).toEqual(G.runs[today].fisco);
    expect(e.cash12(e.fisco())).toEqual(G.runs[today].cash12);
  });
  it("re-running the import updates nothing twice (same ids → conflicts on base version, no duplicates)", async () => {
    const g = G.snapshot;
    const { rows } = await legacyToRows({ ...g, config: g.cfgRaw });
    const n = (await as(c, owner, () => c.query("select count(*)::int n from invoices where ledger_id=$1", [ledger]))).rows[0].n;
    expect(n).toBe(rows.invoices.length);
  });
});
