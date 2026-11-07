/**
 * Courtesy copy of an Italian e-invoice (PDF in the Agenzia delle Entrate layout: "Cedente/prestatore",
 * "Tipologia documento … Numero documento … Data documento", "Totale documento") → the fields needed to find
 * its invoice in Cairn. Also reads the FatturaPA XML when that is what arrives.
 */
export interface EInvoiceData { tipo: string; numero: string; data: string; clienteIds: string[]; totale: number | null; imponibile: number | null }

const itNum = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));
const AMT = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

export function parseCourtesyPdf(lines: string[]): EInvoiceData | null {
  const iHead = lines.findIndex((l) => /Numero documento/.test(l) && /Data documento/.test(l));
  if (iHead < 0) return null;
  let doc: RegExpMatchArray | null = null;
  for (let i = iHead + 1; i < Math.min(lines.length, iHead + 4) && !doc; i++) doc = lines[i]!.match(/\b(TD\d\d)\b.*?\s(\S+)\s+(\d\d)-(\d\d)-(\d{4})\b/);
  if (!doc) return null;
  // Tax ids in the header: the customer's column starts where "Cessionario/committente" starts.
  const hl = lines.slice(0, iHead).find((l) => /Cessionario\/committente/.test(l));
  const col = hl ? hl.indexOf("Cessionario") - 2 : Infinity;
  const ids: string[] = [];
  for (const l of lines.slice(0, iHead))
    for (const m of l.matchAll(/(?:Identificativo fiscale ai fini IVA|Codice fiscale):\s*([A-Z]{0,2}[A-Z0-9]{8,16})/g)) if (m.index! >= col) ids.push(m[1]!);
  const after = (re: RegExp) => { const i = lines.findIndex((l) => re.test(l)); if (i < 0) return [] as number[];
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) { const a = lines[j]!.match(AMT); if (a) return a.map(itNum); } return [] as number[]; };
  const tot = after(/Totale documento/), imp = after(/Totale imponibile/);
  return { tipo: doc[1]!, numero: doc[2]!, data: `${doc[5]}-${doc[4]}-${doc[3]}`, clienteIds: [...new Set(ids)],
    totale: tot.length ? tot[tot.length - 1]! : null, imponibile: imp.length ? imp[imp.length - 1]! : null };
}

/** FatturaPA XML (plain .xml; a signed .p7m needs its envelope removed first). */
export function parseFatturaXml(xml: string): EInvoiceData | null {
  const tag = (name: string, scope = xml) => scope.match(new RegExp(`<(?:\\w+:)?${name}>([^<]*)</(?:\\w+:)?${name}>`))?.[1]?.trim() ?? null;
  const gen = xml.match(/<(?:\w+:)?DatiGeneraliDocumento>([\s\S]*?)<\/(?:\w+:)?DatiGeneraliDocumento>/)?.[1];
  if (!gen) return null;
  const cc = xml.match(/<(?:\w+:)?CessionarioCommittente>([\s\S]*?)<\/(?:\w+:)?CessionarioCommittente>/)?.[1] ?? "";
  const piva = cc.match(/<(?:\w+:)?IdPaese>(\w+)<\/(?:\w+:)?IdPaese>\s*<(?:\w+:)?IdCodice>(\w+)</);
  const cf = tag("CodiceFiscale", cc);
  const tot = tag("ImportoTotaleDocumento", gen), num = tag("Numero", gen), data = tag("Data", gen), tipo = tag("TipoDocumento", gen);
  if (!num || !data) return null;
  const imp = [...xml.matchAll(/<(?:\w+:)?ImponibileImporto>([\d.]+)</g)].reduce((a, m) => a + Number(m[1]), 0);
  return { tipo: tipo ?? "", numero: num, data, clienteIds: [piva ? piva[1]! + piva[2]! : null, cf].filter((x): x is string => !!x),
    totale: tot ? Number(tot) : null, imponibile: imp || null };
}

export interface InvoiceRef { id: string; n: number; anno: number; data: string; cliente: string; documento: number; imponibile: number; clienteIds: string[]; hasFile: boolean }
export type Match = { ok: true; id: string } | { ok: false; reason: string; candidate?: string };

/** Finds the invoice: same number and year; the customer's tax id and the total must agree when Cairn knows them. */
export function matchInvoice(d: EInvoiceData, invoices: InvoiceRef[]): Match {
  const n = parseInt(d.numero.replace(/^\D+/, ""), 10), y = +d.data.slice(0, 4);
  if (!Number.isFinite(n)) return { ok: false, reason: `numero «${d.numero}» non leggibile` };
  const cands = invoices.filter((v) => v.n === n && v.anno === y);
  if (!cands.length) return { ok: false, reason: `nessuna fattura n. ${n}/${y} in Cairn` };
  // Cairn keeps the tax id as typed ("P.IVA: 01337600215", "CF: 93126200612"): compare the codes inside it.
  const codes = (s: string) => (s.toUpperCase().match(/[A-Z0-9]{11,16}/g) ?? []).map((x) => x.replace(/^IT(?=\d{11}$)/, ""));
  const fileCodes = new Set(d.clienteIds.flatMap(codes));
  const byClient = fileCodes.size ? cands.filter((v) => { const cc = v.clienteIds.flatMap(codes); return !cc.length || cc.some((c) => fileCodes.has(c)); }) : cands;
  if (!byClient.length) return { ok: false, reason: `la fattura n. ${n}/${y} in Cairn ha un altro cliente`, candidate: cands[0]!.id };
  const v = byClient[0]!;
  const t = d.totale ?? d.imponibile;
  if (t != null && Math.abs(t - v.documento) > 0.01 && Math.abs(t - v.imponibile) > 0.01)
    return { ok: false, reason: `importo diverso: ${t.toFixed(2).replace(".", ",")} € nel file, ${v.documento.toFixed(2).replace(".", ",")} € in Cairn`, candidate: v.id };
  return { ok: true, id: v.id };
}

/** The Apps Script the owner pastes into script.google.com (runs in their own Google account). */
export function appsScript(o: { rpcUrl: string; anonKey: string; token: string; from: string }): string {
  return `// Cairn · fatture elettroniche da Gmail
// Ogni ora cerca le mail di ${o.from} con allegati PDF, XML o P7M e li manda alla casella privata di Cairn.
// Le mail inviate ricevono l'etichetta «Cairn». Codice privato: non condividere questo script.
const CAIRN = {
  url: ${JSON.stringify(o.rpcUrl)},
  key: ${JSON.stringify(o.anonKey)},
  token: ${JSON.stringify(o.token)},
  from: ${JSON.stringify(o.from)},
};

function setup() {
  ScriptApp.getProjectTriggers().forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sync").timeBased().everyHours(1).create();
  sync();
}

function sync() {
  const label = GmailApp.getUserLabelByName("Cairn") || GmailApp.createLabel("Cairn");
  const threads = GmailApp.search("from:" + CAIRN.from + " has:attachment -label:Cairn newer_than:120d", 0, 20);
  threads.forEach((th) => {
    let ok = true;
    th.getMessages().forEach((m) => { if (m.getFrom().toLowerCase().indexOf(CAIRN.from.toLowerCase()) < 0) return; m.getAttachments().forEach((a) => {
      if (!/\\.(pdf|xml|p7m)$/i.test(a.getName())) return;
      const r = UrlFetchApp.fetch(CAIRN.url, {
        method: "post", contentType: "application/json", muteHttpExceptions: true,
        headers: { apikey: CAIRN.key, Authorization: "Bearer " + CAIRN.key },
        payload: JSON.stringify({ p_token: CAIRN.token, p_filename: a.getName(), p_mime: a.getContentType(),
          p_b64: Utilities.base64Encode(a.getBytes()), p_received: m.getDate().toISOString() }),
      });
      if (r.getResponseCode() >= 300) { ok = false; console.warn(a.getName(), r.getResponseCode(), r.getContentText().slice(0, 200)); }
    }); });
    if (ok) th.addLabel(label);
  });
}
`;
}
