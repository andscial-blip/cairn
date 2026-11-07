import { describe, it, expect } from "vitest";
import { issueGrant, checkOfflineAccess } from "@/offline/session";
import { nextDelayMs } from "@/offline/backoff";

describe("offline session", () => {
  const t0 = Date.parse("2026-11-07T08:00:00Z");
  it("a device that never logged in online cannot work offline", () => {
    expect(checkOfflineAccess(null, t0)).toEqual({ ok: false, reason: "never-logged-in" });
  });
  it("a grant is valid for the configured hours, then expires", () => {
    const g = issueGrant("u", "a@b.c", "d", t0, 168);
    expect(checkOfflineAccess(g, t0 + 167 * 3600_000).ok).toBe(true);
    expect(checkOfflineAccess(g, t0 + 168 * 3600_000)).toEqual({ ok: false, reason: "expired" });
  });
  it("a grant is bound to its user", () => {
    expect(checkOfflineAccess(issueGrant("u", "a", "d", t0), t0, "other")).toEqual({ ok: false, reason: "other-user" });
  });
  it("grants never contain secrets", () => {
    expect(Object.keys(issueGrant("u", "a", "d", t0)).sort()).toEqual(["deviceId", "email", "expiresAt", "grantedAt", "userId"]);
  });
});

describe("backoff", () => {
  it("grows exponentially and is capped at 15 minutes", () => {
    const mid = () => 0.5;
    expect([1, 2, 3, 4].map((a) => nextDelayMs(a, mid))).toEqual([1500, 3000, 6000, 12000]);
    expect(nextDelayMs(50, () => 1)).toBe(15 * 60 * 1000);
  });
});
