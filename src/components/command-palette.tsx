"use client";
/**
 * Quick search (⌘K / Ctrl+K, or "/"): jump to any section, open an invoice by number or client, start a new invoice.
 * Reads only what is already on the device; works offline.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { SECTIONS } from "@/lib/views-nav";
import { legacyApp } from "@/lib/legacy-runtime";
import { Icon } from "@/components/icon";

interface Item { id: string; group: string; label: string; sub?: string; ic: string; run: () => void; keys: string }
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const dmy = (d: string) => (d && d.length >= 10 ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "");

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === "/" && !typing && !document.querySelector(".sheet")) { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { rows, auth } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => { if (open) { setQ(""); setSel(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => { router.push(href); window.scrollTo(0, 0); };
    const out: Item[] = [];
    if (auth.kind === "ready" && auth.role !== "read_only")
      out.push({ id: "new", group: "Azioni", label: "Nuova fattura", ic: "plus", keys: "nuova fattura crea emetti", run: () => legacyApp().openForm() });
    for (const s of SECTIONS) for (const x of s.subs)
      out.push({ id: "p" + x.href, group: "Sezioni", label: s.subs.length > 1 ? `${s.label} › ${x.label}` : s.label, ic: s.ic, keys: `${s.label} ${x.label} ${s.hint}`, run: go(x.href) });
    out.push({ id: "p-sync", group: "Sezioni", label: "Sincronizzazione", ic: "sync", keys: "sincronizzazione conflitti stato", run: go("/sincronizzazione") });
    const cli = new Map((rows.clients ?? []).map((c) => [String(c.id), String((c as Record<string, unknown>).name ?? "")]));
    const inv = [...(rows.invoices ?? [])].filter((v) => !(v as Record<string, unknown>).deleted_at)
      .sort((a, b) => String((b as Record<string, unknown>).issue_date).localeCompare(String((a as Record<string, unknown>).issue_date)));
    for (const r of inv) {
      const v = r as Record<string, unknown>; const name = cli.get(String(v.client_id)) ?? "";
      const label = `Fattura ${String(v.number_label ?? "")}`;
      out.push({ id: "i" + String(v.id), group: "Fatture", label, sub: `${name} · ${dmy(String(v.issue_date ?? ""))}${v.collected_on ? "" : " · da incassare"}`, ic: "file",
        keys: `${label} ${String(v.number_label ?? "")} ${name} ${String(v.issue_date ?? "")}`,
        run: () => { router.push("/fatture"); setTimeout(() => legacyApp().openDetail(String(v.id)), 350); } });
    }
    return out;
  }, [rows, auth, router]);

  const shown = useMemo(() => {
    const t = norm(q.trim());
    if (!t) return items.filter((i) => i.group !== "Fatture").concat(items.filter((i) => i.group === "Fatture").slice(0, 5));
    const words = t.split(/\s+/);
    // Rank: matches in the title first, then in the subtitle, then in the hidden keywords.
    const score = (i: Item) => { const l = norm(i.label), sb = norm(i.sub ?? ""); let sc = 0;
      for (const w of words) sc += l.split(/[^a-z0-9/]+/).some((x) => x.startsWith(w)) ? 4 : l.includes(w) ? 3 : sb.includes(w) ? 2 : 1;
      return sc; };
    return items.filter((i) => { const k = norm(i.label + " " + (i.sub ?? "") + " " + i.keys); return words.every((w) => k.includes(w)); })
      .map((i, n) => ({ i, n, sc: score(i) })).sort((x, y) => y.sc - x.sc || x.n - y.n).map((x) => x.i).slice(0, 30);
  }, [q, items]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => { listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`)?.scrollIntoView({ block: "nearest" }); }, [sel]);
  if (!open) return null;

  const run = (i?: Item) => { if (!i) return; onClose(); i.run(); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(shown[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };
  let lastGroup = "";
  return (
    <div className="cmdk-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Cerca in Cairn" onKeyDown={onKey}>
        <div className="cmdk-in">
          <Icon name="search" size={18} />
          <input ref={input} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca sezioni, fatture, clienti…" aria-label="Cerca"
            role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={shown[sel] ? `cmdk-${sel}` : undefined} />
          <kbd>esc</kbd>
        </div>
        <ul className="cmdk-list" id="cmdk-list" role="listbox" ref={listRef}>
          {shown.length === 0 && <li className="cmdk-empty">Nessun risultato per “{q}”.</li>}
          {shown.map((i, n) => {
            const head = i.group !== lastGroup ? (lastGroup = i.group, <li className="cmdk-g" role="presentation" key={"g" + i.group}>{i.group}</li>) : null;
            return [head, (
              <li key={i.id} id={`cmdk-${n}`} data-i={n} role="option" aria-selected={n === sel} className="cmdk-it"
                onMouseMove={() => setSel(n)} onClick={() => run(i)}>
                <Icon name={i.ic} size={16} /><span><b>{i.label}</b>{i.sub && <small>{i.sub}</small>}</span>
              </li>)];
          })}
        </ul>
        <div className="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> scegli</span><span><kbd>↵</kbd> apri</span><span><kbd>⌘</kbd><kbd>K</kbd> apri e chiudi</span></div>
      </div>
    </div>
  );
}
