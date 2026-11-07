// Recreates a local test database that mimics Supabase and applies all migrations in order.
// Usage: node scripts/db-local.mjs reset   (uses TEST_DATABASE_URL or a local default)
import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const url = process.env.TEST_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/cef_test";
const target = new URL(url);
const dbName = target.pathname.slice(1);
const admin = new URL(url); admin.pathname = "/postgres";

export async function resetDatabase() {
  const a = new pg.Client({ connectionString: admin.toString() });
  await a.connect();
  // Test files may reset in quick succession: serialise drop/create with an advisory lock.
  await a.query("select pg_advisory_lock(424242)");
  try {
    await a.query(`drop database if exists "${dbName}" with (force)`);
    await a.query(`create database "${dbName}"`);
  } finally { await a.query("select pg_advisory_unlock(424242)"); await a.end(); }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const run = async (file) => { await c.query(readFileSync(file, "utf8")); };
  await run("tests/db/supabase-stub.sql");
  const migrations = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
  // Supabase grants broad table privileges by default; emulate that, then re-run the
  // hardening migration so the effective privileges match production exactly.
  for (const f of migrations) await run(join("supabase/migrations", f));
  await run("tests/db/grants.sql");
  for (const f of migrations.filter((m) => m.includes("hardening"))) await run(join("supabase/migrations", f));
  // Deliberate public endpoints, granted after hardening in production order: re-apply them last.
  for (const f of migrations) {
    const sql = readFileSync(join("supabase/migrations", f), "utf8");
    for (const m of sql.matchAll(/-- @public-grant\n([^\n]+)/g)) await c.query(m[1]);
  }
  await c.end();
}

if (process.argv[2] === "reset") {
  resetDatabase().then(() => console.log(`reset ${dbName}: ok`)).catch((e) => { console.error(e.message); process.exit(1); });
}
