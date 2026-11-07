"use client";
import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { useApp } from "@/lib/app-context";
import type { ConflictRecord, OutboxOp } from "@/offline/types";

const STATI: Record<string, string> = { pending: "In attesa", syncing: "In invio", synced: "Inviata", failed: "Rifiutata", conflict: "Conflitto" };
const TONE: Record<string, string> = { pending: "soon", syncing: "soon", synced: "far", failed: "late", conflict: "late" };

export default function Sincronizzazione() {
  const { db, sync, status, auth } = useApp();
  const [ops, setOps] = useState<OutboxOp[]>([]);
  const [conf, setConf] = useState<ConflictRecord[]>([]);
  useEffect(() => {
    if (!db) return;
    const a = liveQuery(() => db.outbox.orderBy("seq").reverse().limit(50).toArray()).subscribe({ next: setOps });
    const b = liveQuery(() => db.conflicts.toArray()).subscribe({ next: setConf });
    return () => { a.unsubscribe(); b.unsubscribe(); };
  }, [db]);
  if (auth.kind !== "ready") return null;
  return (
    <div className="grid">
      <section className="panel c12"><div className="panel-h"><h2>Stato della sincronizzazione</h2><div className="spacer" />
        <button className="btn small primary" type="button" disabled={!status?.online || status?.syncing} onClick={() => sync?.run({ force: true })}>Sincronizza ora</button></div>
        <div className="sstrip">
          <div><span>Connessione</span><b>{status?.online ? "Online" : "Offline"}</b><small>{auth.offline ? "sessione offline" : "sessione attiva"}</small></div>
          <div><span>In attesa</span><b className="num">{status?.pending ?? 0}</b><small>operazioni da inviare</small></div>
          <div><span>Da risolvere</span><b className={`num ${(status?.conflicts ?? 0) + (status?.failed ?? 0) ? "neg" : ""}`}>{(status?.conflicts ?? 0) + (status?.failed ?? 0)}</b><small>conflitti e rifiuti</small></div>
          <div><span>Ultima sincronizzazione</span><b>{status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString("it-IT") : "mai"}</b><small>{status?.lastError ?? "nessun errore"}</small></div>
        </div>
        {status?.authProblem && <div className="panel-b"><p role="alert" style={{ color: "var(--red)" }}>La sessione è scaduta: <a href="/login">accedi di nuovo</a> per inviare le modifiche in attesa. Restano salvate su questo dispositivo.</p></div>}
      </section>

      {conf.length > 0 && <section className="panel c12"><div className="panel-h"><h2>Conflitti da risolvere</h2></div><div className="panel-b">
        <p className="muted" style={{ marginTop: 0 }}>Lo stesso dato è stato modificato anche da un altro dispositivo. Scegli quale versione tenere: nessuna viene sovrascritta da sola.</p>
        {conf.map((c) => {
          const keys = Object.keys(c.local);
          return (
            <div key={c.op_id} style={{ borderTop: "1px solid var(--line-2)", padding: "12px 0" }}>
              <b>{c.entity}</b> <span className="muted">· {new Date(c.detected_at).toLocaleString("it-IT")}</span>
              <div className="tw"><table><thead><tr><th>Campo</th><th>Questo dispositivo</th><th>Server (versione {c.server_version})</th></tr></thead><tbody>
                {keys.map((k) => <tr key={k}><td>{k}</td><td>{JSON.stringify(c.local[k])}</td><td>{JSON.stringify((c.server as Record<string, unknown>)[k])}</td></tr>)}
              </tbody></table></div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="btn small primary" type="button" onClick={() => sync?.resolveConflict(c.op_id, "local")}>Tieni la mia</button>
                <button className="btn small" type="button" onClick={() => sync?.resolveConflict(c.op_id, "server")}>Tieni quella del server</button>
              </div>
            </div>
          );
        })}
      </div></section>}

      <section className="panel c12"><div className="panel-h"><h2>Operazioni recenti su questo dispositivo</h2></div>
        <div className="tw"><table><thead><tr><th>Quando</th><th>Dato</th><th>Operazione</th><th>Stato</th><th>Tentativi</th><th>Dettaglio</th><th /></tr></thead><tbody>
          {ops.map((o) => (
            <tr key={o.op_id}>
              <td className="num">{new Date(o.client_ts).toLocaleString("it-IT")}</td><td>{o.entity}</td><td>{o.op_type === "delete" ? "eliminazione" : "salvataggio"}</td>
              <td><span className={`cdp ${TONE[o.status]}`}>{STATI[o.status]}</span></td><td className="num">{o.attempts}</td>
              <td className="muted" style={{ fontSize: 12.5 }}>{o.last_error ?? (o.synced_at ? `inviata ${new Date(o.synced_at).toLocaleString("it-IT")}` : "")}</td>
              <td>{o.status === "failed" && <button className="btn small" type="button" onClick={() => sync?.retryFailed(o.op_id)}>Riprova</button>}</td>
            </tr>
          ))}
          {!ops.length && <tr><td colSpan={7} className="muted">Nessuna operazione registrata su questo dispositivo.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
