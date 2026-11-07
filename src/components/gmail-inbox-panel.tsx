"use client";
/** Impostazioni → Fatture elettroniche da Gmail: creates the private code and gives the Apps Script to paste. */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { anonKey, createInboxToken, disableInbox, inboxStatus, rpcUrl } from "@/lib/einvoice-inbox";
import { appsScript } from "@/lib/einvoice-pdf";

export function GmailInboxPanel() {
  const { sb, auth, engine } = useApp();
  const ledger = auth.kind === "ready" ? auth.ledgerId : null;
  const [st, setSt] = useState<{ active: boolean; lastUsed: string | null } | null>(null);
  const [from, setFrom] = useState<string>("");
  const [script, setScript] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!ledger) return;
    if (navigator.onLine) inboxStatus(sb, ledger).then(setSt).catch(() => setMsg("Stato non disponibile (serve un account amministratore)."));
  }, [sb, ledger]);
  // The accountant's address from Impostazioni, once the data are loaded (the field stays editable).
  const mail = engine?.s.cfg.commercialista?.email ?? "";
  useEffect(() => { if (mail) setFrom((f) => f || mail); }, [mail]);
  if (!ledger) return null;
  const create = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from.trim())) { setMsg("Scrivi l'indirizzo da cui arrivano le fatture."); return; }
    setBusy(true); setMsg(null);
    try {
      const token = await createInboxToken(sb, ledger);
      setScript(appsScript({ rpcUrl: rpcUrl(), anonKey: anonKey(), token, from: from.trim() }));
      setSt({ active: true, lastUsed: null });
      setMsg(st?.active ? "Nuovo codice creato: lo script vecchio non funziona più. Sostituiscilo con questo." : "Script pronto: copialo e segui i passi qui sotto.");
    } catch (e) { setMsg(`Operazione non riuscita: ${(e as Error).message}`); } finally { setBusy(false); }
  };
  const off = async () => { setBusy(true); try { await disableInbox(sb, ledger); setSt({ active: false, lastUsed: null }); setScript(null); setMsg("Disattivato: lo script non può più inviare file."); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); } };
  const copy = async () => { if (!script) return; try { await navigator.clipboard.writeText(script); setMsg("Script copiato."); } catch { setMsg("Seleziona il testo e copialo a mano."); } };
  const when = st?.lastUsed ? new Date(st.lastUsed).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" }) : null;
  return (
    <section className="panel" id="gmail" style={{ marginTop: 18 }}>
      <div className="panel-h"><h2>Fatture elettroniche da Gmail</h2><div className="spacer" /><span className="eyebrow">{st?.active ? (when ? `attivo · ultimo file ${when}` : "attivo · nessun file ancora") : st ? "non attivo" : ""}</span></div>
      <div className="panel-b" style={{ display: "grid", gap: 12 }}>
        <p style={{ margin: 0 }}>Quando la commercialista ti manda la fattura elettronica (PDF, XML o P7M), Cairn la allega da sola alla fattura giusta e la segna come emessa. Funziona con un piccolo script nel tuo Gmail che gira ogni ora: le mail restano tue, Cairn riceve solo gli allegati di quel mittente.</p>
        <label style={{ display: "grid", gap: 4, maxWidth: 420 }}><span className="muted" style={{ fontSize: 13 }}>Mittente delle fatture</span>
          <input className="in" type="email" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="commercialista@studio.it" aria-label="Mittente delle fatture" /></label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={st?.active ? "btn" : "btn primary"} type="button" disabled={busy || !st} onClick={create}>{st?.active ? "Nuovo script (disattiva il vecchio)" : "Crea lo script"}</button>
          {st?.active && <button className="btn ghost" type="button" disabled={busy} onClick={off}>Disattiva</button>}
        </div>
        {script && (<>
          <textarea className="in" readOnly value={script} rows={8} style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} onFocus={(e) => e.currentTarget.select()} aria-label="Script per Gmail" />
          <div><button className="btn primary" type="button" onClick={copy}>Copia script</button></div>
          <ol style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>Dal computer apri <b>script.google.com</b> con il tuo account Gmail → <b>Nuovo progetto</b>.</li>
            <li>Cancella il testo che c&apos;è, incolla lo script e salva (icona del disco).</li>
            <li>In alto scegli la funzione <b>setup</b> e premi <b>Esegui</b>. Google chiede l&apos;autorizzazione: è il tuo script, quindi «Avanzate» → «Vai al progetto» → «Consenti».</li>
            <li>Fatto: ogni ora le nuove mail del mittente con la fattura arrivano in Cairn. Quella che c&apos;è già negli ultimi 4 mesi arriva subito.</li>
          </ol>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Lo script contiene un codice privato che Cairn mostra solo ora. Se lo perdi o lo condividi per errore, crea un nuovo script: il vecchio smette di funzionare.</p>
        </>)}
        {msg && <p role="status" className="muted" style={{ margin: 0 }}>{msg}</p>}
      </div>
    </section>
  );
}
