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
  await a.query(`drop database if exists "${dbName}" with (force)`);
  await a.query(`create database "${dbName}"`);
  await a.end();
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  const run = async (file) => { await c.query(readFileSync(file, "utf8")); };
  await run("tests/db/supabase-stub.sql");
  for (const f of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
    await run(join("supabase/migrations", f));
  }
  await run("tests/db/grants.sql");
  await c.end();
}

if (process.argv[2] === "reset") {
  resetDatabase().then(() => console.log(`reset ${dbName}: ok`)).catch((e) => { console.error(e.message); process.exit(1); });
}
