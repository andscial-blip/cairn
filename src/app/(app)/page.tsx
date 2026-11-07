"use client";
import Link from "next/link";
import { useApp } from "@/lib/app-context";
import { eur0, pct, dmy, todayISO, daysFrom } from "@/lib/format";

function Kpi({ l, v, s, tone }: { l: string; v: string; s?: string; tone?: string }) {
  return <div className={`kpi ${tone ?? ""}`}><div className="l">{l}</div><div className="v">{v}</div>{s && <div className="s">{s}</div>}</div>;
}

export default function Dashboard() {
  const { engine, year } = useApp();
  if (!engine) return <p className="muted">Caricamento dei dati…</p>;
  if (!engine.s.invoices.length && !engine.s.clients.length) return <Empty />;
  const FX = engine.fisco(); const f = FX[year]; const today = todayISO(); const ys = engine.yearSummary(year, FX);
  const next = engine.nextF24(FX);
  const nextIn = next ? daysFrom(today, next.data) : null;
  const cmp = engine.compliance().filter((c) => c.lvl === "warn");
  const rem = engine.reminders().filter((r) => engine.remDue(r)).slice(0, 6);
  const fl = engine.flow12(FX); const R = engine.rispCalc(); const inv = engine.mainInvestment(); const P = engine.ctPlan(FX);
  return (
    <>
      <section className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-h"><h2>Anno fiscale {year}</h2><div className="spacer" /><span className="eyebrow">per data di incasso</span></div>
      </section>
      {f ? (
        <div className="kpis">
          <Kpi l="Fatturato incassato" v={eur0(ys.incassato)} s={`${ys.paid.length} fatture`} />
          <Kpi l="Netto reale" v={eur0(ys.netto)} s={`${eur0(ys.netto / ys.mesiTrasc)} / mese`} tone="green" />
          <Kpi l="Oneri (INPS + imposta)" v={eur0(ys.oneri)} s={`${pct(f.oneriPct)} dei ricavi`} />
          <Kpi l="Previsione anno" v={eur0(f.ric)} s="incassi + aperte + contratti" />
          <Kpi l={`Da incassare ${year}`} v={eur0(ys.daIncassare)} s={ys.open.length ? `${ys.open.length} fatture aperte` : "tutto incassato"} />
          <Kpi l="Soglia 85.000 €" v={pct(f.soglia)} s="usata (previsione)" tone={f.soglia > 0.88 ? "alert" : ""} />
          <Kpi l="Prossimo F24" v={next ? eur0(next.importo) : "—"} s={next ? `${dmy(next.data)}${nextIn !== null ? ` · tra ${nextIn} giorni` : ""}` : "nessuna scadenza"} tone={nextIn !== null && nextIn <= 14 ? "amber" : ""} />
          <Kpi l="Da accantonare" v={eur0(ys.accant)} s="oneri + margine 10% sugli incassi" />
        </div>
      ) : <p className="muted">Nessun dato per il {year}.</p>}

      <div className="eyebrow" style={{ margin: "18px 0 8px" }}>Finanze personali · oggi</div>
      <div className="kpis">
        <Kpi l="Patrimonio" v={eur0((R?.tot ?? 0) + (inv?.tot ?? 0))} s="risparmi + investimenti" />
        <Kpi l="Margine mensile" v={eur0((engine.cash12(FX).inTot - engine.cash12(FX).outTot) / 12 - fl.sp - fl.pac - fl.rm)} s="entrate nette − spese − PAC e risparmi" />
        <Kpi l="Fondo emergenza" v={`${(R?.mesi ?? 0).toLocaleString("it-IT", { maximumFractionDigits: 1 })} mesi`} s="obiettivo 6 mesi" tone={(R?.mesi ?? 0) < 3 ? "alert" : ""} />
        <Kpi l="Accantonamento tasse" v={P ? `${eur0(P.ct.mens)} / mese` : "—"} s={P ? (P.first ? `scoperto dal ${dmy(P.first.d)}` : "F24 coperti") : "conto tasse non collegato"} tone={P?.first ? "alert" : ""} />
      </div>

      <div className="grid" style={{ marginTop: 14 }}>
        <section className="panel c7"><div className="panel-h"><h2>Da fare ora</h2></div><div className="panel-b">
          {!cmp.length && !rem.length && <p className="muted">Niente di urgente.</p>}
          <ul className="chk">
            {cmp.map((c) => <li key={c.k}><b>{c.t}</b><br /><span className="muted">{c.d}</span></li>)}
            {rem.map((r) => <li key={r.id}><b>{r.titolo}</b> <span className="muted">· {dmy(r.data)}</span>{r.dettaglio && <><br /><span className="muted">{r.dettaglio}</span></>}</li>)}
          </ul>
        </div></section>
        <section className="panel c5"><div className="panel-h"><h2>Prossime scadenze F24</h2></div><div className="panel-b">
          <ul className="chk">
            {engine.f24Rows(FX).filter((r) => !r.versato && r.data >= today).slice(0, 6).map((r) => (
              <li key={r.id}><b>{dmy(r.data)}</b> · {eur0(r.importo)}<br /><span className="muted">{r.descrizione}</span></li>
            ))}
          </ul>
        </div></section>
      </div>
      <p className="muted" style={{ marginTop: 16, fontSize: 12.5 }}>Prima versione della Dashboard: i numeri vengono dallo stesso motore dell&apos;app attuale, verificato sui tuoi dati. Grafici e le altre schede arrivano nei prossimi passi.</p>
    </>
  );
}

function Empty() {
  return (
    <section className="panel"><div className="panel-h"><h2>Benvenuto in Cairn</h2></div><div className="panel-b">
      <p className="muted">Il tuo fascicolo è vuoto. Importa i dati dall&apos;app precedente per iniziare.</p>
      <Link className="btn primary" href="/importa">Importa i dati</Link>
    </div></section>
  );
}
