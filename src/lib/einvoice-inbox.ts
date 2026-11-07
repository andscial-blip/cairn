"use client";
/**
 * Inbox of e-invoice files sent by the Gmail script (see appsScript in einvoice-pdf.ts and the einvoice_inbox migration).
 * The token is created here and shown once inside the script: only its SHA-256 is stored.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

export interface InboxRow { id: string; filename: string; mime: string; received_at: string | null; created_at: string; content_b64: string | null; status: string; note: string; invoice_id: string | null }

export async function inboxStatus(sb: SupabaseClient, ledger: string): Promise<{ active: boolean; lastUsed: string | null }> {
  const { data, error } = await sb.from("einvoice_inbox_tokens").select("last_used_at").eq("ledger_id", ledger).maybeSingle();
  if (error) throw error;
  return { active: !!data, lastUsed: (data?.last_used_at as string | null | undefined) ?? null };
}

/** New token (an old script stops working). Returns the token, to be pasted inside the script. */
export async function createInboxToken(sb: SupabaseClient, ledger: string): Promise<string> {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const token_hash = `\\x${hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token)))}`;
  const { error } = await sb.from("einvoice_inbox_tokens").upsert({ ledger_id: ledger, token_hash, created_at: new Date().toISOString(), last_used_at: null }, { onConflict: "ledger_id" });
  if (error) throw error;
  return token;
}

export async function disableInbox(sb: SupabaseClient, ledger: string) {
  const { error } = await sb.from("einvoice_inbox_tokens").delete().eq("ledger_id", ledger);
  if (error) throw error;
}

export async function listInbox(sb: SupabaseClient, ledger: string, limit = 20): Promise<InboxRow[]> {
  const { data, error } = await sb.from("einvoice_inbox").select("id, filename, mime, received_at, created_at, content_b64, status, note, invoice_id")
    .eq("ledger_id", ledger).eq("status", "new").order("created_at").limit(limit);
  if (error) throw error;
  return (data ?? []) as InboxRow[];
}

/** Attached or ignored: the file content is removed from the inbox (the attachment keeps its own copy). */
export async function closeInbox(sb: SupabaseClient, id: string, status: "attached" | "ignored", invoiceId: string | null, note = "") {
  const { error } = await sb.from("einvoice_inbox").update({ status, invoice_id: invoiceId, note: note.slice(0, 300), content_b64: null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
export async function noteInbox(sb: SupabaseClient, id: string, note: string) {
  await sb.from("einvoice_inbox").update({ note: note.slice(0, 300), updated_at: new Date().toISOString() }).eq("id", id);
}

export const rpcUrl = () => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/einvoice_inbox_put`;
export const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function b64ToBytes(b64: string): Uint8Array { const s = atob(b64); const out = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i); return out; }
/** A signed .p7m keeps the FatturaPA XML inside its envelope, usually in one piece: take it from <?xml to the closing tag. */
export function xmlFromBytes(bytes: Uint8Array): string | null {
  const s = new TextDecoder("latin1").decode(bytes);
  const a = s.indexOf("<?xml"), m = s.match(/<\/(?:\w+:)?FatturaElettronica>/);
  if (a < 0 || !m || m.index! < a) return null;
  return new TextDecoder("utf-8").decode(bytes.slice(a, m.index! + m[0].length));
}
