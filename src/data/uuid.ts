/** RFC 4122 UUID v5 (SHA-1, name-based). Deterministic ids make the legacy import idempotent. */
export const NS_CAIRN = "5b1f2a0e-7c3d-4e8a-9b6f-0c2d4e6f8a10";

function parseUuid(u: string): Uint8Array {
  const h = u.replace(/-/g, ""); const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return b;
}
function fmt(b: Uint8Array): string {
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export async function uuidv5(name: string, ns = NS_CAIRN): Promise<string> {
  const n = new TextEncoder().encode(name), nsb = parseUuid(ns);
  const buf = new Uint8Array(nsb.length + n.length); buf.set(nsb); buf.set(n, nsb.length);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-1", buf)).slice(0, 16);
  hash[6] = (hash[6]! & 0x0f) | 0x50; hash[8] = (hash[8]! & 0x3f) | 0x80;
  return fmt(hash);
}
