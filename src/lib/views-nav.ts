/**
 * Information architecture v2: 7 sections (was 12 tabs). Related views are sub-tabs of one section,
 * so the routes (and deep links, calendar links, bookmarks) stay the same.
 */
export interface SubView { v: ViewKey; href: string; label: string }
export interface Section { id: string; label: string; ic: string; subs: SubView[]; hint: string }

export type ViewKey = "home" | "entr" | "spese" | "risp" | "invest" | "anal" | "inv" | "prev" | "f24" | "tasse" | "contr" | "set";

export const SECTIONS: Section[] = [
  { id: "home", label: "Panoramica", ic: "home", hint: "Situazione e cose da fare oggi", subs: [{ v: "home", href: "/", label: "Panoramica" }] },
  { id: "fatture", label: "Fatture", ic: "file", hint: "Registro e prossime emissioni", subs: [
    { v: "inv", href: "/fatture", label: "Registro" }, { v: "prev", href: "/da-emettere", label: "Da emettere" }] },
  { id: "finanze", label: "Finanze", ic: "piggy", hint: "Entrate, spese, risparmi e investimenti", subs: [
    { v: "entr", href: "/entrate", label: "Entrate" }, { v: "spese", href: "/spese", label: "Spese" },
    { v: "risp", href: "/risparmi", label: "Risparmi" }, { v: "invest", href: "/investimenti", label: "Investimenti" }] },
  { id: "fisco", label: "Fisco", ic: "euro", hint: "Scadenze, F24, tasse e controlli", subs: [
    { v: "f24", href: "/scadenze", label: "Scadenze" }, { v: "tasse", href: "/tasse", label: "Tasse e F24" }] },
  { id: "analisi", label: "Analisi", ic: "chart", hint: "Andamenti, cassa, clienti e proiezioni", subs: [{ v: "anal", href: "/analisi", label: "Analisi" }] },
  { id: "contratti", label: "Contratti", ic: "brief", hint: "Contratti, rinnovi e missioni", subs: [{ v: "contr", href: "/contratti", label: "Contratti" }] },
  { id: "set", label: "Impostazioni", ic: "gear", hint: "Clienti, parametri, dati e sicurezza", subs: [{ v: "set", href: "/impostazioni", label: "Impostazioni" }] },
];

/** Flat list (kept for code that maps original view keys to routes). */
export const VIEWS = SECTIONS.flatMap((s) => s.subs.map((x) => ({ ...x, ic: s.ic })));
export const sectionOf = (path: string) => SECTIONS.find((s) => s.subs.some((x) => x.href === path)) ?? null;
export const hrefOf = (v: string) => (VIEWS.find((x) => x.v === v)?.href ?? (v === "mis" ? "/contratti" : v === "fisco" ? "/tasse" : "/"));
