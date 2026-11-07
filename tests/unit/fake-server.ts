import type { ApplyResult, Entity, LocalRow, OutboxOp, SyncTransport } from "@/offline/types";
import { TransientError, AuthError } from "@/offline/types";

/** In-memory stand-in for apply_operation() with the same idempotency/OCC contract. */
export class FakeServer implements SyncTransport {
  rows = new Map<string, LocalRow>();
  ops = new Map<string, ApplyResult>();
  calls = 0;
  failNext = 0;               // simulate network drops
  dropAfterApply = 0;         // server applies but the response is lost
  authFail = false;
  clock = Date.parse("2026-11-07T08:00:00Z");

  async applyOperation(op: OutboxOp): Promise<ApplyResult> {
    this.calls++;
    if (this.authFail) throw new AuthError("JWT expired");
    if (this.failNext > 0) { this.failNext--; throw new TransientError("Failed to fetch"); }
    const prev = this.ops.get(op.op_id);
    if (prev) return { ...prev, duplicate: true };
    const key = `${op.entity}:${op.record_id}`;
    const cur = this.rows.get(key);
    let res: ApplyResult;
    if (!cur) {
      if (op.op_type === "delete") res = { status: "applied", noop: true };
      else { this.rows.set(key, this.stamp({ ...op.payload, id: op.record_id, ledger_id: op.ledger_id, version: 1 })); res = { status: "applied", version: 1 }; }
    } else if (op.base_version !== cur.version) {
      res = { status: "conflict", server: { ...cur }, server_version: cur.version };
    } else {
      const v = cur.version + 1;
      this.rows.set(key, this.stamp({ ...cur, ...op.payload, version: v, ...(op.op_type === "delete" ? { deleted_at: "x" } : {}) }));
      res = { status: "applied", version: v };
    }
    this.ops.set(op.op_id, res);
    if (this.dropAfterApply > 0) { this.dropAfterApply--; throw new TransientError("response lost"); }
    return res;
  }

  async pull(entity: Entity, _ledger: string, since: string | null): Promise<LocalRow[]> {
    return [...this.rows.entries()].filter(([k]) => k.startsWith(entity + ":")).map(([, r]) => r)
      .filter((r) => !since || (r.updated_at ?? "") >= since);
  }

  /** Another device edits directly on the server. */
  remoteEdit(entity: Entity, id: string, changes: Record<string, unknown>) {
    const key = `${entity}:${id}`; const cur = this.rows.get(key)!;
    this.rows.set(key, this.stamp({ ...cur, ...changes, version: cur.version + 1 }));
  }

  private stamp(r: LocalRow): LocalRow { this.clock += 1000; return { ...r, updated_at: new Date(this.clock).toISOString() } as LocalRow; }
}
