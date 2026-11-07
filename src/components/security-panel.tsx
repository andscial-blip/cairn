"use client";
/** Impostazioni → Sicurezza: biometric unlock on this device, sign out everywhere. */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { biometricAvailable, enrollLock, type LockConfig } from "@/lib/app-lock";

export function SecurityPanel() {
  const { db, auth, sb } = useApp();
  const [avail, setAvail] = useState<boolean | null>(null);
  const [cfg, setCfg] = useState<LockConfig | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void biometricAvailable().then(setAvail);
    if (db) void db.meta.get("applock").then((m) => setCfg((m?.value as LockConfig | undefined) ?? null));
  }, [db]);
  if (auth.kind !== "ready" || !db) return null;
  const enable = async () => {
    setBusy(true); setMsg(null);
    try { const c = await enrollLock({ id: auth.userId, email: auth.email }); await db.meta.put({ key: "applock", value: c }); setCfg(c); setMsg("Attivato: da ora Cairn si apre con Face ID, Touch ID o impronta su questo dispositivo."); }
    catch (e) { setMsg((e as DOMException).name === "NotAllowedError" ? "Operazione annullata." : `Non attivato: ${(e as Error).message}`); }
    finally { setBusy(false); }
  };
  const disable = async () => { await db.meta.delete("applock"); setCfg(null); setMsg("Disattivato su questo dispositivo. Puoi anche eliminare la chiave «Cairn» dalle passkey del sistema."); };
  const everywhere = async () => {
    if (!navigator.onLine) { setMsg("Serve la connessione."); return; }
    await sb.auth.signOut({ scope: "global" }); await db.meta.delete("grant"); window.location.assign("/login?m=" + encodeURIComponent("Sei uscito da tutti i dispositivi."));
  };
  return (
    <section className="panel" id="sicurezza" style={{ marginTop: 18 }}>
      <div className="panel-h"><h2>Sicurezza</h2><div className="spacer" /><span className="eyebrow">{cfg ? "sblocco biometrico attivo" : ""}</span></div>
      <div className="panel-b" style={{ display: "grid", gap: 12 }}>
        <div>
          <b>Sblocco con Face ID, Touch ID o impronta</b>
          <p className="muted" style={{ margin: "4px 0 0" }}>Cairn si blocca all&apos;apertura e dopo 5 minuti in background. Il riconoscimento lo fa il sistema del dispositivo: Cairn non riceve né conserva dati biometrici. Email e password restano sempre disponibili.</p>
        </div>
        {avail === false && <p className="muted" style={{ margin: 0 }}>Questo dispositivo o browser non offre lo sblocco biometrico alle app web.</p>}
        {avail && (cfg
          ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn" type="button" onClick={disable}>Disattiva su questo dispositivo</button></div>
          : <div><button className="btn primary" type="button" disabled={busy} onClick={enable}>{busy ? "Attivo…" : "Attiva su questo dispositivo"}</button></div>)}
        <div style={{ borderTop: "1px solid var(--line-2)", paddingTop: 12 }}>
          <button className="btn ghost" type="button" onClick={everywhere}>Esci da tutti i dispositivi</button>
          <p className="muted" style={{ margin: "4px 0 0", fontSize: 13 }}>Da usare se perdi un telefono: chiude le sessioni ovunque; per rientrare servirà la password.</p>
        </div>
        {msg && <p role="status" className="muted" style={{ margin: 0 }}>{msg}</p>}
      </div>
    </section>
  );
}
