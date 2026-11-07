"use client";
/**
 * Renders one section with the original app's own rendering code (src/legacy/views.ts, verified
 * byte-for-byte against the original), fed by the live local snapshot. Read-only actions are wired
 * here; editing actions arrive with the write bridge.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { createViews } from "@/legacy/views";
import { hrefOf, type ViewKey } from "@/lib/views-nav";
import { InvoiceQuick } from "./invoice-quick";

/** UI state that the original kept in S (filters, simulator) survives navigation within the session. */
const UI: { filter: { stato: string; cliente: string; q: string }; sim?: unknown; f24all?: boolean } = { filter: { stato: "tutti", cliente: "", q: "" } };

const COMPOSE: Record<ViewKey, (V: ReturnType<typeof createViews>, FX: unknown) => string> = {
  home: (V, FX) => V.vHome(FX), entr: (V, FX) => V.vEntrate(FX), spese: (V, FX) => V.vSpese(FX), risp: (V, FX) => V.vRisp(FX),
  invest: (V, FX) => V.vInvest(FX), anal: (V, FX) => V.vAnal(FX), inv: (V, FX) => V.vInv(FX), prev: (V, FX) => V.vPrev(FX),
  f24: (V, FX) => V.vF24(FX),
  tasse: (V, FX) => V.compliancePanel() + V.vTasse(FX) + `<div style="height:8px"></div>` + V.vFisco(FX) + V.redditiPanel(),
  contr: (V, FX) => V.vContr(FX) + `<div class="eyebrow" style="margin:22px 0 4px">Missioni</div>` + V.vMis(FX),
  set: (V, FX) => V.vSet(FX),
};
/** Controls that edit data: they open the original forms once the write bridge is in place. */
const EDIT_SELECTORS = "[data-proj],[data-risp],#invRev,#invPrices,[data-calsync],[data-mail],[data-pm-done],[data-pm],[data-ctr],[data-mis],[data-quota],#todoV3,#exportX,#exportX2,#exportV3,#exportV3b,#exportJ,#exportCairn,[data-f24pay],[data-f24edit],#addF24,#ctSave,#saveForn,#addCli,[data-ack],[data-red],[data-restore],[data-cli],[data-sim],#simReset";

export function LegacyView({ view }: { view: ViewKey }) {
  const { engine, year } = useApp();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const html = useMemo(() => {
    if (!engine) return "";
    const S = Object.assign({}, engine.s, { year, filter: UI.filter, calsync: [], storico: [], sim: UI.sim, f24all: UI.f24all }) as unknown as Record<string, unknown>;
    try {
      const out = COMPOSE[view](createViews(S, engine), engine.fisco());
      UI.sim = S.sim;
      return out;
    } catch (e) {
      console.error(e);
      return `<section class="panel empty">Errore nel disegnare questa sezione: ${String((e as Error).message).replace(/[<>&]/g, "")}</section>`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, year, view, tick]);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.innerHTML = html;
    const fs = el.querySelector<HTMLSelectElement>("#fStato"); if (fs) fs.value = UI.filter.stato;
    const fc = el.querySelector<HTMLSelectElement>("#fCli"); if (fc) fc.value = UI.filter.cliente;
    el.querySelectorAll<HTMLElement>(EDIT_SELECTORS).forEach((b) => { b.setAttribute("aria-disabled", "true"); b.classList.add("pending-edit"); });
  }, [html]);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const go = t.closest<HTMLElement>("[data-go-v]"); if (go) { router.push(hrefOf(go.dataset.goV!)); return; }
      const g = t.closest<HTMLElement>("[data-go]");
      if (g) { const k = g.dataset.go!; if (k === "f24" || k === "tasse") router.push("/tasse"); else { UI.filter.stato = k === "inv-late" ? "scadute" : "aperte"; router.push("/fatture"); setTick((x) => x + 1); } return; }
      if (t.closest("#f24more")) { UI.f24all = !UI.f24all; setTick((x) => x + 1); return; }
      const o = t.closest<HTMLElement>("[data-open]"); if (o) { setOpen(o.dataset.open!); return; }
      if (t.closest(EDIT_SELECTORS)) { e.preventDefault(); setNote("Questa funzione di modifica arriva con il prossimo aggiornamento: per ora usala nell'app precedente."); setTimeout(() => setNote(null), 4500); }
    };
    let qTimer: ReturnType<typeof setTimeout> | undefined;
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.id === "fStato") { UI.filter.stato = t.value; setTick((x) => x + 1); }
      if (t.id === "fCli") { UI.filter.cliente = t.value; setTick((x) => x + 1); }
    };
    const onInput = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t.id === "fQ") { UI.filter.q = t.value; clearTimeout(qTimer); qTimer = setTimeout(() => { setTick((x) => x + 1); requestAnimationFrame(() => { const n = el.querySelector<HTMLInputElement>("#fQ"); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }); }, 250); }
    };
    el.addEventListener("click", onClick); el.addEventListener("change", onChange); el.addEventListener("input", onInput);
    return () => { el.removeEventListener("click", onClick); el.removeEventListener("change", onChange); el.removeEventListener("input", onInput); clearTimeout(qTimer); };
  }, [router]);

  return (
    <>
      {note && <div className="toast show" role="status">{note}</div>}
      {!engine && <div className="panel empty">Carico i dati…</div>}
      <div ref={ref} />
      {open && <InvoiceQuick id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
