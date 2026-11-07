import { describe, it, expect } from "vitest";
import { isNetworkError, withTimeout } from "@/offline/net";

describe("network error detection (all browsers)", () => {
  it("recognises Safari/iOS, Chrome and Firefox wordings and supabase retryable errors", () => {
    for (const m of ["Load failed", "TypeError: Load failed", "Failed to fetch", "NetworkError when attempting to fetch resource.", "The Internet connection appears to be offline."])
      expect(isNetworkError({ message: m }), m).toBe(true);
    expect(isNetworkError({ name: "AuthRetryableFetchError", message: "Load failed", status: 0 })).toBe(true);
    expect(isNetworkError({ message: "upstream", status: 503 })).toBe(true);
  });
  it("does not mistake real answers for network problems", () => {
    expect(isNetworkError({ name: "AuthSessionMissingError", message: "Auth session missing!", status: 400 })).toBe(false);
    expect(isNetworkError({ message: "invalid JWT", status: 401 })).toBe(false);
    expect(isNetworkError({ message: "permission denied for table x", code: "42501" })).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
  it("times out hanging requests", async () => {
    await expect(withTimeout(new Promise(() => undefined), 20)).rejects.toMatchObject({ name: "TimeoutError" });
    expect(isNetworkError({ name: "TimeoutError", message: "timed out" })).toBe(true);
    await expect(withTimeout(Promise.resolve(7), 50)).resolves.toBe(7);
  });
});
