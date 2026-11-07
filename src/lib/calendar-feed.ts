"use client";
/** Manages the private calendar feed: create/rotate the link, publish the ICS when data change. */
import type { SupabaseClient } from "@supabase/supabase-js";

const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s: string) => crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
const KEY = (ledger: string) => `cairn-cal-token:${ledger}`;
const LAST = (ledger: string) => `cairn-cal-last:${ledger}`;
const ls = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } }, del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } } };

export const feedUrl = (token: string) => `${location.origin}/api/calendario/${token}.ics`;
export const savedToken = (ledger: string) => ls.get(KEY(ledger));

export async function feedStatus(sb: SupabaseClient, ledger: string): Promise<{ active: boolean; updatedAt: string | null }> {
  const { data, error } = await sb.from("calendar_feeds").select("updated_at").eq("ledger_id", ledger).maybeSingle();
  if (error) throw error;
  return { active: !!data, updatedAt: (data?.updated_at as string | undefined) ?? null };
}

/** Creates the feed or replaces its link (the old link stops working). Returns the new private URL. */
export async function createOrRotate(sb: SupabaseClient, ledger: string, ics: string): Promise<string> {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const token_hash = `\\x${hex(await sha(token))}`;
  const { error } = await sb.from("calendar_feeds").upsert({ ledger_id: ledger, token_hash, ics, updated_at: new Date().toISOString() }, { onConflict: "ledger_id" });
  if (error) throw error;
  ls.set(KEY(ledger), token); ls.set(LAST(ledger), hex(await sha(ics)));
  return feedUrl(token);
}

export async function disableFeed(sb: SupabaseClient, ledger: string) {
  const { error } = await sb.from("calendar_feeds").delete().eq("ledger_id", ledger);
  if (error) throw error;
  ls.del(KEY(ledger)); ls.del(LAST(ledger));
}

/** Publishes the current ICS if it changed since the last publish from this device. */
export async function publishIfChanged(sb: SupabaseClient, ledger: string, ics: string, force = false): Promise<boolean> {
  const h = hex(await sha(ics));
  if (!force && ls.get(LAST(ledger)) === h) return false;
  const { error, count } = await sb.from("calendar_feeds").update({ ics, updated_at: new Date().toISOString() }, { count: "exact" }).eq("ledger_id", ledger);
  if (error || !count) return false;
  ls.set(LAST(ledger), h); return true;
}
