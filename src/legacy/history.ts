/** Change history for the original "Cronologia modifiche" panel, built from the server audit log (previous values). */
import { COLL_TABLE, rowsToSnapshot } from "@/data/mapping";
import { mergeCfg } from "@/domain/engine";
import type { Entity, LocalRow } from "@/offline/types";

export interface AuditEntry { id: number; at: string; action: string; entity: string; record_id: string | null; details: { before?: Record<string, unknown> } }
export interface StoricoEntry { id: string; ts: string; azione: string; path: string; prima: Record<string, unknown> | null }

const T2C = Object.fromEntries(Object.entries(COLL_TABLE).map(([c, t]) => [t, c])) as Record<string, string>;
export const HISTORY_TABLES = [...Object.values(COLL_TABLE), "ledger_settings"];
const AZ: Record<string, string> = { create: "creazione", update: "modifica", delete: "eliminazione" };

export function auditToStorico(entries: AuditEntry[], rows: Partial<Record<Entity, LocalRow[]>>): StoricoEntry[] {
  const out: StoricoEntry[] = [];
  for (const e of entries) {
    if (!AZ[e.action] || !e.record_id) continue;
    const ts = e.at, azione = AZ[e.action]!, id = String(e.id);
    if (e.entity === "ledger_settings") { out.push({ id, ts, azione, path: "config/main", prima: (e.details.before?.data as Record<string, unknown>) ?? null }); continue; }
    const coll = T2C[e.entity]; if (!coll) continue;
    let prima: Record<string, unknown> | null = null;
    if (e.details.before) {
      // Rebuild the document from the previous row; children (invoice lines, holdings) are the current ones.
      const snap = rowsToSnapshot({ ...rows, [e.entity]: [{ ...e.details.before, id: e.record_id, deleted_at: null }] } as never, mergeCfg) as unknown as Record<string, { id: string }[]>;
      const d = snap[coll]?.find((x) => x.id === e.record_id);
      if (d) { prima = { ...d }; delete prima.id; }
    }
    out.push({ id, ts, azione, path: `${coll}/${e.record_id}`, prima });
  }
  return out;
}
