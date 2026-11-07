"use client";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { tot } from "@/domain/engine";
import { eur, dmy, todayISO } from "@/lib/format";
import type { Invoice } from "@/domain/types";

const TONE: Record<string, string> = { Incassata: "far", Scaduta: "late", "Da incassare": "soon", Proforma: "soon" };

export default function Fatture() {
  const { engine, year, rows, save, sb, auth } = useApp();
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState(todayISO());
  const [msg, setMsg] = useState<string | null>(null);
  if (!engine) return <p className="muted">Caricamento…</p>;
  const canWrite = auth.kind === "ready" && auth.role !== "read_only";
  const list = engine.s.invoices.filter((v) => engine.fy(v) === year || v.anno === year).sort((a, b) => (a.data < b.data ? 1 : -1));
  const name = (id: string) => engine.client(id)?.nome ?? "—";
  const attachmentOf = (v: Invoice) => {
    const row = (rows.invoices ?? []).find((r) => r.id === v.id);
    const att = row?.attachment_id ? (rows.attachments ?? []).find((a) => a.id === row.attachment_id) : undefined;
    return att as { storage_path?: string; original_name?: string } | undefined;
  };
  async function openPdf(path: string) {
    if (!navigator.onLine) { setMsg("I PDF si aprono solo online."); return; }
    const { data, error } = await sb.storage.from("attachments").createSignedUrl(path, 60);
    if (error || !data) { setMsg("PDF non disponibile."); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }
  async function collect(v: Invoice) {
    if (!date || date < v.data) { setMsg("La data di incasso non può precedere la data della fattura."); return; }
    await save("invoices", v.id, { collected_on: date });
    setEditing(null); setMsg(`Fattura ${v.num} segnata come incassata il ${dmy(date)}${navigator.onLine ? "" : " (verrà inviata appena torni online)"}.`);
  }
  return (
    <section className="panel">
      <div className="panel-h"><h2>Fatture {year}</h2><div className="spacer" /><span className="eyebrow">{list.length} fatture</span></div>
      {msg && <div className="panel-b" role="status"><p className="muted" style={{ margin: 0 }}>{msg}</p></div>}
      <div className="tw"><table>
        <thead><tr><th>N.</th><th>Cliente</th><th>Data</th><th className="r">Importo</th><th>Stato</th><th>Incasso</th><th>PDF</th></tr></thead>
        <tbody>
          {list.map((v) => {
            const st = engine.fase(v); const att = attachmentOf(v);
            return (
              <tr key={v.id}>
                <td className="num"><b>{v.num}</b></td><td>{name(v.cliente)}</td><td className="num">{dmy(v.data)}</td>
                <td className="r num">{eur(tot(v).documento)}</td>
                <td><span className={`cdp ${TONE[st] ?? "soon"}`}>{st}</span></td>
                <td className="num">
                  {v.incasso ? dmy(v.incasso) : canWrite && (editing === v.id ? (
                    <span style={{ display: "inline-flex", gap: 6 }}>
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data di incasso" />
                      <button className="btn small primary" type="button" onClick={() => collect(v)}>Salva</button>
                      <button className="btn small ghost" type="button" onClick={() => setEditing(null)}>Annulla</button>
                    </span>
                  ) : <button className="btn small" type="button" onClick={() => { setEditing(v.id); setDate(todayISO()); }}>Segna incassata</button>)}
                </td>
                <td>{att?.storage_path ? <button className="btn small ghost" type="button" onClick={() => openPdf(att.storage_path!)}>Apri</button> : <span className="muted">—</span>}</td>
              </tr>
            );
          })}
          {!list.length && <tr><td colSpan={7} className="muted">Nessuna fattura per il {year}.</td></tr>}
        </tbody>
      </table></div>
    </section>
  );
}
