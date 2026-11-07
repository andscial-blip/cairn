import Dexie, { type Table } from "dexie";
import { ENTITIES, type ConflictRecord, type LocalRow, type OutboxOp } from "./types";

export interface PendingFile { id: string; ledger_id: string; storage_path: string; blob: Blob; mime_type: string; created_at: string; }
export interface MetaEntry { key: string; value: unknown; }

/** Local operational store. Postgres stays the source of truth; this is a cache + outbox. */
export class LocalDB extends Dexie {
  outbox!: Table<OutboxOp, string>;
  conflicts!: Table<ConflictRecord, string>;
  files!: Table<PendingFile, string>;
  meta!: Table<MetaEntry, string>;

  constructor(name = "cassa-e-fisco") {
    super(name);
    const stores: Record<string, string> = {
      outbox: "op_id, seq, status, record_id, [status+next_attempt_at]",
      conflicts: "op_id, record_id",
      files: "id",
      meta: "key",
    };
    for (const e of ENTITIES) stores[e] = "id, ledger_id, updated_at, _dirty";
    this.version(1).stores(stores);
  }

  rows(entity: (typeof ENTITIES)[number]): Table<LocalRow, string> {
    return this.table(entity);
  }
}
