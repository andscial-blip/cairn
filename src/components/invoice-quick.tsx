"use client";
/** Temporary invoice sheet (until the original detail sheet is bridged): summary, mark as collected offline, open the PDF. */
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { tot } from "@/domain/engine";
import { eur, dmy, todayISO } from "@/lib/format";

export function InvoiceQuick({ id, onClose }: { id: string; onClose: () => void }) {
  const { engine, rows, save, sb, auth } = useApp();
  const [date, setDate] = useState(todayISO());
  const [msg, setMsg] = useState<string | null>(null);
  const v = engine?.s.invoices.find((x) => x.id === id);
  if (!engine || !v) return null;
  const canWrite = auth.kind === "ready" && auth.role !== "read_only";
  const t = tot(v); const c = engine.client(v.cliente);
  const row = (rows.invoices ?? []).find((r) => r.id === v.id);
  const att = row?.attachment_id ? ((rows.attachments ?? []).find((a) => a.id === row.attachment_id) as { storage_path?: string } | undefined) : undefined;
  async function openPdf() {
    if (!att?.storage_path) return;
    if (!navigator.onLine) { setMsg("I PDF si aprono solo online."); return; }
    const { data, error } = await sb.storage.from("attachments").createSignedUrl(att.storage_path, 60);
    if (error || !data) { setMsg("PDF non disponibile."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }
  async function collect() {
    if (!date || date < v!.data) { setMsg("La data di incasso non può precedere la data della fattura."); return; }
    await save("invoices", v!.id, { collected_on: date });
    setMsg(`Segnata come incassata il ${dmy(date)}${navigator.onLine ? "." : " (verrà inviata appena torni online)."}`);
  }
  return (
    <div className="sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={`Fattura ${v.num}`}>
        <div className="sheet-h"><h2>Fattura {v.num}</h2><div className="spacer" /><button className="btn ghost" type="button" onClick={onClose}>Chiudi</button></div>
        <div className="sheet-b">
          <div className="mini">
            <div><span>Cliente</span><b>{c?.nome ?? "—"}</b></div>
            <div><span>Data</span><b className="num">{dmy(v.data)}</b></div>
            <div><span>Totale documento</span><b className="num">{eur(t.documento)}</b></div>
            <div><span>Stato</span><b>{engine.fase(v)}</b></div>
            <div><span>Scadenza</span><b className="num">{dmy(engine.dueDate(v))}</b></div>
            <div><span>Incasso</span><b className="num">{v.incasso ? dmy(v.incasso) : "—"}</b></div>
          </div>
          {msg && <p role="status" className="muted">{msg}</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
            {!v.incasso && canWrite && (<>
              <label>Data di incasso <input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <button className="btn primary" type="button" onClick={collect}>Segna incassata</button>
            </>)}
            {att?.storage_path && <button className="btn" type="button" onClick={openPdf}>Apri PDF</button>}
          </div>
          <p className="muted" style={{ marginTop: 18 }}>La scheda completa (modifica, invio, proforma) arriva con il prossimo aggiornamento.</p>
        </div>
      </div>
    </div>
  );
}
