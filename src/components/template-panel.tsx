"use client";
/** Impostazioni → Modello Excel v3: the personal template lives in the private archive, never in the code. */
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-context";
import { V3_PATH } from "@/lib/legacy-runtime";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export function TemplatePanel() {
  const { sb, auth } = useApp();
  const ledger = auth.kind === "ready" ? auth.ledgerId : null;
  const [has, setHas] = useState<boolean | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!ledger || !navigator.onLine) return;
    sb.storage.from("attachments").list(`${ledger}/templates`).then(({ data }) => setHas(!!data?.some((f) => f.name === "excel-v3.xlsx"))).catch(() => undefined);
  }, [sb, ledger]);
  if (!ledger) return null;
  const upload = async (f: File | undefined) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name) || f.size > 15 * 1024 * 1024) { setMsg("Serve un file .xlsx sotto i 15 MB."); return; }
    setMsg("Carico…");
    const { error } = await sb.storage.from("attachments").upload(V3_PATH(ledger), f, { upsert: true, contentType: XLSX });
    if (error) { setMsg(`Caricamento non riuscito: ${error.message}`); return; }
    setHas(true); setMsg("Modello caricato: ora «Excel v3 aggiornato» in Fatture funziona.");
  };
  return (
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="panel-h"><h2>Modello Excel v3</h2><div className="spacer" /><span className="eyebrow">{has === null ? "" : has ? "caricato" : "da caricare"}</span></div>
      <div className="panel-b" style={{ display: "grid", gap: 10 }}>
        <p style={{ margin: 0 }}>Il pulsante «Excel v3 aggiornato» riempie il tuo modello Excel con i dati di Cairn. Il modello contiene dati personali, quindi resta nel tuo archivio privato e non nel codice dell&apos;app.</p>
        <label className="btn" style={{ justifySelf: "start", cursor: "pointer" }}>{has ? "Sostituisci il modello" : "Carica il modello (.xlsx)"}
          <input type="file" accept=".xlsx" style={{ display: "none" }} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {msg && <p role="status" className="muted" style={{ margin: 0 }}>{msg}</p>}
      </div>
    </section>
  );
}
