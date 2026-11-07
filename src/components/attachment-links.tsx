"use client";
/** Opens private attachments (links of the form cairn-att:<path>) through short-lived signed URLs. */
import { useEffect } from "react";
import { useApp } from "@/lib/app-context";
export function AttachmentLinks() {
  const { sb } = useApp();
  useEffect(() => {
    const onClick = async (e: MouseEvent) => {
      const a = (e.target as Element).closest?.('a[href^="cairn-att:"]') as HTMLAnchorElement | null; if (!a) return;
      e.preventDefault();
      if (!navigator.onLine) { alertLater("I file allegati si aprono solo online."); return; }
      const w = window.open("", "_blank");
      const { data, error } = await sb.storage.from("attachments").createSignedUrl(a.getAttribute("href")!.slice("cairn-att:".length), 120);
      if (error || !data) { w?.close(); alertLater("File non disponibile."); return; }
      if (w) w.location.href = data.signedUrl; else window.location.assign(data.signedUrl);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [sb]);
  return null;
}
function alertLater(m: string) { const r = document.getElementById("toastRoot"); if (!r) return; const t = document.createElement("div"); t.className = "toast"; t.textContent = m; r.replaceChildren(t); setTimeout(() => t.remove(), 2600); }
