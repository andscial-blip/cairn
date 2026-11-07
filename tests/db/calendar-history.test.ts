import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type pg from "pg";
import { randomUUID, createHash, randomBytes } from "node:crypto";
import { freshDb, createUser, bootstrapLedger, as, op, apply } from "./helpers";

let c: pg.Client, owner: string, reader: string, stranger: string, ledger: string;
const token = randomBytes(32).toString("base64url");
const hash = (t: string) => createHash("sha256").update(t).digest();

beforeAll(async () => {
  c = await freshDb();
  owner = await createUser(c, "owner@example.test"); reader = await createUser(c, "reader@example.test"); stranger = await createUser(c, "s@example.test");
  ledger = await bootstrapLedger(c, owner, "A");
  await as(c, owner, () => c.query("select public.admin_set_member($1,$2,'read_only')", [ledger, reader]));
});
afterAll(async () => { await c.end(); });

describe("calendar feed", () => {
  it("the owner publishes the feed; anyone with the token (and only the token) can read the ICS", async () => {
    await as(c, owner, () => c.query("insert into calendar_feeds (ledger_id, token_hash, ics) values ($1,$2,'BEGIN:VCALENDAR')", [ledger, hash(token)]));
    const ok = await as(c, null, () => c.query("select public.calendar_ics($1) as ics", [token]));
    expect(ok.rows[0].ics).toBe("BEGIN:VCALENDAR");
    const wrong = await as(c, null, () => c.query("select public.calendar_ics($1) as ics", [randomBytes(32).toString("base64url")]));
    expect(wrong.rows[0].ics).toBeNull();
    const bad = await as(c, null, () => c.query("select public.calendar_ics($1) as ics", ["' or 1=1 --"]));
    expect(bad.rows[0].ics).toBeNull();
  });
  it("the table itself is closed to anonymous users, read-only members and strangers", async () => {
    await expect(as(c, null, () => c.query("select * from calendar_feeds"))).rejects.toThrow(/permission denied/);
    expect((await as(c, reader, () => c.query("select * from calendar_feeds"))).rowCount).toBe(0);
    expect((await as(c, stranger, () => c.query("select * from calendar_feeds"))).rowCount).toBe(0);
    await expect(as(c, reader, () => c.query("insert into calendar_feeds (ledger_id, token_hash) values ($1,$2)", [ledger, hash("x")]))).rejects.toThrow();
  });
  it("rotating the token revokes the old link and is audited", async () => {
    const t2 = randomBytes(32).toString("base64url");
    await as(c, owner, () => c.query("update calendar_feeds set token_hash = $2 where ledger_id = $1", [ledger, hash(t2)]));
    expect((await as(c, null, () => c.query("select public.calendar_ics($1) as ics", [token]))).rows[0].ics).toBeNull();
    expect((await as(c, null, () => c.query("select public.calendar_ics($1) as ics", [t2]))).rows[0].ics).toBe("BEGIN:VCALENDAR");
    const a = await c.query("select details->>'event' as e from audit_logs where entity = 'calendar_feeds' order by id");
    expect(a.rows.map((r) => r.e)).toEqual(["feed_created", "feed_rotated"]);
  });
});

describe("history with previous values", () => {
  it("updates and deletes keep the previous version of the record", async () => {
    const id = randomUUID();
    await as(c, owner, async () => {
      await apply(c, op(ledger, "clients", id, { name: "Prima" }));
      await apply(c, op(ledger, "clients", id, { name: "Dopo" }, { base_version: 1 }));
      await apply(c, op(ledger, "clients", id, {}, { op_type: "delete", base_version: 2 }));
    });
    const r = await c.query("select action, details from audit_logs where entity = 'clients' and record_id = $1 order by id", [id]);
    expect(r.rows.map((x) => x.action)).toEqual(["create", "update", "delete"]);
    expect(r.rows[0].details.before).toBeUndefined();
    expect(r.rows[1].details.before).toMatchObject({ name: "Prima", version: 1 });
    expect(r.rows[2].details.before).toMatchObject({ name: "Dopo", version: 2 });
    expect(r.rows[1].details.before.ledger_id).toBeUndefined();
  });
  it("history stays private to the ledger's admins", async () => {
    expect((await as(c, stranger, () => c.query("select * from audit_logs where entity = 'clients'"))).rowCount).toBe(0);
  });
});
