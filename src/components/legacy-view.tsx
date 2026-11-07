"use client";
/** Page host: points the original app's code at this section and redraws it when data, year or section change. */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { renderLegacy, updateRuntime } from "@/lib/legacy-runtime";
import { hrefOf, type ViewKey } from "@/lib/views-nav";

export function LegacyView({ view }: { view: ViewKey }) {
  const { engine, rows, year, auth, sb, save, remove } = useApp();
  const router = useRouter();
  const ready = auth.kind === "ready";
  updateRuntime({
    engine, rows, year, view, sb, save, remove,
    writable: ready && auth.role !== "read_only", ledgerId: ready ? auth.ledgerId : null,
    navigate: (v) => { router.push(hrefOf(v)); window.scrollTo(0, 0); },
  });
  useEffect(() => { renderLegacy(); }, [engine, year, view]);
  return (
    <>
      {!engine && (
        <div className="skel" role="status" aria-label="Carico i dati">
          <div className="skel-b" style={{ height: 120 }} /><div className="skel-row"><div className="skel-b" /><div className="skel-b" /><div className="skel-b" /></div>
          <div className="skel-b" style={{ height: 260 }} />
        </div>
      )}
      <div id="app" />
    </>
  );
}
