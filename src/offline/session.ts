/**
 * Offline session policy. No password or refresh token is stored by us: we only remember
 * that this device completed an online login, for whom, and until when offline work is allowed.
 */
export interface OfflineGrant { userId: string; email: string; deviceId: string; grantedAt: number; expiresAt: number; }

export const DEFAULT_OFFLINE_HOURS = 168; // 7 days

export function issueGrant(userId: string, email: string, deviceId: string, now = Date.now(), hours = DEFAULT_OFFLINE_HOURS): OfflineGrant {
  return { userId, email, deviceId, grantedAt: now, expiresAt: now + hours * 3600_000 };
}

export type OfflineAccess = { ok: true; grant: OfflineGrant } | { ok: false; reason: "never-logged-in" | "expired" | "other-user" };

export function checkOfflineAccess(grant: OfflineGrant | null | undefined, now = Date.now(), expectedUser?: string): OfflineAccess {
  if (!grant) return { ok: false, reason: "never-logged-in" };
  if (expectedUser && grant.userId !== expectedUser) return { ok: false, reason: "other-user" };
  if (now >= grant.expiresAt) return { ok: false, reason: "expired" };
  return { ok: true, grant };
}
