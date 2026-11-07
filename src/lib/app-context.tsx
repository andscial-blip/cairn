"use client";
/**
 * App-wide context: authentication (online, or a limited offline grant), the user's ledger,
 * the local IndexedDB store, the sync engine and a live domain snapshot for the views.
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { liveQuery } from "dexie";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseBrowser } from "@/lib/supabase/client";
import { LocalDB } from "@/offline/db";
import { SyncEngine, type SyncStatus } from "@/offline/engine";
import { SupabaseTransport } from "@/offline/supabase-transport";
import { checkOfflineAccess, issueGrant, DEFAULT_OFFLINE_HOURS, type OfflineGrant } from "@/offline/session";
import { ENTITIES, type LocalRow } from "@/offline/types";
import { isNetworkError, withTimeout } from "@/offline/net";
import { saveRecord, deleteRecord, type MutationContext } from "@/offline/mutations";
import { rowsToSnapshot } from "@/data/mapping";
import { Engine, mergeCfg } from "@/domain/engine";
import type { Entity } from "@/offline/types";

export type AuthState =
  | { kind: "loading" }
  | { kind: "signed-out"; reason?: string }
  | { kind: "ready"; userId: string; email: string; ledgerId: string; role: string; offline: boolean; grant: OfflineGrant | null };

interface Ctx {
  auth: AuthState;
  sb: SupabaseClient;
  db: LocalDB | null;
  sync: SyncEngine | null;
  status: SyncStatus | null;
  engine: Engine | null;
  rows: Partial<Record<Entity, LocalRow[]>>;
  year: number;
  setYear: (y: number) => void;
  save: (entity: Entity, id: string | null, changes: Record<string, unknown>) => Promise<string>;
  remove: (entity: Entity, id: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(AppCtx); if (!c) throw new Error("useApp outside AppProvider"); return c; };

const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const OFFLINE_HOURS = Number(process.env.NEXT_PUBLIC_OFFLINE_SESSION_HOURS ?? DEFAULT_OFFLINE_HOURS) || DEFAULT_OFFLINE_HOURS;

function deviceId(): string {
  try { let id = localStorage.getItem("cairn-device"); if (!id) { id = crypto.randomUUID(); localStorage.setItem("cairn-device", id); } return id; }
  catch { return "unknown-device"; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [auth, setAuth] = useState<AuthState>({ kind: "loading" });
  const [db, setDb] = useState<LocalDB | null>(null);
  const [rows, setRows] = useState<Partial<Record<Entity, LocalRow[]>>>({});
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [year, setYearState] = useState<number>(() => new Date().getFullYear());
  const syncRef = useRef<SyncEngine | null>(null);

  // 1) Authentication: online session first; if the network is down, fall back to the offline grant.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = new LocalDB();
      await local.open();
      const grant = (await local.meta.get("grant"))?.value as OfflineGrant | undefined;
      const membership = (await local.meta.get("membership"))?.value as { ledgerId: string; role: string } | undefined;
      const online = typeof navigator === "undefined" || navigator.onLine;
      let user: { id: string; email?: string } | null = null;
      let networkProblem = !online;
      if (online) {
        try {
          const { data, error } = await withTimeout(sb.auth.getUser(), 8000);
          if (error && isNetworkError(error)) networkProblem = true;
          user = data.user ? { id: data.user.id, email: data.user.email ?? "" } : null;
        } catch (e) { if (isNetworkError(e)) networkProblem = true; else throw e; }
      }
      if (user) {
        // Online: (re)load membership; a suspended account sees no rows → signed out.
        type MemberRow = { ledger_id: string; role: string };
        const res = await withTimeout(Promise.resolve(sb.from("ledger_members").select("ledger_id, role").eq("user_id", user.id).limit(1)), 8000)
          .then((r) => ({ m: (r.data ?? null) as MemberRow[] | null, me: r.error as { message: string } | null }))
          .catch((e: unknown) => ({ m: null as MemberRow[] | null, me: { message: e instanceof Error ? e.message : "network" } }));
        const { m, me } = res;
        if (me && !isNetworkError(me)) { if (!cancelled) setAuth({ kind: "signed-out", reason: "Errore nel caricare il fascicolo." }); return; }
        const mm = m?.[0] ? { ledgerId: m[0].ledger_id as string, role: m[0].role as string } : membership;
        if (!mm) { await sb.auth.signOut(); if (!cancelled) setAuth({ kind: "signed-out", reason: "Account sospeso o senza fascicolo assegnato." }); return; }
        const g = issueGrant(user.id, user.email ?? "", deviceId(), Date.now(), OFFLINE_HOURS);
        await local.meta.bulkPut([{ key: "grant", value: g }, { key: "membership", value: mm }]);
        if (!cancelled) { setDb(local); setAuth({ kind: "ready", userId: user.id, email: user.email ?? "", ledgerId: mm.ledgerId, role: mm.role, offline: false, grant: g }); }
        return;
      }
      if (networkProblem) {
        const acc = checkOfflineAccess(grant ?? null);
        if (acc.ok && membership) {
          if (!cancelled) { setDb(local); setAuth({ kind: "ready", userId: acc.grant.userId, email: acc.grant.email, ledgerId: membership.ledgerId, role: membership.role, offline: true, grant: acc.grant }); }
          return;
        }
        if (!cancelled) setAuth({ kind: "signed-out", reason: acc.ok ? "Serve una connessione per il primo accesso." : acc.reason === "expired" ? "La sessione offline è scaduta: collegati a internet e accedi di nuovo." : "Serve una connessione per il primo accesso su questo dispositivo." });
        return;
      }
      if (!cancelled) setAuth({ kind: "signed-out" });
    })();
    return () => { cancelled = true; };
  }, [sb]);

  // 2) Sync engine: push the outbox, pull changes, on every relevant trigger.
  useEffect(() => {
    if (auth.kind !== "ready" || !db) return;
    const engine = new SyncEngine({ db, transport: new SupabaseTransport(sb), ledgerId: auth.ledgerId, isOnline: () => navigator.onLine });
    syncRef.current = engine;
    const off = engine.onStatus(setStatus);
    const detach = engine.attach(window, document);
    return () => { off(); detach(); syncRef.current = null; };
  }, [auth, db, sb]);

  // 3) Live view of the local store.
  useEffect(() => {
    if (!db) return;
    const sub = liveQuery(async () => {
      const out: Partial<Record<Entity, LocalRow[]>> = {};
      for (const e of ENTITIES) out[e] = await db.rows(e).toArray();
      return out;
    }).subscribe({ next: setRows, error: () => undefined });
    return () => sub.unsubscribe();
  }, [db]);

  // 4) Service worker for offline loading of the app shell.
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    // Register, then ask the worker to refresh the saved copy of every section (all sections usable offline).
    navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready)
      .then((reg) => { if (navigator.onLine) reg.active?.postMessage("precache"); }).catch(() => undefined);
  }, []);

  useEffect(() => { try { const y = Number(localStorage.getItem("cairn-year")); if (y) setYearState(y); } catch { /* ignore */ } }, []);
  const setYear = (y: number) => { setYearState(y); try { localStorage.setItem("cairn-year", String(y)); } catch { /* ignore */ } };

  const engine = useMemo(() => {
    if (!Object.keys(rows).length) return null;
    return new Engine(rowsToSnapshot(rows as never, mergeCfg), todayISO());
  }, [rows]);

  const mctx = (): MutationContext => {
    if (auth.kind !== "ready" || !db) throw new Error("Non pronto");
    if (auth.role === "read_only") throw new Error("Accesso in sola lettura");
    return { db, userId: auth.userId, ledgerId: auth.ledgerId };
  };
  const value: Ctx = {
    auth, sb, db, sync: syncRef.current, status, engine, rows, year, setYear,
    save: async (entity, id, changes) => { const rid = await saveRecord(mctx(), entity, id, changes); void syncRef.current?.run(); return rid; },
    remove: async (entity, id) => { await deleteRecord(mctx(), entity, id); void syncRef.current?.run(); },
    signOut: async () => {
      if (db) { await db.meta.delete("grant"); }
      await sb.auth.signOut(); window.location.assign("/login");
    },
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
