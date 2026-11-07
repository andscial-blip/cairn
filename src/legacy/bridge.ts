/**
 * Write bridge: the original app saved through a tiny document API (db.doc("invoices/<id>").set/update/delete,
 * db.doc("config/main")...). This module implements that API on top of Cairn's offline outbox:
 * every document write becomes row changes (only the fields that really changed) queued with saveRecord/
 * deleteRecord, so edits work offline and sync idempotently with conflict detection.
 */
import { COLL_TABLE, PRESERVE, changedFields, docHoldings, docLines, docToRow, type LegacyColl } from "@/data/mapping";
import { uuidv5 } from "@/data/uuid";
import type { Entity, LocalRow } from "@/offline/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;
export interface BridgeEnv {
  /** Current local rows by table (non-deleted and deleted). */
  rows: () => Partial<Record<Entity, LocalRow[]>>;
  /** Current documents by legacy collection, plus `cfg` (merged settings). */
  docs: () => Record<string, Doc[]>;
  save: (entity: Entity, id: string, changes: Record<string, unknown>) => Promise<unknown>;
  remove: (entity: Entity, id: string) => Promise<unknown>;
  /** Called after a successful write so the open form sees its own change immediately. */
  optimistic: (coll: string, id: string, doc: Doc | null) => void;
  /** Files uploaded in this session, waiting to be attached to their invoice. */
  uploads: Map<string, { path: string; name: string; mime: string; size: number }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Same id derivation as the import, so documents created with a readable id stay stable across re-imports. */
const KIND: Record<LegacyColl, string> = { invoices: "invoice", clients: "client", contratti: "contract", missioni: "mission", promemoria: "reminder",
  f24: "f24", redditi: "income", risparmi: "savings", investimenti: "investment", spese: "expenses" };
const live = (xs: LocalRow[] | undefined) => (xs ?? []).filter((r) => !r.deleted_at);
const strip = (r: Doc) => { const o = { ...r }; delete o.id; return o; };

export function createBridgeDb(env: BridgeEnv) {
  async function resolveId(coll: LegacyColl, id: string): Promise<{ rid: string; legacy: string | null }> {
    if (UUID.test(id)) return { rid: id.toLowerCase(), legacy: null };
    if (coll === "clients") { const hit = live(env.rows().clients).find((c) => c.short_code === id); if (hit) return { rid: hit.id, legacy: id }; }
    return { rid: await uuidv5(`${KIND[coll]}:${id}`), legacy: id };
  }

  async function write(coll: LegacyColl, id: string, doc: Doc) {
    const table = COLL_TABLE[coll] as Entity;
    const { rid, legacy } = await resolveId(coll, id);
    const rows = env.rows();
    const existing = live(rows[table]).find((r) => r.id === rid);
    const next: Doc = docToRow(coll, { ...doc, id: rid } as never);
    for (const k of PRESERVE[table] ?? []) delete next[k];
    if (!existing) {
      if (table === "contracts") next.title = legacy ?? "";
      if (table === "reminders") next.key = legacy ?? rid;
      if (table === "clients") next.short_code = legacy;
    } else {
      // Booleans in the document ("paid", "done") map to dates: keep the stored date while still true.
      if (table === "f24_payments" && existing.paid_on && next.paid_on) delete next.paid_on;
      if (table === "reminders" && existing.done_on && next.done_on) delete next.done_on;
    }
    // Invoice PDF uploaded in this session: create the attachment record first (FIFO keeps the order on the server).
    if (coll === "invoices" && doc.pdf?.id && env.uploads.has(doc.pdf.id) && existing?.attachment_id !== doc.pdf.id) {
      const u = env.uploads.get(doc.pdf.id)!;
      await env.save("attachments", doc.pdf.id, { entity: "invoices", record_id: rid, storage_path: u.path, original_name: u.name, mime_type: u.mime, size_bytes: u.size, upload_status: "uploaded" });
      next.attachment_id = doc.pdf.id; env.uploads.delete(doc.pdf.id);
    }
    const changes = existing ? changedFields(existing, next) : strip(next);
    if (Object.keys(changes).length) await env.save(table, rid, changes);

    if (coll === "invoices") {
      const stored = live(rows.invoice_lines).filter((l) => l.invoice_id === rid).sort((a, b) => Number(a.position) - Number(b.position));
      const lines = docLines(doc as never);
      for (const [i, l] of lines.entries()) {
        const cur = stored[i];
        const ch = cur ? changedFields(cur, l) : { invoice_id: rid, ...l };
        if (Object.keys(ch).length) await env.save("invoice_lines", cur ? cur.id : crypto.randomUUID(), ch);
      }
      for (const extra of stored.slice(lines.length)) await env.remove("invoice_lines", extra.id);
    }
    if (coll === "investimenti" && Array.isArray(doc.titoli)) {
      const stored = live(rows.holdings).filter((h) => h.account_id === rid);
      const hs = docHoldings(doc as never);
      for (const h of hs) {
        const cur = stored.find((x) => x.isin === h.isin);
        const ch = cur ? changedFields(cur, h) : { account_id: rid, ...h };
        if (Object.keys(ch).length) await env.save("holdings", cur ? cur.id : crypto.randomUUID(), ch);
      }
      for (const gone of stored.filter((x) => !hs.some((h) => h.isin === x.isin))) await env.remove("holdings", gone.id);
    }
    env.optimistic(coll, rid, { ...doc, id: rid });
  }

  async function del(coll: LegacyColl, id: string) {
    const table = COLL_TABLE[coll] as Entity;
    const { rid } = await resolveId(coll, id);
    const rows = env.rows();
    if (coll === "invoices") for (const l of live(rows.invoice_lines).filter((x) => x.invoice_id === rid)) await env.remove("invoice_lines", l.id);
    if (coll === "investimenti") for (const h of live(rows.holdings).filter((x) => x.account_id === rid)) await env.remove("holdings", h.id);
    if (live(rows[table]).some((r) => r.id === rid)) await env.remove(table, rid);
    env.optimistic(coll, rid, null);
  }

  const current = (coll: string, id: string) => (env.docs()[coll] ?? []).find((d) => d.id === id || d.id === id.toLowerCase()) ?? null;
  const settingsRow = () => live(env.rows().ledger_settings)[0];
  const noop = { get: async () => ({ exists: false, data: () => undefined }), set: async () => undefined, update: async () => undefined, delete: async () => undefined };

  function doc(path: string) {
    const [coll, id] = path.split("/") as [string, string];
    if (coll === "config") {
      const data = () => (settingsRow()?.data as Doc | undefined) ?? null;
      const put = async (d: Doc) => { const r = settingsRow(); await env.save("ledger_settings", r?.id ?? crypto.randomUUID(), { data: d }); env.optimistic("config", "main", d); };
      return { get: async () => ({ exists: !!data(), data: () => data() ?? undefined }),
        set: async (x: Doc, o?: { merge?: boolean }) => put(o?.merge ? { ...(data() ?? {}), ...x } : x),
        update: async (x: Doc) => put({ ...(data() ?? {}), ...x }), delete: async () => undefined };
    }
    if (!(coll in COLL_TABLE)) return noop; // history log and calendar-sync bookkeeping: handled server-side / not used in Cairn
    const c = coll as LegacyColl;
    return {
      get: async () => { const d = current(c, id); return { exists: !!d, data: () => (d ? strip(d) : undefined) }; },
      set: async (x: Doc, o?: { merge?: boolean }) => write(c, id, o?.merge ? { ...(current(c, id) ?? {}), ...x } : x),
      update: async (x: Doc) => { const cur = current(c, id); if (!cur) throw Object.assign(new Error("not found"), { code: "not_found" }); return write(c, id, { ...cur, ...x }); },
      delete: async () => del(c, id),
    };
  }
  function collection(c: string) {
    return { get: async () => { const docs = (env.docs()[c] ?? []).map((d) => ({ id: d.id, data: () => strip(d) })); return { docs, forEach: (f: (d: unknown) => void) => docs.forEach(f), size: docs.length, empty: !docs.length }; } };
  }
  return { doc, collection };
}
