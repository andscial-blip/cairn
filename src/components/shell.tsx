"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
import { Icon } from "./icon";
import { Logo } from "./logo";
import { SyncBadge } from "./sync-badge";

import { VIEWS } from "@/lib/views-nav";
import { Tooltip } from "./tooltip";
import { BottomNav } from "./bottom-nav";
import { AttachmentLinks } from "./attachment-links";
import { legacyApp } from "@/lib/legacy-runtime";

const NAV = VIEWS;

export function Shell({ children }: { children: React.ReactNode }) {
  const { auth, year, setYear, engine, signOut } = useApp();
  const path = usePathname();
  const router = useRouter();
  useEffect(() => { if (auth.kind === "signed-out") router.replace(`/login${auth.reason ? `?m=${encodeURIComponent(auth.reason)}` : ""}`); }, [auth, router]);
  if (auth.kind !== "ready") return <main className="wrap" style={{ paddingTop: 64 }}><p className="muted">Caricamento…</p></main>;
  const years = engine ? engine.years() : [year];
  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brandwrap"><Logo /><div className="brand"><b>Cairn</b><span>A. Scialabba · P.IVA, tasse e patrimonio</span></div></div>
          <div className="spacer" />
          <SyncBadge />
          <label className="yearpick">Anno{" "}
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          {auth.role !== "read_only" && <button className="btn primary" type="button" onClick={() => legacyApp().openForm()}>+ Nuova fattura</button>}
          <button className="btn small ghost hide-sm" type="button" onClick={signOut} title={`Esci (${auth.email})`}>Esci</button>
        </div>
        <nav className="nav" aria-label="Sezioni"><div className="wrap">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className="navlink">
              <span className="nic"><Icon name={n.ic} /></span>{n.label}
            </Link>
          ))}
        </div></nav>
      </header>
      {auth.offline && <div className="wrap" role="status" style={{ marginTop: 10 }}><p className="muted" style={{ margin: 0 }}>Modalità offline: le modifiche restano su questo dispositivo e vengono inviate appena torna la connessione. Accesso offline valido fino al {new Date(auth.grant!.expiresAt).toLocaleString("it-IT")}.</p></div>}
      <main className="wrap">{children}</main>
      <div id="sheetRoot" />
      <div id="toastRoot" />
      <AttachmentLinks />
      <Tooltip />
      <BottomNav />
    </>
  );
}
