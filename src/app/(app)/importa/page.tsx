"use client";
import { useState } from "react";
import { useApp } from "@/lib/app-context";
import { legacyToRows, IMPORT_ORDER, type LegacyExport } from "@/data/mapping";
import { uuidv5 } from "@/data/uuid";

type Phase = { kind: "idle" } | { kind: "ready"; data: LegacyExport; counts: Record<string, number> } | { kind: "running"; done: number; total: number; step: string } | { kind: "done"; report: string[] } | { kind: "error"; msg: string };

const LABELS: Record<string, string> = { ledger_settings: "Impostazioni", clients: "Clienti", contracts: "Contratti", missions: "Missioni e quote", invoices: "Fatture",
  invoice_lines: "Righe fattura", f24_payments: "F24", reminders: "Promemoria", monthly_expenses: "Spese mensili", savings_accounts: "Conti di risparmio",
  investment_accounts: "Conti di investimento", holdings: "ETF", other_income: "Altri redditi" };

export default function Importa() {
  const { auth, sb, sync } = useApp();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  if (auth.kind !== "ready") return null;
  const canWrite = ["super_admin", "admin", "responsabile", "operator"].includes(auth.role);

  async function pick(file: File) {
    try {
      if (file.size > 60 * 1024 * 1024) throw new Error("File troppo grande (massimo 60 MB).");
      const data = JSON.parse(await file.text()) as LegacyExport & { formato?: string };
      if (!Array.isArray(data.invoices) || !Array.isArray(data.clients)) throw new Error("Il file non sembra un'esportazione dell'app precedente.");
      const { rows } = await legacyToRows(data);
      const counts = Object.fromEntries(IMPORT_ORDER.map((t) => [t, rows[t].length]));
      counts.pdf = Object.keys(data.pdfs ?? {}).length;
      setPhase({ kind: "ready", data, counts });
    } catch (e) { setPhase({ kind: "error", msg: e instanceof Error ? e.message : "File non leggibile." }); }
  }

  async function run(data: LegacyExport) {
    if (auth.kind !== "ready") return;
    if (!navigator.onLine) { setPhase({ kind: "error", msg: "L'importazione richiede la connessione a internet." }); return; }
    const ledger = auth.ledgerId; const report: string[] = [];
    try {
      const { rows, ids } = await legacyToRows(data);
      const pdfs = Object.entries(data.pdfs ?? {});
      const total = IMPORT_ORDER.reduce((a, t) => a + rows[t].length, 0) + pdfs.length;
      let done = 0;
      for (const table of IMPORT_ORDER) {
        setPhase({ kind: "running", done, total, step: LABELS[table] ?? table });
        const keycol = table === "ledger_settings" ? "ledger_id" : "id";
        const { data: cur, error } = await sb.from(table).select(`${keycol}, version`).eq("ledger_id", ledger);
        if (error) throw new Error(`${LABELS[table]}: ${error.message}`);
        const ver = new Map((cur ?? []).map((r: Record<string, unknown>) => [String(r[keycol]), Number(r.version)]));
        let ok = 0, ko = 0;
        for (const r of rows[table]) {
          const { id, ...payload } = r;
          const base = ver.get(table === "ledger_settings" ? ledger : id) ?? null;
          const { data: res, error: e } = await sb.rpc("apply_operation", { p: { op_id: crypto.randomUUID(), ledger_id: ledger, entity: table, record_id: id, op_type: "upsert", base_version: base, origin: "online", payload } });
          if (e || (res as { status: string }).status !== "applied") { ko++; report.push(`${LABELS[table]}: ${e?.message ?? (res as { message?: string }).message ?? (res as { status: string }).status}`); } else ok++;
          setPhase({ kind: "running", done: ++done, total, step: LABELS[table] ?? table });
        }
        report.unshift(`${LABELS[table]}: ${ok} importati${ko ? `, ${ko} con errori` : ""}`);
      }
      // PDFs → private Storage bucket + attachment rows + link on the invoice.
      let pOk = 0;
      for (const [legacyId, f] of pdfs) {
        setPhase({ kind: "running", done, total, step: "PDF delle fatture" });
        const invId = ids[`invoice:${legacyId}`]; if (!invId) { done++; continue; }
        const attId = await uuidv5(`attachment:${legacyId}`);
        const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
        const name = f.name.replace(/[^\w.\- ]+/g, "_");
        const path = `${ledger}/${attId}/${name}`;
        const up = await sb.storage.from("attachments").upload(path, new Blob([bytes], { type: f.mime || "application/pdf" }), { upsert: true, contentType: f.mime || "application/pdf" });
        if (up.error) { report.push(`PDF ${f.name}: ${up.error.message}`); done++; continue; }
        const { data: ex } = await sb.from("attachments").select("version").eq("id", attId).maybeSingle();
        await sb.rpc("apply_operation", { p: { op_id: crypto.randomUUID(), ledger_id: ledger, entity: "attachments", record_id: attId, op_type: "upsert", base_version: ex?.version ?? null, origin: "online",
          payload: { entity: "invoices", record_id: invId, storage_path: path, original_name: f.name, mime_type: f.mime || "application/pdf", size_bytes: bytes.length, upload_status: "uploaded" } } });
        const { data: iv } = await sb.from("invoices").select("version").eq("id", invId).single();
        await sb.rpc("apply_operation", { p: { op_id: crypto.randomUUID(), ledger_id: ledger, entity: "invoices", record_id: invId, op_type: "upsert", base_version: iv?.version ?? null, origin: "online", payload: { attachment_id: attId } } });
        pOk++; setPhase({ kind: "running", done: ++done, total, step: "PDF delle fatture" });
      }
      if (pdfs.length) report.push(`PDF: ${pOk} su ${pdfs.length} caricati`);
      await sync?.run({ force: true });
      setPhase({ kind: "done", report });
    } catch (e) { setPhase({ kind: "error", msg: e instanceof Error ? e.message : "Errore durante l'importazione." }); }
  }

  return (
    <section className="panel">
      <div className="panel-h"><h2>Importa i dati dall&apos;app precedente</h2></div>
      <div className="panel-b">
        <ol className="chk" style={{ paddingLeft: 20 }}>
          <li>Nell&apos;app precedente apri <b>Impostazioni → Backup ed esportazione</b> e clicca <b>Esporta per Cairn (con PDF)</b>.</li>
          <li>Scegli qui sotto il file <code>Cairn_export_….json</code> appena scaricato.</li>
          <li>Puoi ripetere l&apos;importazione: i record vengono aggiornati, mai duplicati.</li>
        </ol>
        {!canWrite && <p className="muted">Il tuo ruolo è in sola lettura: non puoi importare.</p>}
        {canWrite && (phase.kind === "idle" || phase.kind === "error" || phase.kind === "ready") && (
          <p style={{ marginTop: 14 }}><input type="file" accept="application/json,.json" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} /></p>
        )}
        {phase.kind === "error" && <p role="alert" style={{ color: "var(--red)" }}>{phase.msg}</p>}
        {phase.kind === "ready" && (
          <>
            <div className="tw" style={{ marginTop: 10 }}><table><tbody>
              {Object.entries(phase.counts).filter(([, n]) => n > 0).map(([k, n]) => <tr key={k}><td>{LABELS[k] ?? "PDF fatture"}</td><td className="r num">{n}</td></tr>)}
            </tbody></table></div>
            <button className="btn primary" style={{ marginTop: 14 }} type="button" onClick={() => run(phase.data)}>Importa adesso</button>
          </>
        )}
        {phase.kind === "running" && (
          <div role="status" style={{ marginTop: 14 }}>
            <p className="muted">{phase.step}… {phase.done} / {phase.total}</p>
            <div className="progress"><i style={{ width: `${Math.round((phase.done / Math.max(1, phase.total)) * 100)}%` }} /></div>
          </div>
        )}
        {phase.kind === "done" && (
          <div role="status" style={{ marginTop: 14 }}>
            <p><b className="pos">Importazione completata.</b></p>
            <ul className="chk">{phase.report.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}
      </div>
    </section>
  );
}
