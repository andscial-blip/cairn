"use client";
/** Impostazioni → Calendario: private ICS link to subscribe from Google Calendar / Apple Calendar. */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { createOrRotate, disableFeed, feedStatus, feedUrl, savedToken } from "@/lib/calendar-feed";
import { currentIcs, setFeedActive } from "@/lib/legacy-runtime";

export function CalendarPanel() {
  const { sb, auth } = useApp();
  const ledger = auth.kind === "ready" ? auth.ledgerId : null;
  const [st, setSt] = useState<{ active: boolean; updatedAt: string | null } | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!ledger) return;
    const t = savedToken(ledger); if (t) setUrl(feedUrl(t));
    if (navigator.onLine) feedStatus(sb, ledger).then(setSt).catch(() => setMsg("Stato del calendario non disponibile."));
  }, [sb, ledger]);
  if (!ledger) return null;
  const run = async (f: () => Promise<void>) => { setBusy(true); setMsg(null); try { await f(); } catch (e) { setMsg(`Operazione non riuscita: ${(e as Error).message}`); } finally { setBusy(false); } };
  const create = () => run(async () => {
    if (!navigator.onLine) { setMsg("Serve la connessione."); return; }
    const ics = currentIcs(); if (!ics) { setMsg("Dati non ancora caricati."); return; }
    const u = await createOrRotate(sb, ledger, ics); setUrl(u); setSt({ active: true, updatedAt: new Date().toISOString() }); setFeedActive(true);
    setMsg(st?.active ? "Nuovo link creato: il vecchio non funziona più. Aggiorna l'iscrizione nel calendario." : "Link creato. Ora aggiungilo al tuo calendario.");
  });
  const disable = () => run(async () => { await disableFeed(sb, ledger); setUrl(null); setSt({ active: false, updatedAt: null }); setFeedActive(false); setMsg("Calendario disattivato: il link non funziona più."); });
  const copy = async () => { if (!url) return; try { await navigator.clipboard.writeText(url); setMsg("Link copiato."); } catch { setMsg(url); } };
  return (
    <section className="panel" id="calendario" style={{ marginTop: 18 }}>
      <div className="panel-h"><h2>Calendario</h2><div className="spacer" /><span className="eyebrow">{st?.active ? "attivo" : st ? "non attivo" : ""}</span></div>
      <div className="panel-b" style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0 }}>Emissioni fatture, F24, promemoria e revisione del PAC dei prossimi mesi, in un calendario a parte che si aggiorna da solo ogni volta che usi Cairn.</p>
        {st?.active && url && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input className="in" readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ flex: "1 1 320px", minWidth: 0 }} aria-label="Link privato del calendario" />
            <button className="btn" type="button" onClick={copy}>Copia link</button>
          </div>
        )}
        {st?.active && !url && <p className="muted" style={{ margin: 0 }}>Il link è stato creato da un altro dispositivo e qui non è visibile: se ti serve, crea un nuovo link (il vecchio smette di funzionare).</p>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {!st?.active && <button className="btn primary" type="button" disabled={busy || !st} onClick={create}>Crea link privato</button>}
          {st?.active && <button className="btn" type="button" disabled={busy} onClick={create}>Crea nuovo link (disattiva il vecchio)</button>}
          {st?.active && <button className="btn ghost" type="button" disabled={busy} onClick={disable}>Disattiva</button>}
        </div>
        {msg && <p role="status" className="muted" style={{ margin: 0 }}>{msg}</p>}
        <details className="help"><summary>Come aggiungerlo</summary>
          <p><b>Google Calendar (dal computer):</b> calendar.google.com → a sinistra «Altri calendari» → <b>+</b> → «Da URL» → incolla il link → «Aggiungi calendario». Compare anche sul telefono. Google lo rilegge ogni qualche ora (fino a un giorno): per gli avvisi imposta le notifiche predefinite di questo calendario.</p>
          <p><b>iPhone (Calendario Apple):</b> Impostazioni → Calendario → Account → Aggiungi account → Altro → «Aggiungi calendario sottoscritto» → incolla il link.</p>
          <p>Il link è privato: chi lo ha vede le scadenze (non altro). Se lo condividi per errore, crea un nuovo link.</p>
        </details>
      </div>
    </section>
  );
}
