/**
 * Trading 212 read-only bridge: POST /api/t212 with the user's Supabase session (Bearer token).
 * The Trading 212 key and secret live only in the server environment (T212_API_KEY, T212_API_SECRET);
 * they never reach the browser. Only members who can write to the ledger may call it.
 */
import { normalisePositions } from "@/lib/t212";

export const dynamic = "force-dynamic";
const T212 = "https://live.trading212.com/api/v0";
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function POST(req: Request) {
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = process.env.T212_API_KEY, secret = process.env.T212_API_SECRET;
  const bearer = req.headers.get("authorization") ?? "";
  if (!sbUrl || !anon) return json({ code: "not_configured" }, 503);
  if (!/^Bearer [\w.-]+$/.test(bearer)) return json({ code: "unauthorized" }, 401);
  // 1) Who is calling: a signed-in member with write access to a ledger.
  const u = await fetch(`${sbUrl}/auth/v1/user`, { headers: { apikey: anon, authorization: bearer }, cache: "no-store" });
  if (!u.ok) return json({ code: "unauthorized" }, 401);
  const user = (await u.json()) as { id?: string };
  const m = await fetch(`${sbUrl}/rest/v1/ledger_members?select=role&user_id=eq.${encodeURIComponent(user.id ?? "")}`, { headers: { apikey: anon, authorization: bearer }, cache: "no-store" });
  const roles = m.ok ? ((await m.json()) as { role: string }[]) : [];
  if (!roles.some((r) => r.role !== "read_only")) return json({ code: "forbidden" }, 403);
  if (!key || !secret) return json({ code: "t212_not_configured" }, 503);
  // 2) Trading 212, read-only calls.
  const auth = "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
  const get = (p: string) => fetch(`${T212}${p}`, { headers: { authorization: auth }, cache: "no-store", signal: AbortSignal.timeout(12_000) });
  try {
    const pr = await get("/equity/positions");
    if (pr.status === 401) return json({ code: "t212_bad_key" }, 502);
    if (pr.status === 403) return json({ code: "t212_scope", scope: "portfolio" }, 502);
    if (pr.status === 429) return json({ code: "t212_rate" }, 429);
    if (!pr.ok) return json({ code: "t212_error", status: pr.status }, 502);
    const positions = normalisePositions(await pr.json());
    let cash: number | null = null, total: number | null = null, currency: string | null = null;
    const sr = await get("/equity/account/summary").catch(() => null);
    if (sr?.ok) {
      const s = (await sr.json()) as Record<string, unknown>;
      const num = (v: unknown) => (typeof v === "number" ? v : null);
      const c = s.cash as Record<string, unknown> | undefined;
      // cash = available to trade + uninvested cash in pies (+ reserved for orders); totalValue = whole account.
      const cs = [num(c?.availableToTrade), num(c?.inPies), num(c?.reservedForOrders)].filter((x): x is number => x !== null);
      cash = cs.length ? cs.reduce((a, b) => a + b, 0) : null;
      total = num(s.totalValue);
      currency = typeof s.currency === "string" ? s.currency : null;
    }
    return json({ positions, cash, total, currency, at: new Date().toISOString() });
  } catch (e) {
    return json({ code: "t212_unreachable", message: (e as Error).message.slice(0, 120) }, 504);
  }
}
