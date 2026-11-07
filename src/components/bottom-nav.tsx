"use client";
/** Phone navigation: the 4 most used destinations + new invoice within thumb reach; the rest in "Altro". */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { Icon } from "./icon";
import { legacyApp } from "@/lib/legacy-runtime";
import { SECTIONS, sectionOf } from "@/lib/views-nav";

const MAIN = ["home", "fatture", "fisco"];
export function BottomNav() {
  const path = usePathname(); const { signOut, auth } = useApp();
  const [more, setMore] = useState(false);
  useEffect(() => { setMore(false); }, [path]);
  const active = sectionOf(path)?.id ?? (path === "/importa" || path === "/sincronizzazione" ? "set" : "");
  const S = (id: string) => SECTIONS.find((s) => s.id === id)!;
  const tab = (id: string) => { const s = S(id); return (
    <Link key={id} href={s.subs[0]!.href} aria-current={active === id ? "page" : undefined}><Icon name={s.ic} size={20} /><span>{s.label}</span></Link>); };
  const others = SECTIONS.filter((s) => !MAIN.includes(s.id));
  return (
    <>
      <nav className="bnav" aria-label="Sezioni principali">
        {tab("home")}{tab("fatture")}
        {auth.kind === "ready" && auth.role !== "read_only"
          ? <button type="button" className="bplus" aria-label="Nuova fattura" onClick={() => legacyApp().openForm()}><Icon name="plus" size={22} /></button>
          : <span />}
        {tab("fisco")}
        <button type="button" aria-current={others.some((s) => s.id === active) ? "page" : undefined} aria-expanded={more} onClick={() => setMore(true)}><Icon name="more" size={20} /><span>Altro</span></button>
      </nav>
      {more && (
        <div className="sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) setMore(false); }}>
          <div className="sheet sheet-menu" role="dialog" aria-modal="true" aria-label="Altre sezioni">
            <div className="sheet-h"><h2>Altre sezioni</h2><div className="spacer" /><button className="btn ghost" type="button" onClick={() => setMore(false)}>Chiudi</button></div>
            <div className="sheet-b">
              <ul className="menu-list">
                {others.map((s) => (<li key={s.id}><Link href={s.subs[0]!.href}><Icon name={s.ic} size={20} /><span><b>{s.label}</b><small>{s.hint}</small></span></Link></li>))}
                <li><Link href="/sincronizzazione"><Icon name="sync" size={20} /><span><b>Sincronizzazione</b><small>Stato, conflitti e operazioni in attesa</small></span></Link></li>
                <li><button type="button" onClick={signOut}><Icon name="down" size={20} /><span><b>Esci</b><small>{auth.kind === "ready" ? auth.email : ""}</small></span></button></li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
