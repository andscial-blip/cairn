// Synthetic statements (no personal data). The real ones are checked privately against the months saved on 4/11/2026.
import { describe, it, expect } from "vitest";
import { itemsToRows } from "@/lib/pdf-text";
import { parseUniCredit, parseRevolutPdf, parseRevolutCsv, categorize, merchantKey, aggregate, planMonths, statementPeriod, detect, type Tx } from "@/lib/bank-import";

const it_ = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y], width: str.length * 5 });

describe("PDF layout", () => {
  it("joins items on the same baseline at proportional columns", () => {
    const rows = itemsToRows([it_("Data", 50, 700), it_("Uscite", 400, 700), it_("01.07.26", 50, 680), it_("8,53", 410, 680.6)], 1);
    // cw = 5 units per character: x 50 → column 10, x 400 → 80, x 410 → 82
    expect(rows.map((r) => [r.text.indexOf(r.text.trim().split(/\s+/)[0]!), r.text.trim().split(/\s+/)])).toEqual([[10, ["Data", "Uscite"]], [10, ["01.07.26", "8,53"]]]);
    expect([rows[0]!.text.indexOf("Uscite"), rows[1]!.text.indexOf("8,53")]).toEqual([80, 82]);
    expect(Math.abs(rows[1]!.y - 680)).toBeLessThan(1);
  });
});

// UniCredit-like page: header, a one-line movement, a movement whose description sits above and below the amount row, an income.
const H = "Data      Valuta    Descrizione                                         Uscite        Entrate";
const pad = (s: string, col: number) => s + " ".repeat(Math.max(1, col - s.length));
const UC = [
  { page: 1, y: 800, text: "Estratto conto al 30.09.2026" },
  { page: 1, y: 700, text: H },
  { page: 1, y: 690, text: "30.06.26            SALDO INIZIALE A VS. CREDITO                                    1.000,00" },
  { page: 1, y: 680, text: pad("01.07.26  01.07.26  MY GENIUS: COSTO FISSO", H.indexOf("Uscite") + 2) + "0,43" },
  { page: 1, y: 665, text: "                    PAGAMENTO MASTERCARD Contactless del 01/07/2026" },
  { page: 1, y: 660, text: pad("06.07.26  01.07.26", H.indexOf("Uscite")) + "548,27" },
  { page: 1, y: 655, text: "                    CARTA *6339 DI EUR 548,27 LEROY MERLIN PALERMO" },
  { page: 1, y: 640, text: "                    BONIFICO SEPA DA: ALTROMERCATO" },
  { page: 1, y: 635, text: pad("10.07.26  10.07.26", H.indexOf("Entrate") + 1) + "1.802,00" },
  { page: 1, y: 600, text: "Per il blocco della sua carta chiami il numero verde" },
];

describe("UniCredit PDF", () => {
  const T = parseUniCredit(UC);
  it("reads amount sign from the column and the description around the amount row", () => {
    expect(T).toEqual([
      { date: "2026-07-01", amount: -0.43, source: "UniCredit", text: "MY GENIUS: COSTO FISSO" },
      { date: "2026-07-06", amount: -548.27, source: "UniCredit", text: "PAGAMENTO MASTERCARD Contactless del 01/07/2026 CARTA *6339 DI EUR 548,27 LEROY MERLIN PALERMO" },
      { date: "2026-07-10", amount: 1802, source: "UniCredit", text: "BONIFICO SEPA DA: ALTROMERCATO" },
    ]);
  });
  it("categories and statement period", () => {
    expect(T.map((t) => categorize(t))).toEqual(["Commissioni bancarie", "Casa e lavori", "Entrate da lavoro"]);
    expect(detect("e.pdf", "Codice BIC SWIFT: UNCRITM1K93\nEstratto conto al 30.09.2026")).toBe("unicredit-pdf");
    expect(statementPeriod("unicredit-pdf", UC.map((r) => r.text).join("\n"), T)).toEqual({ from: "2026-07-01", to: "2026-09-30" });
  });
});

describe("Revolut", () => {
  const L = [
    "Jan 1, 2026 - Dec 31, 2026", "Generated on the Nov 4, 2026",
    "Current Accounts Transaction Statements",
    "  Jun 9, 2026    Istanbul Pizzeria Kebap         Merchant     -€24.50   €574.87   €0.00",
    "  Jun 9, 2026    To EUR Conto deposito senza     Others       -€1.00    €573.87   €0.00",
    "                 vincoli",
    "  Jun 12, 2026   Cash withdrawal                 ATM          -€50.00   €523.87   €0.00",
    "Savings Accounts Transaction Statements",
    "  Jun 9, 2026    From EUR Personal               Others       €1.00     €100.00",
  ];
  it("PDF: current account only, continuation lines, categories", () => {
    const T = parseRevolutPdf(L);
    expect(T.map((t) => [t.date, t.amount, t.text, categorize(t)])).toEqual([
      ["2026-06-09", -24.5, "Istanbul Pizzeria Kebap", "Ristoranti, bar e spesa"],
      ["2026-06-09", -1, "To EUR Conto deposito senza vincoli", "Investimenti e risparmio"],
      ["2026-06-12", -50, "Cash withdrawal", "Contanti"],
    ]);
    expect(statementPeriod("revolut-pdf", L.join("\n"), T)).toEqual({ from: "2026-01-01", to: "2026-11-03" });
  });
  it("CSV export: completed current-account rows, fee deducted", () => {
    const csv = "Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance\n" +
      "CARD_PAYMENT,Current,2026-10-02 10:00:00,2026-10-03 09:00:00,Lidl,-12.40,0.00,EUR,COMPLETED,100\n" +
      "CARD_PAYMENT,Current,2026-10-04 10:00:00,,Pending shop,-5.00,0.00,EUR,PENDING,95\n" +
      "TRANSFER,Savings,2026-10-05 10:00:00,2026-10-05 10:00:00,To pocket,-1.00,0.00,EUR,COMPLETED,94\n" +
      "ATM,Current,2026-10-06 10:00:00,2026-10-06 10:00:00,\"Cash at Bank, Rome\",-50.00,1.25,EUR,COMPLETED,42";
    expect(detect("account-statement.csv", csv.split("\n")[0]!)).toBe("revolut-csv");
    expect(parseRevolutCsv(csv)).toEqual([
      { date: "2026-10-03", text: "Lidl", kind: "CARD_PAYMENT", amount: -12.4, source: "Revolut" },
      { date: "2026-10-06", text: "Cash at Bank, Rome", kind: "ATM", amount: -51.25, source: "Revolut" },
    ]);
  });
});

describe("rules learned from corrections", () => {
  it("merchant key ignores card numbers, dates and amounts", () => {
    expect(merchantKey("PAGAMENTO MASTERCARD Contactless del 01/07/2026 CARTA *6339 DI EUR 548,27 LEROY MERLIN PALERMO")).toBe("LEROY MERLIN PALERMO");
    expect(merchantKey("Pendejos Snc Di Damia Dan")).toBe("PENDEJOS SNC DI");
  });
  it("a learned rule wins over the built-in ones", () => {
    const t: Tx = { date: "2026-07-06", amount: -20, text: "Pendejos Snc Di Damia Dan", source: "Revolut", kind: "Merchant" };
    expect(categorize(t)).toBe("Ristoranti, bar e spesa");
    expect(categorize(t, [{ k: "PENDEJOS SNC DI", c: "Acquisti e sport" }])).toBe("Acquisti e sport");
  });
});

describe("months", () => {
  const tx = (date: string, amount: number, c: string, source: "UniCredit" | "Revolut" = "Revolut") => ({ date, amount, c, text: "", source });
  it("expenses by category, investito net, transfers and income excluded", () => {
    expect(aggregate([tx("2026-10-01", -10, "Viaggi"), tx("2026-10-02", -5, "Viaggi"), tx("2026-10-03", 4, "Viaggi"), tx("2026-10-04", -400, "Investimenti e risparmio"), tx("2026-10-05", 20, "Investimenti e risparmio"), tx("2026-10-06", -100, "Interno"), tx("2026-10-07", 1800, "Entrate da lavoro")]))
      .toEqual([{ mese: "2026-10", cat: { Viaggi: 15 }, investito: 380, n: 2 }]);
  });
  const saved = [{ mese: "2026-09", cat: { Viaggi: 15 }, investito: 0, fonti: "UniCredit, Revolut" }];
  const rev = { months: [{ mese: "2026-09", cat: { Viaggi: 10 }, investito: 0, n: 1 }, { mese: "2026-10", cat: { Viaggi: 7 }, investito: 0, n: 1 }, { mese: "2026-11", cat: { Viaggi: 1 }, investito: 0, n: 1 }], periods: [{ from: "2026-09-01", to: "2026-11-03" }] };
  it("one bank alone does not overwrite a month saved with two; a partial month is skipped; a new month says what is missing", () => {
    const p = planMonths({ Revolut: rev }, saved, "2026-11-07");
    expect(p.map((x) => [x.mese, x.state, x.missing])).toEqual([["2026-09", "needs-other", ["UniCredit"]], ["2026-10", "new", ["UniCredit"]], ["2026-11", "partial", undefined]]);
  });
  it("months saved per source: importing the other bank later adds its part", () => {
    const first = planMonths({ Revolut: rev }, [], "2026-11-07").find((x) => x.mese === "2026-10")!.next!;
    const uc = { months: [{ mese: "2026-10", cat: { Viaggi: 3, Salute: 20 }, investito: 400, n: 2 }], periods: [{ from: "2026-10-01", to: "2026-12-31" }] };
    const p = planMonths({ UniCredit: uc }, [first], "2027-01-05").find((x) => x.mese === "2026-10")!;
    expect(p.state).toBe("update");
    expect(p.next).toMatchObject({ cat: { Viaggi: 10, Salute: 20 }, investito: 400, fonti: "UniCredit, Revolut" });
    expect(planMonths({ UniCredit: uc }, [p.next!], "2027-01-05")[0]!.state).toBe("same");
  });
});
