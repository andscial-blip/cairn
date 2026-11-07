/**
 * Cairn fiscal & cash-flow engine — a faithful TypeScript port of the approved artifact (v35).
 * Pure: every function reads only the Snapshot and the injected `today`, so results are
 * reproducible and testable (golden tests compare them with the original app, number by number).
 */
import { addDays, addMonths, addMonthsD, daysBetween, dmy, isHoliday, lastDay, mLabel, nextWork, nthLastFriday, pad, r2, workday, ym } from "./dates";
import type { Client, Config, Contract, F24, Invoice, InvestmentAccount, Holding, Reminder, SavingsAccount, Snapshot, YearParams } from "./types";

export const DEFAULT_CFG: Config = {
  params: {
    "2025": { coef: 0.67, inps: 0.2607, imp: 0.05, margine: 0.1 }, "2026": { coef: 0.67, inps: 0.2607, imp: 0.05, margine: 0.1 },
    "2027": { coef: 0.67, inps: 0.2607, imp: 0.15, margine: 0.1 }, "2028": { coef: 0.67, inps: 0.2607, imp: 0.15, margine: 0.1 },
    "2029": { coef: 0.67, inps: 0.2607, imp: 0.15, margine: 0.1 }, "2030": { coef: 0.67, inps: 0.2607, imp: 0.15, margine: 0.1 },
  },
  soglie: { s85: 85000, s100: 100000, allerta: 75000, bolloMin: 77.47, bollo: 2 },
  emissione: { dicembre: 18 },
  commercialista: { nome: "Isabella", email: "" },
  fisco: {},
};

/** One-level deep merge of stored settings over the defaults (same rule as the artifact). */
export function mergeCfg(d: Partial<Config> | null | undefined): Config {
  const c = JSON.parse(JSON.stringify(DEFAULT_CFG)) as Record<string, unknown>;
  Object.entries(d ?? {}).forEach(([k, v]) => {
    c[k] = typeof v === "object" && v !== null && !Array.isArray(v) ? Object.assign({}, c[k] as object, v) : v;
  });
  return c as Config;
}

export interface Totals { comp: number; ind: number; rimb: number; bollo: number; imponibile: number; documento: number; servizi: number; }
export function tot(inv: Pick<Invoice, "righe" | "bollo">): Totals {
  let comp = 0, ind = 0, rimb = 0;
  (inv.righe ?? []).forEach((r) => {
    const v = (+(r.qta ?? 0) || 0) * (+(r.prezzo ?? 0) || 0);
    if (r.tipo === "trasferta") ind += v; else if (r.tipo === "rimborso") rimb += v; else comp += v;
  });
  const bollo = +(inv.bollo ?? 0) || 0;
  const imponibile = comp + ind + bollo;
  return { comp: r2(comp), ind: r2(ind), rimb: r2(rimb), bollo, imponibile: r2(imponibile), documento: r2(comp + ind + rimb + bollo), servizi: r2(comp + ind + rimb) };
}

export interface Projection {
  contratto: string; cliente: string; months: string[]; label: string; data: string; incasso: string; anno: number;
  comp: number; ind: number; gg: number; tariffa: number; trasf: { dal: string; al: string; n: number; ipotesi: boolean; quota?: boolean }[];
  bollo: number; imponibile: number; ipotesi: boolean; quota?: number;
}
export interface FiscalYear {
  y: number; p: YearParams; inc: number; att: number; contr: number; stima: number; ric: number; red: number;
  inpsCalc: number; inps: number; accInps: number; saldoInps: number; inpsVers: number; base: number; impCalc: number; imp: number;
  accImp: number; saldoImp: number; giugno: number; novembre: number; oneri: number; netto: number; oneriPct: number; soglia: number; accantona: number;
}
export type Fisco = Record<number, FiscalYear>;
export interface F24Row extends F24 { stima: boolean; bollo?: boolean; }

export class Engine {
  readonly cfg: Config;
  private projCache: Projection[] | null = null;

  constructor(readonly s: Snapshot, readonly today: string) { this.cfg = s.cfg ?? DEFAULT_CFG; }

  /** Same data with contracts/missions modified (scenarios, "minimo garantito", simulator). */
  withData(mod: (contratti: Contract[], missioni: Snapshot["missioni"]) => void): Engine {
    const C = structuredClone(this.s.contratti), M = structuredClone(this.s.missioni);
    mod(C, M);
    return new Engine({ ...this.s, contratti: C, missioni: M }, this.today);
  }

  // ---------- config ----------
  years(): number[] { return Object.keys(this.cfg.params).map(Number).sort((a, b) => a - b); }
  P(y: number): YearParams { return this.cfg.params[String(y)] ?? this.cfg.params[String(this.years().slice(-1)[0])]!; }
  client(id: string): Client | undefined { return this.s.clients.find((c) => c.id === id); }
  accMeth(y: number) { return this.cfg.acconti?.[String(y)] ?? "storico"; }

  // ---------- invoices ----------
  gg(inv: Invoice): number { const c = this.client(inv.cliente); return c && c.gg != null && c.gg !== "" ? +c.gg : 30; }
  scadenza(inv: Invoice): string { return inv.data ? addDays(inv.data, this.gg(inv)) : ""; }
  dueDate(inv: Invoice): string {
    const t = this.client(inv.cliente)?.termine; if (!inv.data) return "";
    if (t?.giornoMese) return `${addMonths(ym(inv.data), 1)}-${pad(+t.giornoMese)}`;
    if (t?.fineMese) return addDays(lastDay(ym(inv.data)), +(t.giorni ?? 0) || 0);
    if (t?.giorni) return addDays(inv.data, +t.giorni);
    return this.scadenza(inv);
  }
  effDate(inv: Invoice): string { return inv.incasso || this.scadenza(inv); }
  fy(inv: Invoice): number | null { const d = this.effDate(inv); return d ? +d.slice(0, 4) : null; }
  emessa(inv: Invoice): boolean { return !inv.statoTracking || !!inv.emessaSdi || !!inv.incasso; }
  fase(inv: Invoice): string {
    if (inv.incasso) return "Incassata";
    if (!this.emessa(inv)) return inv.inviataCommercialista ? `Inviata a ${this.cfg.commercialista?.nome || "commercialista"}` : "Proforma";
    return this.today > this.dueDate(inv) ? "Scaduta" : "Da incassare";
  }
  stato(inv: Invoice): string {
    if (inv.incasso) return "Incassata";
    if (!this.emessa(inv)) return "Da incassare";
    return this.today > this.dueDate(inv) ? "Scaduta" : "Da incassare";
  }
  nextNumber(year: number): number { const ns = this.s.invoices.filter((v) => v.anno === year).map((v) => v.n || 0); return (ns.length ? Math.max(...ns) : 0) + 1; }

  // ---------- projections from contracts + missions ----------
  emissionDate(c: Contract, last: string, pEnd: string): string {
    const dic = this.cfg.emissione?.dicembre;
    let d: string;
    if (last.slice(5) === "12" && dic) d = `${last}-${pad(Math.min(28, +dic))}`;
    else d = c.regola?.n ? nthLastFriday(last, c.regola.n) : addDays(pEnd, +(c.offset ?? 0) || 0);
    return workday(d);
  }
  private covered(): Set<string> {
    const set = new Set<string>(); this.s.invoices.forEach((v) => (v.mesiCoperti ?? []).forEach((m) => set.add(`${v.cliente}|${m}`))); return set;
  }
  projections(): Projection[] {
    if (this.projCache) return this.projCache;
    const cov = this.covered(), nowM = ym(this.today), firstM = addMonths(nowM, -1), out: Projection[] = [];
    this.s.contratti.filter((c) => c.attivo !== false && c.dal && c.al && c.importo > 0).forEach((c) => {
      const step = Math.max(1, +(c.ogni ?? 1) || 1);
      for (let m = c.dal; m <= c.al; m = addMonths(m, step)) {
        const months: string[] = []; for (let i = 0; i < step; i++) { const mm = addMonths(m, i); if (mm <= c.al) months.push(mm); }
        const last = months[months.length - 1]!;
        if (last < firstM) continue;
        if (months.some((mm) => cov.has(`${c.cliente}|${mm}`))) continue;
        if (this.s.invoices.some((v) => v.cliente === c.cliente && !(v.mesiCoperti && v.mesiCoperti.length) && v.data && ym(v.data) === last)) continue;
        const pStart = `${months[0]}-01`, pEnd = lastDay(last);
        let gg = 0; const trasf: Projection["trasf"] = [];
        this.s.missioni.filter((x) => x.tipo !== "quota" && x.cliente === c.cliente && x.dal && x.al).forEach((x) => {
          const a = x.dal! > pStart ? x.dal! : pStart, b = x.al! < pEnd ? x.al! : pEnd;
          if (b >= a) { const n = daysBetween(a, b) + 1; gg += n; trasf.push({ dal: a, al: b, n, ipotesi: !!x.ipotesi }); }
        });
        const tariffa = +(c.tariffa ?? 0) || 0, comp = r2((+c.importo || 0) * months.length / step), ind = r2(gg * tariffa);
        const data = this.emissionDate(c, last, pEnd);
        const cl = this.client(c.cliente); const gp = cl && cl.gg != null && cl.gg !== "" ? +cl.gg : 30;
        const incasso = addDays(data, gp);
        out.push({ contratto: c.id, cliente: c.cliente, months, label: months.length > 1 ? `${mLabel(months[0]!)} – ${mLabel(last)}` : mLabel(months[0]!),
          data, incasso, anno: +incasso.slice(0, 4), comp, ind, gg, tariffa, trasf, bollo: 2, imponibile: r2(comp + ind + 2),
          ipotesi: !!c.ipotesi || trasf.some((t) => t.ipotesi) });
      }
    });
    // Annual quotas: days per year without dates, spread over periods not yet invoiced.
    this.s.missioni.filter((q) => q.tipo === "quota" && q.anno && (q.giorni ?? 0) > 0).forEach((q) => {
      const Y = String(q.anno);
      const per = out.filter((x) => x.cliente === q.cliente && x.months.some((m) => m.startsWith(Y)));
      const invoiced = this.s.invoices.filter((v) => v.cliente === q.cliente && (v.data || "").startsWith(Y))
        .reduce((a, v) => a + (v.righe ?? []).filter((r) => r.tipo === "trasferta").reduce((b, r) => b + (+(r.qta ?? 0) || 0), 0), 0);
      const dated = per.reduce((a, x) => a + x.trasf.filter((t) => t.dal.startsWith(Y)).reduce((b, t) => b + t.n, 0), 0);
      const rem = Math.max(0, (q.giorni ?? 0) - invoiced - dated);
      const w = per.map((x) => x.months.filter((m) => m.startsWith(Y)).length), W = w.reduce((a, b) => a + b, 0);
      if (!W || !rem) return;
      let given = 0, acc = 0;
      per.forEach((x, i) => {
        acc += rem * w[i]! / W; const n = Math.round(acc) - given; given += n; if (n <= 0) return;
        x.gg += n; x.ind = r2(x.ind + n * x.tariffa); x.imponibile = r2(x.comp + x.ind + x.bollo); x.ipotesi = true; x.quota = (x.quota ?? 0) + n;
        x.trasf.push({ dal: `${x.months[0]}-01`, al: lastDay(x.months[x.months.length - 1]!), n, ipotesi: true, quota: true });
      });
    });
    this.projCache = out.sort((a, b) => (a.data < b.data ? -1 : 1));
    return this.projCache;
  }

  // ---------- reminders (manual + automatic from contracts) ----------
  reminders(): Reminder[] {
    const out: Reminder[] = this.s.promemoria.map((x) => ({ ...x, auto: false }));
    this.s.contratti.filter((c) => !c.ipotesi && c.attivo !== false && c.al).forEach((c) => {
      const end = lastDay(c.al); if (end < this.today) return;
      const succ = this.s.contratti.some((k) => k.id !== c.id && k.cliente === c.cliente && !k.ipotesi && k.dal > c.al);
      if (succ) return;
      const cl = this.client(c.cliente) ?? { nome: c.cliente };
      out.push({ id: `auto-${c.id}`, auto: true, data: end, preavviso: 45, cliente: c.cliente, titolo: `Contratto ${cl.nome} in scadenza`,
        dettaglio: `Scade il ${dmy(end)} e non c'è ancora un rinnovo firmato. ${c.note || ""}`, fatto: false });
    });
    return out.sort((a, b) => (a.data < b.data ? -1 : 1));
  }
  remDue(r: Reminder): boolean { return !r.fatto && addDays(r.data, -(+(r.preavviso ?? 0) || 14)) <= this.today; }

  // ---------- annual fiscal engine ----------
  fisco(): Fisco {
    const p1 = this.fiscoCore(null);
    return Object.values(this.cfg.acconti ?? {}).some((v) => v === "previsionale") ? this.fiscoCore(p1) : p1;
  }
  /** Only invoices, signed contracts and dated missions that are not hypotheses. */
  fiscoMin(): Fisco {
    return this.withData((C, M) => {
      C.splice(0, C.length, ...C.filter((c) => !c.ipotesi));
      M.splice(0, M.length, ...M.filter((x) => x.tipo !== "quota" && !x.ipotesi));
    }).fisco();
  }
  private fiscoCore(p1: Fisco | null): Fisco {
    const ys = this.years(), out: Fisco = {}; const PROJ = this.projections();
    const soglie = this.cfg.soglie, F = this.cfg.fisco ?? {};
    const ov = (y: number, k: string): number | null => { const o = F[String(y)] as Record<string, unknown> | undefined; return o && o[k] != null && o[k] !== "" ? +(o[k] as number) : null; };
    ys.forEach((y, i) => {
      const p = this.P(y), prev = i ? out[ys[i - 1]!] : undefined;
      let inc = 0, att = 0, contr = 0;
      this.s.invoices.forEach((v) => { if (this.fy(v) !== y) return; const t = tot(v).imponibile; if (v.incasso) inc += t; else att += t; });
      PROJ.forEach((x) => { if (x.anno === y) contr += x.imponibile; });
      const stima = ov(y, "stima") || 0, ric = inc + att + contr + stima, red = ric * p.coef;
      const inpsCalc = red * p.inps, inps = ov(y, "inps") ?? inpsCalc;
      const prv = p1 && this.accMeth(y) === "previsionale" ? p1[y] : undefined;
      const accInps = ov(y, "accontiInps") ?? (prv ? prv.inpsCalc * 0.8 : prev && prev.inps > 0 ? prev.inps * 0.8 : 0);
      const saldoInps = inps - accInps;
      const inpsVers = ov(y, "inpsVersati") ?? ((prev ? prev.saldoInps : 0) + accInps);
      const base = Math.max(0, red - Math.max(0, inpsVers)), impCalc = base * p.imp, imp = ov(y, "imposta") ?? impCalc;
      const accImp = ov(y, "accontiImp") ?? (prv ? (prv.impCalc > 51.65 ? prv.impCalc : 0) : prev && prev.imp > 51.65 ? prev.imp : 0);
      const saldoImp = imp - accImp;
      const nx = p1 && this.accMeth(y + 1) === "previsionale" && p1[y + 1] ? { i: p1[y + 1]!.impCalc, n: p1[y + 1]!.inpsCalc } : { i: imp, n: inps };
      const giugno = Math.max(0, saldoImp) + Math.max(0, saldoInps) + (nx.i > 257.52 ? nx.i * 0.4 : 0) + nx.n * 0.4;
      const novembre = (nx.i <= 51.65 ? 0 : nx.i <= 257.52 ? nx.i : nx.i * 0.6) + nx.n * 0.4;
      const oneri = inps + imp;
      out[y] = { y, p, inc, att, contr, stima, ric, red, inpsCalc, inps, accInps, saldoInps, inpsVers, base, impCalc, imp, accImp, saldoImp, giugno, novembre, oneri,
        netto: ric - oneri, oneriPct: ric ? oneri / ric : p.coef * p.inps + p.coef * (1 - p.inps) * p.imp, soglia: ric / soglie.s85,
        accantona: Math.ceil(oneri * (1 + p.margine)) };
    });
    return out;
  }
  oneriInv(inv: Invoice, FX: Fisco) {
    const y = this.fy(inv)!, f = FX[y], t = tot(inv).imponibile, p = this.P(y);
    const pc = f ? f.oneriPct : p.coef * p.inps + p.coef * (1 - p.inps) * p.imp; const o = t * pc;
    return { oneri: o, netto: t - o, accantona: Math.ceil(o * (1 + p.margine)) };
  }

  /** Dashboard figures for a year: collected invoices with their pro-rata charges (same as the artifact). */
  yearSummary(y: number, FX: Fisco) {
    const inYear = this.s.invoices.filter((v) => this.fy(v) === y), paid = inYear.filter((v) => v.incasso), open = inYear.filter((v) => !v.incasso);
    let incassato = 0, netto = 0, oneri = 0, accant = 0;
    paid.forEach((v) => { const t = tot(v).imponibile, o = this.oneriInv(v, FX); incassato += t; netto += o.netto; oneri += o.oneri; accant += o.accantona; });
    const cy = +this.today.slice(0, 4), m = +this.today.slice(5, 7);
    const mesiTrasc = y < cy ? 12 : y > cy ? 1 : m;
    return { inYear, paid, open, incassato, netto, oneri, accant, mesiTrasc, daIncassare: open.reduce((a, v) => a + tot(v).imponibile, 0) };
  }

  // ---------- F24 schedule (real + estimated + e-invoice stamp duty) ----------
  bolloRows(): F24Row[] {
    const q: Record<string, number> = {};
    this.s.invoices.filter((v) => this.emessa(v) && (+(v.bollo ?? 0) || 0) > 0).forEach((v) => {
      const d = v.emessaSdi || v.data; const y = +d.slice(0, 4), qq = Math.floor((+d.slice(5, 7) - 1) / 3) + 1; const k = `${y}-${qq}`;
      q[k] = (q[k] ?? 0) + (+(v.bollo ?? 0) || 0);
    });
    this.projections().forEach((x) => { const d = x.data; const y = +d.slice(0, 4), qq = Math.floor((+d.slice(5, 7) - 1) / 3) + 1; const k = `${y}-${qq}`; q[`${k}p`] = (q[`${k}p`] ?? 0) + 2; });
    const out: F24Row[] = [];
    const yrs = [...new Set(Object.keys(q).map((k) => +k.slice(0, 4)))];
    yrs.forEach((y) => {
      const g = (n: number) => (q[`${y}-${n}`] ?? 0) + (q[`${y}-${n}p`] ?? 0), est = (n: number) => (q[`${y}-${n}p`] ?? 0) > 0;
      const q1 = g(1), q2 = g(2), q3 = g(3), q4 = g(4);
      const pushRow = (d0: string, desc: string, trib: string, imp: number, e: boolean) => {
        const d = nextWork(d0);
        if (imp > 0 && d >= this.today) out.push({ id: `bollo-${d}`, data: d, descrizione: desc + (e ? " (stima)" : ""), tributi: trib, importo: r2(imp), versato: false, stima: true, bollo: true });
      };
      if (q1 + q2 <= 5000) pushRow(`${y}-11-30`, `Bollo fatture elettroniche ${y}: I, II e III trimestre`, "2521, 2522, 2523", q1 + q2 + q3, est(1) || est(2) || est(3));
      else { pushRow(`${y}-05-31`, `Bollo I trim. ${y}`, "2521", q1, est(1)); pushRow(`${y}-09-30`, `Bollo II trim. ${y}`, "2522", q2, est(2)); pushRow(`${y}-11-30`, `Bollo III trim. ${y}`, "2523", q3, est(3)); }
      const feb = new Date(y + 1, 2, 0).getDate(); pushRow(`${y + 1}-02-${pad(feb)}`, `Bollo fatture elettroniche IV trimestre ${y}`, "2524", q4, est(4));
    });
    return out;
  }
  f24Rows(FX: Fisco): F24Row[] {
    const rows: F24Row[] = this.s.f24.map((r) => ({ ...r, stima: false }));
    this.years().forEach((y) => {
      const f = FX[y]; if (!f) return;
      ([[`${y + 1}-06-30`, `Saldo ${y} + I acconto ${y + 1}`, f.giugno], [`${y + 1}-11-30`, `II acconto ${y + 1}`, f.novembre]] as const).forEach(([d, desc, imp]) => {
        if (d < this.today) return;
        const real = this.s.f24.some((r) => r.data && r.data.slice(0, 7) === d.slice(0, 7));
        if (!real && imp > 1 && f.ric > 0) rows.push({ id: `est-${d}`, data: d, descrizione: `${desc} (stima)`, tributi: d.slice(5, 7) === "06" ? "1792, 1790, PXXR" : "1790, PXXR", importo: r2(imp), versato: false, stima: true });
      });
    });
    this.bolloRows().forEach((b) => { if (!this.s.f24.some((r) => r.data && r.data.slice(0, 7) === b.data.slice(0, 7) && /252[1-4]/.test(r.tributi || ""))) rows.push(b); });
    return rows.sort((a, b) => (a.data < b.data ? -1 : 1));
  }
  nextF24(FX: Fisco): F24Row | undefined { return this.f24Rows(FX).find((r) => !r.versato && r.data >= this.today); }

  // ---------- compliance checks ----------
  compliance() {
    const out: { k: string; lvl: "warn" | "info"; t: string; d: string; noAck?: 1; date?: string }[] = [];
    const ack = new Set(this.cfg.ack ?? []); const today = this.today; const cy = +today.slice(0, 4);
    const eur0 = (v: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" } as unknown as Intl.NumberFormatOptions).format(+v || 0);
    const byY: Record<string, number[]> = {};
    this.s.invoices.forEach((v) => { if (v.anno) (byY[v.anno] = byY[v.anno] ?? []).push(+v.n); });
    Object.entries(byY).forEach(([y, ns]) => {
      ns.sort((a, b) => a - b); const max = ns[ns.length - 1]!; const miss: number[] = []; for (let i = 1; i <= max; i++) if (!ns.includes(i)) miss.push(i);
      const dup = [...new Set(ns.filter((n, i) => ns.indexOf(n) !== i))];
      if (miss.length) out.push({ k: `num-${y}-${miss.join(".")}`, lvl: "warn", t: `Numerazione ${y}: mancano i numeri ${miss.join(", ")}`, d: "Le fatture devono avere numeri progressivi senza salti. Se una fattura è stata annullata serve una nota di credito, non la cancellazione." });
      if (dup.length) out.push({ k: `dup-${y}-${dup.join(".")}`, lvl: "warn", t: `Numerazione ${y}: numeri ripetuti ${dup.join(", ")}`, d: "Due fatture con lo stesso numero nello stesso anno: correggi quella sbagliata." });
    });
    const comm = this.cfg.commercialista?.nome || "la commercialista";
    this.s.invoices.forEach((v) => {
      const c = this.client(v.cliente) ?? ({} as Client); const t = tot(v);
      if (c.estero) out.push({ k: `est-${v.id}`, lvl: "warn", t: `Fattura estera ${v.num} (${c.nome}): tre verifiche`, d: "1) È stata comunicata allo SdI con codice destinatario XXXXXXX? 2) L'importo realmente accreditato in euro coincide con la fattura? Con il principio di cassa conta l'incasso effettivo: se diverso, correggi l'importo nell'app. 3) La marca da bollo da 2 € è stata applicata (anche cartacea)?" });
      else if (v.emessaSdi && v.data) { const dd = daysBetween(v.data, v.emessaSdi); if (dd > 12) out.push({ k: `sdi-${v.id}`, lvl: "info", t: `Fattura ${v.num} inviata allo SdI ${dd} giorni dopo la data`, d: `Datata ${dmy(v.data)}, inviata il ${dmy(v.emessaSdi)}; il termine è di 12 giorni. Possibile sanzione, riducibile con il ravvedimento operoso: verifica con ${comm} se è già stata gestita.` }); }
      else if (v.statoTracking && !this.emessa(v) && v.data) { const lim = addDays(v.data, 12), dd = daysBetween(today, lim); if (dd <= 5) out.push({ k: `due-${v.id}`, noAck: 1, lvl: "warn", date: lim, t: `Fattura ${v.num}: va inviata allo SdI entro il ${dmy(lim)}`, d: dd < 0 ? `Termine superato da ${-dd} giorni: chiedi l'invio subito.` : `Mancano ${dd} giorni.` }); }
      if (!c.estero && t.comp + t.ind + t.rimb > 77.47 && !(+(v.bollo ?? 0))) out.push({ k: `bollo-${v.id}`, lvl: "warn", t: `Fattura ${v.num} senza marca da bollo`, d: "Sopra 77,47 € la fattura forfettaria richiede il bollo da 2 €." });
    });
    const inc = this.s.invoices.filter((v) => v.incasso && v.incasso.startsWith(String(cy))).reduce((a, v) => a + tot(v).imponibile, 0);
    if (inc > 100000) out.push({ k: `s100-${cy}`, noAck: 1, lvl: "warn", t: `Incassi ${cy} oltre 100.000 €`, d: "Esci dal forfettario già da quest'anno: l'IVA si applica dall'operazione che ha fatto superare la soglia. Contatta subito la commercialista." });
    else if (inc > 85000) out.push({ k: `s85-${cy}`, noAck: 1, lvl: "warn", t: `Incassi ${cy} oltre 85.000 €`, d: "Dal prossimo anno esci dal regime forfettario." });
    [cy - 1, cy].forEach((y) => {
      const dip = this.s.redditi.filter((r) => (r.data || "").startsWith(String(y)) && (r.tipo === "amministratore" || r.tipo === "dipendente")).reduce((a, r) => a + (+r.importo || 0), 0);
      if (dip > 30000) out.push({ k: `dip-${y}`, noAck: 1, lvl: "warn", t: `Redditi da lavoro dipendente o assimilato ${y} oltre 30.000 €`, d: `${eur0(dip)}: è una causa di esclusione dal forfettario per l'anno dopo (compensi da amministratore compresi). Verifica con la commercialista.` });
    });
    return out.filter((x) => x.noAck || !ack.has(x.k)).sort((a, b) => (a.lvl === "warn" ? 0 : 1) - (b.lvl === "warn" ? 0 : 1));
  }

  // ---------- personal finance ----------
  static readonly STRAORD = new Set(["Casa e lavori"]);
  speseStats() {
    const L = [...this.s.spese].sort((a, b) => (a.mese < b.mese ? -1 : 1)); if (!L.length) return null;
    const totc: Record<string, number> = {}; L.forEach((m) => Object.entries(m.cat ?? {}).forEach(([k, v]) => { totc[k] = (totc[k] ?? 0) + (+v || 0); }));
    const rec = L.map((m) => Object.entries(m.cat ?? {}).filter(([k]) => !Engine.STRAORD.has(k)).reduce((a, [, v]) => a + (+v || 0), 0));
    const stra = L.map((m) => Object.entries(m.cat ?? {}).filter(([k]) => Engine.STRAORD.has(k)).reduce((a, [, v]) => a + (+v || 0), 0));
    const n = L.length;
    return { L, tot: totc, rec, stra, n, avgRec: rec.reduce((a, b) => a + b, 0) / n, straTot: stra.reduce((a, b) => a + b, 0), avgInv: L.reduce((a, m) => a + (+(m.investito ?? 0) || 0), 0) / n };
  }
  rispCalc() {
    const L = this.s.risparmi.filter((c) => c.ruolo !== "tasse").map((c) => ({ ...c })).sort((a, b) => (a.ordine ?? 9) - (b.ordine ?? 9)) as (SavingsAccount & { netto: number; reale: number })[];
    if (!L.length) return null;
    L.forEach((c) => { c.netto = (+(c.tassoLordo ?? 0) || 0) - (+(c.costi ?? 0) || 0); c.reale = c.netto * (1 - (c.aliquota ?? 26) / 100) - (+(c.bollo ?? 0) || 0); });
    const totS = L.reduce((s, c) => s + (+c.saldo || 0), 0), gain = L.reduce((s, c) => s + (+(c.guadagno ?? 0) || 0), 0), mens = L.reduce((s, c) => s + (+(c.versamento?.importo ?? 0) || 0), 0);
    const w = (v: (c: (typeof L)[number]) => number) => (totS ? L.reduce((s, c) => s + v(c) * (+c.saldo || 0), 0) / totS : 0);
    const st = this.speseStats(); const avg = st ? st.avgRec : 0;
    return { L, tot: totS, gain, mens, netto: w((c) => c.netto), reale: w((c) => c.reale), lordo: w((c) => +(c.tassoLordo ?? 0) || 0), avg, mesi: avg ? totS / avg : 0 };
  }
  static rispFV(P: number, pmt: number, ann: number, m: number): number { const i = Math.pow(1 + ann / 100, 1 / 12) - 1; return P * Math.pow(1 + i, m) + pmt * (i ? (Math.pow(1 + i, m) - 1) / i : m); }

  invCalc(a: InvestmentAccount | undefined) {
    if (!a || !a.titoli || !a.titoli.length) return null;
    const T = a.titoli.map((t) => ({ ...t, valore: r2((+t.quote || 0) * (+t.prezzoEur || 0)) })) as (Holding & { valore: number; peso: number; drift: number; pl: number })[];
    const totV = T.reduce((s, t) => s + t.valore, 0) || 1, costo = T.reduce((s, t) => s + (+t.costo || 0), 0);
    T.forEach((t) => { t.peso = t.valore / totV; t.drift = t.peso * 100 - (+t.target || 0); t.pl = t.valore - (+t.costo || 0); });
    const p = a.pac ?? {}; const fine = addMonthsD(p.inizio || this.today, (+(p.anni ?? 20) || 20) * 12); const today = this.today;
    let n = 0; { let d = today.slice(0, 8) + pad(+(p.giorno ?? 1) || 1); if (d <= today) d = addMonthsD(d, 1); while (d <= fine) { n++; d = addMonthsD(d, 1); } }
    const mesiTot = (+(p.anni ?? 20) || 20) * 12, trasc = Math.max(0, mesiTot - n);
    const netDep = (+(a.depositi ?? 0) || 0) - (+(a.prelievi ?? 0) || 0); const rev = addMonthsD(p.ultimaRevisione || today, +(p.revisioneMesi ?? 6) || 6);
    const maxD = T.reduce((m, t) => (Math.abs(t.drift) > Math.abs(m.drift) ? t : m), T[0]!);
    return { T, tot: totV, costo, pl: totV - costo, netDep, fine, n, mesiTot, trasc, rev, maxD, anniRes: n / 12, pac: +(p.importo ?? 0) || 0, soglia: +(p.soglia ?? 5) || 5, p };
  }
  static invProj(c: { tot: number; pac: number }, r: number) { const i = Math.pow(1 + r, 1 / 12) - 1; return (k: number) => c.tot * Math.pow(1 + i, k) + c.pac * (i ? (Math.pow(1 + i, k) - 1) / i : k); }
  mainInvestment() { return this.invCalc(this.s.investimenti.find((x) => x.id === "trading212") ?? this.s.investimenti[0]); }

  ctInfo() {
    const r = this.s.risparmi.find((x) => x.ruolo === "tasse");
    if (r) { const v = r.versamento ?? {}; return { saldo: +r.saldo || 0, data: r.aggiornato, mens: +(v.importo ?? 0) || 0, giorno: +(v.giorno ?? 1) || 1, dal: r.copreDal || "", linked: r as SavingsAccount | undefined }; }
    const c = this.cfg.contoTasse ?? {}; return c.saldo != null ? { saldo: +c.saldo, data: c.data, mens: 0, giorno: 1, dal: "", linked: undefined } : null;
  }
  ctPlan(FX: Fisco, days = 400) {
    const ct = this.ctInfo(); if (!ct) return null; const today = this.today, lim = addDays(today, days);
    const all = this.f24Rows(FX).filter((r) => !r.versato && r.data >= today && r.data <= lim);
    const pre = all.filter((r) => ct.dal && r.data < ct.dal), f = all.filter((r) => !ct.dal || r.data >= ct.dal);
    let bal = ct.saldo, min = Infinity, minD: string | null = null, need = 0;
    let first: { d: string; v: number; t: string } | null = null;
    const dep: string[] = []; { let d = today.slice(0, 8) + pad(Math.min(28, ct.giorno)); if (d <= today) d = addMonthsD(d, 1); while (d <= lim) { dep.push(d); d = addMonthsD(d, 1); } }
    const ev = [...dep.map((d) => ({ d, v: ct.mens, t: "dep", r: null as F24Row | null })), ...f.map((r) => ({ d: r.data, v: -r.importo, t: "f24", r }))]
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.t === "dep" ? -1 : 1));
    const pts: { d: string; bal: number; imp: number; desc: string }[] = []; let cumF = 0;
    ev.forEach((e) => {
      bal += e.v;
      if (e.t === "f24") {
        cumF += -e.v; const nDep = dep.filter((d) => d <= e.d).length;
        if (nDep) need = Math.max(need, (cumF - ct.saldo) / nDep); else if (cumF > ct.saldo) need = Infinity;
        pts.push({ d: e.d, bal, imp: -e.v, desc: e.r!.descrizione });
        if (bal < min) { min = bal; minD = e.d; }
        if (bal < 0 && !first) first = e;
      }
    });
    return { ct, f, pre, pts, min, minD, first: first as { d: string; v: number; t: string } | null, need, dep, tot: f.reduce((a, r) => a + r.importo, 0) };
  }

  // ---------- cash windows (current month counted in full) ----------
  months12(): string[] { const [y, m] = this.today.split("-").map(Number); const out: string[] = []; for (let i = 0; i < 12; i++) { const x = new Date(y!, m! - 1 + i, 1); out.push(`${x.getFullYear()}-${pad(x.getMonth() + 1)}`); } return out; }
  invInM(v: Invoice, m: string): boolean { const cur = this.today.slice(0, 7); return v.incasso ? m === cur && v.incasso.slice(0, 7) === m : this.effDate(v).slice(0, 7) === m; }
  f24InM(r: F24Row, m: string): boolean { const cur = this.today.slice(0, 7); return r.versato ? m === cur && r.data.slice(0, 7) === m : r.data.slice(0, 7) === m; }
  cash12(FX: Fisco) {
    const PRa = this.projections(), fr = this.f24Rows(FX), m12 = this.months12();
    const inTot = m12.reduce((a, m) => a + this.s.invoices.filter((v) => this.invInM(v, m)).reduce((b, v) => b + tot(v).documento, 0) + PRa.filter((x) => x.incasso.slice(0, 7) === m).reduce((b, x) => b + x.imponibile, 0), 0);
    const outTot = m12.reduce((a, m) => a + fr.filter((r) => this.f24InM(r, m)).reduce((b, r) => b + r.importo, 0), 0);
    return { inTot, outTot };
  }
  flow12(FX: Fisco) {
    const PRa = this.projections(), fr = this.f24Rows(FX), st = this.speseStats(), R = this.rispCalc(), inv = this.mainInvestment();
    const sp = st ? st.avgRec : 0, pac = inv ? inv.pac : 0, rm = R ? R.mens : 0;
    const rows = this.months12().map((m) => {
      const opn = this.s.invoices.filter((v) => this.invInM(v, m)), pr = PRa.filter((x) => x.incasso.slice(0, 7) === m);
      const firm = opn.reduce((a, v) => a + tot(v).documento, 0) + pr.filter((x) => !x.ipotesi).reduce((a, x) => a + x.imponibile, 0);
      const ipo = pr.filter((x) => x.ipotesi).reduce((a, x) => a + x.imponibile, 0);
      const f24 = fr.filter((r) => this.f24InM(r, m)).reduce((a, r) => a + r.importo, 0);
      const done = opn.filter((v) => v.incasso).reduce((a, v) => a + tot(v).documento, 0);
      const src: Record<string, number> = {};
      opn.forEach((v) => { src[v.cliente] = (src[v.cliente] ?? 0) + tot(v).documento; });
      pr.forEach((x) => { src[x.cliente] = (src[x.cliente] ?? 0) + x.imponibile; });
      return { m, firm, ipo, done, in: firm + ipo, f24, sp, pac, rm, src, saldo: firm + ipo - f24 - sp - pac - rm, cum: 0 };
    });
    let c = 0; rows.forEach((r) => { c += r.saldo; r.cum = c; });
    const T = (k: "in" | "firm" | "ipo" | "f24" | "saldo") => rows.reduce((a, r) => a + r[k], 0);
    return { rows, sp, pac, rm, tin: T("in"), tfirm: T("firm"), tipo: T("ipo"), tf24: T("f24"), tsal: T("saldo") };
  }
}

export { isHoliday };
