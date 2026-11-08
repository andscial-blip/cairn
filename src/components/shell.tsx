"use client";
/**
 * App frame v2. Desktop: side menu + page header with sub-tabs. Tablet: compact icon rail.
 * Phone: sticky top bar (title, year, sync) + bottom bar. One component, adapted by CSS (no duplicated markup logic).
 */
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { Icon } from "./icon";
import { Logo, Mark } from "./logo";
import { SyncBadge } from "./sync-badge";
import { SECTIONS, sectionOf } from "@/lib/views-nav";
import { Tooltip } from "./tooltip";
import { BottomNav } from "./bottom-nav";
import { AttachmentLinks } from "./attachment-links";
import { legacyApp } from "@/lib/legacy-runtime";
import { LockScreen, useAppLock } from "./app-lock";

const EXTRA: Record<string, { label: string; hint: string; parent: string }> = {
  "/importa": { label: "Importa", hint: "Dati dall'app precedente", parent: "set" },
  "/sincronizzazione": { label: "Sincronizzazione", hint: "Stato, conflitti e operazioni in attesa", parent: "set" },
};

/** The year selector appears only where it changes what the page shows. */
const YEAR_PATHS = new Set(["/", "/fatture", "/tasse", "/analisi"]);

export function Shell({ children }: { children: React.ReactNode }) {
  const { auth, year, setYear, engine, signOut, status } = useApp();
  const path = usePathname();
  const router = useRouter();
  const lock = useAppLock();
  const cmd = useCommandPalette();
  useEffect(() => { if (auth.kind === "signed-out") router.replace(`/login${auth.reason ? `?m=${encodeURIComponent(auth.reason)}` : ""}`); }, [auth, router]);
  if (auth.kind !== "ready" || !lock.ready) return null; // the splash screen stays visible until the session is resolved
  if (lock.locked && lock.cfg) return <LockScreen cfg={lock.cfg} onUnlocked={lock.unlocked} />;
  const years = engine ? engine.years() : [year];
  const sec = sectionOf(path);
  const extra = EXTRA[path];
  const activeId = sec?.id ?? extra?.parent;
  const title = sec?.label ?? extra?.label ?? "Cairn";
  const hint = sec?.hint ?? extra?.hint ?? "";
  const canWrite = auth.role !== "read_only";
  return (
    <div className="app">
      <a className="skip" href="#main">Vai al contenuto</a>
      <CommandPalette open={cmd.open} onClose={() => cmd.setOpen(false)} />
      <aside className="side" aria-label="Sezioni">
        <Link href="/" className="side-brand" aria-label="Cairn, panoramica"><Logo /><b className="wordmark">CAIRN</b></Link>
        <nav className="side-nav">
          {SECTIONS.map((s) => (
            <Link key={s.id} href={s.subs[0]!.href} className="side-link" aria-current={activeId === s.id ? "page" : undefined} title={s.label}>
              <Icon name={s.ic} size={18} /><span>{s.label}</span>
            </Link>
          ))}
        </nav>
        <div className="side-foot">
          <SyncBadge />
          <button className="side-link" type="button" onClick={signOut} title={`Esci (${auth.email})`}><Icon name="logout" size={18} /><span>Esci</span></button>
        </div>
      </aside>
      <div className="col">
        <header className="phead">
          <div className="phead-row">
            {/* Phone: the side menu (with the logo) is hidden, so the mark sits beside the page title. */}
            <Link href="/" className="pbrand only-phone" aria-label="Cairn, panoramica"><Mark className="pm-l" /><Logo className="pm-d" /></Link>
            <div className="ptitle"><h1>{title}</h1>{hint && <p>{hint}</p>}</div>
            <div className="pctl">
              <span className="only-phone"><SyncBadge compact /></span>
              <button type="button" className="btn ghost searchbtn" onClick={() => cmd.setOpen(true)} aria-label="Cerca (⌘K)" title="Cerca (⌘K)"><Icon name="search" size={16} /><span className="not-phone">Cerca</span><kbd className="not-phone">⌘K</kbd></button>
              {YEAR_PATHS.has(path) && <label className="yearsel"><span className="vh">Anno</span>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Anno">
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>}
              {canWrite && <button className="btn primary not-phone" type="button" onClick={() => legacyApp().openForm()}><Icon name="plus" size={16} />Nuova fattura</button>}
            </div>
          </div>
          {sec && sec.subs.length > 1 && (
            <nav className="subnav" aria-label={`Viste di ${sec.label}`}>
              {sec.subs.map((x) => <Link key={x.href} href={x.href} aria-current={path === x.href ? "page" : undefined}>{x.label}</Link>)}
            </nav>
          )}
        </header>
        {auth.offline && <div className="offline-note" role="status">Offline: le modifiche restano su questo dispositivo e partono appena torna la rete. Accesso offline valido fino al {new Date(auth.grant!.expiresAt).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })}.</div>}
        <main className="main" id="main" data-ready={engine && (status?.lastSyncAt || status?.lastError || auth.offline || (status && !status.online)) ? "1" : undefined}>{children}</main>
      </div>
      <div id="sheetRoot" />
      <div id="toastRoot" />
      <AttachmentLinks />
      <Tooltip />
      <BottomNav />
    </div>
  );
}
