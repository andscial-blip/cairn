/** The write bridge turns the original app's document writes into minimal, ordered outbox operations. */
import { describe, it, expect, beforeEach } from "vitest";
import { LocalDB } from "@/offline/db";
import { saveRecord, deleteRecord, type MutationContext } from "@/offline/mutations";
import { createBridgeDb } from "@/legacy/bridge";
import { rowsToSnapshot } from "@/data/mapping";
import { mergeCfg } from "@/domain/engine";
import { ENTITIES, type Entity, type LocalRow } from "@/offline/types";

const LEDGER = "11111111-1111-4111-8111-111111111111", USER = "22222222-2222-4222-8222-222222222222";
const C1 = "aaaaaaaa-0000-4000-8000-000000000001", INV = "bbbbbbbb-0000-4000-8000-000000000001";
const L1 = "cccccccc-0000-4000-8000-000000000001", L2 = "cccccccc-0000-4000-8000-000000000002";
const F1 = "dddddddd-0000-4000-8000-000000000001", SET = "eeeeeeee-0000-4000-8000-000000000001";

let db: LocalDB, ctx: MutationContext, cache: Partial<Record<Entity, LocalRow[]>>, bridge: ReturnType<typeof createBridgeDb>, optimistic: [string, string, unknown][];
const refresh = async () => { for (const e of ENTITIES) cache[e] = await db.rows(e).toArray(); };
const ops = async () => (await db.outbox.orderBy("seq").toArray()).map((o) => ({ e: o.entity, id: o.record_id, t: o.op_type, p: o.payload, base: o.base_version }));
const seed = (e: Entity, r: Record<string, unknown>) => db.rows(e).put({ ledger_id: LEDGER, version: 3, updated_at: "2026-11-01T00:00:00Z", ...r } as LocalRow);

beforeEach(async () => {
  db = new LocalDB(`bridge-${Math.random()}`); cache = {}; optimistic = [];
  ctx = { db, userId: USER, ledgerId: LEDGER };
  await seed("clients", { id: C1, name: "Cliente A", short_code: "clientea", legal_name: "", vat_id: "", address: "", pec: "", country: "IT", is_foreign: false, sort: 1, payment_days: 30, payment_terms: {}, default_fee: 1000, default_rate: 20, templates: { line: "", travel: "" } });
  await seed("invoices", { id: INV, client_id: C1, year: 2026, number: 5, number_label: "5/2026", issue_date: "2026-10-01", collected_on: null, sdi_sent_on: null, sent_to_accountant_on: null, sdi_number: null, stamp_duty: 2, stamp_auto: true, months_covered: ["2026-10"], travel: null, status_tracking: false, notes: "" });
  await seed("invoice_lines", { id: L1, invoice_id: INV, position: 0, description: "Compenso ottobre", quantity: 1, unit_price: 1000, kind: "compenso" });
  await seed("invoice_lines", { id: L2, invoice_id: INV, position: 1, description: "Rimborso", quantity: 1, unit_price: 50, kind: "rimborso" });
  await seed("f24_payments", { id: F1, due_date: "2026-11-16", paid_on: null, amount: 1304, description: "Rata IV", codes: ["1792"], notes: "" });
  await seed("ledger_settings", { id: SET, data: { ack: [], params: { "2026": { coef: 0.67, inps: 0.2607, imp: 0.05, margine: 0.1 } } } });
  await refresh();
  bridge = createBridgeDb({
    rows: () => cache,
    docs: () => { const s = rowsToSnapshot(cache as never, mergeCfg) as unknown as Record<string, Record<string, unknown>[]>; return s as never; },
    save: async (e, id, ch) => { await saveRecord(ctx, e, id, ch); await refresh(); },
    remove: async (e, id) => { await deleteRecord(ctx, e, id); await refresh(); },
    optimistic: (c, id, d) => { optimistic.push([c, id, d]); },
    uploads: new Map([["ffffffff-0000-4000-8000-000000000001", { path: `${LEDGER}/ffffffff-0000-4000-8000-000000000001/f.pdf`, name: "f.pdf", mime: "application/pdf", size: 1234 }]]),
  });
});

describe("write bridge", () => {
  it("update of one field queues exactly that field, with the stored version (OCC)", async () => {
    await bridge.doc(`invoices/${INV}`).update({ incasso: "2026-11-06" });
    expect(await ops()).toEqual([{ e: "invoices", id: INV, t: "upsert", p: { collected_on: "2026-11-06" }, base: 3 }]);
    expect(optimistic[0]![0]).toBe("invoices");
  });
  it("re-saving an unchanged document queues nothing", async () => {
    const cur = (await bridge.doc(`invoices/${INV}`).get()).data();
    await bridge.doc(`invoices/${INV}`).set(cur as never);
    expect(await ops()).toEqual([]);
  });
  it("new invoice: invoice row first, then its lines (parents before children)", async () => {
    const id = "bbbbbbbb-0000-4000-8000-000000000009";
    await bridge.doc(`invoices/${id}`).set({ cliente: C1, anno: 2026, n: 6, num: "6/2026", data: "2026-11-07", incasso: null, bollo: 2, bolloAuto: true,
      mesiCoperti: ["2026-11"], righe: [{ tipo: "compenso", qta: 1, prezzo: 3000, desc: "Compenso novembre" }] });
    const o = await ops();
    expect(o.map((x) => x.e)).toEqual(["invoices", "invoice_lines"]);
    expect(o[0]!.p).toMatchObject({ client_id: C1, number: 6, issue_date: "2026-11-07", stamp_duty: 2 });
    expect(o[1]!.p).toMatchObject({ invoice_id: id, position: 0, unit_price: 3000, kind: "compenso" });
    expect(o.every((x) => x.base === null)).toBe(true);
  });
  it("editing lines reuses stored rows by position and deletes the surplus", async () => {
    const cur = (await bridge.doc(`invoices/${INV}`).get()).data() as Record<string, unknown>;
    await bridge.doc(`invoices/${INV}`).set({ ...cur, righe: [{ tipo: "compenso", qta: 1, prezzo: 1200, desc: "Compenso ottobre" }] });
    expect(await ops()).toEqual([
      { e: "invoice_lines", id: L1, t: "upsert", p: { unit_price: 1200 }, base: 3 },
      { e: "invoice_lines", id: L2, t: "delete", p: {}, base: 3 },
    ]);
  });
  it("F24 paid toggle maps to a payment date and back", async () => {
    await bridge.doc(`f24/${F1}`).update({ versato: true });
    await bridge.doc(`f24/${F1}`).update({ versato: false });
    const o = await ops();
    expect(o).toHaveLength(1); // consecutive edits merge into the pending operation
    expect(o[0]!.p).toEqual({ paid_on: null });
  });
  it("settings: update merges into the stored JSON", async () => {
    const r = await bridge.doc("config/main").get(); expect(r.exists).toBe(true);
    await bridge.doc("config/main").update({ ack: ["sdi-x"] });
    const o = await ops();
    expect(o[0]).toMatchObject({ e: "ledger_settings", id: SET });
    expect((o[0]!.p as { data: Record<string, unknown> }).data).toMatchObject({ ack: ["sdi-x"], params: { "2026": { coef: 0.67 } } });
  });
  it("a client created with a readable code gets a stable UUID and keeps the code", async () => {
    await bridge.doc("clients/nuovo-cliente").set({ nome: "Nuovo cliente", gg: 30 });
    const [o] = await ops();
    expect(o!.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(o!.p).toMatchObject({ name: "Nuovo cliente", short_code: "nuovo-cliente", payment_days: 30 });
  });
  it("PDF uploaded in the session: attachment record is queued before the invoice link", async () => {
    await bridge.doc(`invoices/${INV}`).update({ pdf: { id: "ffffffff-0000-4000-8000-000000000001", url: "x", nome: "f.pdf" } });
    const o = await ops();
    expect(o.map((x) => x.e)).toEqual(["attachments", "invoices"]);
    expect(o[0]!.p).toMatchObject({ entity: "invoices", record_id: INV, mime_type: "application/pdf", size_bytes: 1234 });
    expect(o[1]!.p).toEqual({ attachment_id: "ffffffff-0000-4000-8000-000000000001" });
  });
  it("delete removes the invoice and its lines", async () => {
    await bridge.doc(`invoices/${INV}`).delete();
    expect((await ops()).map((x) => `${x.e}:${x.t}`)).toEqual(["invoice_lines:delete", "invoice_lines:delete", "invoices:delete"]);
  });
  it("history and calendar bookkeeping writes are ignored", async () => {
    await bridge.doc("storico/123").set({ a: 1 }); await bridge.doc("calsync/k").delete();
    expect(await ops()).toEqual([]);
  });
});
