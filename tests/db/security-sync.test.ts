import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type pg from "pg";
import { randomUUID } from "node:crypto";
import { freshDb, createUser, bootstrapLedger, as, op, apply } from "./helpers";

let c: pg.Client;
let owner: string, reader: string, operator: string, stranger: string, ledgerA: string, ledgerB: string, otherOwner: string;

beforeAll(async () => {
  c = await freshDb();
  owner = await createUser(c, "owner@example.test");
  reader = await createUser(c, "reader@example.test");
  operator = await createUser(c, "operator@example.test");
  stranger = await createUser(c, "stranger@example.test");
  otherOwner = await createUser(c, "other@example.test");
  ledgerA = await bootstrapLedger(c, owner, "A");
  ledgerB = await bootstrapLedger(c, otherOwner, "B");
  await as(c, owner, async () => {
    await c.query("select public.admin_set_member($1,$2,'read_only')", [ledgerA, reader]);
    await c.query("select public.admin_set_member($1,$2,'operator')", [ledgerA, operator]);
  });
});
afterAll(async () => { await c.end(); });

describe("create, read and idempotency", () => {
  it("owner creates a client through apply_operation and reads it back", async () => {
    const id = randomUUID();
    const r = await as(c, owner, () => apply(c, op(ledgerA, "clients", id, { name: "YouSud ODV", payment_terms: { dayOfMonth: 5 } })));
    expect(r).toMatchObject({ status: "applied", version: 1 });
    const rows = await as(c, owner, () => c.query("select name, version, created_by from clients where id = $1", [id]));
    expect(rows.rows[0]).toMatchObject({ name: "YouSud ODV", version: 1, created_by: owner });
  });

  it("replaying the same op_id never duplicates (offline retry / double send)", async () => {
    const id = randomUUID();
    const o = op(ledgerA, "clients", id, { name: "Altromercato" });
    const first = await as(c, operator, () => apply(c, o));
    const second = await as(c, operator, () => apply(c, o));
    expect(first).toMatchObject({ status: "applied", version: 1 });
    expect(second).toMatchObject({ status: "applied", duplicate: true });
    const n = await as(c, owner, () => c.query("select count(*)::int n, max(version) v from clients where id=$1", [id]));
    expect(n.rows[0]).toEqual({ n: 1, v: 1 });
  });

  it("someone else cannot reuse another user's op_id", async () => {
    const o = op(ledgerA, "clients", randomUUID(), { name: "X" });
    await as(c, owner, () => apply(c, o));
    await expect(as(c, operator, () => apply(c, o))).rejects.toThrow(/op_id already used/);
  });
});

describe("optimistic concurrency and conflicts", () => {
  it("detects concurrent edits, keeps the server copy and reports it", async () => {
    const id = randomUUID();
    await as(c, owner, () => apply(c, op(ledgerA, "clients", id, { name: "Base" })));
    // Device 1 edits on version 1 → version 2.
    const d1 = await as(c, owner, () => apply(c, op(ledgerA, "clients", id, { name: "Device 1" }, { base_version: 1 })));
    expect(d1).toMatchObject({ status: "applied", version: 2 });
    // Device 2 also edited version 1 while offline → conflict, not overwrite.
    const d2 = await as(c, operator, () => apply(c, op(ledgerA, "clients", id, { name: "Device 2" }, { base_version: 1 })));
    expect(d2.status).toBe("conflict");
    expect((d2.server as { name: string }).name).toBe("Device 1");
    const row = await as(c, owner, () => c.query("select name, version from clients where id=$1", [id]));
    expect(row.rows[0]).toEqual({ name: "Device 1", version: 2 });
    const log = await as(c, owner, () => c.query("select outcome, user_id from audit_logs where record_id=$1 and action='sync'", [id]));
    expect(log.rows[0]?.user_id).toBe(operator);
    expect(log.rows.map((r) => r.outcome)).toContain("conflict");
  });

  it("direct table writes must also bump the version by exactly one", async () => {
    const id = randomUUID();
    await as(c, owner, () => apply(c, op(ledgerA, "clients", id, { name: "V" })));
    await expect(as(c, owner, () => c.query("update clients set name='hack' where id=$1", [id]))).rejects.toThrow(/version_conflict/);
    await as(c, owner, () => c.query("update clients set name='ok', version=2 where id=$1", [id]));
  });

  it("delete is a versioned soft delete that propagates to other devices", async () => {
    const id = randomUUID();
    await as(c, owner, () => apply(c, op(ledgerA, "clients", id, { name: "To delete" })));
    const r = await as(c, owner, () => apply(c, op(ledgerA, "clients", id, {}, { op_type: "delete", base_version: 1 })));
    expect(r).toMatchObject({ status: "applied", version: 2 });
    const row = await as(c, reader, () => c.query("select deleted_at is not null as gone, version from clients where id=$1", [id]));
    expect(row.rows[0]).toEqual({ gone: true, version: 2 });
  });

  it("invalid data is rejected with a reason and recorded, not half-applied", async () => {
    const cl = randomUUID();
    await as(c, owner, () => apply(c, op(ledgerA, "clients", cl, { name: "C" })));
    const inv = { client_id: cl, year: 2026, number: 1, issue_date: "2026-01-10" };
    expect(await as(c, owner, () => apply(c, op(ledgerA, "invoices", randomUUID(), inv)))).toMatchObject({ status: "applied" });
    const dup = await as(c, owner, () => apply(c, op(ledgerA, "invoices", randomUUID(), inv)));
    expect(dup).toMatchObject({ status: "rejected", code: "23505" });
    const bad = await as(c, owner, () => apply(c, op(ledgerA, "invoice_lines", randomUUID(), { invoice_id: randomUUID(), description: "x", unit_price: -5 })));
    expect(bad.status).toBe("rejected");
  });
});

describe("authorization (RLS)", () => {
  it("a user outside the ledger sees nothing and cannot write", async () => {
    const n = await as(c, stranger, () => c.query("select count(*)::int n from clients"));
    expect(n.rows[0].n).toBe(0);
    expect(await as(c, stranger, () => apply(c, op(ledgerA, "clients", randomUUID(), { name: "intrusion" })))).toMatchObject({ status: "rejected", code: "42501" });
    await expect(as(c, stranger, () => c.query("insert into clients (id, ledger_id, name) values ($1,$2,'x')", [randomUUID(), ledgerA]))).rejects.toThrow(/row-level security/);
  });

  it("anonymous requests read nothing", async () => {
    await expect(as(c, null, () => c.query("select count(*) from clients"))).rejects.toThrow(/permission denied/);
  });

  it("read-only members can read but not write", async () => {
    const n = await as(c, reader, () => c.query("select count(*)::int n from clients"));
    expect(n.rows[0].n).toBeGreaterThan(0);
    expect(await as(c, reader, () => apply(c, op(ledgerA, "clients", randomUUID(), { name: "nope" })))).toMatchObject({ status: "rejected", code: "42501" });
  });

  it("ledgers are isolated from each other, including cross-ledger references", async () => {
    const n = await as(c, owner, () => c.query("select count(*)::int n from ledgers"));
    expect(n.rows[0].n).toBe(1);
    const clA = randomUUID();
    await as(c, owner, () => apply(c, op(ledgerA, "clients", clA, { name: "A-client" })));
    // otherOwner tries to attach an invoice in ledger B to a client of ledger A.
    const r = await as(c, otherOwner, () => apply(c, op(ledgerB, "invoices", randomUUID(), { client_id: clA, year: 2026, number: 9, issue_date: "2026-02-01" })));
    expect(r.status).toBe("rejected");
    // and cannot overwrite a ledger-A record by naming it under ledger B
    const r2 = await as(c, otherOwner, () => apply(c, op(ledgerB, "clients", clA, { name: "stolen" }, { base_version: 1 })));
    expect(r2.status).not.toBe("applied");
    const row = await as(c, owner, () => c.query("select name from clients where id=$1", [clA]));
    expect(row.rows[0].name).toBe("A-client");
  });

  it("privilege escalation attempts fail and are audited", async () => {
    const esc = await as(c, operator, () => c.query("select public.admin_set_member($1,$2,'super_admin') as r", [ledgerA, operator]));
    expect(esc.rows[0].r).toEqual({ ok: false, error: "not authorized" });
    const sus = await as(c, operator, () => c.query("select public.admin_set_user_status($1,'suspended') as r", [owner]));
    expect(sus.rows[0].r.ok).toBe(false);
    await expect(as(c, operator, () => c.query("insert into ledger_members (ledger_id,user_id,role) values ($1,$2,'admin')", [ledgerA, stranger]))).rejects.toThrow(/row-level security/);
    await expect(as(c, operator, () => c.query("update profiles set status='active' where id=$1", [operator]))).rejects.toThrow(/permission denied/);
    await expect(as(c, operator, () => c.query("select public.bootstrap_ledger($1,'mine')", [operator]))).rejects.toThrow(/permission denied/);
    const denied = await as(c, owner, () => c.query("select count(*)::int n from audit_logs where outcome='denied' and user_id=$1", [operator]));
    expect(denied.rows[0].n).toBeGreaterThan(0);
  });

  it("the audit log cannot be altered by anyone through the API", async () => {
    await expect(as(c, owner, () => c.query("update audit_logs set outcome='ok'"))).rejects.toThrow(/permission denied|append-only/);
    await expect(as(c, owner, () => c.query("delete from audit_logs"))).rejects.toThrow(/permission denied|append-only/);
    await expect(as(c, owner, () => c.query("insert into audit_logs (action, entity) values ('create','x')"))).rejects.toThrow(/permission denied/);
    await c.query("reset role");
    await expect(c.query("delete from audit_logs")).rejects.toThrow(/append-only/);
  });

  it("audit entries carry user, entity, record, op id and offline origin", async () => {
    const id = randomUUID();
    const o = op(ledgerA, "clients", id, { name: "Audited" }, { origin: "offline" });
    await as(c, operator, () => apply(c, o));
    const r = await as(c, owner, () => c.query("select user_id, action, entity, op_id, origin, outcome from audit_logs where record_id=$1", [id]));
    expect(r.rows[0]).toEqual({ user_id: operator, action: "create", entity: "clients", op_id: o.op_id, origin: "offline", outcome: "ok" });
  });

  it("suspended accounts lose all access immediately, including pending sync", async () => {
    await as(c, owner, () => c.query("select public.admin_set_user_status($1,'suspended')", [operator]));
    const n = await as(c, operator, () => c.query("select count(*)::int n from clients"));
    expect(n.rows[0].n).toBe(0);
    expect(await as(c, operator, () => apply(c, op(ledgerA, "clients", randomUUID(), { name: "queued offline" })))).toMatchObject({ status: "rejected", code: "42501" });
    const self = await as(c, owner, () => c.query("select public.admin_set_user_status($1,'suspended') as r", [owner]));
    expect(self.rows[0].r).toEqual({ ok: false, error: "cannot suspend yourself" });
    await as(c, owner, () => c.query("select public.admin_set_user_status($1,'active')", [operator]));
    const back = await as(c, operator, () => c.query("select count(*)::int n from clients"));
    expect(back.rows[0].n).toBeGreaterThan(0);
  });

  it("storage objects are scoped to the ledger in the path", async () => {
    await c.query("reset role");
    await as(c, owner, () => c.query("insert into storage.objects (bucket_id, name) values ('attachments', $1)", [`${ledgerA}/${randomUUID()}/f.pdf`]));
    await expect(as(c, owner, () => c.query("insert into storage.objects (bucket_id, name) values ('attachments', $1)", [`${ledgerB}/${randomUUID()}/f.pdf`]))).rejects.toThrow(/row-level security/);
    const seen = await as(c, stranger, () => c.query("select count(*)::int n from storage.objects"));
    expect(seen.rows[0].n).toBe(0);
  });
});
