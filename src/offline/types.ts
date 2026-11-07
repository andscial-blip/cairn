export const ENTITIES = [
  "clients", "contracts", "missions", "invoices", "invoice_lines", "f24_payments", "reminders", "tax_returns",
  "monthly_expenses", "savings_accounts", "investment_accounts", "holdings", "attachments", "ledger_settings",
] as const;
export type Entity = (typeof ENTITIES)[number];

/** A row as stored locally: server columns plus local bookkeeping. */
export interface LocalRow {
  id: string;
  ledger_id: string;
  version: number;            // last version confirmed by the server (0 = never synced)
  updated_at?: string;
  deleted_at?: string | null;
  _dirty?: 0 | 1;             // has local changes not yet confirmed
  [k: string]: unknown;
}

export type OpStatus = "pending" | "syncing" | "synced" | "failed" | "conflict";

export interface OutboxOp {
  op_id: string;
  user_id: string;
  ledger_id: string;
  entity: Entity;
  record_id: string;
  op_type: "upsert" | "delete";
  base_version: number | null; // server version the edit was made on (null = new record)
  payload: Record<string, unknown>;
  client_ts: string;
  status: OpStatus;
  attempts: number;
  last_error: string | null;
  next_attempt_at: number;     // epoch ms
  synced_at: string | null;
  seq: number;                 // local monotonic order
}

export interface ConflictRecord {
  op_id: string;
  entity: Entity;
  record_id: string;
  local: Record<string, unknown>;
  server: Record<string, unknown>;
  server_version: number;
  detected_at: string;
}

export type ApplyResult =
  | { status: "applied"; version?: number; duplicate?: boolean; noop?: boolean }
  | { status: "conflict"; server: Record<string, unknown>; server_version: number; duplicate?: boolean }
  | { status: "rejected"; code?: string; message?: string; duplicate?: boolean };

/** Network boundary, implemented with Supabase in production and mocked in tests. */
export interface SyncTransport {
  applyOperation(op: OutboxOp, origin: "online" | "offline"): Promise<ApplyResult>;
  pull(entity: Entity, ledgerId: string, since: string | null): Promise<LocalRow[]>;
}

/** Thrown by the transport when the request never reached a verdict (offline, timeout, 5xx). */
export class TransientError extends Error { readonly transient = true; }
/** Thrown when the session is no longer valid (expired token, suspended account). */
export class AuthError extends Error { readonly auth = true; }
