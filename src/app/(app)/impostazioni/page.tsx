"use client";
import Link from "next/link";
import { LegacyView } from "@/components/legacy-view";
import { CalendarPanel } from "@/components/calendar-panel";
import { TemplatePanel } from "@/components/template-panel";
import { SecurityPanel } from "@/components/security-panel";
export default function Page() {
  return (<>
    <LegacyView view="set" />
    <SecurityPanel />
    <CalendarPanel />
    <TemplatePanel />
    <section className="panel" style={{ marginTop: 18 }}>
      <div className="panel-h"><h2>Dati e sincronizzazione</h2></div>
      <div className="panel-b" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn" href="/importa">Importa dall&apos;app precedente</Link>
        <Link className="btn" href="/sincronizzazione">Stato sincronizzazione e conflitti</Link>
      </div>
    </section>
  </>);
}
