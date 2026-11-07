"use client";
import Link from "next/link";
import { useApp } from "@/lib/app-context";

const ago = (iso: string | null) => {
  if (!iso) return "mai";
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "adesso"; if (s < 3600) return `${Math.round(s / 60)} min fa`; if (s < 86400) return `${Math.round(s / 3600)} h fa`;
  return new Date(iso).toLocaleDateString("it-IT");
};

/** Always-visible sync state: online/offline, pending operations, conflicts, last sync. */
export function SyncBadge() {
  const { status, auth } = useApp();
  if (auth.kind !== "ready") return null;
  const online = status?.online ?? !auth.offline;
  const tone = status?.authProblem || (status?.conflicts ?? 0) > 0 || (status?.failed ?? 0) > 0 ? "late" : (status?.pending ?? 0) > 0 ? "soon" : "far";
  const label = status?.authProblem ? "Accedi di nuovo per sincronizzare"
    : !online ? `Offline${status?.pending ? ` · ${status.pending} in attesa` : ""}`
    : status?.syncing ? "Sincronizzazione…"
    : status?.conflicts ? `${status.conflicts} conflitt${status.conflicts > 1 ? "i" : "o"} da risolvere`
    : status?.failed ? `${status.failed} operazion${status.failed > 1 ? "i" : "e"} rifiutat${status.failed > 1 ? "e" : "a"}`
    : status?.pending ? `${status.pending} in attesa di invio`
    : `Sincronizzato · ${ago(status?.lastSyncAt ?? null)}`;
  return (
    <Link href="/sincronizzazione" className={`cdp ${tone}`} style={{ textDecoration: "none", whiteSpace: "nowrap" }} aria-live="polite" title="Stato della sincronizzazione">
      <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, marginRight: 6, background: online ? "var(--green-soft)" : "var(--tax)" }} />
      <span className={tone === "far" ? "sb-hide-sm" : undefined}>{label}</span>
    </Link>
  );
}
