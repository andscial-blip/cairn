/** Biometric unlock: the WebAuthn answer is accepted only if signed by the enrolled key, fresh, for this site, and user-verified. */
import { describe, it, expect, beforeAll } from "vitest";
import { verifyAssertion, derToRaw, type LockConfig } from "@/lib/app-lock";

const b64u = (b: ArrayBuffer | Uint8Array) => Buffer.from(b as Uint8Array).toString("base64url");
const toDer = (raw: Uint8Array) => { const int = (x: Uint8Array) => { let v = Array.from(x); while (v.length > 1 && v[0] === 0 && v[1]! < 0x80) v = v.slice(1); if (v[0]! >= 0x80) v = [0, ...v]; return [0x02, v.length, ...v]; };
  const body = [...int(raw.slice(0, 32)), ...int(raw.slice(32))]; return new Uint8Array([0x30, body.length, ...body]); };
const ORIGIN = "https://cairn.example", RP = "cairn.example";
let keys: CryptoKeyPair, cfg: LockConfig;
const rawId = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);

async function assertion(o: { challenge?: Uint8Array; signedChallenge?: Uint8Array; origin?: string; flags?: number; rp?: string; tamper?: boolean } = {}) {
  const challenge = o.challenge ?? crypto.getRandomValues(new Uint8Array(32));
  const clientDataJSON = new TextEncoder().encode(JSON.stringify({ type: "webauthn.get", challenge: b64u(o.signedChallenge ?? challenge), origin: o.origin ?? ORIGIN }));
  const rpHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(o.rp ?? RP)));
  const authenticatorData = new Uint8Array([...rpHash, o.flags ?? 0x05, 0, 0, 0, 7]);
  const cdHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataJSON));
  const raw = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, keys.privateKey, new Uint8Array([...authenticatorData, ...cdHash])));
  if (o.tamper) raw[10] = raw[10]! ^ 0xff;
  return { cfg, challenge, origin: ORIGIN, rpId: RP, rawId, clientDataJSON, authenticatorData, signature: toDer(raw) };
}

describe("biometric unlock verification", () => {
  beforeAll(async () => {
    keys = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    cfg = { credId: b64u(rawId), publicKey: b64u(new Uint8Array(await crypto.subtle.exportKey("spki", keys.publicKey))), alg: -7, userId: "u", createdAt: 0 };
  });
  it("accepts a fresh, user-verified assertion signed by the enrolled key", async () => {
    expect(await verifyAssertion(await assertion())).toBe(true);
  });
  it("rejects replayed challenges, other sites, other RP ids, missing user verification and tampered signatures", async () => {
    const replay = await assertion(); replay.challenge = crypto.getRandomValues(new Uint8Array(32));
    expect(await verifyAssertion(replay)).toBe(false);
    expect(await verifyAssertion(await assertion({ origin: "https://evil.example" }))).toBe(false);
    expect(await verifyAssertion(await assertion({ rp: "evil.example" }))).toBe(false);
    expect(await verifyAssertion(await assertion({ flags: 0x01 }))).toBe(false); // present but not verified (no Face ID / PIN)
    expect(await verifyAssertion(await assertion({ tamper: true }))).toBe(false);
  });
  it("rejects an assertion from another credential", async () => {
    const a = await assertion(); a.rawId = new Uint8Array([9, 9, 9]);
    expect(await verifyAssertion(a)).toBe(false);
  });
  it("converts DER signatures with leading zeros", () => {
    const raw = new Uint8Array(64).map((_, i) => (i === 0 || i === 32 ? 0x80 : i));
    expect(Array.from(derToRaw(toDer(raw)))).toEqual(Array.from(raw));
  });
});
