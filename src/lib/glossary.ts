/**
 * Glossary: the first time a fiscal or financial term appears in a panel it gets a dotted underline and a short
 * explanation, shown on hover, tap or keyboard focus (same tooltip as the charts). Definitions are general rules,
 * deliberately without figures that change every year; the person's own figures are in the views.
 */
type Entry = { re: RegExp; t: string; d: string };
const G: Entry[] = [
  { re: /\bF24\b/, t: "F24", d: "Il modulo con cui si pagano imposte e contributi, dall'home banking o tramite la commercialista. Ogni riga ha un codice tributo." },
  { re: /\bacconti?\b/i, t: "Acconto", d: "Anticipo su imposta e contributi dell'anno in corso, in due rate (giugno e novembre), calcolato di norma su quanto dovuto l'anno prima." },
  { re: /\bsaldo(?= \d{4})/i, t: "Saldo", d: "La differenza tra quanto dovuto per l'anno e gli acconti già versati. Si paga a giugno dell'anno dopo, insieme al primo acconto." },
  { re: /\bcoefficiente(?: di redditività)?\b/i, t: "Coefficiente di redditività", d: "La quota dei ricavi che il forfettario considera reddito, fissata dal codice ATECO. Imposta e contributi si calcolano solo su questa quota." },
  { re: /\bimposta sostitutiva\b/i, t: "Imposta sostitutiva", d: "Nel forfettario prende il posto di IRPEF, addizionali e IRAP: 15% del reddito, 5% nei primi cinque anni di una nuova attività se ci sono i requisiti." },
  { re: /\bGestione Separata\b/i, t: "Gestione Separata INPS", d: "La cassa previdenziale dei professionisti senza una cassa di categoria. I contributi sono una percentuale del reddito forfettario." },
  { re: /\bINPS\b/, t: "Contributi INPS", d: "Per te quelli della Gestione Separata, in percentuale sul reddito forfettario. Si deducono dal reddito dell'anno in cui li versi." },
  { re: /\bsoglia\b/i, t: "Soglia del forfettario", d: "Fino a 85.000 € incassati nell'anno resti nel regime. Oltre, esci dall'anno successivo; oltre 100.000 € esci subito, dall'incasso che supera il limite." },
  { re: /\bSdI\b/, t: "SdI · Sistema di Interscambio", d: "Il canale dell'Agenzia delle Entrate che consegna le fatture elettroniche: una fattura esiste fiscalmente solo quando passa dallo SdI." },
  { re: /\bproforma\b/i, t: "Proforma", d: "Anticipa importi e dati al cliente ma non ha valore fiscale. La fattura vera è quella emessa allo SdI." },
  { re: /\bbollo (?:sulle |delle )?fatture\b/i, t: "Bollo sulle fatture elettroniche", d: "2 € per ogni fattura senza IVA sopra 77,47 €, versati con F24 per trimestre (codici 2521–2524)." },
  { re: /\bcodici(?= (?:tributo|\d{4}))/i, t: "Codici tributo", d: "1790 e 1791: acconti dell'imposta sostitutiva. 1792: saldo. 2521–2524: bollo fatture del I–IV trimestre. Le sigle INPS indicano i contributi della Gestione Separata." },
  { re: /\bravvedimento\b/i, t: "Ravvedimento operoso", d: "Pagare in ritardo di propria iniziativa, con una sanzione ridotta e gli interessi." },
  { re: /\bper data di incasso\b/i, t: "Principio di cassa", d: "Nel forfettario conta quando incassi, non quando emetti la fattura: un bonifico arrivato il 2 gennaio vale per l'anno nuovo." },
  { re: /\bquadro RR\b/i, t: "Quadro RR", d: "La parte del Modello Redditi in cui si calcolano i contributi INPS della Gestione Separata." },
  { re: /\bNetto reale\b/, t: "Netto reale", d: "Quanto ti resta degli incassi dopo imposta sostitutiva e contributi INPS stimati." },
  { re: /\b(?:da )?accantona\w*/i, t: "Accantonare", d: "Mettere da parte, su un conto separato, la quota di ogni incasso che servirà per pagare gli F24." },
  { re: /\bdel netto\b/, t: "Tasso di risparmio", d: "La parte delle entrate, tolti gli F24, che non hai speso." },
  { re: /\bipotesi\b/i, t: "Ipotesi", d: "Entrate da rinnovi di contratto non ancora firmati: se il rinnovo salta, spariscono." },
  { re: /\bPAC\b/, t: "PAC · piano di accumulo", d: "Un versamento fisso ogni mese in ETF, a prescindere dall'andamento del mercato." },
  { re: /\bETF\b/, t: "ETF", d: "Fondo che replica un indice ed è quotato in borsa: costi bassi e ampia diversificazione." },
  { re: /\bribilanci\w*/i, t: "Ribilanciamento", d: "Riportare i pesi degli ETF agli obiettivi. Cairn segue la regola 5/25: si interviene quando un peso si scosta di 5 punti o del 25% del suo obiettivo." },
  { re: /\bfondo (?:di )?emergenza\b/i, t: "Fondo emergenza", d: "Quanti mesi di spese ricorrenti coprono i risparmi liquidi. Di solito si punta a 3–6 mesi." },
  { re: /\bplus(?:valenza|\/minus)\w*/i, t: "Plusvalenza", d: "Guadagno sulla carta finché non vendi. Alla vendita è tassato al 26% (12,5% sui titoli di Stato)." },
];
const SKIP = "script,style,svg,.ts,button,a,input,textarea,select,option,label,h1,h2,h3,.gl,.cdp,.pill,.btn,.segs,.legend,.eyebrow,#ctip,[contenteditable]";

/** Underline the first occurrence of each term in every panel (and once in the page outside panels). */
export function applyGlossary(root: HTMLElement) {
  const scopes: HTMLElement[] = [...root.querySelectorAll<HTMLElement>(".panel, .kpis")];
  const done = new Map<HTMLElement | null, Set<string>>();
  const scopeOf = (n: Node) => { let e = n.parentElement; while (e && e !== root) { if (scopes.includes(e)) return e; e = e.parentElement; } return null; };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue && n.nodeValue.trim().length > 2 && !n.parentElement?.closest(SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  const nodes: Text[] = []; while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const first of nodes) {
    const sc = scopeOf(first); let seen = done.get(sc); if (!seen) { seen = new Set(); done.set(sc, seen); }
    let node: Text | null = first;
    while (node && node.nodeValue) {
      let best: { i: number; len: number; e: Entry } | null = null;
      for (const e of G) { if (seen.has(e.t)) continue; const m = e.re.exec(node.nodeValue); if (m && (!best || m.index < best.i)) best = { i: m.index, len: m[0].length, e }; }
      if (!best) break;
      seen.add(best.e.t);
      const term = node.splitText(best.i); const rest = term.splitText(best.len);
      const span = document.createElement("span"); span.className = "gl"; span.tabIndex = 0;
      span.setAttribute("data-tip", best.e.t + "\n" + best.e.d); span.setAttribute("aria-description", best.e.d);
      term.replaceWith(span); span.appendChild(term);
      node = rest;
    }
  }
}
