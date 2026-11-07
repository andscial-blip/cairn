import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/calendario/[token]/route";

const TOKEN = "A".repeat(43);
const call = (t: string) => GET(new Request(`http://x/api/calendario/${t}`), { params: Promise.resolve({ token: t }) });

describe("calendar feed route", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://sb.test"; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "pub-key";
    fetchMock = vi.fn(async (_u: string, init: RequestInit) => new Response(JSON.stringify(JSON.parse(String(init.body)).p_token === TOKEN ? "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n" : null), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());
  it("serves the ICS for a valid token (with or without .ics)", async () => {
    for (const t of [TOKEN, `${TOKEN}.ics`]) {
      const r = await call(t);
      expect(r.status).toBe(200);
      expect(r.headers.get("content-type")).toBe("text/calendar; charset=utf-8");
      expect(await r.text()).toContain("BEGIN:VCALENDAR");
    }
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://sb.test/rest/v1/rpc/calendar_ics");
    expect((init as RequestInit).headers).toMatchObject({ apikey: "pub-key" });
  });
  it("404 for unknown tokens, and malformed tokens never reach the database", async () => {
    expect((await call("B".repeat(43))).status).toBe(404);
    const n = fetchMock.mock.calls.length;
    for (const bad of ["short", "../../etc", "A".repeat(44), "' or 1=1"]) expect((await call(bad)).status).toBe(404);
    expect(fetchMock.mock.calls.length).toBe(n);
  });
});
