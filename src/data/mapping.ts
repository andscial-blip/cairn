/**
 * Mapping between the domain model (src/domain/types.ts, same shape as the original app)
 * and the Postgres rows. Two directions:
 *   - legacyToRows: one-off import of the original app's export (deterministic UUID v5 ids,
 *     so re-running the import updates the same records instead of duplicating them);
 *   - rowsToSnapshot: what the app does on every render, from the local IndexedDB copy.
 */
import { lastDay } from "@/domain/dates";
import type { Client, Config, Contract, F24, IncomeRecord, Invoice, InvestmentAccount, Mission, MonthlyExpenses, Reminder, SavingsAccount, Snapshot } from "@/domain/types";
import { uuidv5 } from "./uuid";

type Row = Record<string, unknown> & { id: string };
export type RowsByTable = {
  clients: Row[]; contracts: Row[]; missions: Row[]; invoices: Row[]; invoice_lines: Row[]; f24_payments: Row[];
  reminders: Row[]; monthly_expenses: Row[]; savings_accounts: Row[]; investment_accounts: Row[]; holdings: Row[];
  other_income: Row[]; ledger_settings: Row[];
};
/** Order in which rows must be written (parents before children). */
export const IMPORT_ORDER: (keyof RowsByTable)[] = ["ledger_settings", "clients", "contracts", "missions", "invoices", "invoice_lines",
  "f24_payments", "reminders", "monthly_expenses", "savings_accounts", "investment_accounts", "holdings", "other_income"];

export interface LegacyExport {
  invoices: Invoice[]; clients: Client[]; contratti: Contract[]; missioni: Mission[]; promemoria: Reminder[]; f24: F24[];
  spese: MonthlyExpenses[]; redditi: IncomeRecord[]; investimenti: InvestmentAccount[]; risparmi: SavingsAccount[];
  config: Partial<Config> & Record<string, unknown>;
  /** Optional embedded PDFs: legacy invoice id → { name, mime, base64 }. */
  pdfs?: Record<string, { name: string; mime: string; base64: string }>;
}

const num = (v: unknown, d = 0) => (v === null || v === undefined || v === "" ? d : Number(v));
const monthStart = (m: string) => `${m}-01`;
const splitCodes = (s?: string) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : []);

export async function legacyToRows(L: LegacyExport): Promise<{ rows: RowsByTable; ids: Record<string, string> }> {
  const ids: Record<string, string> = {};
  const id = async (kind: string, legacy: string) => (ids[`${kind}:${legacy}`] ??= await uuidv5(`${kind}:${legacy}`));
  const rows: RowsByTable = { clients: [], contracts: [], missions: [], invoices: [], invoice_lines: [], f24_payments: [], reminders: [],
    monthly_expenses: [], savings_accounts: [], investment_accounts: [], holdings: [], other_income: [], ledger_settings: [] };

  for (const c of L.clients) rows.clients.push({
    id: await id("client", c.id), name: c.nome, short_code: c.id, legal_name: c.ragione ?? "", vat_id: c.idFiscale ?? "",
    address: c.indirizzo ?? "", pec: c.pec ?? "", country: c.paese ?? "IT", is_foreign: !!c.estero, sort: num(c.ordine),
    payment_days: c.gg === null || c.gg === undefined || c.gg === "" ? null : Number(c.gg), payment_terms: c.termine ?? {},
    default_fee: num(c.compenso), default_rate: num(c.tariffa), templates: { line: c.desc ?? "", travel: c.descTrasf ?? "" }, notes: "",
  });
  for (const k of L.contratti) rows.contracts.push({
    id: await id("contract", k.id), client_id: await id("client", k.cliente), title: k.id, start_date: monthStart(k.dal), end_date: lastDay(k.al),
    monthly_fee: num(k.importo) / Math.max(1, num(k.ogni, 1)), is_signed: !k.ipotesi, is_active: k.attivo !== false, notes: k.note ?? "",
    terms: { amount: num(k.importo), every: num(k.ogni, 1), offset: num(k.offset), rule: k.regola ?? {}, rate: num(k.tariffa) },
  });
  for (const m of L.missioni) {
    const quota = m.tipo === "quota";
    rows.missions.push({ id: await id("mission", m.id), client_id: await id("client", m.cliente), kind: quota ? "quota" : "trip",
      start_date: quota ? null : m.dal, end_date: quota ? null : m.al, year: quota ? num(m.anno) : null, days: quota ? num(m.giorni) : null,
      is_hypothesis: !!m.ipotesi, notes: m.note ?? "" });
  }
  for (const v of L.invoices) {
    const iid = await id("invoice", v.id);
    rows.invoices.push({ id: iid, client_id: await id("client", v.cliente), year: v.anno, number: v.n, number_label: v.num ?? `${v.n}/${v.anno}`,
      issue_date: v.data, collected_on: v.incasso ?? null, sdi_sent_on: v.emessaSdi ?? null, sent_to_accountant_on: v.inviataCommercialista ?? null,
      sdi_number: v.numeroSdi ?? null, stamp_duty: num(v.bollo), stamp_auto: v.bolloAuto !== false, months_covered: v.mesiCoperti ?? [],
      travel: v.trasf ?? null, status_tracking: !!v.statoTracking, notes: v.note ?? "" });
    for (const [i, r] of (v.righe ?? []).entries()) rows.invoice_lines.push({ id: await id("line", `${v.id}#${i}`), invoice_id: iid, position: i,
      description: r.desc ?? "", quantity: num(r.qta, 1), unit_price: num(r.prezzo), kind: ["compenso", "trasferta", "rimborso"].includes(String(r.tipo)) ? r.tipo : "altro" });
  }
  for (const f of L.f24) rows.f24_payments.push({ id: await id("f24", f.id), due_date: f.data, paid_on: f.versato ? f.data : null, amount: num(f.importo),
    description: f.descrizione ?? "", codes: splitCodes(f.tributi), kind: "altro", notes: f.note ?? "" });
  for (const r of L.promemoria) rows.reminders.push({ id: await id("reminder", r.id), key: r.id, due_date: r.data, title: r.titolo, notes: r.dettaglio ?? "",
    lead_days: num(r.preavviso, 14), client_id: r.cliente ? await id("client", r.cliente) : null, done_on: r.fatto ? r.data : null });
  for (const s of L.spese) rows.monthly_expenses.push({ id: await id("expenses", s.id), month: monthStart(s.mese), categories: s.cat ?? {}, invested: num(s.investito),
    sources: (s.fonti ?? "").split(",").map((x) => x.trim()).filter(Boolean), notes: s.note ?? "" });
  for (const a of L.risparmi) rows.savings_accounts.push({ id: await id("savings", a.id), name: a.nome, product: a.prodotto ?? "", logo: a.logo ?? null,
    role: a.ruolo === "tasse" ? "tax" : "savings", balance: num(a.saldo), gains: num(a.guadagno), as_of: a.aggiornato ?? new Date().toISOString().slice(0, 10),
    gross_rate: num(a.tassoLordo), cost_rate: num(a.costi), stamp_rate: num(a.bollo), tax_rate: num(a.aliquota, 26), contribution: a.versamento ?? {},
    covers_from: a.copreDal || null, sort: num(a.ordine, 9), notes: a.note ?? [], fund: a.fondo ?? "" });
  for (const a of L.investimenti) {
    const aid = await id("investment", a.id);
    rows.investment_accounts.push({ id: aid, name: a.nome ?? a.id, logo: a.id === "trading212" ? "t212" : null, as_of: a.aggiornato ?? new Date().toISOString().slice(0, 10),
      deposits: num(a.depositi), withdrawals: num(a.prelievi), deposit_fees: num(a.commDeposito), fx_fees: num(a.commCambio),
      realized: a.realizzate ?? [], monthly: a.mensile ?? {}, pac: a.pac ?? {}, history: a.storico ?? [] });
    for (const t of a.titoli ?? []) rows.holdings.push({ id: await id("holding", `${a.id}#${t.isin}`), account_id: aid, isin: t.isin, ticker: t.ticker, name: t.nome,
      asset_class: t.classe ?? "", units: num(t.quote), cost: num(t.costo), price_eur: num(t.prezzoEur), currency: t.valuta ?? "EUR", target_pct: num(t.target) });
  }
  for (const r of L.redditi) rows.other_income.push({ id: await id("income", r.id), received_on: r.data, kind: r.tipo, amount: num(r.importo), notes: r.note ?? "" });

  // Settings: compliance acknowledgements reference record ids → remap legacy ids to the new UUIDs.
  const cfg = { ...(L.config ?? {}) } as Record<string, unknown>;
  const remapAck = async (k: string) => {
    const m = k.match(/^(sdi|est|bollo|due)-(.+)$/); if (!m) return k;
    return `${m[1]}-${await id("invoice", m[2]!)}`;
  };
  cfg.ack = await Promise.all(((cfg.ack as string[]) ?? []).map(remapAck));
  delete cfg.app; delete cfg.creato;
  rows.ledger_settings.push({ id: await id("settings", "main"), data: cfg });
  return { rows, ids };
}

/** Builds the domain snapshot from (non-deleted) rows. */
export function rowsToSnapshot(R: Partial<Record<keyof RowsByTable, Row[]>>, defaults: (c: Partial<Config>) => Config): Snapshot {
  const live = <T extends Row>(xs: T[] | undefined) => (xs ?? []).filter((x) => !x.deleted_at);
  const s = (v: unknown) => (v === null || v === undefined ? undefined : String(v));
  const clientsById = new Map(live(R.clients).map((c) => [c.id, c]));
  const lines = new Map<string, Row[]>();
  live(R.invoice_lines).forEach((l) => { const k = String(l.invoice_id); (lines.get(k) ?? lines.set(k, []).get(k)!).push(l); });
  const attachments = new Map(live((R as Record<string, Row[] | undefined>).attachments).map((a) => [a.id, a]));
  const holdings = new Map<string, Row[]>();
  live(R.holdings).forEach((h) => { const k = String(h.account_id); (holdings.get(k) ?? holdings.set(k, []).get(k)!).push(h); });

  const clients: Client[] = live(R.clients).map((c) => {
    const t = (c.templates ?? {}) as { line?: string; travel?: string };
    const terms = (c.payment_terms ?? {}) as Client["termine"];
    return { id: c.id, nome: String(c.name), ...(c.short_code ? { codice: String(c.short_code) } : {}), ragione: s(c.legal_name), idFiscale: s(c.vat_id), indirizzo: s(c.address), pec: s(c.pec), ordine: num(c.sort),
      estero: !!c.is_foreign, paese: s(c.country), gg: c.payment_days === null || c.payment_days === undefined ? null : Number(c.payment_days),
      termine: terms && Object.keys(terms).length ? terms : undefined, compenso: num(c.default_fee), tariffa: num(c.default_rate), desc: t.line, descTrasf: t.travel };
  });
  const contratti: Contract[] = live(R.contracts).map((k) => {
    const t = (k.terms ?? {}) as { amount?: number; every?: number; offset?: number; rule?: { n?: number }; rate?: number };
    return { id: k.id, cliente: String(k.client_id), dal: String(k.start_date).slice(0, 7), al: String(k.end_date ?? k.start_date).slice(0, 7),
      importo: num(t.amount, num(k.monthly_fee)), ogni: num(t.every, 1), offset: num(t.offset), regola: t.rule ?? {}, tariffa: num(t.rate),
      ipotesi: !k.is_signed, attivo: k.is_active !== false, note: s(k.notes) };
  });
  const missioni: Mission[] = live(R.missions).map((m) => m.kind === "quota"
    ? { id: m.id, cliente: String(m.client_id), tipo: "quota", anno: num(m.year), giorni: num(m.days), ipotesi: !!m.is_hypothesis, note: s(m.notes) }
    : { id: m.id, cliente: String(m.client_id), dal: s(m.start_date), al: s(m.end_date), ipotesi: !!m.is_hypothesis, note: s(m.notes) });
  const invoices: Invoice[] = live(R.invoices).map((v) => ({
    id: v.id, cliente: String(v.client_id), anno: num(v.year), n: num(v.number), num: s(v.number_label), data: String(v.issue_date),
    incasso: s(v.collected_on) ?? null, emessaSdi: s(v.sdi_sent_on) ?? null, inviataCommercialista: s(v.sent_to_accountant_on) ?? null, numeroSdi: s(v.sdi_number),
    statoTracking: !!v.status_tracking, bollo: num(v.stamp_duty), bolloAuto: v.stamp_auto !== false, mesiCoperti: (v.months_covered as string[]) ?? [],
    trasf: (v.travel as Invoice["trasf"]) ?? null, note: s(v.notes),
    ...(v.attachment_id && attachments.get(String(v.attachment_id))
      ? { pdf: { id: String(v.attachment_id), nome: String(attachments.get(String(v.attachment_id))!.original_name), url: `cairn-att:${attachments.get(String(v.attachment_id))!.storage_path}` } } : {}),
    righe: (lines.get(v.id) ?? []).sort((a, b) => num(a.position) - num(b.position))
      .map((l) => ({ tipo: String(l.kind), qta: num(l.quantity), prezzo: num(l.unit_price), desc: s(l.description) })),
  }));
  const f24: F24[] = live(R.f24_payments).map((f) => ({ id: f.id, data: String(f.due_date), descrizione: String(f.description ?? ""),
    tributi: ((f.codes as string[]) ?? []).join(", "), importo: num(f.amount), versato: !!f.paid_on, note: s(f.notes) }));
  const promemoria: Reminder[] = live(R.reminders).map((r) => ({ id: r.id, data: String(r.due_date), titolo: String(r.title), dettaglio: s(r.notes),
    preavviso: num(r.lead_days, 14), cliente: s(r.client_id), fatto: !!r.done_on }));
  const spese: MonthlyExpenses[] = live(R.monthly_expenses).map((e) => ({ id: e.id, mese: String(e.month).slice(0, 7), cat: (e.categories as Record<string, number>) ?? {},
    investito: num(e.invested), fonti: ((e.sources as string[]) ?? []).join(", "), note: s(e.notes) }));
  const risparmi: SavingsAccount[] = live(R.savings_accounts).map((a) => ({ id: a.id, nome: String(a.name), prodotto: s(a.product), logo: s(a.logo),
    ...(a.role === "tax" ? { ruolo: "tasse" as const } : {}), ordine: num(a.sort, 9), saldo: num(a.balance), guadagno: num(a.gains), aggiornato: s(a.as_of),
    tassoLordo: num(a.gross_rate), costi: num(a.cost_rate), bollo: num(a.stamp_rate), aliquota: num(a.tax_rate, 26),
    versamento: (a.contribution as SavingsAccount["versamento"]) ?? {}, copreDal: s(a.covers_from), note: (a.notes as string[]) ?? [], fondo: s(a.fund) }));
  const investimenti: InvestmentAccount[] = live(R.investment_accounts).map((a) => ({ id: a.id, nome: s(a.name), ...(a.logo ? { logo: String(a.logo) } : {}), aggiornato: s(a.as_of),
    depositi: num(a.deposits), prelievi: num(a.withdrawals), commDeposito: num(a.deposit_fees), commCambio: num(a.fx_fees),
    realizzate: (a.realized as InvestmentAccount["realizzate"]) ?? [], mensile: (a.monthly as Record<string, number>) ?? {}, pac: (a.pac as InvestmentAccount["pac"]) ?? {}, storico: (a.history as InvestmentAccount["storico"]) ?? [],
    titoli: (holdings.get(a.id) ?? []).map((h) => ({ isin: String(h.isin), ticker: String(h.ticker), nome: String(h.name), classe: s(h.asset_class),
      quote: num(h.units), costo: num(h.cost), prezzoEur: num(h.price_eur), valuta: s(h.currency), target: num(h.target_pct) })) }));
  const redditi: IncomeRecord[] = live(R.other_income).map((r) => ({ id: r.id, data: String(r.received_on), tipo: String(r.kind), importo: num(r.amount), note: s(r.notes) }));
  const settings = (live(R.ledger_settings)[0]?.data ?? {}) as Partial<Config>;
  void clientsById;
  return { invoices, clients, f24, contratti, missioni, promemoria, redditi, spese, risparmi, investimenti, cfg: defaults(settings) };
}

/* ------------------------------------------------------------------------------------------------
 * Live edits: the original app's documents (ids already UUIDs) → the main row of their table.
 * Derived/identity columns that the document cannot carry are listed in PRESERVE and kept as stored.
 * ---------------------------------------------------------------------------------------------- */
export const COLL_TABLE = {
  invoices: "invoices", clients: "clients", contratti: "contracts", missioni: "missions", promemoria: "reminders", f24: "f24_payments",
  redditi: "other_income", risparmi: "savings_accounts", investimenti: "investment_accounts", spese: "monthly_expenses",
} as const;
export type LegacyColl = keyof typeof COLL_TABLE;
/** Columns not representable in the document: kept from the stored row (or defaulted on insert). */
export const PRESERVE: Partial<Record<string, string[]>> = {
  clients: ["short_code"], contracts: ["title"], reminders: ["key"], investment_accounts: ["logo"],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any> & { id: string };
export function docToRow(coll: LegacyColl, d: Doc): Row {
  switch (coll) {
    case "clients": return { id: d.id, name: d.nome, legal_name: d.ragione ?? "", vat_id: d.idFiscale ?? "", address: d.indirizzo ?? "", pec: d.pec ?? "",
      country: d.paese ?? "IT", is_foreign: !!d.estero, sort: num(d.ordine), payment_days: d.gg === null || d.gg === undefined || d.gg === "" ? null : Number(d.gg),
      payment_terms: d.termine ?? {}, default_fee: num(d.compenso), default_rate: num(d.tariffa), templates: { line: d.desc ?? "", travel: d.descTrasf ?? "" } };
    case "contratti": return { id: d.id, client_id: d.cliente, start_date: monthStart(d.dal), end_date: lastDay(d.al), monthly_fee: num(d.importo) / Math.max(1, num(d.ogni, 1)),
      is_signed: !d.ipotesi, is_active: d.attivo !== false, notes: d.note ?? "",
      terms: { amount: num(d.importo), every: num(d.ogni, 1), offset: num(d.offset), rule: d.regola ?? {}, rate: num(d.tariffa) } };
    case "missioni": { const q = d.tipo === "quota";
      return { id: d.id, client_id: d.cliente, kind: q ? "quota" : "trip", start_date: q ? null : d.dal, end_date: q ? null : d.al, year: q ? num(d.anno) : null,
        days: q ? num(d.giorni) : null, is_hypothesis: !!d.ipotesi, notes: d.note ?? "" }; }
    case "invoices": return { id: d.id, client_id: d.cliente, year: num(d.anno), number: num(d.n), number_label: d.num ?? `${d.n}/${d.anno}`, issue_date: d.data,
      collected_on: d.incasso ?? null, sdi_sent_on: d.emessaSdi ?? null, sent_to_accountant_on: d.inviataCommercialista ?? null, sdi_number: d.numeroSdi ?? null,
      stamp_duty: num(d.bollo), stamp_auto: d.bolloAuto !== false, months_covered: d.mesiCoperti ?? [], travel: d.trasf ?? null, status_tracking: !!d.statoTracking,
      notes: d.note ?? "" };
    case "f24": return { id: d.id, due_date: d.data, paid_on: d.versato ? d.data : null, amount: num(d.importo), description: d.descrizione ?? "",
      codes: splitCodes(d.tributi), notes: d.note ?? "" };
    case "promemoria": return { id: d.id, due_date: d.data, title: d.titolo, notes: d.dettaglio ?? "", lead_days: num(d.preavviso, 14),
      client_id: d.cliente || null, done_on: d.fatto ? d.data : null };
    case "spese": return { id: d.id, month: monthStart(d.mese), categories: d.cat ?? {}, invested: num(d.investito),
      sources: String(d.fonti ?? "").split(",").map((x) => x.trim()).filter(Boolean), notes: d.note ?? "" };
    case "risparmi": return { id: d.id, name: d.nome, product: d.prodotto ?? "", logo: d.logo ?? null, role: d.ruolo === "tasse" ? "tax" : "savings",
      balance: num(d.saldo), gains: num(d.guadagno), as_of: d.aggiornato ?? new Date().toISOString().slice(0, 10), gross_rate: num(d.tassoLordo),
      cost_rate: num(d.costi), stamp_rate: num(d.bollo), tax_rate: num(d.aliquota, 26), contribution: d.versamento ?? {}, covers_from: d.copreDal || null,
      sort: num(d.ordine, 9), notes: d.note ?? [], fund: d.fondo ?? "" };
    case "investimenti": return { id: d.id, name: d.nome ?? "", as_of: d.aggiornato ?? new Date().toISOString().slice(0, 10), deposits: num(d.depositi),
      withdrawals: num(d.prelievi), deposit_fees: num(d.commDeposito), fx_fees: num(d.commCambio), realized: d.realizzate ?? [], monthly: d.mensile ?? {}, pac: d.pac ?? {}, history: d.storico ?? [] };
    case "redditi": return { id: d.id, received_on: d.data, kind: d.tipo, amount: num(d.importo), notes: d.note ?? "" };
  }
}
/** Invoice lines in document order (ids assigned by the caller, reusing stored ids by position). */
export const docLines = (d: Doc) => ((d.righe ?? []) as Doc[]).map((r, i) => ({ position: i, description: r.desc ?? "", quantity: num(r.qta, 1),
  unit_price: num(r.prezzo), kind: ["compenso", "trasferta", "rimborso"].includes(String(r.tipo)) ? r.tipo : "altro" }));
/** Holdings of an investment account (matched to stored rows by ISIN). */
export const docHoldings = (d: Doc) => ((d.titoli ?? []) as Doc[]).map((t) => ({ isin: t.isin, ticker: t.ticker, name: t.nome, asset_class: t.classe ?? "",
  units: num(t.quote), cost: num(t.costo), price_eur: num(t.prezzoEur), currency: t.valuta ?? "EUR", target_pct: num(t.target) }));

/** Canonical JSON (sorted keys) for change detection. */
export const canon = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === "object" && !Array.isArray(x)
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, (x as Record<string, unknown>)[k]])) : x));
/** Fields of `next` whose value differs from `cur` (absent/undefined/null are treated alike). */
export function changedFields(cur: Record<string, unknown> | undefined, next: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (k === "id") continue;
    const a = cur?.[k] ?? null, b = v ?? null;
    if (typeof a === "number" || typeof b === "number" ? Number(a) !== Number(b) || (a === null) !== (b === null) : canon(a) !== canon(b)) out[k] = v ?? null;
  }
  return out;
}
