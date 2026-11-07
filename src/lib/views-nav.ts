/** Sections in the same order and with the same names/icons as the original app. */
export const VIEWS = [
  { v: "home", href: "/", label: "Dashboard", ic: "home" },
  { v: "entr", href: "/entrate", label: "Entrate", ic: "inbox" },
  { v: "spese", href: "/spese", label: "Spese", ic: "piggy" },
  { v: "risp", href: "/risparmi", label: "Risparmi", ic: "safe" },
  { v: "invest", href: "/investimenti", label: "Investimenti", ic: "trend" },
  { v: "anal", href: "/analisi", label: "Analisi", ic: "chart" },
  { v: "inv", href: "/fatture", label: "Fatture", ic: "file" },
  { v: "prev", href: "/da-emettere", label: "Da emettere", ic: "pen" },
  { v: "f24", href: "/scadenze", label: "Scadenze", ic: "cal" },
  { v: "tasse", href: "/tasse", label: "F24 e tasse", ic: "euro" },
  { v: "contr", href: "/contratti", label: "Contratti", ic: "brief" },
  { v: "set", href: "/impostazioni", label: "Impostazioni", ic: "gear" },
] as const;
export type ViewKey = (typeof VIEWS)[number]["v"];
export const hrefOf = (v: string) => (VIEWS.find((x) => x.v === v) ?? (v === "mis" ? VIEWS[10] : v === "fisco" ? VIEWS[9] : VIEWS[0])).href;
