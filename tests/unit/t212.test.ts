import { describe, it, expect, vi, afterEach } from "vitest";
import { normalisePositions, applyPositions, shortTicker, type Holding } from "@/lib/t212";
import { POST } from "@/app/api/t212/route";

const pos = (isin: string, q: number, value: number, cost: number, ticker = "EUNLd_EQ") =>
  ({ instrument: { isin, ticker, name: "iShares " + isin, currency: "EUR" }, quantity: q, walletImpact: { currency: "EUR", currentValue: value, totalCost: cost, unrealizedProfitLoss: value - cost } });

describe("Trading 212 → holdings", () => {
  const cur: Holding[] = [
    { isin: "IE00B4L5Y983", ticker: "EUNL", nome: "Core MSCI World", classe: "az", quote: 25, costo: 2900, prezzoEur: 128, target: 60 },
    { isin: "IE000U58J0M1", ticker: "INRE", nome: "Clean Energy", classe: "tem", quote: 13, costo: 311, prezzoEur: 20, target: 5 },
  ];
  it("normalises positions and skips malformed ones", () => {
    const n = normalisePositions([pos("IE00B4L5Y983", 25.5, 3300, 2969), { instrument: {}, quantity: 3 }, { instrument: { isin: "X" }, quantity: 0, walletImpact: { currentValue: 1 } }]);
    expect(n).toHaveLength(1); expect(n[0]).toMatchObject({ isin: "IE00B4L5Y983", quantity: 25.5, value: 3300, cost: 2969 });
    expect(() => normalisePositions({ error: 1 })).toThrow();
  });
  it("updates units, cost and EUR price; keeps target and class; adds new; removes sold", () => {
    const d = applyPositions(cur, normalisePositions([pos("IE00B4L5Y983", 26, 3380, 3000), pos("IE00BKM4GZ66", 10, 300, 290, "EIMIl_EQ")]));
    const w = d.next.find((h) => h.isin === "IE00B4L5Y983")!;
    expect(w).toMatchObject({ quote: 26, costo: 3000, prezzoEur: 130, target: 60, classe: "az", ticker: "EUNL" });
    expect(d.next.find((h) => h.isin === "IE00BKM4GZ66")).toMatchObject({ ticker: "EIMI", quote: 10, target: 0 });
    expect(d.next.some((h) => h.isin === "IE000U58J0M1")).toBe(false);
    expect(d.changed.map((c) => [c.isin, !!c.before, !!c.after])).toEqual([["IE00B4L5Y983", true, true], ["IE00BKM4GZ66", false, true], ["IE000U58J0M1", true, false]]);
  });
  it("never applies an empty response (would delete every holding)", () => {
    expect(() => applyPositions(cur, [])).toThrow();
  });
  it("short tickers", () => { expect(shortTicker("EUNLd_EQ")).toBe("EUNL"); expect(shortTicker("AAPL_US_EQ")).toBe("AAPL"); });
});

describe("POST /api/t212", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  const env = () => { vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon"); vi.stubEnv("T212_API_KEY", "k"); vi.stubEnv("T212_API_SECRET", "s"); };
  const req = (auth?: string) => new Request("http://x/api/t212", { method: "POST", headers: auth ? { authorization: auth } : {} });
  const fake = (role: string | null, t212: (u: string, h: Headers) => Response) => vi.fn(async (u: string, init?: RequestInit) => {
    const h = new Headers(init?.headers);
    if (u.endsWith("/auth/v1/user")) return h.get("authorization") === "Bearer good" ? Response.json({ id: "u1" }) : new Response("no", { status: 401 });
    if (u.includes("/rest/v1/ledger_members")) return Response.json(role ? [{ role }] : []);
    return t212(u, h);
  });
  it("refuses without a session, with a bad session and for read-only members", async () => {
    env();
    expect((await POST(req())).status).toBe(401);
    vi.stubGlobal("fetch", fake("super_admin", () => new Response("x")));
    expect((await POST(req("Bearer bad"))).status).toBe(401);
    vi.stubGlobal("fetch", fake("read_only", () => new Response("x")));
    expect((await POST(req("Bearer good"))).status).toBe(403);
  });
  it("says when the key is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sb.test"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon"); vi.stubEnv("T212_API_KEY", ""); vi.stubEnv("T212_API_SECRET", "");
    vi.stubGlobal("fetch", fake("super_admin", () => new Response("x")));
    const r = await POST(req("Bearer good")); expect(r.status).toBe(503); expect((await r.json()).code).toBe("t212_not_configured");
  });
  it("calls Trading 212 with Basic auth and returns positions and cash", async () => {
    env();
    const f = fake("super_admin", (u, h) => {
      expect(h.get("authorization")).toBe("Basic " + Buffer.from("k:s").toString("base64"));
      if (u.endsWith("/equity/positions")) return Response.json([pos("IE00B4L5Y983", 25, 3250, 2969)]);
      if (u.endsWith("/equity/account/summary")) return Response.json({ currency: "EUR", totalValue: 5500, cash: { availableToTrade: 40, inPies: 2, reservedForOrders: 0 } });
      return new Response("?", { status: 404 });
    });
    vi.stubGlobal("fetch", f);
    const r = await POST(req("Bearer good")); const b = await r.json();
    expect(r.status).toBe(200); expect(b.positions[0]).toMatchObject({ isin: "IE00B4L5Y983", quantity: 25 }); expect(b).toMatchObject({ cash: 42, total: 5500, currency: "EUR" });
  });
  it("reads the history when asked, following nextPagePath; a missing permission does not block the positions", async () => {
    env();
    const seen: string[] = [];
    const t212 = (deny: boolean) => (u: string) => {
      seen.push(u.replace("https://live.trading212.com", ""));
      if (u.endsWith("/equity/positions")) return Response.json([pos("IE00B4L5Y983", 25, 3250, 2969)]);
      if (u.endsWith("/equity/account/summary")) return Response.json({ currency: "EUR", totalValue: 5500, cash: { availableToTrade: 40 } });
      if (deny && u.includes("/history/")) return new Response("", { status: 403 });
      if (u.includes("/history/transactions") && !u.includes("cursor")) return Response.json({ items: [{ type: "DEPOSIT", amount: 400, dateTime: "2026-10-01T08:00:00Z" }], nextPagePath: "/api/v0/equity/history/transactions?limit=50&cursor=abc" });
      if (u.includes("/history/transactions")) return Response.json({ items: [{ type: "DEPOSIT", amount: 400, dateTime: "2026-11-01T08:00:00Z" }], nextPagePath: null });
      if (u.includes("/history/orders")) return Response.json({ items: [], nextPagePath: null });
      if (u.includes("/history/dividends")) return Response.json({ items: [], nextPagePath: null });
      return new Response("?", { status: 404 });
    };
    const reqH = () => new Request("http://x/api/t212", { method: "POST", headers: { authorization: "Bearer good", "content-type": "application/json" }, body: JSON.stringify({ history: true }) });
    vi.stubGlobal("fetch", fake("super_admin", t212(false)));
    const b = await (await POST(reqH())).json();
    expect(b.history.transactions.map((t: { d: string }) => t.d.slice(0, 7))).toEqual(["2026-10", "2026-11"]);
    expect(seen).toContain("/api/v0/equity/history/transactions?limit=50&cursor=abc");
    vi.stubGlobal("fetch", fake("super_admin", t212(true)));
    const d = await (await POST(reqH())).json();
    expect(d.positions).toHaveLength(1); expect(d.history).toBeUndefined(); expect(d.historyError).toBe("scope");
    // without the flag, no history calls
    seen.length = 0; vi.stubGlobal("fetch", fake("super_admin", t212(false)));
    await POST(req("Bearer good")); expect(seen.some((u) => u.includes("/history/"))).toBe(false);
  });
  it("maps Trading 212 errors to clear codes", async () => {
    env();
    vi.stubGlobal("fetch", fake("super_admin", () => new Response("", { status: 403 })));
    expect((await (await POST(req("Bearer good"))).json()).code).toBe("t212_scope");
    vi.stubGlobal("fetch", fake("super_admin", () => new Response("", { status: 401 })));
    expect((await (await POST(req("Bearer good"))).json()).code).toBe("t212_bad_key");
  });
});
