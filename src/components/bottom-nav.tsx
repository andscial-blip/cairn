"use client";
/** Phone navigation, as in the original: Home · Fatture · + · Scadenze · Altro (sheet with the other sections). */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { Icon } from "./icon";
import { legacyApp } from "@/lib/legacy-runtime";

const MORE = [["/entrate", "inbox", "Entrate"], ["/spese", "piggy", "Spese"], ["/risparmi", "safe", "Risparmi"], ["/investimenti", "trend", "Investimenti"],
  ["/analisi", "chart", "Analisi"], ["/da-emettere", "pen", "Prossime fatture"], ["/tasse", "euro", "F24 e tasse"], ["/contratti", "brief", "Contratti e missioni"],
  ["/impostazioni", "gear", "Impostazioni"], ["/sincronizzazione", "check", "Sincronizzazione"]] as const;

export function BottomNav() {
  const path = usePathname(); const router = useRouter(); const { signOut, auth } = useApp();
  const [more, setMore] = useState(false);
  const cur = (h: string) => (path === h ? "page" : "false");
  return (
    <>
      <nav className="bnav" aria-label="Sezioni principali">
        <button type="button" aria-current={cur("/")} onClick={() => router.push("/")}><Icon name="home" size={15} />Home</button>
        <button type="button" aria-current={cur("/fatture")} onClick={() => router.push("/fatture")}><Icon name="file" size={15} />Fatture</button>
        <button type="button" className="bplus" aria-label="Nuova fattura" onClick={() => legacyApp().openForm()}><Icon name="plus" size={15} /></button>
        <button type="button" aria-current={cur("/scadenze")} onClick={() => router.push("/scadenze")}><Icon name="cal" size={15} />Scadenze</button>
        <button type="button" aria-current={MORE.some(([h]) => h === path) ? "page" : "false"} onClick={() => setMore(true)}><Icon name="more" size={15} />Altro</button>
      </nav>
      {more && (
        <div className="sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) setMore(false); }}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Altre sezioni">
            <div className="sheet-h"><h2>Altre sezioni</h2><div className="spacer" /><button className="btn ghost" type="button" onClick={() => setMore(false)}>Chiudi</button></div>
            <div className="sheet-b"><div className="morelist">
              {MORE.map(([h, i, l]) => <Link key={h} className="btn" href={h} onClick={() => setMore(false)}><Icon name={i} size={16} /> {l}</Link>)}
              <button className="btn" type="button" onClick={signOut}>Esci{auth.kind === "ready" ? ` (${auth.email})` : ""}</button>
            </div></div>
          </div>
        </div>
      )}
    </>
  );
}
