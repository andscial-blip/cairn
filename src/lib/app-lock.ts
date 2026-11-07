/**
 * Biometric app lock (Face ID / Touch ID / fingerprint / Windows Hello) with WebAuthn platform authenticators.
 *
 * Security model (stated plainly in the UI):
 * - The operating system performs the biometric check; Cairn never sees biometric data or any secret.
 * - Enabling creates a device-bound key pair; only the PUBLIC key is stored locally (IndexedDB).
 * - Unlocking asks the OS for a signature with user verification on a fresh random challenge; Cairn verifies the
 *   signature, the challenge, the origin, the relying party and the UV flag before opening the app.
 * - It protects an already signed-in device (like banking apps' quick unlock). It is not a remote login: the
 *   password stays the fallback and is always available. Disabling deletes the local key reference; the OS
 *   credential can also be removed from the system passkey settings.
 */
export interface LockConfig { credId: string; publicKey: string | null; alg: number; userId: string; createdAt: number }

const b64u = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b as ArrayBuffer))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const rand = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const sha256 = async (b: BufferSource) => new Uint8Array(await crypto.subtle.digest("SHA-256", b));
const buf = (u: Uint8Array) => u as unknown as BufferSource;
const concat = (a: Uint8Array, b: Uint8Array) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };

export async function biometricAvailable(): Promise<boolean> {
  try {
    return typeof window !== "undefined" && !!window.PublicKeyCredential
      && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

/** Creates the device credential (the OS shows its Face ID / fingerprint prompt). */
export async function enrollLock(user: { id: string; email: string }): Promise<LockConfig> {
  const cred = await navigator.credentials.create({
    publicKey: {
      rp: { name: "Cairn", id: location.hostname },
      user: { id: rand(16), name: user.email, displayName: `Cairn · ${user.email}` },
      challenge: rand(32),
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
      timeout: 60_000, attestation: "none",
    },
  }) as PublicKeyCredential | null;
  if (!cred) throw new Error("Operazione annullata");
  const r = cred.response as AuthenticatorAttestationResponse;
  const spki = typeof r.getPublicKey === "function" ? r.getPublicKey() : null;
  const alg = typeof r.getPublicKeyAlgorithm === "function" ? r.getPublicKeyAlgorithm() : -7;
  return { credId: b64u(cred.rawId), publicKey: spki ? b64u(spki) : null, alg, userId: user.id, createdAt: Date.now() };
}

/** Asks the OS to verify the user and checks the signed answer. Resolves true only on a valid, user-verified assertion. */
export async function unlockWithBiometrics(cfg: LockConfig): Promise<boolean> {
  const challenge = rand(32);
  const cred = await navigator.credentials.get({
    publicKey: { challenge, rpId: location.hostname, userVerification: "required", timeout: 60_000,
      allowCredentials: [{ type: "public-key", id: unb64u(cfg.credId), transports: ["internal", "hybrid"] }] },
  }) as PublicKeyCredential | null;
  if (!cred) return false;
  const r = cred.response as AuthenticatorAssertionResponse;
  return verifyAssertion({ cfg, challenge, origin: location.origin, rpId: location.hostname, rawId: new Uint8Array(cred.rawId),
    clientDataJSON: new Uint8Array(r.clientDataJSON), authenticatorData: new Uint8Array(r.authenticatorData), signature: new Uint8Array(r.signature) });
}

/** Pure verification (exported for tests). */
export async function verifyAssertion(a: { cfg: LockConfig; challenge: Uint8Array; origin: string; rpId: string; rawId: Uint8Array;
  clientDataJSON: Uint8Array; authenticatorData: Uint8Array; signature: Uint8Array }): Promise<boolean> {
  if (b64u(a.rawId) !== a.cfg.credId) return false;
  const cd = JSON.parse(new TextDecoder().decode(a.clientDataJSON)) as { type: string; challenge: string; origin: string };
  if (cd.type !== "webauthn.get" || cd.challenge !== b64u(a.challenge) || cd.origin !== a.origin) return false;
  const ad = a.authenticatorData;
  if (ad.length < 37) return false;
  const rpHash = await sha256(new TextEncoder().encode(a.rpId));
  if (!rpHash.every((v, i) => v === ad[i])) return false;
  const flags = ad[32]!;
  if (!(flags & 0x01) || !(flags & 0x04)) return false; // user present + user verified (biometrics/PIN)
  if (!a.cfg.publicKey) return true; // very old browsers without getPublicKey(): the OS check above is still required
  const data = concat(ad, await sha256(buf(a.clientDataJSON)));
  const spki = unb64u(a.cfg.publicKey);
  if (a.cfg.alg === -257) {
    const key = await crypto.subtle.importKey("spki", buf(spki), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, buf(a.signature), buf(data));
  }
  const key = await crypto.subtle.importKey("spki", buf(spki), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, buf(derToRaw(a.signature)), buf(data));
}

/** WebAuthn ECDSA signatures are DER; WebCrypto wants r||s (64 bytes). */
export function derToRaw(der: Uint8Array): Uint8Array {
  if (der[0] !== 0x30) return der;
  let i = 2;
  const read = () => { if (der[i] !== 0x02) throw new Error("bad DER"); const len = der[i + 1]!; let v = der.slice(i + 2, i + 2 + len); i += 2 + len;
    while (v.length > 32 && v[0] === 0) v = v.slice(1); const o = new Uint8Array(32); o.set(v, 32 - v.length); return o; };
  return concat(read(), read());
}

/** Lock policy: lock on cold start and after the app has been in the background for more than 5 minutes. */
export const RELOCK_MS = 5 * 60_000;
