// Gmail inbox for e-invoice files: public entry point guarded by a token (only its hash stored), file checks, dedupe.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type pg from "pg";
import { createHash, randomBytes } from "node:crypto";
import { freshDb, createUser, bootstrapLedger, as } from "./helpers";

let c: pg.Client, owner: string, reader: string, stranger: string, ledger: string;
const token = randomBytes(32).toString("base64url");
const hash = (t: string) => createHash("sha256").update(t).digest();
const pdf = Buffer.from("%PDF-1.4 fattura").toString("base64");
const put = (t: string, name: string, b64 = pdf) => as(c, null, () => c.query("select public.einvoice_inbox_put($1,$2,'application/pdf',$3,now()) as r", [t, name, b64]));

beforeAll(async () => {
  c = await freshDb();
  owner = await createUser(c, "owner@example.test"); reader = await createUser(c, "reader@example.test"); stranger = await createUser(c, "s@example.test");
  ledger = await bootstrapLedger(c, owner, "A");
  await as(c, owner, () => c.query("select public.admin_set_member($1,$2,'read_only')", [ledger, reader]));
  await as(c, owner, () => c.query("insert into einvoice_inbox_tokens (ledger_id, token_hash) values ($1,$2)", [ledger, hash(token)]));
});
afterAll(async () => { await c.end(); });

describe("e-invoice inbox", () => {
  it("accepts a file with the right token, ignores the same file twice, refuses a wrong token and other file types", async () => {
    expect((await put(token, "Fattura_16_2026.pdf")).rows[0].r).toBe("ok");
    expect((await put(token, "copia.pdf")).rows[0].r).toBe("duplicate");
    await expect(put(randomBytes(32).toString("base64url"), "x.pdf")).rejects.toThrow(/invalid token/);
    await expect(put("' or 1=1 --", "x.pdf")).rejects.toThrow(/invalid token/);
    await expect(put(token, "virus.exe", Buffer.from("MZ").toString("base64"))).rejects.toThrow(/unsupported/);
    const r = await as(c, owner, () => c.query("select filename, mime, size, status from einvoice_inbox where ledger_id = $1", [ledger]));
    expect(r.rows).toEqual([{ filename: "Fattura_16_2026.pdf", mime: "application/pdf", size: 16, status: "new" }]);
    expect((await as(c, owner, () => c.query("select last_used_at from einvoice_inbox_tokens"))).rows[0].last_used_at).not.toBeNull();
  });
  it("tables are closed to anonymous users, read-only members and strangers", async () => {
    await expect(as(c, null, () => c.query("select * from einvoice_inbox"))).rejects.toThrow(/permission denied/);
    await expect(as(c, null, () => c.query("select * from einvoice_inbox_tokens"))).rejects.toThrow(/permission denied/);
    expect((await as(c, reader, () => c.query("select * from einvoice_inbox"))).rowCount).toBe(0);
    expect((await as(c, stranger, () => c.query("select * from einvoice_inbox"))).rowCount).toBe(0);
    expect((await as(c, reader, () => c.query("select * from einvoice_inbox_tokens"))).rowCount).toBe(0);
    await expect(as(c, reader, () => c.query("insert into einvoice_inbox_tokens (ledger_id, token_hash) values ($1,$2)", [ledger, hash("x")]))).rejects.toThrow();
  });
  it("the owner closes an item and clears its content; a new token revokes the old script", async () => {
    await as(c, owner, () => c.query("update einvoice_inbox set status = 'attached', content_b64 = null where ledger_id = $1", [ledger]));
    expect((await as(c, owner, () => c.query("select status, content_b64 from einvoice_inbox"))).rows[0]).toEqual({ status: "attached", content_b64: null });
    const t2 = randomBytes(32).toString("base64url");
    await as(c, owner, () => c.query("update einvoice_inbox_tokens set token_hash = $2 where ledger_id = $1", [ledger, hash(t2)]));
    await expect(put(token, "nuova.pdf", Buffer.from("%PDF nuova").toString("base64"))).rejects.toThrow(/invalid token/);
    expect((await put(t2, "nuova.pdf", Buffer.from("%PDF nuova").toString("base64"))).rows[0].r).toBe("ok");
  });
});
