/**
 * The edit path must be lossless: for every record of the owner's real data,
 * row → document (what the original code sees) → row (what an edit writes back) changes nothing.
 * Uses private/rows.json (personal data, git-ignored): skipped where absent.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { rowsToSnapshot, docToRow, docLines, docHoldings, changedFields, COLL_TABLE, type LegacyColl } from "@/data/mapping";
import { mergeCfg } from "@/domain/engine";

const FILE = "private/rows.json";
const has = existsSync(FILE);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const R: Record<string, any[]> = has ? JSON.parse(readFileSync(FILE, "utf8")) : {};

describe.skipIf(!has)("edit round-trip on real data", () => {
  const S = rowsToSnapshot(R as never, mergeCfg) as unknown as Record<string, { id: string }[]>;
  for (const [coll, table] of Object.entries(COLL_TABLE)) {
    it(`${coll} → ${table}`, () => {
      const docs = S[coll] ?? [];
      expect(docs.length).toBe((R[table] ?? []).length);
      for (const d of docs) {
        const stored = R[table]!.find((r) => r.id === d.id);
        expect(changedFields(stored, docToRow(coll as LegacyColl, d)), `${coll}/${d.id}`).toEqual({});
      }
    });
  }
  it("invoice lines by position", () => {
    for (const v of S.invoices as unknown as { id: string }[]) {
      const stored = R.invoice_lines!.filter((l) => l.invoice_id === v.id).sort((a, b) => a.position - b.position);
      const next = docLines(v as never);
      expect(next.length).toBe(stored.length);
      next.forEach((l, i) => expect(changedFields(stored[i], l)).toEqual({}));
    }
  });
  it("holdings by ISIN", () => {
    for (const a of S.investimenti as unknown as { id: string }[]) {
      for (const h of docHoldings(a as never)) {
        const stored = R.holdings!.find((x) => x.account_id === a.id && x.isin === h.isin);
        expect(changedFields(stored, h)).toEqual({});
      }
    }
  });
  it("detects a real change", () => {
    const v = { ...(S.invoices![0] as Record<string, unknown>), incasso: "2026-12-01" } as never;
    expect(changedFields(R.invoices!.find((r) => r.id === (v as { id: string }).id), docToRow("invoices", v))).toEqual({ collected_on: "2026-12-01" });
  });
});
