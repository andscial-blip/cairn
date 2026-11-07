import type { LocalDB } from "./db";
import type { Entity, LocalRow, OutboxOp } from "./types";

export interface MutationContext { db: LocalDB; userId: string; ledgerId: string; now?: () => Date; uuid?: () => string; }

const id = (ctx: MutationContext) => (ctx.uuid ?? (() => crypto.randomUUID()))();
const now = (ctx: MutationContext) => (ctx.now ?? (() => new Date()))();

async function nextSeq(db: LocalDB): Promise<number> {
  const last = await db.outbox.orderBy("seq").last();
  return (last?.seq ?? 0) + 1;
}

/**
 * Applies a change locally and queues it for the server in ONE IndexedDB transaction, so the
 * queue survives app closes and reboots and the UI never shows a change that isn't queued.
 * Consecutive edits to the same record are merged into the still-pending operation.
 */
export async function saveRecord(ctx: MutationContext, entity: Entity, recordId: string | null,
                                 changes: Record<string, unknown>): Promise<string> {
  const { db } = ctx;
  const rid = recordId ?? id(ctx);
  await db.transaction("rw", [db.rows(entity), db.outbox], async () => {
    const existing = await db.rows(entity).get(rid);
    const row: LocalRow = { ...(existing ?? { id: rid, ledger_id: ctx.ledgerId, version: 0 }), ...changes, _dirty: 1 };
    await db.rows(entity).put(row);
    const pending = await db.outbox.where("record_id").equals(rid)
      .filter((o) => o.status === "pending" && o.entity === entity && o.op_type === "upsert").last();
    if (pending) {
      await db.outbox.update(pending.op_id, { payload: { ...pending.payload, ...changes }, client_ts: now(ctx).toISOString() });
      return;
    }
    const op: OutboxOp = {
      op_id: id(ctx), user_id: ctx.userId, ledger_id: ctx.ledgerId, entity, record_id: rid, op_type: "upsert",
      base_version: existing && existing.version > 0 ? existing.version : null,
      payload: { ...changes }, client_ts: now(ctx).toISOString(), status: "pending", attempts: 0,
      last_error: null, next_attempt_at: 0, synced_at: null, seq: await nextSeq(db),
    };
    await db.outbox.add(op);
  });
  return rid;
}

export async function deleteRecord(ctx: MutationContext, entity: Entity, recordId: string): Promise<void> {
  const { db } = ctx;
  await db.transaction("rw", [db.rows(entity), db.outbox], async () => {
    const existing = await db.rows(entity).get(recordId);
    if (!existing) return;
    // Never-synced record with only pending ops: drop them, nothing to tell the server.
    if (existing.version === 0) {
      const ops = await db.outbox.where("record_id").equals(recordId).filter((o) => o.status === "pending").toArray();
      if (ops.length && ops.every((o) => o.base_version === null)) {
        await db.outbox.bulkDelete(ops.map((o) => o.op_id));
        await db.rows(entity).delete(recordId);
        return;
      }
    }
    await db.rows(entity).put({ ...existing, deleted_at: now(ctx).toISOString(), _dirty: 1 });
    await db.outbox.add({
      op_id: id(ctx), user_id: ctx.userId, ledger_id: ctx.ledgerId, entity, record_id: recordId, op_type: "delete",
      base_version: existing.version > 0 ? existing.version : null, payload: {}, client_ts: now(ctx).toISOString(),
      status: "pending", attempts: 0, last_error: null, next_attempt_at: 0, synced_at: null, seq: await nextSeq(db),
    });
  });
}
