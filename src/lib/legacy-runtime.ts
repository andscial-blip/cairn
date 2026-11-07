"use client";
/**
 * One instance of the original app's code per browser tab, wired to Cairn:
 * S (the original state object) is refreshed from the live engine; writes go through the bridge.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createLegacy, type LegacyApp } from "@/legacy/app";
import { createBridgeDb } from "@/legacy/bridge";
import { mergeCfg, type Engine } from "@/domain/engine";
import type { Entity, LocalRow } from "@/offline/types";

const COLLS = ["invoices", "clients", "f24", "contratti", "missioni", "promemoria", "redditi", "spese", "risparmi", "investimenti"] as const;
const MAX_PDF = 15 * 1024 * 1024;

export interface RuntimeDeps {
  engine: Engine | null; rows: Partial<Record<Entity, LocalRow[]>>; year: number; view: string;
  writable: boolean; ledgerId: string | null; sb: SupabaseClient;
  save: (e: Entity, id: string, ch: Record<string, unknown>) => Promise<unknown>;
  remove: (e: Entity, id: string) => Promise<unknown>;
  navigate: (view: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const S: any = { ready: false, writable: false, view: "home", year: new Date().getFullYear(), calsync: [], storico: [], filter: { stato: "tutti", cliente: "", q: "" } };
let deps: RuntimeDeps | null = null;
let app: LegacyApp | null = null;
let syncedEngine: Engine | null = null;
const uploads = new Map<string, { path: string; name: string; mime: string; size: number }>();

const COMPOSE: Record<string, (FX: unknown) => string> = {
  home: (FX) => app!.vHome(FX), entr: (FX) => app!.vEntrate(FX), spese: (FX) => app!.vSpese(FX), risp: (FX) => app!.vRisp(FX),
  invest: (FX) => app!.vInvest(FX), anal: (FX) => app!.vAnal(FX), inv: (FX) => app!.vInv(FX), prev: (FX) => app!.vPrev(FX), f24: (FX) => app!.vF24(FX),
  tasse: (FX) => app!.compliancePanel() + app!.vTasse(FX) + `<div style="height:8px"></div>` + app!.vFisco(FX) + app!.redditiPanel(),
  contr: (FX) => app!.vContr(FX) + `<div class="eyebrow" style="margin:22px 0 4px">Missioni</div>` + app!.vMis(FX),
  set: (FX) => app!.vSet(FX),
};

function syncFromEngine() {
  const E = deps?.engine; if (!E) return;
  for (const c of COLLS) S[c] = E.s[c];
  S.cfg = E.s.cfg; syncedEngine = E;
}

/** The original render(): draw the current section into #app and bind its controls. */
export function renderLegacy() {
  const el = typeof document !== "undefined" ? document.getElementById("app") : null;
  if (!el || !deps?.engine || !app) return;
  try {
    const FX = app._fisco();
    let h = "";
    if (!S.invoices.length && !S.clients.length) h += `<div class="banner">Il registro è vuoto. Importa i dati dall'app precedente da <b>Impostazioni → Importa</b>, oppure aggiungi i clienti in <b>Impostazioni</b>.</div>`;
    h += (COMPOSE[S.view] ?? COMPOSE.home!)(FX);
    el.innerHTML = h;
    app.bindView(FX);
  } catch (e) {
    console.error(e);
    el.innerHTML = `<section class="panel empty">Errore nel disegnare questa sezione: ${String((e as Error).message).replace(/[<>&]/g, "")}</section>`;
  }
}

function toast(m: string) { try { app?.toast(m); } catch { /* no toast root yet */ } }

function ensureApp() {
  if (app) return app;
  const db = createBridgeDb({
    rows: () => deps!.rows,
    docs: () => ({ ...Object.fromEntries(COLLS.map((c) => [c, S[c] ?? []])) }),
    save: (e, id, ch) => deps!.save(e, id, ch),
    remove: (e, id) => deps!.remove(e, id),
    optimistic: (coll, id, doc) => {
      if (coll === "config") S.cfg = mergeCfg(doc as never);
      else { const arr = (S[coll] ?? []).filter((d: { id: string }) => d.id !== id); S[coll] = doc ? [...arr, doc] : arr; }
      renderLegacy();
      setTimeout(() => { if (deps?.engine && deps.engine !== syncedEngine) { syncFromEngine(); renderLegacy(); } }, 400);
    },
    uploads,
  });
  S.db = db;
  app = createLegacy({
    S, engine: () => deps!.engine!, render: () => renderLegacy(), setView: (v) => deps?.navigate(v),
    downloads: {
      save: async ({ filename, data }) => {
        const blob = data instanceof Blob ? data : new Blob([typeof data === "string" ? data : data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? (data as BlobPart) : JSON.stringify(data)]);
        const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000); return true;
      },
    },
    assetsCap: {
      upload: async (f: File) => {
        if (!navigator.onLine) throw Object.assign(new Error("offline"), { code: "offline" });
        if (f.size > MAX_PDF) throw Object.assign(new Error("too large"), { code: "too_large" });
        const mime = f.type || "application/pdf";
        const id = crypto.randomUUID(); const name = f.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "documento.pdf";
        const path = `${deps!.ledgerId}/${id}/${name}`;
        const { error } = await deps!.sb.storage.from("attachments").upload(path, f, { contentType: mime, upsert: false });
        if (error) throw Object.assign(new Error(error.message), { code: "upload_failed" });
        uploads.set(id, { path, name: f.name.slice(0, 255), mime, size: f.size });
        return { id, url: `cairn-att:${path}` };
      },
    },
    unavailable: (what) => toast(what === "calendar" ? "Il calendario arriva come feed ICS (da aggiungere al tuo Google Calendar) in un prossimo aggiornamento."
      : what === "v3" ? "L'Excel v3 usa il tuo modello personale: lo sposto in un'area privata in un passo successivo. Intanto usa 'Solo dati'."
      : "Non serve più: i dati sono già in Cairn."),
  });
  return app;
}

/** Called by the page host on every relevant change (engine, year, section, permissions). */
export function updateRuntime(d: RuntimeDeps) {
  deps = d; ensureApp();
  S.ready = !!d.engine; S.writable = d.writable; S.year = d.year; S.view = d.view;
  if (d.engine && d.engine !== syncedEngine) syncFromEngine();
}
export const legacyApp = () => ensureApp();
export { S as legacyState };
