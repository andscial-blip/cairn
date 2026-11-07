import { describe, it, expect, beforeEach } from "vitest";
import { LocalDB } from "@/offline/db";
import { SyncEngine } from "@/offline/engine";
import { saveRecord, deleteRecord, type MutationContext } from "@/offline/mutations";
import { nextDelayMs } from "@/offline/backoff";
import { FakeServer } from "./fake-server";

const LEDGER = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

let db: LocalDB, server: FakeServer, engine: SyncEngine, ctx: MutationContext, online: boolean, now: number;

beforeEach(async () => {
  db = new LocalDB(`test-${Math.random()}`);
  server = new FakeServer();
  online = true; now = Date.parse("2026-11-07T08:00:00Z");
  engine = new SyncEngine({ db, transport: server, ledgerId: LEDGER, isOnline: () => online, now: () => now, rand: () => 0.5 });
  ctx = { db, userId: USER, ledgerId: LEDGER, uuid };
});

describe("offline queue", () => {
  it("an offline insert is visible locally at once and queued with full metadata", async () => {
    online = false;
    const id = await saveRecord(ctx, "clients", null, { name: "YouSud" });
    await engine.run();
    expect((await db.rows("clients").get(id))?.name).toBe("YouSud");
    const [op] = await db.outbox.toArray();
    expect(op).toMatchObject({ user_id: USER, entity: "clients", record_id: id, op_type: "upsert", status: "pending", attempts: 0, base_version: null });
    expect(op!.op_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(server.calls).toBe(0);
  });

  it("the queue survives closing and reopening the app", async () => {
    online = false;
    await saveRecord(ctx, "invoices", null, { number: 17 });
    const name = db.name; db.close();
    const reopened = new LocalDB(name); await reopened.open();
    expect(await reopened.outbox.where("status").equals("pending").count()).toBe(1);
  });

  it("several edits to the same unsent record become one operation", async () => {
    online = false;
    const id = await saveRecord(ctx, "clients", null, { name: "A" });
    await saveRecord(ctx, "clients", id, { country: "MU" });
    const ops = await db.outbox.toArray();
    expect(ops).toHaveLength(1);
    expect(ops[0]!.payload).toEqual({ name: "A", country: "MU" });
  });

  it("deleting a never-synced record just drops it", async () => {
    online = false;
    const id = await saveRecord(ctx, "reminders", null, { title: "x" });
    await deleteRecord(ctx, "reminders", id);
    expect(await db.outbox.count()).toBe(0);
    expect(await db.rows("reminders").get(id)).toBeUndefined();
  });
});

describe("synchronization", () => {
  it("syncs when the connection comes back and marks everything synced", async () => {
    online = false;
    const id = await saveRecord(ctx, "clients", null, { name: "Altromercato" });
    online = true;
    await engine.run();
    const [op] = await db.outbox.toArray();
    expect(op!.status).toBe("synced");
    expect(await db.rows("clients").get(id)).toMatchObject({ version: 1, _dirty: 0 });
    expect((await engine.status()).pending).toBe(0);
  });

  it("network failure → retry with backoff, then success; order preserved", async () => {
    await saveRecord(ctx, "clients", null, { name: "first" });
    await saveRecord(ctx, "clients", null, { name: "second" });
    server.failNext = 1;
    await engine.run();
    let ops = await db.outbox.orderBy("seq").toArray();
    expect(ops.map((o) => o.status)).toEqual(["pending", "pending"]);
    expect(ops[0]!.attempts).toBe(1);
    expect(ops[0]!.next_attempt_at).toBe(now + nextDelayMs(1, () => 0.5));
    await engine.run();                       // too early: backoff not elapsed
    expect(server.calls).toBe(1);
    now += 60_000;
    await engine.run();
    ops = await db.outbox.orderBy("seq").toArray();
    expect(ops.map((o) => o.status)).toEqual(["synced", "synced"]);
  });

  it("a lost response followed by a retry creates no duplicate (idempotent)", async () => {
    const id = await saveRecord(ctx, "invoices", null, { number: 18 });
    server.dropAfterApply = 1;
    await engine.run();
    now += 60_000;
    await engine.run();
    expect([...server.rows.keys()].filter((k) => k.endsWith(id))).toHaveLength(1);
    expect((await db.outbox.toArray())[0]!.status).toBe("synced");
    expect(server.rows.get(`invoices:${id}`)!.version).toBe(1);
  });

  it("an interrupted sync (app killed mid-request) is recovered at next start", async () => {
    await saveRecord(ctx, "clients", null, { name: "x" });
    const [op] = await db.outbox.toArray();
    await db.outbox.update(op!.op_id, { status: "syncing" });
    expect(await engine.recover()).toBe(1);
    await engine.run();
    expect((await db.outbox.get(op!.op_id))!.status).toBe("synced");
  });

  it("edits made while a previous op was in flight are re-based, not turned into conflicts", async () => {
    const id = await saveRecord(ctx, "clients", null, { name: "v1" });
    await engine.run();
    await saveRecord(ctx, "clients", id, { name: "v2" });
    await engine.run();
    await saveRecord(ctx, "clients", id, { name: "v3" });
    await saveRecord(ctx, "clients", id, { notes: "n" });
    await engine.run();
    expect(server.rows.get(`clients:${id}`)).toMatchObject({ name: "v3", notes: "n", version: 3 });
    expect(await db.conflicts.count()).toBe(0);
  });

  it("concurrent edit elsewhere → conflict kept with both versions; resolution is explicit", async () => {
    const id = await saveRecord(ctx, "clients", null, { name: "Base" });
    await engine.run();
    server.remoteEdit("clients", id, { name: "Other device" });
    online = false;
    await saveRecord(ctx, "clients", id, { name: "This device" });
    online = true;
    await engine.run();
    const [c] = await db.conflicts.toArray();
    expect(c).toMatchObject({ record_id: id, local: { name: "This device" }, server_version: 2 });
    expect((c!.server as { name: string }).name).toBe("Other device");
    expect(server.rows.get(`clients:${id}`)!.name).toBe("Other device");      // not overwritten
    expect((await db.rows("clients").get(id))!.name).toBe("This device");     // local data preserved
    expect((await engine.status()).conflicts).toBe(1);
    await engine.resolveConflict(c!.op_id, "local", { uuid });
    await engine.run();
    expect(server.rows.get(`clients:${id}`)).toMatchObject({ name: "This device", version: 3 });
    expect(await db.conflicts.count()).toBe(0);
  });

  it("choosing the server version replaces the local copy", async () => {
    const id = await saveRecord(ctx, "clients", null, { name: "Base" });
    await engine.run();
    server.remoteEdit("clients", id, { name: "Server wins" });
    await saveRecord(ctx, "clients", id, { name: "Mine" });
    await engine.run();
    const [c] = await db.conflicts.toArray();
    await engine.resolveConflict(c!.op_id, "server");
    expect(await db.rows("clients").get(id)).toMatchObject({ name: "Server wins", version: 2, _dirty: 0 });
  });

  it("pull brings remote changes but never clobbers unsynced local edits", async () => {
    const a = await saveRecord(ctx, "clients", null, { name: "A" });
    const b = await saveRecord(ctx, "clients", null, { name: "B" });
    await engine.run();
    server.remoteEdit("clients", a, { name: "A remote" });
    server.remoteEdit("clients", b, { name: "B remote" });
    online = false;
    await saveRecord(ctx, "clients", b, { name: "B local" });
    online = true;
    await engine.pull();
    expect((await db.rows("clients").get(a))!.name).toBe("A remote");
    expect((await db.rows("clients").get(b))!.name).toBe("B local");
  });

  it("an expired session stops sync and keeps the queue", async () => {
    await saveRecord(ctx, "clients", null, { name: "x" });
    server.authFail = true;
    await engine.run();
    const s = await engine.status();
    expect(s.authProblem).toBe(true);
    expect(s.pending).toBe(1);
  });

  it("server rejection is permanent until the user retries; it is not retried in a loop", async () => {
    await saveRecord(ctx, "invoices", null, { number: 1 });
    const t = server.applyOperation.bind(server);
    server.applyOperation = async () => ({ status: "rejected", code: "23505", message: "numero fattura già usato" });
    await engine.run(); await engine.run();
    const [op] = await db.outbox.toArray();
    expect(op).toMatchObject({ status: "failed", last_error: "numero fattura già usato" });
    server.applyOperation = t;
    await engine.retryFailed(op!.op_id);
    await engine.run();
    expect((await db.outbox.get(op!.op_id))!.status).toBe("synced");
  });

  it("runs are serialized: overlapping triggers do not double-send", async () => {
    await saveRecord(ctx, "clients", null, { name: "x" });
    await Promise.all([engine.run(), engine.run(), engine.run()]);
    expect(server.calls).toBe(1);
  });
});
