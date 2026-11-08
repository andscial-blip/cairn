import { describe, it, expect } from "vitest";
import { auditToStorico, onlyNotes, type AuditEntry } from "@/legacy/history";

describe("Cronologia: Dashboard notes", () => {
  it("onlyNotes is true only when nothing but the notes changed", () => {
    expect(onlyNotes({ a: 1, note: "x" }, { a: 1, note: "y", noteAt: "2026-11-08T10:45" })).toBe(true);
    expect(onlyNotes({ a: 1, note: "x" }, { a: 2, note: "y" })).toBe(false);
    expect(onlyNotes({ a: 1 }, { a: 1 })).toBe(false);
  });
  it("settings changes that only touch the notes are left out, the others stay", () => {
    const rows = { ledger_settings: [{ id: "s", data: { soglia: 2, note: "c" } }] } as never;
    const E = (id: number, before: Record<string, unknown>): AuditEntry => ({ id, at: "2026-11-08T10:0" + id, action: "update", entity: "ledger_settings", record_id: "s", details: { before: { data: before } } });
    // newest first: 3 = note b→c (hidden), 2 = soglia 1→2 (kept), 1 = note a→b (hidden)
    const out = auditToStorico([E(3, { soglia: 2, note: "b" }), E(2, { soglia: 1, note: "b" }), E(1, { soglia: 1, note: "a" })], rows);
    expect(out.map((x) => x.id)).toEqual(["2"]);
  });
});
