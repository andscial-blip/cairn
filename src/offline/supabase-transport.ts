import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthError, TransientError, type ApplyResult, type Entity, type LocalRow, type OutboxOp, type SyncTransport } from "./types";

const PAGE = 1000;

function classify(err: { message?: string; code?: string; status?: number } | null, status?: number): never {
  const s = status ?? err?.status ?? 0;
  const msg = err?.message ?? "errore sconosciuto";
  if (s === 401 || s === 403 || /jwt|token/i.test(msg)) throw new AuthError(msg);
  throw new TransientError(msg);
}

/** Production transport: apply_operation RPC for pushes, RLS-filtered selects for pulls. */
export class SupabaseTransport implements SyncTransport {
  constructor(private readonly sb: SupabaseClient) {}

  async applyOperation(op: OutboxOp, origin: "online" | "offline"): Promise<ApplyResult> {
    try {
      const { data, error, status } = await this.sb.rpc("apply_operation", {
        p: { op_id: op.op_id, ledger_id: op.ledger_id, entity: op.entity, record_id: op.record_id, op_type: op.op_type,
             base_version: op.base_version, payload: op.payload, client_ts: op.client_ts, origin },
      });
      if (error) classify(error, status);
      return data as ApplyResult;
    } catch (e) {
      if (e instanceof AuthError || e instanceof TransientError) throw e;
      throw new TransientError(e instanceof Error ? e.message : "rete non disponibile");
    }
  }

  async pull(entity: Entity, ledgerId: string, since: string | null): Promise<LocalRow[]> {
    const out: LocalRow[] = [];
    for (let from = 0; ; from += PAGE) {
      let q = this.sb.from(entity).select("*").eq("ledger_id", ledgerId).order("updated_at", { ascending: true }).range(from, from + PAGE - 1);
      if (since) q = q.gte("updated_at", since);
      const { data, error, status } = await q;
      if (error) classify(error, status);
      out.push(...((data ?? []) as LocalRow[]));
      if (!data || data.length < PAGE) return out;
    }
  }
}
