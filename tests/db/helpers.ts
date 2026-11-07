import pg from "pg";
import { randomUUID } from "node:crypto";
// @ts-expect-error plain ESM script without types
import { resetDatabase } from "../../scripts/db-local.mjs";

export const DB_URL = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/cef_test";

export async function freshDb(): Promise<pg.Client> {
  await resetDatabase();
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}

/** Creates an auth user (profile is created by trigger). Runs as the platform superuser. */
export async function createUser(c: pg.Client, email: string): Promise<string> {
  const id = randomUUID();
  await c.query("reset role");
  await c.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  return id;
}

export async function bootstrapLedger(c: pg.Client, owner: string, name = "Fascicolo test"): Promise<string> {
  await c.query("reset role");
  const r = await c.query("select public.bootstrap_ledger($1, $2) as id", [owner, name]);
  return r.rows[0].id as string;
}

/** Runs fn as the given user with the "authenticated" role, exactly like PostgREST does. */
export async function as<T>(c: pg.Client, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await c.query("reset role");
  await c.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await c.query(userId ? "set role authenticated" : "set role anon");
  try { return await fn(); } finally { await c.query("reset role"); }
}

export function op(ledger: string, entity: string, record: string, payload: object, extra: Partial<{ op_type: string; base_version: number | null; op_id: string; origin: string }> = {}) {
  return { op_id: extra.op_id ?? randomUUID(), ledger_id: ledger, entity, record_id: record, op_type: extra.op_type ?? "upsert",
           base_version: extra.base_version ?? null, origin: extra.origin ?? "offline", client_ts: new Date().toISOString(), payload };
}

export async function apply(c: pg.Client, o: object): Promise<Record<string, unknown>> {
  const r = await c.query("select public.apply_operation($1::jsonb) as r", [JSON.stringify(o)]);
  return r.rows[0].r;
}
