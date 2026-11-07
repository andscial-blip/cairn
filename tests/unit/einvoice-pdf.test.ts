// Courtesy PDF of an e-invoice (synthetic, Agenzia delle Entrate layout) and FatturaPA XML → matching invoice.
import { describe, it, expect } from "vitest";
import { parseCourtesyPdf, parseFatturaXml, matchInvoice, appsScript, type InvoiceRef } from "@/lib/einvoice-pdf";

const L = [
  "  Cedente/prestatore (fornitore)                                            Cessionario/committente (cliente)",
  "    Identificativo fiscale ai fini IVA: IT01234567890                         Identificativo fiscale ai fini IVA: IT09876543210",
  "    Codice fiscale: RSSMRA80A01H501U                                          Codice fiscale: 09876543210",
  "    Denominazione:  MARIO ROSSI                                               Denominazione: CLIENTE SPA",
  "           Tipologia documento            Art. 73           Numero documento                 Data documento                Codice destinatario",
  "              TD01 (fattura)                                                       16          23-10-2026                     Indicata PEC",
  "                     esigibilità iva / riferimenti normativi                 %IVA      Spese accessorie     Arr.    Totale imponibile Totale imposta",
  "  Operazione effettuata ai sensi dell'art. 1, commi da 54 a 89, della legge n. 190/2014 N2.2                  0,00           6.682,00              0",
  "          Importo bollo              Bollo Virtuale                   Sconto/Maggiorazione                Arr.            Totale documento",
  "                                                                                                                                             6.682,00",
];
const refs: InvoiceRef[] = [
  { id: "a", n: 16, anno: 2026, data: "2026-10-23", cliente: "c1", documento: 6682, imponibile: 6680, clienteIds: ["P.IVA: 09876543210"], hasFile: false },
  { id: "b", n: 15, anno: 2026, data: "2026-10-23", cliente: "c2", documento: 1802, imponibile: 1800, clienteIds: ["93126200612"], hasFile: false },
];

describe("e-invoice files", () => {
  it("reads number, date, customer ids and totals from the courtesy PDF", () => {
    expect(parseCourtesyPdf(L)).toEqual({ tipo: "TD01", numero: "16", data: "2026-10-23", clienteIds: ["IT09876543210", "09876543210"], totale: 6682, imponibile: 6682 });
    expect(parseCourtesyPdf(["INVOICE No. 001/2025", "TO ECOA"])).toBeNull();
  });
  it("matches by number and year, checks customer and total", () => {
    const d = parseCourtesyPdf(L)!;
    expect(matchInvoice(d, refs)).toEqual({ ok: true, id: "a" });
    expect(matchInvoice({ ...d, totale: 100 }, refs)).toMatchObject({ ok: false, candidate: "a" });
    expect(matchInvoice({ ...d, clienteIds: ["IT11111111111"] }, refs)).toMatchObject({ ok: false, reason: expect.stringContaining("altro cliente") });
    expect(matchInvoice({ ...d, numero: "99" }, refs)).toMatchObject({ ok: false, reason: "nessuna fattura n. 99/2026 in Cairn" });
  });
  it("reads the FatturaPA XML", () => {
    const x = `<?xml version="1.0"?><p:FatturaElettronica><FatturaElettronicaHeader><CessionarioCommittente><DatiAnagrafici><IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>09876543210</IdCodice></IdFiscaleIVA></DatiAnagrafici></CessionarioCommittente></FatturaElettronicaHeader>
      <FatturaElettronicaBody><DatiGenerali><DatiGeneraliDocumento><TipoDocumento>TD01</TipoDocumento><Divisa>EUR</Divisa><Data>2026-10-23</Data><Numero>16</Numero><ImportoTotaleDocumento>6682.00</ImportoTotaleDocumento></DatiGeneraliDocumento></DatiGenerali>
      <DatiBeniServizi><DatiRiepilogo><ImponibileImporto>6682.00</ImponibileImporto></DatiRiepilogo></DatiBeniServizi></FatturaElettronicaBody></p:FatturaElettronica>`;
    const d = parseFatturaXml(x)!;
    expect(d).toMatchObject({ tipo: "TD01", numero: "16", data: "2026-10-23", clienteIds: ["IT09876543210"], totale: 6682 });
    expect(matchInvoice(d, refs)).toEqual({ ok: true, id: "a" });
  });
  it("the Gmail script carries the token and the sender, and nothing else of the user", () => {
    const s = appsScript({ rpcUrl: "https://x.supabase.co/rest/v1/rpc/einvoice_inbox_put", anonKey: "anon", token: "T".repeat(43), from: "studio@example.it" });
    expect(s).toContain('"TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"'); expect(s).toContain("from:\" + CAIRN.from"); expect(s).toContain("everyHours(1)");
  });
});
