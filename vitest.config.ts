import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };
export default defineConfig({
  test: {
    projects: [
      { resolve: { alias }, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node", setupFiles: ["tests/unit/setup.ts"] } },
      // DB tests need a Postgres reachable via TEST_DATABASE_URL (see scripts/db-local.mjs and CI).
      { resolve: { alias }, test: { name: "db", include: ["tests/db/**/*.test.ts"], environment: "node", fileParallelism: false, testTimeout: 20000 } },
    ],
  },
});
