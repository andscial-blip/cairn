// Domain model. Field names follow the original app so the engine is a faithful port;
// src/data/mapping.ts converts between these objects and the Postgres rows.
export type LineKind = "compenso" | "trasferta" | "rimborso" | "altro";
export interface InvoiceLine { tipo?: LineKind | string; qta?: number; prezzo?: number; desc?: string; }
export interface Invoice {
  id: string; cliente: string; anno: number; n: number; num?: string; data: string;
  incasso?: string | null; emessaSdi?: string | null; inviataCommercialista?: string | null; numeroSdi?: string;
  statoTracking?: boolean; bollo?: number; bolloAuto?: boolean; righe: InvoiceLine[]; mesiCoperti?: string[];
  trasf?: { dal: string; al: string; tariffa: number } | null; note?: string; pdf?: { id: string; nome?: string; url?: string } | null;
}
export interface Client {
  codice?: string;
  id: string; nome: string; ragione?: string; idFiscale?: string; indirizzo?: string; pec?: string; ordine?: number;
  estero?: boolean; paese?: string; gg?: number | string | null; termine?: { giornoMese?: number; fineMese?: boolean; giorni?: number };
  compenso?: number; tariffa?: number; desc?: string; descTrasf?: string;
  /** Small image as a data URL, uploaded by the owner. */
  logo?: string;
}
export interface F24 { id: string; data: string; descrizione: string; tributi?: string; importo: number; versato?: boolean; note?: string; }
export interface Contract {
  id: string; cliente: string; dal: string; al: string; importo: number; ogni?: number; offset?: number;
  regola?: { n?: number }; tariffa?: number; ipotesi?: boolean; attivo?: boolean; note?: string;
}
export interface Mission {
  id: string; cliente: string; tipo?: "missione" | "quota"; dal?: string; al?: string; anno?: number; giorni?: number;
  ipotesi?: boolean; note?: string;
}
export interface Reminder { id: string; data: string; titolo: string; dettaglio?: string; preavviso?: number; cliente?: string; fatto?: boolean; auto?: boolean; }
export interface IncomeRecord { id: string; data: string; tipo: string; importo: number; note?: string; }
export interface MonthlyExpenses { id: string; mese: string; cat: Record<string, number>; investito?: number; fonti?: string; note?: string;
  /** Per source (bank) totals, from the statement import: the month's figures are their sum. */
  perFonte?: Record<string, { cat: Record<string, number>; investito: number; al?: string }>;
}
export interface SavingsAccount {
  id: string; nome: string; prodotto?: string; logo?: string; ruolo?: "tasse"; ordine?: number; saldo: number; guadagno?: number;
  aggiornato?: string; tassoLordo?: number; costi?: number; bollo?: number; aliquota?: number;
  versamento?: { importo?: number; giorno?: number; nota?: string }; copreDal?: string; note?: string[]; fondo?: string;
  /** One point per balance update: d = date, saldo = balance, guadagno = total gains shown by the provider. */
  storico?: { d: string; saldo: number; guadagno: number }[];
}
export interface Holding { isin: string; ticker: string; nome: string; classe?: string; quote: number; costo: number; prezzoEur: number; valore?: number; valuta?: string; target: number; }
export interface InvestmentAccount {
  logo?: string;
  id: string; nome?: string; aggiornato?: string; titoli: Holding[]; depositi?: number; prelievi?: number;
  commDeposito?: number; commCambio?: number; realizzate?: { data: string; isin: string; importo: number }[];
  mensile?: Record<string, number>;
  pac?: { importo?: number; giorno?: number; inizio?: string; anni?: number; revisioneMesi?: number; soglia?: number; ultimaRevisione?: string };
  /** Daily snapshots from the Trading 212 sync: d = date, v = value of the ETFs, c = cost basis, cash = uninvested cash. */
  storico?: { d: string; v: number; c: number; cash?: number | null; p?: Record<string, number> }[];
  /** From the Trading 212 history: interest and dividends, per-year tax figures, day of the last complete import. */
  proventi?: { data: string; isin: string; importo: number; tipo: string }[];
  fiscoAnni?: import("@/lib/t212-history").YearTax[];
  movimentiAl?: string | null;
}
export interface YearParams { coef: number; inps: number; imp: number; margine: number; }
export interface Config {
  params: Record<string, YearParams>;
  soglie: { s85: number; s100: number; allerta: number; bolloMin: number; bollo: number };
  emissione?: { dicembre?: number };
  commercialista?: { nome?: string; email?: string };
  fisco?: Record<string, Partial<Record<"stima" | "inps" | "accontiInps" | "inpsVersati" | "imposta" | "accontiImp", number | string>>>;
  acconti?: Record<string, "storico" | "previsionale">;
  ack?: string[];
  contoTasse?: { saldo?: number; data?: string };
  emergenzaMesi?: number;
  [k: string]: unknown;
}
export interface Snapshot {
  invoices: Invoice[]; clients: Client[]; f24: F24[]; contratti: Contract[]; missioni: Mission[];
  promemoria: Reminder[]; redditi: IncomeRecord[]; spese: MonthlyExpenses[]; risparmi: SavingsAccount[];
  investimenti: InvestmentAccount[]; cfg: Config;
}
