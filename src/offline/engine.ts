import type { LocalDB } from "./db";
import { nextDelayMs } from "./backoff";
import { ENTITIES, type ApplyResult, type ConflictRecord, type Entity, type OutboxOp, type SyncTransport } from "./types";

export interface SyncStatus {
  online: boolean;
  syncing: boolean;
  pending: number;
  failed: number;
  conflicts: number;
  lastSyncAt: string | null;
  lastError: string | null;
  authProblem: boolean;
}

export interface EngineOptions {
  db: LocalDB;
  transport: SyncTransport;
  ledgerId: string;
  isOnline?: () => boolean;
  now?: () => number;
  rand?: () => number;
  /** Overlap applied to pull cursors to cover rows committed out of timestamp order. */
  pullOverlapMs?: number;
}

/**
 * Push/pull sync engine. Safe to call run() any number of times: runs are serialized,
 * pushes are idempotent (op_id) and a crash mid-sync is recovered by resetting
 * "syncing" ops to "pending" on the next start.
 */
export class SyncEngine {
  private running: Promise<void> | null = null;
  private listeners = new Set<(s: SyncStatus) => void>();
  private lastError: string | null = null;
  private authProblem = false;
  private readonly o: Required<Omit<EngineOptions, "isOnline">> & { isOnline: () => boolean };

  constructor(opts: EngineOptions) {
    this.o = { isOnline: () => true, now: () => Date.now(), rand: Math.random, pullOverlapMs: 2 * 60 * 1000, ...opts };
  }

  onStatus(fn: (s: SyncStatus) => void): () => void { this.listeners.add(fn); void this.emit(); return () => this.listeners.delete(fn); }

  async status(): Promise<SyncStatus> {
    const { db } = this.o;
    const [pending, failed, conflicts, last] = await Promise.all([
      db.outbox.where("status").anyOf("pending", "syncing").count(),
      db.outbox.where("status").equals("failed").count(),
      db.conflicts.count(),
      db.meta.get("lastSyncAt"),
    ]);
    return { online: this.o.isOnline(), syncing: this.running !== null, pending, failed, conflicts,
             lastSyncAt: (last?.value as string) ?? null, lastError: this.lastError, authProblem: this.authProblem };
  }

  private async emit() { if (this.listeners.size) { const s = await this.status(); this.listeners.forEach((l) => l(s)); } }

  /** Recovers ops left in "syncing" by a crash or closed tab. Call once at startup. */
  async recover(): Promise<number> {
    return this.o.db.outbox.where("status").equals("syncing").modify({ status: "pending" });
  }

  run(opts: { force?: boolean } = {}): Promise<void> {
    if (this.running) return this.running;
    this.running = (async () => {
      try {
        await this.emit();
        if (!this.o.isOnline()) return;
        await this.push(opts.force ?? false);
        if (!this.authProblem) await this.pull();
        if (!this.authProblem) { this.lastError = null; await this.o.db.meta.put({ key: "lastSyncAt", value: new Date(this.o.now()).toISOString() }); }
      } catch (e) {
        this.lastError = e instanceof Error ? e.message : String(e);
      } finally {
        this.running = null;
        await this.emit();
      }
    })();
    return this.running;
  }

  async push(force = false): Promise<void> {
    const { db, transport } = this.o;
    for (;;) {
      // Strict FIFO: the oldest pending op goes first; if it is still backing off, everything
      // behind it waits too (a later edit must never reach the server before an earlier one).
      const op = await db.outbox.where("status").equals("pending").sortBy("seq").then((a) => a[0]);
      if (!op) return;
      if (!force && op.next_attempt_at > this.o.now()) return;
      await db.outbox.update(op.op_id, { status: "syncing" });
      let res: ApplyResult;
      try {
        res = await transport.applyOperation(op, op.attempts === 0 && op.client_ts && this.o.isOnline() ? "online" : "offline");
      } catch (e) {
        const err = e as { auth?: boolean; transient?: boolean; message?: string };
        if (err.auth) {
          this.authProblem = true;
          await db.outbox.update(op.op_id, { status: "pending", last_error: "Sessione scaduta: accedi di nuovo per sincronizzare." });
          return;
        }
        const attempts = op.attempts + 1;
        await db.outbox.update(op.op_id, { status: "pending", attempts, last_error: err.message ?? "errore di rete",
                                           next_attempt_at: this.o.now() + nextDelayMs(attempts, this.o.rand) });
        this.lastError = err.message ?? "errore di rete";
        return; // stop this round; order is preserved and later ops retry after the backoff
      }
      await this.settle(op, res);
    }
  }

  private async settle(op: OutboxOp, res: ApplyResult): Promise<void> {
    const { db } = this.o;
    const table = db.rows(op.entity);
    await db.transaction("rw", [table, db.outbox, db.conflicts], async () => {
      if (res.status === "applied") {
        const version = res.version ?? (op.base_version ?? 0) + 1;
        await db.outbox.update(op.op_id, { status: "synced", synced_at: new Date(this.o.now()).toISOString(), last_error: null });
        // Re-base later local edits of the same record on the version just confirmed.
        const later = await db.outbox.where("record_id").equals(op.record_id)
          .filter((o) => o.status === "pending" && o.entity === op.entity && o.seq > op.seq).toArray();
        for (const l of later) await db.outbox.update(l.op_id, { base_version: version });
        const row = await table.get(op.record_id);
        if (row && !res.noop) await table.put({ ...row, version, _dirty: later.length ? 1 : 0 });
      } else if (res.status === "conflict") {
        const c: ConflictRecord = { op_id: op.op_id, entity: op.entity, record_id: op.record_id, local: op.payload,
                                    server: res.server, server_version: res.server_version, detected_at: new Date(this.o.now()).toISOString() };
        await db.conflicts.put(c);
        await db.outbox.update(op.op_id, { status: "conflict", last_error: "Modificato altrove: scegli quale versione tenere." });
      } else {
        await db.outbox.update(op.op_id, { status: "failed", last_error: res.message ?? res.code ?? "rifiutato dal server" });
      }
    });
  }

  async pull(): Promise<void> {
    const { db, transport, ledgerId } = this.o;
    for (const entity of ENTITIES) {
      const key = `cursor:${ledgerId}:${entity}`;
      const cur = (await db.meta.get(key))?.value as string | undefined;
      const since = cur ? new Date(new Date(cur).getTime() - this.o.pullOverlapMs).toISOString() : null;
      const rows = await transport.pull(entity, ledgerId, since);
      if (!rows.length) continue;
      const table = db.rows(entity);
      await db.transaction("rw", [table, db.outbox, db.meta], async () => {
        let max = cur ?? "";
        for (const r of rows) {
          if (r.updated_at && r.updated_at > max) max = r.updated_at;
          const local = await table.get(r.id);
          const hasLocal = await db.outbox.where("record_id").equals(r.id)
            .filter((o) => o.entity === entity && (o.status === "pending" || o.status === "syncing" || o.status === "conflict")).count();
          if (hasLocal) continue;                                    // never clobber unsynced local edits
          if (local && local.version > r.version) continue;          // stale page from the overlap window
          await table.put({ ...r, _dirty: 0 });
        }
        await db.meta.put({ key, value: max });
      });
    }
  }

  /** Explicit, user-driven conflict resolution. */
  async resolveConflict(opId: string, choice: "server" | "local", userCtx: { now?: () => Date; uuid?: () => string } = {}): Promise<void> {
    const { db } = this.o;
    const c = await db.conflicts.get(opId);
    if (!c) return;
    const table = db.rows(c.entity);
    await db.transaction("rw", [table, db.outbox, db.conflicts], async () => {
      const op = await db.outbox.get(opId);
      if (choice === "server") {
        await table.put({ ...(c.server as object), id: c.record_id, version: c.server_version, _dirty: 0 } as never);
        await db.outbox.update(opId, { status: "synced", last_error: "Risolto: tenuta la versione del server", synced_at: new Date().toISOString() });
      } else if (op) {
        const last = await db.outbox.orderBy("seq").last();
        await db.outbox.update(opId, { status: "synced", last_error: "Risolto: sostituito da nuova operazione" });
        await db.outbox.add({ ...op, op_id: (userCtx.uuid ?? (() => crypto.randomUUID()))(), base_version: c.server_version,
                              status: "pending", attempts: 0, last_error: null, next_attempt_at: 0, synced_at: null,
                              client_ts: (userCtx.now ?? (() => new Date()))().toISOString(), seq: (last?.seq ?? 0) + 1 });
      }
      await db.conflicts.delete(opId);
    });
    await this.emit();
  }

  /** Re-queue a permanently failed op after the user fixed the data. */
  async retryFailed(opId: string): Promise<void> {
    await this.o.db.outbox.update(opId, { status: "pending", attempts: 0, next_attempt_at: 0 });
    await this.emit();
  }

  /** Wires automatic triggers: app open, back online, back to foreground, periodic safety net. */
  attach(win: Pick<Window, "addEventListener" | "removeEventListener">, doc: Pick<Document, "addEventListener" | "removeEventListener" | "visibilityState">, intervalMs = 60_000): () => void {
    const kick = () => { void this.run(); };
    const onVis = () => { if (doc.visibilityState === "visible") kick(); };
    win.addEventListener("online", kick);
    doc.addEventListener("visibilitychange", onVis);
    const t = setInterval(kick, intervalMs);
    void this.recover().then(kick);
    return () => { win.removeEventListener("online", kick); doc.removeEventListener("visibilitychange", onVis); clearInterval(t); };
  }

  /** Entities we know about, for UI listings. */
  static entities(): readonly Entity[] { return ENTITIES; }
}
