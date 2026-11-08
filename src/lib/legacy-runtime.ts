"use client";
/**
 * One instance of the original app's code per browser tab, wired to Cairn:
 * S (the original state object) is refreshed from the live engine; writes go through the bridge.
 */
import { polish, bindPolish, bindSheetPolish } from "@/lib/view-polish";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createLegacy, type LegacyApp } from "@/legacy/app";
import { createBridgeDb } from "@/legacy/bridge";
import { mergeCfg, type Engine } from "@/domain/engine";
import type { Entity, LocalRow } from "@/offline/types";
import { buildIcs } from "@/lib/ics";
import { feedStatus, publishIfChanged } from "@/lib/calendar-feed";
import { listInbox, closeInbox, noteInbox, b64ToBytes, xmlFromBytes } from "@/lib/einvoice-inbox";
import { parseCourtesyPdf, parseFatturaXml, type EInvoiceData } from "@/lib/einvoice-pdf";
import { loadPdfLib, pdfToLines } from "@/lib/pdf-text";
import { auditToStorico, HISTORY_TABLES, type AuditEntry } from "@/legacy/history";

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
let feedActive: boolean | null = null, feedChecking = false, publishTimer: ReturnType<typeof setTimeout> | undefined;
let historyAt = 0, historyKey = "";
export const V3_PATH = (ledger: string) => `${ledger}/templates/excel-v3.xlsx`;

const COMPOSE: Record<string, (FX: unknown) => string> = {
  home: (FX) => app!.vHome(FX), entr: (FX) => app!.vEntrate(FX), spese: (FX) => app!.vSpese(FX), risp: (FX) => app!.vRisp(FX),
  invest: (FX) => app!.vInvest(FX), anal: (FX) => app!.vAnal(FX), inv: (FX) => app!.vInv(FX), prev: (FX) => app!.vPrev(FX), f24: (FX) => app!.vF24(FX),
  // Fisco › Tasse e F24: compliance always on top, then one of three focused views (was one 5,000 px page).
  tasse: (FX) => {
    const T = [["f24", "Versamenti e conto tasse"], ["calc", "Calcolo annuale"], ["redditi", "Altri redditi"]];
    const t = T.some((x) => x[0] === S.ttab) ? S.ttab : "f24";
    const bar = `<div class="segs" role="tablist" aria-label="Viste di tasse e F24">${T.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === t}" data-ttab-go="${k}">${l}</button>`).join("")}</div>`;
    return app!.compliancePanel() + bar + (t === "f24" ? app!.vTasse(FX) : t === "calc" ? app!.vFisco(FX) : app!.redditiPanel());
  },
  contr: (FX) => app!.vContr(FX) + `<div class="eyebrow" style="margin:22px 0 4px">Missioni</div>` + app!.vMis(FX),
  set: (FX) => app!.vSet(FX),
};

function syncFromEngine() {
  const E = deps?.engine; if (!E) return;
  for (const c of COLLS) S[c] = E.s[c];
  S.cfg = E.s.cfg; syncedEngine = E;
}

/** The original render(): draw the current section into #app and bind its controls. */
let autoT212Tried = false;
let inboxTried = false;
/** Inbox files not matched automatically, kept in memory with their bytes for the manual "Abbina" sheet. */
let inboxPending: { id: string; filename: string; mime: string; reason: string; candidate?: string; data: EInvoiceData | null; bytes: Uint8Array; received: string }[] = [];
async function readEInvoice(bytes: Uint8Array, mime: string): Promise<EInvoiceData | null> {
  try {
    if (mime === "application/pdf") return parseCourtesyPdf(await pdfToLines(await loadPdfLib(), bytes));
    const xml = mime === "application/xml" ? new TextDecoder("utf-8").decode(bytes) : xmlFromBytes(bytes);
    return xml ? parseFatturaXml(xml) : null;
  } catch { return null; }
}
/** Reads the Gmail inbox (once per app start): each e-invoice file goes to its invoice; the others wait in "Da fare". */
async function processInbox() {
  const d = deps; if (!d?.ledgerId || !d.writable || !navigator.onLine || !app) return;
  let rows; try { rows = await listInbox(d.sb, d.ledgerId); } catch { return; }
  const attached: string[] = []; inboxPending = [];
  for (const r of rows) {
    if (!r.content_b64) continue;
    const bytes = b64ToBytes(r.content_b64), received = r.received_at ?? r.created_at;
    const data = await readEInvoice(bytes, r.mime);
    if (!data) { await closeInbox(d.sb, r.id, "ignored", null, "non è una fattura elettronica").catch(() => undefined); continue; }
    const res = await app.inboxAttach({ bytes, filename: r.filename, mime: r.mime, data, received, invoiceId: null });
    if (res.ok) { await closeInbox(d.sb, r.id, "attached", res.id, res.skipped ? "la fattura aveva già un file" : "").catch(() => undefined); if (!res.skipped) attached.push(res.num); }
    else { if (r.note !== res.reason) await noteInbox(d.sb, r.id, res.reason).catch(() => undefined); inboxPending.push({ id: r.id, filename: r.filename, mime: r.mime, reason: res.reason, candidate: res.candidate, data, bytes, received }); }
  }
  S.inboxPending = inboxPending.map(({ bytes: _b, ...p }) => p);
  if (attached.length) toast(attached.length === 1 ? `Fattura elettronica ${attached[0]} allegata da Gmail` : `${attached.length} fatture elettroniche allegate da Gmail`);
  renderLegacy();
}
export function renderLegacy() {
  const el = typeof document !== "undefined" ? document.getElementById("app") : null;
  if (!el || !deps?.engine || !app) return;
  try {
    const FX = app._fisco();
    // With the private calendar feed active, the calendar is always up to date: no "sync" to-do in the Dashboard.
    S.calsync = feedActive ? app.calItems(FX).map((i: { key: string; hash: string; date: string }) => ({ id: i.key, hash: i.hash, date: i.date })) : [];
    if (S.view === "set") void loadHistory();
    let h = "";
    if (!S.invoices.length && !S.clients.length) h += `<div class="banner">Il registro è vuoto. Importa i dati dall'app precedente da <b>Impostazioni → Importa</b>, oppure aggiungi i clienti in <b>Impostazioni</b>.</div>`;
    h += (COMPOSE[S.view] ?? COMPOSE.home!)(FX);
    // Keep open folds (e.g. "Costi e fisco") open across redraws of the same section: a sync or a save redraws the page.
    const key = (d: Element) => d.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    const wasOpen = el.dataset.view === String(S.view) ? new Set([...el.querySelectorAll("details[open]")].map(key)) : new Set<string>();
    el.innerHTML = h; el.dataset.view = String(S.view);
    if (wasOpen.size) el.querySelectorAll("details").forEach((d) => { if (wasOpen.has(key(d))) (d as HTMLDetailsElement).open = true; });
    app.bindView(FX);
    // Accessibility: horizontally scrollable tables must be reachable and scrollable with the keyboard.
    el.querySelectorAll<HTMLElement>(".tw").forEach((t) => { if (t.scrollWidth > t.clientWidth) { t.tabIndex = 0; t.setAttribute("role", "region"); t.setAttribute("aria-label", t.closest(".panel")?.querySelector("h2")?.textContent?.trim() || "Tabella"); } });
    // Presentation polish (chart labels, wide tables, settings index): see view-polish.ts.
    polish(el, String(S.view), Number(S.year) || undefined); bindPolish(() => document.getElementById("app")); bindSheetPolish();
    // In-page tabs (Analisi, Tasse e F24): remember the choice in S and redraw.
    if (!el.dataset.tabs) {
      el.dataset.tabs = "1";
      el.addEventListener("click", (e) => {
        const b = (e.target as Element).closest?.("[data-atab-go],[data-ttab-go],[data-prev-all],[data-f24-past],[data-todo-all],[data-enty]") as HTMLElement | null; if (!b) return;
        if (b.dataset.enty) S.entY = Number(b.dataset.enty);
        else if (b.dataset.todoAll) S.todoAll = !S.todoAll;
        else if (b.dataset.prevAll) S.prevAll = !S.prevAll;
        else if (b.dataset.f24Past) S.f24past = !S.f24past;
        else if (b.dataset.atabGo) S.atab = b.dataset.atabGo; else S.ttab = b.dataset.ttabGo;
        renderLegacy();
      });
    }
    schedulePublish();
  } catch (e) {
    console.error(e);
    el.innerHTML = `<section class="panel empty">Errore nel disegnare questa sezione: ${String((e as Error).message).replace(/[<>&]/g, "")}</section>`;
  }
}

/** ICS text of the current deadlines (same items the original pushed to Google Calendar). */
export function currentIcs(): string | null {
  if (!app || !deps?.engine) return null;
  return buildIcs(app.calItems(app._fisco()));
}
export function setFeedActive(v: boolean) { feedActive = v; renderLegacy(); }
function schedulePublish() {
  clearTimeout(publishTimer);
  publishTimer = setTimeout(() => {
    const d = deps; if (!feedActive || !d?.ledgerId || !d.writable || !navigator.onLine) return;
    const ics = currentIcs(); if (ics) void publishIfChanged(d.sb, d.ledgerId, ics).catch(() => undefined);
  }, 4000);
}
async function checkFeed() {
  const d = deps; if (feedChecking || feedActive !== null || !d?.ledgerId || !navigator.onLine) return;
  feedChecking = true;
  try { feedActive = (await feedStatus(d.sb, d.ledgerId)).active; renderLegacy(); } catch { /* not admin or offline: leave unknown */ } finally { feedChecking = false; }
}
async function loadHistory() {
  const d = deps; if (!d?.ledgerId || !navigator.onLine || Date.now() - historyAt < 20_000) return;
  historyAt = Date.now();
  const { data, error } = await d.sb.from("audit_logs").select("id, at, action, entity, record_id, details").eq("ledger_id", d.ledgerId)
    .in("entity", HISTORY_TABLES).in("action", ["create", "update", "delete"]).order("id", { ascending: false }).limit(60);
  if (error || !data) return;
  const key = data.map((x) => x.id).join(",");
  if (key === historyKey) return;
  historyKey = key; S.storico = auditToStorico(data as AuditEntry[], d.rows);
  if (S.view === "set") renderLegacy();
}

const MIME: Record<string, string> = { pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", json: "application/json", xml: "application/xml", csv: "text/csv", ics: "text/calendar" };
/**
 * Saves a file the user asked for. On iPhone/iPad and in the installed app (standalone), a download link does nothing:
 * there the share sheet opens instead («Salva su File», Mail, WhatsApp…). Elsewhere a normal download.
 */
export async function saveFile(filename: string, data: unknown): Promise<boolean> {
  const type = MIME[(filename.split(".").pop() || "").toLowerCase()] ?? "application/octet-stream";
  const blob = data instanceof Blob ? data : new Blob([typeof data === "string" ? data : data instanceof ArrayBuffer || ArrayBuffer.isView(data) ? (data as BlobPart) : JSON.stringify(data)], { type });
  const file = new File([blob], filename, { type: blob.type || type });
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios = /iP(hone|ad|od)/.test(nav.userAgent) || (nav.platform === "MacIntel" && nav.maxTouchPoints > 1);
  const standalone = nav.standalone === true || (typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches);
  if ((ios || standalone) && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title: filename }); return true; }
    catch (e) { if ((e as Error).name === "AbortError") return false; /* not allowed (e.g. activation lost): fall back below */ }
  }
  const url = URL.createObjectURL(file);
  if (ios && standalone) { window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 60_000); return true; }
  const a = document.createElement("a"); a.href = url; a.download = filename; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000); return true;
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
      save: async ({ filename, data }) => saveFile(filename, data),
    },
    assetsCap: {
      upload: async (f: File) => {
        if (!navigator.onLine) throw Object.assign(new Error("offline"), { code: "offline" });
        if (f.size > MAX_PDF) throw Object.assign(new Error("too large"), { code: "too_large" });
        // E-invoice files: the PDF copy, the FatturaPA XML or the signed .xml.p7m.
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        const mime = ext === "pdf" ? "application/pdf" : ext === "xml" ? "application/xml" : ext === "p7m" ? "application/pkcs7-mime" : f.type || "";
        if (!["application/pdf", "application/xml", "application/pkcs7-mime"].includes(mime)) throw Object.assign(new Error("type"), { code: "type" });
        const id = crypto.randomUUID(); const name = f.name.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "fattura.pdf";
        const path = `${deps!.ledgerId}/${id}/${name}`;
        const { error } = await deps!.sb.storage.from("attachments").upload(path, f, { contentType: mime, upsert: false });
        if (error) throw Object.assign(new Error(error.message), { code: "upload_failed" });
        uploads.set(id, { path, name: f.name.slice(0, 255), mime, size: f.size });
        return { id, url: `cairn-att:${path}` };
      },
    },
    unavailable: (what) => {
      if (what === "calendar" && feedActive && deps?.ledgerId && navigator.onLine) {
        const ics = currentIcs(); if (ics) void publishIfChanged(deps.sb, deps.ledgerId, ics, true).then((ok) => toast(ok ? "Calendario aggiornato: Google Calendar lo rilegge entro qualche ora." : "Aggiornamento del calendario non riuscito."));
        return;
      }
      if (what === "calendar") { deps?.navigate("set"); setTimeout(() => { location.hash = "calendario"; document.getElementById("calendario")?.scrollIntoView({ behavior: "smooth" }); }, 400); return; }
      toast(what === "v3" ? (navigator.onLine ? "Carica prima il modello Excel v3 in Impostazioni → Modello Excel v3." : "L'Excel v3 si prepara solo online (il modello è nell'archivio privato).")
        : "Non serve più: i dati sono già in Cairn.");
    },
    t212: async (o?: { history?: boolean }) => {
      const d = deps; if (!d) return { status: 0, body: { code: "unauthorized" } };
      const { data } = await d.sb.auth.getSession(); const token = data.session?.access_token;
      if (!token) return { status: 401, body: { code: "unauthorized" } };
      const r = await fetch("/api/t212", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(o ?? {}), cache: "no-store" });
      return { status: r.status, body: await r.json().catch(() => ({})) };
    },
    inbox: {
      attach: async (rowId: string, invoiceId: string) => {
        const p = inboxPending.find((x) => x.id === rowId); const d = deps; if (!p || !d || !app) return false;
        const res = await app.inboxAttach({ bytes: p.bytes, filename: p.filename, mime: p.mime, data: p.data, received: p.received, invoiceId });
        if (!res.ok) return false;
        await closeInbox(d.sb, rowId, "attached", res.id, res.skipped ? "la fattura aveva già un file" : "abbinata a mano").catch(() => undefined);
        inboxPending = inboxPending.filter((x) => x.id !== rowId); S.inboxPending = inboxPending.map(({ bytes: _b, ...x }) => x); renderLegacy(); return true;
      },
      ignore: async (rowId: string) => {
        const d = deps; if (!d) return false;
        try { await closeInbox(d.sb, rowId, "ignored", null, "ignorata"); } catch { return false; }
        inboxPending = inboxPending.filter((x) => x.id !== rowId); S.inboxPending = inboxPending.map(({ bytes: _b, ...x }) => x); renderLegacy(); return true;
      },
    },
    attachmentBlob: async (url: string) => {
      const d = deps; if (!d || !url.startsWith("cairn-att:")) return null;
      const { data, error } = await d.sb.storage.from("attachments").download(url.slice("cairn-att:".length));
      return error ? null : data;
    },
    v3Template: async () => {
      const d = deps; if (!d?.ledgerId || !navigator.onLine) return null;
      const { data, error } = await d.sb.storage.from("attachments").download(V3_PATH(d.ledgerId));
      if (error || !data) return null;
      const buf = new Uint8Array(await data.arrayBuffer()); let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(bin);
    },
  });
  return app;
}

/** Called by the page host on every relevant change (engine, year, section, permissions). */
export function updateRuntime(d: RuntimeDeps) {
  deps = d; ensureApp();
  S.ready = !!d.engine; S.writable = d.writable; S.year = d.year; S.view = d.view;
  if (d.engine && d.engine !== syncedEngine) syncFromEngine();
  if (feedActive === null && d.ledgerId && d.writable) void checkFeed();
  // Trading 212: once per app start, online and writable, a quiet daily sync (see autoT212 in the legacy app).
  if (!autoT212Tried && d.engine && d.writable && d.ledgerId && typeof navigator !== "undefined" && navigator.onLine) {
    autoT212Tried = true;
    setTimeout(() => { void Promise.resolve(app?.autoT212()).then((r) => { if (r === "review") toast("Trading 212: c'è un ETF nuovo o venduto. Controlla in Investimenti → Sincronizza."); }).catch(() => undefined); }, 2500);
  }
  // E-invoice files from Gmail: once per app start, after the data are loaded.
  if (!inboxTried && d.engine && d.writable && d.ledgerId && typeof navigator !== "undefined" && navigator.onLine) {
    inboxTried = true; setTimeout(() => { void processInbox().catch(() => undefined); }, 4000);
  }
}
export const legacyApp = () => ensureApp();
export { S as legacyState };
