/**
 * Private calendar feed: GET /api/calendario/<token>.ics → the ICS text published by the app.
 * The token is the only credential (256-bit, stored hashed); no session, no data other than the calendar.
 */
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = token.replace(/\.ics$/i, "");
  const notFound = () => new Response("Not found", { status: 404, headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } });
  if (!/^[A-Za-z0-9_-]{43}$/.test(t)) return notFound();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Response("Not configured", { status: 503 });
  const r = await fetch(`${url}/rest/v1/rpc/calendar_ics`, {
    method: "POST", cache: "no-store", headers: { apikey: key, "content-type": "application/json" }, body: JSON.stringify({ p_token: t }),
  });
  if (!r.ok) return new Response("Temporarily unavailable", { status: 502, headers: { "cache-control": "no-store" } });
  const ics = (await r.json()) as string | null;
  if (!ics) return notFound();
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": 'inline; filename="cairn.ics"',
    "cache-control": "private, max-age=300", "x-robots-tag": "noindex" } });
}
