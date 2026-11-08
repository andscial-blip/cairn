// @ts-nocheck
/* eslint-disable */
// Source of the views, forms and actions (originally extracted from the single-file app; maintained here since v2).
// The pre-redesign copy is frozen in tests/fixtures/legacy-original.ts: tests use it to prove calculations are unchanged.
// Rendering, forms, sheets and actions are the original code, extracted verbatim. What is injected instead:
//  - engine calls → src/domain/engine.ts (verified equal on real data), following scenario edits of S;
//  - S.db → the write bridge (src/legacy/bridge.ts) on the offline outbox;
//  - files: downloads/uploads → browser download and Supabase Storage; ids → UUIDs;
//  - excluded: Google Calendar sync (replaced by the ICS feed) and the Excel v3 template (contains personal data).
import { tot, DEFAULT_CFG as ENGINE_DEFAULT_CFG } from "@/domain/engine";
import type { Engine } from "@/domain/engine";
import { applyPositions } from "@/lib/t212";
import { addSnapshot, snapshotOf, dietz, xirr, pacFlows, splitContribution, idleCash, thin, addSavingsPoint, savingsYield, rebalanceCheck } from "@/lib/invest";
import { accountFromHistory, historyCovers, pacCheck, taxByYear, yearEndValues } from "@/lib/t212-history";
import { parseUniCredit, parseRevolutPdf, parseRevolutCsv, detect, statementPeriod, categorize, merchantKey, aggregate, planMonths, CATEGORIES, EXCLUDED } from "@/lib/bank-import";
import { loadPdfLib, pdfToRows } from "@/lib/pdf-text";
import { matchInvoice } from "@/lib/einvoice-pdf";
export type LegacyApp = Record<"vHome" | "vInv" | "vPrev" | "vContr" | "vMis" | "vF24" | "vTasse" | "vFisco" | "compliancePanel" | "redditiPanel" | "vEntrate" | "vSpese" | "vInvest" | "vRisp" | "vAnal" | "vSet" | "bindView" | "openForm" | "toast" | "autoT212" | "inboxAttach" | "closeSheet" | "escClose" | "openDetail" | "calItems" | "_fisco", (...a: any[]) => any>;
export interface LegacyEnv {
  S: any; engine: () => Engine; render: () => void; setView: (v: string) => void;
  downloads: { save: (o: { filename: string; data: unknown }) => Promise<unknown> } | null;
  assetsCap: { upload: (f: File) => Promise<{ id: string; url: string }> } | null;
  unavailable: (what: string) => void;
  v3Template: () => Promise<string | null>;
  /** Trading 212 read-only sync (server route); absent in tests. */
  t212?: (o?: { history?: boolean }) => Promise<{ status: number; body: any }>;
  /** E-invoice files from the Gmail inbox that could not be matched automatically (see legacy-runtime processInbox). */
  inbox?: { attach: (rowId: string, invoiceId: string) => Promise<boolean>; ignore: (rowId: string) => Promise<boolean> };
  /** A private attachment (cairn-att:<path>) as a Blob, for "Scarica". */
  attachmentBlob?: (url: string) => Promise<Blob | null>;
}
export function createLegacy(env: LegacyEnv): LegacyApp {
const S = env.S;
const cfg = () => S.cfg;
const todayISO = () => env.engine().today;
const uid = () => crypto.randomUUID();
const render = () => env.render();
const setView = (v) => env.setView(v);
const DEFAULT_CFG = ENGINE_DEFAULT_CFG;
let downloads = env.downloads, assetsCap = env.assetsCap;
const syncCalendar = async () => env.unavailable("calendar");
// Excel v3: the template holds personal figures, so it lives in the private Storage area and is fetched on use.
let V3_B64 = null;
const exportV3 = async (...a) => { try { V3_B64 = await env.v3Template(); } catch (e) { V3_B64 = null; } if (!V3_B64) { env.unavailable("v3"); return; } return exportV3_orig(...a); };
const exportCairn = async () => env.unavailable("exportCairn");
// The original looked up the PAC account by its old readable id; in Cairn ids are UUIDs: match the account marked t212.
// Same for clients referenced by their old readable code.
const isClientCode = (id, code) => id === code || ((S.clients || []).find((c) => c.id === id) || {}).codice === code;
const isMainInv = (x, i, arr) => x.id === "trading212" || x.logo === "t212" || (i === 0 && !arr.some((y) => y.id === "trading212" || y.logo === "t212"));
// The engine follows S: when the original code swaps S.contratti/S.missioni (scenarios, simulator) or a write
// updates S optimistically, calculations run on a derived engine built from S.
const COLLS = ["invoices","clients","f24","contratti","missioni","promemoria","redditi","spese","risparmi","investimenti"];
let _ce = null, _key = null;
const curE = () => {
  const E = env.engine();
  if (COLLS.every((c) => S[c] === E.s[c]) && S.cfg === E.s.cfg) return E;
  const key = [E, ...COLLS.map((c) => S[c]), S.cfg];
  if (!_ce || !_key || key.some((x, i) => x !== _key[i])) { _key = key; const C = E.constructor; _ce = new C({ ...E.s, ...Object.fromEntries(COLLS.map((c) => [c, S[c]])), cfg: S.cfg }, E.today); }
  return _ce;
};
const projections=(...a)=>curE().projections(...a);
const fy=(...a)=>curE().fy(...a);
const fiscoMin=(...a)=>curE().fiscoMin(...a);
const oneriInv=(...a)=>curE().oneriInv(...a);
const nextF24=(...a)=>curE().nextF24(...a);
const reminders=(...a)=>curE().reminders(...a);
const remDue=(...a)=>curE().remDue(...a);
const stato=(...a)=>curE().stato(...a);
const f24Rows=(...a)=>curE().f24Rows(...a);
const emessa=(...a)=>curE().emessa(...a);
const compliance=(...a)=>curE().compliance(...a);
const ctInfo=(...a)=>curE().ctInfo(...a);
const ctPlan=(...a)=>curE().ctPlan(...a);
const effDate=(...a)=>curE().effDate(...a);
const fase=(...a)=>curE().fase(...a);
const scadenza=(...a)=>curE().scadenza(...a);
const nextNumber=(...a)=>curE().nextNumber(...a);
const speseStats=(...a)=>curE().speseStats(...a);
const cash12=(...a)=>curE().cash12(...a);
const invCalc=(...a)=>curE().invCalc(...a);
const rispCalc=(...a)=>curE().rispCalc(...a);
const flow12=(...a)=>curE().flow12(...a);
const flowYear=(...a)=>curE().flowYear(...a);const cashYear=(...a)=>curE().cashYear(...a);
const fisco=(...a)=>curE().fisco(...a);
const gg=(...a)=>curE().gg(...a);
const invInM=(...a)=>curE().invInM(...a);
const f24InM=(...a)=>curE().f24InM(...a);
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const EUR=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",useGrouping:"always"});
const EUR0=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",maximumFractionDigits:0,useGrouping:"always"});
const eur=v=>EUR.format(+v||0), eur0=v=>EUR0.format(+v||0);
const pct=(v,d=1)=>((+v||0)*100).toLocaleString("it-IT",{minimumFractionDigits:d,maximumFractionDigits:d})+"%";
const MESI=["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const MESI_L=["GENNAIO","FEBBRAIO","MARZO","APRILE","MAGGIO","GIUGNO","LUGLIO","AGOSTO","SETTEMBRE","OTTOBRE","NOVEMBRE","DICEMBRE"];
const pad=n=>String(n).padStart(2,"0");
const parse=s=>{if(!s)return null;const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const addDays=(s,n)=>{const d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const dmy=s=>{if(!s)return"";const [y,m,d]=s.split("-");return d+"/"+m+"/"+y};
const dmyShort=s=>{if(!s)return"";const [y,m,d]=s.split("-");return d+"/"+m+"/"+y.slice(2)};
const daysBetween=(a,b)=>Math.round((parse(b)-parse(a))/864e5);
const r2=v=>Math.round((+v||0)*100)/100;
const ICONS={
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 home:'<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
 file:'<path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
 brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3"/><path d="M3 13h18"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 8.6 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14.2H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 8.6a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9c.2.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
 alert:'<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
 euro:'<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10h9M4 14h9"/>',
 inbox:'<path d="M12 3v11M8 10l4 4 4-4"/><path d="M4 14v6h16v-6"/>',
 down:'<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
 check:'<path d="M4 12l5 5L20 6"/>',
 pct:'<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 pen:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
 sync:'<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 12A9 9 0 0 1 18.5 5.7L21 8"/><path d="M3 21v-5h5M21 3v5h-5"/>',
 piggy:'<path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1-1 3h-3v-2H9v2H6l-1-3a4 4 0 0 1 0-3z"/><path d="M15 9h.01"/>',
 safe:'<rect x="3" y="4" width="18" height="15" rx="2"/><circle cx="12" cy="11.5" r="3.5"/><path d="M12 8v1M12 14v1M7 19v2M17 19v2"/>',
 trend:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 stamp:'<path d="M9 3h6l-1 7h3l1 5H6l1-5h3z"/><path d="M5 20h14"/>'
};
const ico=(n,sz=16)=>ICONS[n]?`<svg class="ic" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`:"";
const DOTICON={"!":"alert","€":"euro","↧":"inbox","⇩":"down","✓":"check","%":"pct","⏰":"clock","✎":"pen","✉":"mail","📅":"cal","€$":"piggy","§":"stamp","➤":"send","📎":"file"};
const years=()=>Object.keys(cfg().params).map(Number).sort((a,b)=>a-b);
const P=y=>cfg().params[String(y)]||cfg().params[String(years().slice(-1)[0])];
const clientById=id=>S.clients.find(c=>c.id===id);
/** Client mark before its name: the logo uploaded in Impostazioni → Clienti, or the initials. */
const clg=(id,big)=>{const c=typeof id==="object"?id:clientById(id);const n=c?c.nome:String(id||"");
  if(c&&c.logo&&/^data:image\/(png|webp|jpeg);base64,/.test(c.logo))return `<img class="clg${big?" big":""}" src="${c.logo}" alt="" aria-hidden="true">`;
  const ini=n.replace(/[^A-Za-zÀ-ÿ ]/g," ").split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join("")||"?";
  return `<span class="clg mono${big?" big":""}" aria-hidden="true">${esc(ini)}</span>`};
/** Logo and client name together, on one line (tables and cards). */
const cliw=(id,name,big)=>`<span class="cliw">${clg(id,big)}<span>${esc(name)}</span></span>`;
const ym=d=>d.slice(0,7);
const addMonths=(m,n)=>{const [y,mm]=m.split("-").map(Number);const d=new Date(y,mm-1+n,1);return d.getFullYear()+"-"+pad(d.getMonth()+1)};
const mLabel=m=>{const [y,mm]=m.split("-").map(Number);return MESI[mm-1].toLowerCase()+" "+y};
const GIORNI=["domenica","lunedì","martedì","mercoledì","giovedì","venerdì","sabato"];
const dayName=s=>GIORNI[parse(s).getDay()];
const regolaTxt=c=>c.regola&&c.regola.n?(c.regola.n===1?"ultimo venerdì":"penultimo venerdì")+" del mese"+((cfg().emissione||{}).dicembre?` · dicembre: il ${(cfg().emissione||{}).dicembre}`:""):(+c.offset||0)===0?"a fine periodo":(c.offset>0?c.offset+" gg dopo fine periodo":(-c.offset)+" gg prima di fine periodo");
const accMeth=y=>((cfg().acconti||{})[String(y)])||"storico";
function fiscoCore(p1){
  const ys=years(), out={}; const PROJ=projections();
  const soglie=cfg().soglie, F=cfg().fisco||{};
  const ov=(y,k)=>{const o=F[String(y)];return o&&o[k]!=null&&o[k]!==""?+o[k]:null};
  ys.forEach((y,i)=>{
    const p=P(y), prev=i?out[ys[i-1]]:null;
    let inc=0,att=0,contr=0;
    S.invoices.forEach(v=>{if(fy(v)!==y)return;const t=tot(v).imponibile;if(v.incasso)inc+=t;else att+=t;});
    PROJ.forEach(x=>{if(x.anno===y)contr+=x.imponibile});
    const stima=ov(y,"stima")||0, ric=inc+att+contr+stima, red=ric*p.coef;
    const inpsCalc=red*p.inps, inps=ov(y,"inps")??inpsCalc;
    const prv=p1&&accMeth(y)==="previsionale"&&p1[y];
    const accInps=ov(y,"accontiInps")??(prv?prv.inpsCalc*.8:(prev&&prev.inps>0?prev.inps*.8:0));
    const saldoInps=inps-accInps;
    const inpsVers=ov(y,"inpsVersati")??((prev?prev.saldoInps:0)+accInps);
    const base=Math.max(0,red-Math.max(0,inpsVers)), impCalc=base*p.imp, imp=ov(y,"imposta")??impCalc;
    const accImp=ov(y,"accontiImp")??(prv?(prv.impCalc>51.65?prv.impCalc:0):(prev&&prev.imp>51.65?prev.imp:0));
    const saldoImp=imp-accImp;
    const nx=p1&&accMeth(y+1)==="previsionale"&&p1[y+1]?{i:p1[y+1].impCalc,n:p1[y+1].inpsCalc}:{i:imp,n:inps};
    const giugno=Math.max(0,saldoImp)+Math.max(0,saldoInps)+(nx.i>257.52?nx.i*.4:0)+nx.n*.4;
    const novembre=(nx.i<=51.65?0:nx.i<=257.52?nx.i:nx.i*.6)+nx.n*.4;
    const oneri=inps+imp;
    out[y]={y,p,inc,att,contr,stima,ric,red,inpsCalc,inps,accInps,saldoInps,inpsVers,base,impCalc,imp,accImp,saldoImp,giugno,novembre,oneri,netto:ric-oneri,
      oneriPct:ric?oneri/ric:p.coef*p.inps+p.coef*(1-p.inps)*p.imp, soglia:ric/soglie.s85, accantona:Math.ceil(oneri*(1+p.margine))};
  });
  return out;
}
function withScenario(mod,fn){const c0=S.contratti,m0=S.missioni;
  try{const C=JSON.parse(JSON.stringify(c0)),M=JSON.parse(JSON.stringify(m0));mod(C,M);S.contratti=C;S.missioni=M;_pc=null;return fn()}
  finally{S.contratti=c0;S.missioni=m0;_pc=null}}
const LOG_SKIP=new Set(["calsync","storico"]);
function prevOf(path){const [c,id]=path.split("/");if(c==="config")return S.cfg?JSON.parse(JSON.stringify(S.cfg)):null;
  const arr={invoices:S.invoices,clients:S.clients,f24:S.f24,contratti:S.contratti,missioni:S.missioni,promemoria:S.promemoria,redditi:S.redditi,investimenti:S.investimenti,risparmi:S.risparmi}[c];
  if(!arr)return undefined;const d=arr.find(x=>x.id===id);if(!d)return null;const o=JSON.parse(JSON.stringify(d));delete o.id;return o}
function logDb(db){return {collection:c=>db.collection(c),doc:p=>{const ref=db.doc(p);if(LOG_SKIP.has(p.split("/")[0]))return ref;
  const lg=async az=>{const prima=prevOf(p);if(prima===undefined)return;try{await db.doc("storico/"+Date.now()+"-"+Math.random().toString(36).slice(2,7)).set({ts:new Date().toISOString(),azione:az,path:p,prima})}catch(e){}};
  return {get:(...a)=>ref.get(...a),onSnapshot:(...a)=>ref.onSnapshot(...a),
    update:async x=>{await lg("modifica");return ref.update(x)},
    set:async(x,o)=>{await lg(prevOf(p)?"modifica":"creazione");return o?ref.set(x,o):ref.set(x)},
    delete:async()=>{await lg("eliminazione");return ref.delete()}}}}}
async function write(fn,okMsg){
  if(!S.db||!S.writable){toast("Archivio in sola lettura in questa vista");return false}
  try{await fn(logDb(S.db));if(okMsg)toast(okMsg);return true}
  catch(e){
    if(e&&e.code==="unavailable"){await new Promise(r=>setTimeout(r,600+Math.random()*600));try{await fn(logDb(S.db));if(okMsg)toast(okMsg);return true}catch(e2){}}
    if(e&&e.code==="invalid_argument"){S.writable=false}
    toast(e&&e.code==="quota_exceeded"?"Archivio pieno: elimina dati vecchi":"Salvataggio non riuscito: riprova");return false}
}
function toast(m){const t=document.createElement("div");t.className="toast";t.textContent=m;$("#toastRoot").replaceChildren(t);setTimeout(()=>{if(t.parentNode)t.remove()},2600)}
let _pc=null,_pcT=0;
function vHome(FX){
  const y=S.year, f=FX[y]||{}, s=cfg().soglie, FMIN=fiscoMin();
  const inYear=S.invoices.filter(v=>fy(v)===y);
  const paid=inYear.filter(v=>v.incasso);
  let incassato=0,netto=0,oneri=0,accant=0;
  paid.forEach(v=>{const t=tot(v).imponibile,o=oneriInv(v,FX);incassato+=t;netto+=o.netto;oneri+=o.oneri;accant+=o.accantona});
  const nx=nextF24(FX);
  const mesiTrasc=y<new Date().getFullYear()?12:(y>new Date().getFullYear()?1:new Date().getMonth()+1);
  // to-do: always about TODAY, independent from the selected year
  const cy=new Date().getFullYear(), fc=FX[cy]||{};
  const todo=[]; const T=(o)=>todo.push(o);
  const cn=id=>(clientById(id)||{nome:id}).nome;
  reminders().filter(remDue).forEach(r=>{const dd=daysBetween(todayISO(),r.data);
    T({lvl:dd<=14?"warn":"do",ic:"⏰",title:esc(r.titolo),sub:esc(r.dettaglio||""),date:r.data,big:dmy(r.data).slice(0,5),act:r.auto?`<button class="btn small" data-go-v="contr" type="button">Contratti</button>`:`<button class="btn small" data-pm-done="${r.id}" type="button">Fatto</button>`})});
  const openAll=S.invoices.filter(v=>!v.incasso);
  const lateAll=openAll.filter(v=>stato(v)==="Scaduta");
  if(lateAll.length)T({lvl:"warn",ic:"!",title:`${lateAll.length>1?lateAll.length+" fatture scadute":"Fattura scaduta"}: sollecita`,sub:lateAll.map(v=>v.num+" "+cn(v.cliente)).join(" · "),big:eur0(lateAll.reduce((a,v)=>a+tot(v).documento,0)),act:`<button class="btn small" data-go="inv-late">Vedi</button>`});
  const nxT=nextF24(FX);
  {const up=f24Rows(FX).filter(r=>!r.versato&&r.data>=todayISO()&&(r.data<=addDays(todayISO(),30)||r===nxT||(nxT&&r.data===nxT.data)));
   up.forEach(r=>{const dd=daysBetween(todayISO(),r.data);T({lvl:dd<=30?"warn":"do",ic:"€",title:`${r.bollo?"Bollo fatture":"F24"} del ${dmy(r.data)}${r.stima?" (stima)":""}`,sub:esc(r.descrizione)+(r.tributi?" · codici "+esc(r.tributi):""),date:r.data,big:eur0(r.importo),act:`<button class="btn small" data-go="tasse">F24</button>`})})}
  const openSoon=openAll.filter(v=>stato(v)==="Da incassare");
  if(openSoon.length)T({lvl:"do",ic:"↧",title:`${openSoon.length>1?openSoon.length+" fatture":"1 fattura"} da incassare`,sub:openSoon.map(v=>v.num+" "+cn(v.cliente)).join(" · ")+". All'arrivo del bonifico segna la data.",big:eur0(openSoon.reduce((a,v)=>a+tot(v).documento,0)),act:`<button class="btn small" data-go="inv-open">Segna incassi</button>`});
  const PR=projections();
  {const want=calItems(FX),have=Object.fromEntries((S.calsync||[]).map(d=>[d.id,d]));const n=want.filter(i=>!have[i.key]||have[i.key].hash!==i.hash).length;
   if(n)T({lvl:"do",ic:"📅",title:"Aggiorna Google Calendar",sub:"Emissioni, promemoria e F24 dei prossimi mesi, con notifica sul telefono.",big:String(n),bigL:n>1?"scadenze":"scadenza",act:`<button class="btn small dark" data-calsync="1" type="button">Sincronizza</button>`})}
  const due=PR.filter(x=>x.data<=addDays(todayISO(),5));
  due.forEach(x=>{const late=x.data<todayISO();
    T({lvl:late?"warn":"do",ic:"✎",title:`Emetti fattura ${esc(cn(x.cliente))} · ${x.label}`,sub:`${eur0(x.comp)}${x.ind?` + indennità ${x.gg} gg`:""} · ${dayName(x.data)} ${dmy(x.data)}${x.ipotesi?" (ipotesi)":""}`,date:x.data,big:eur0(x.imponibile),act:`<button class="btn small primary" data-proj="${esc(x.contratto)}|${x.months[0]}" type="button">Crea fattura</button>`})});
  if(!due.length&&PR.length){const x=PR[0];T({lvl:"ok",ic:"✎",title:`Prossima fattura: ${esc(cn(x.cliente))}`,sub:`${x.label} · da emettere ${dayName(x.data)} ${dmy(x.data)}${x.ipotesi?" (ipotesi)":""}`,date:x.data,big:eur0(x.imponibile),act:`<button class="btn small" data-go-v="prev" type="button">Prossime fatture</button>`})}
  S.invoices.filter(v=>v.statoTracking&&v.inviataCommercialista&&!emessa(v)&&daysBetween(v.inviataCommercialista,todayISO())>=3).forEach(v=>{
    T({lvl:"warn",ic:"!",title:`${esc((cfg().commercialista||{}).nome||"La commercialista")} ha emesso la ${esc(v.num)}?`,sub:`Inviata il ${dmy(v.inviataCommercialista)} · ${esc(cn(v.cliente))}. Se sì, segnala come emessa.`,big:eur0(tot(v).documento),act:`<button class="btn small" data-open="${v.id}" type="button">Apri</button>`})});
  S.invoices.filter(v=>v.statoTracking&&!v.inviataCommercialista&&!emessa(v)&&v.data&&v.data<=todayISO()).forEach(v=>{
    T({lvl:"warn",ic:"✉",title:`Invia la ${esc(v.num)} a ${esc((cfg().commercialista||{}).nome||"commercialista")}`,sub:`${esc(cn(v.cliente))} · proforma del ${dmy(v.data)}`,big:eur0(tot(v).documento),act:`<button class="btn small dark" data-mail="${v.id}" type="button">Prepara email</button>`})});
  const lastX=(()=>{try{return localStorage.getItem("fa-v3")}catch(e){return null}})(), lastUpd=S.invoices.reduce((a,v)=>v.aggiornata&&v.aggiornata>a?v.aggiornata:a,"");
  {const cw=compliance().filter(x=>x.lvl==="warn");if(cw.length)T({lvl:"warn",ic:"!",title:cw.length===1?cw[0].t:`${cw.length} controlli di conformità da verificare`,sub:cw.length===1?cw[0].d:cw.slice(0,3).map(x=>x.t).join(" · "),act:`<button class="btn small" data-go-v="tasse" type="button">Controlli</button>`})}
  {let lb=null;try{lb=localStorage.getItem("fa-backup")}catch(e){}
   if(!lb||daysBetween(lb,todayISO())>30)T({lvl:"do",ic:"⇩",title:"Backup mensile dell'archivio",sub:lb?`Ultimo backup il ${dmy(lb)}. Scarica una copia completa: fatture, contratti, missioni, F24 e impostazioni.`:"Scarica una copia completa: fatture, contratti, missioni, F24 e impostazioni.",act:`<button class="btn small dark" data-backup="1" type="button">Scarica backup</button>`})}
  const ctS=ctInfo(), d6=f24Rows(FX).filter(r=>!r.versato&&r.data>=todayISO()&&r.data<=addDays(todayISO(),183)).reduce((a,r)=>a+r.importo,0);
  if(ctS&&ctS.linked){const P=ctPlan(FX);if(P&&P.first){const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;T({lvl:daysBetween(todayISO(),P.first.d)<=120?"warn":"do",ic:"€$",title:`Accantonamento tasse insufficiente dal ${dmy(P.first.d)}`,sub:`Con ${eur0(P.ct.mens)} al mese il conto va a ${eur0(P.min)} il ${dmy(P.minD)}.${nd?` Per coprire gli F24 servono circa ${eur0(nd)} al mese.`:""}`,big:nd?eur0(nd):"",bigL:nd?"/ mese":"",act:`<button class="btn small" data-go-v="tasse" type="button">Vedi</button>`})}}
  else if(ctS&&ctS.saldo!=null){if(+ctS.saldo<d6)T({lvl:"warn",ic:"€$",title:"Conto tasse scoperto",sub:`Hai ${eur0(ctS.saldo)}, nei prossimi 6 mesi verserai ${eur0(d6)} di F24.`,big:eur0(d6-ctS.saldo),act:`<button class="btn small" data-go-v="tasse" type="button">Vedi</button>`})}
  else T({lvl:"do",ic:"€$",title:"Registra il saldo del conto tasse",sub:`Così vedi se copri gli F24: giugno ${cy+1} ≈ ${eur0(fc.giugno||0)}.`,act:`<button class="btn small" data-go-v="tasse" type="button">Inserisci</button>`});
  if(fc.ric>=s.allerta)T({lvl:"warn",ic:"!",title:`Previsione ${cy} vicina alla soglia`,sub:`Valuta tempi di fatturazione e rimborsi analitici.`,big:eur0(fc.ric),act:""});
  // incasso a cavallo d'anno: principio di cassa, l'aliquota cambia
  if(P(cy+1).imp>P(cy).imp){const risk=[...PR.filter(x=>x.anno===cy&&x.incasso>=`${cy}-12-15`),...openAll.filter(v=>fy(v)===cy&&effDate(v)>=`${cy}-12-15`).map(v=>({cliente:v.cliente,imponibile:tot(v).imponibile,incasso:effDate(v),label:v.num}))];
    const amt=risk.reduce((a,x)=>a+x.imponibile,0);
    if(amt>0){const extra=amt*P(cy).coef*(1-P(cy).inps)*(P(cy+1).imp-P(cy).imp);
      T({lvl:"do",ic:"%",title:`Incassi a fine dicembre: chiedi il bonifico entro il 31/12`,sub:`${risk.map(x=>cn(x.cliente)+" "+x.label).join(" · ")}: se slittano a gennaio passano al ${cy+1} con imposta al ${pct(P(cy+1).imp,0)} (circa ${eur0(extra)} in più).`,date:risk[0].incasso,big:eur0(amt),act:`<button class="btn small" data-go-v="prev" type="button">Vedi</button>`})}}
  {const lim=addDays(todayISO(),-60);const miss=S.invoices.filter(v=>emessa(v)&&!v.pdf&&((v.emessaSdi||v.data||"")>=lim));
   if(miss.length)T({lvl:"do",ic:"📎",title:miss.length>1?`Carica ${miss.length} fatture elettroniche`:`Carica la fattura elettronica ${esc(miss[0].num)}`,sub:miss.map(v=>esc(v.num)+" "+esc(cn(v.cliente))).join(" · ")+". Il PDF o l'XML ricevuto dopo l'emissione allo SdI.",act:`<button class="btn small" data-open="${miss[0].id}" type="button">Carica</button>`})}
  invTodos(T);rispTodos(T);speseTodos(T);inboxTodos(T);
  const rank={warn:0,do:1,ok:2};
  todo.sort((a,b)=>(rank[a.lvl]-rank[b.lvl])||((a.date||"9999")<(b.date||"9999")?-1:1));
  // year-aware KPI values
  const open=inYear.filter(v=>!v.incasso), late=open.filter(v=>stato(v)==="Scaduta");
  const projY=y>cy?PR.filter(x=>x.anno===y):[];
  const aperto=open.reduce((a,v)=>a+tot(v).documento,0)+projY.reduce((a,x)=>a+x.imponibile,0);
  const f24Y=y===cy?null:[...S.f24.filter(r=>(r.data||"").startsWith(String(y))),...f24Rows(FX).filter(r=>r.stima&&r.data.startsWith(String(y)))];
  const f24Ytot=f24Y?f24Y.reduce((a,r)=>a+(+r.importo||0),0):0;

  // monthly chart
  const mInc=Array(12).fill(0), mAtt=Array(12).fill(0), mPr=Array(12).fill(0);
  inYear.forEach(v=>{const m=+effDate(v).slice(5,7)-1;const t=tot(v).imponibile;if(v.incasso)mInc[m]+=t;else mAtt[m]+=t});
  PR.forEach(x=>{if(x.anno===y)mPr[+x.incasso.slice(5,7)-1]+=x.imponibile});
  const curM=y===cy?new Date().getMonth():-1;
  const sogliaW=Math.min(100,(f.inc||0)/s.s85*100), sogliaF=Math.min(100-sogliaW,((f.att||0)+(f.contr||0)+(f.stima||0))/s.s85*100);
  const PV=persVals(FX);
  const TODO_MAX=5, todoShown=S.todoAll?todo:todo.slice(0,TODO_MAX);
  const li=t=>{const ci=t.date?cdInfo(t.date):null;
    return `<li class="${t.lvl}"><span class="dot ${t.lvl}">${DOTICON[t.ic]?ico(DOTICON[t.ic],13):t.ic}</span><div class="tm"><div class="tt">${t.title}</div>${t.sub?`<div class="ts">${t.sub}</div>`:""}</div><div class="tr">${t.big?`<b class="num">${t.big}${t.bigL?` <small>${t.bigL}</small>`:""}</b>`:""}${ci?`<span class="cdp ${ci.c}">${ci.t}</span>`:""}</div><div class="ta">${t.act||""}</div></li>`};
  const accPct=pct((fc.oneriPct||0)*(1+P(cy).margine),0);
  const hasCT=ctS&&ctS.saldo!=null, cov=hasCT?(d6>0?Math.max(0,Math.min(1,(+ctS.saldo)/d6)):1):null;
  const nxi=nx?cdInfo(nx.data):null, soglAlert=(f.soglia||0)>=s.allerta/s.s85;
  return `
  <div class="home v2"><div class="h-left">
  <section class="panel hero h-hero">
    <div class="hero-h"><div><h2>Il tuo ${y}</h2><span class="eyebrow">${y>cy?"anno futuro · valori da contratti":y<cy?"anno chiuso · per data di incasso":"per data di incasso"}</span></div>${late.length?`<button class="cdp late" data-go="inv-late" type="button">${late.length>1?late.length+" fatture scadute":"1 fattura scaduta"}</button>`:""}</div>
    <div class="hero-nums">
      <div class="hn-main"><span>Incassato</span><b class="num">${eur0(incassato)}</b><small>${paid.length} fatture</small></div>
      <div><span>Netto reale</span><b class="num pos">${eur0(netto)}</b><small>${eur0(netto/mesiTrasc)} / mese</small></div>
      <div><span>Da accantonare</span><b class="num">${eur0(accant)}</b><small>sugli incassi ${y}</small></div>
      ${aperto?`<div><span>${y>cy?"Previsto da contratti":"Da incassare"}</span><b class="num ${late.length?"neg":""}">${eur0(aperto)}</b><small>${y>cy?projY.length+" fatture previste":open.length+" aperte"}</small></div>`:""}
    </div>
    <div class="hero-chart chart"><div class="hc-d">${homeChart(mInc,mAtt,mPr,curM)}</div><div class="hc-m">${homeChart(mInc,mAtt,mPr,curM,380,true)}</div></div>
    <div class="legend hero-legend"><span><i style="background:var(--vz-real)"></i>Incassato</span><span><i style="background:var(--vz-plan)"></i>Fatture aperte</span><span><i style="background:var(--vz-hyp)"></i>Previsto dai contratti</span></div>
    <div class="hero-soglia">
      <div class="hs-top"><span>Previsione ${y} <b class="num">${y>cy?approx(f.ric):eur0(f.ric||0)}</b></span><span class="${soglAlert?"neg":""}"><b class="num">${pct(f.soglia||0)}</b> della soglia ${eur0(s.s85)}</span></div>
      <div class="meter" role="img" aria-label="Soglia usata ${pct(f.soglia||0)}"><i style="width:${sogliaW}%"></i><i class="f" style="left:${sogliaW}%;width:${sogliaF}%"></i><span class="mk" style="left:${Math.min(99.5,s.allerta/s.s85*100)}%"></span></div>
      <div class="meter-legend"><span>incassato</span><span>+ previsto</span><span>allerta ${eur0(s.allerta)}</span></div>
    </div>
  </section>
  <div class="h-duo">
  <section class="panel h-card go" data-go-v="tasse">
    <div class="panel-h"><h2>Tasse</h2><div class="spacer"></div><span class="eyebrow">accantona il ${accPct} di ogni incasso</span></div>
    <div class="panel-b">
      <div class="big-row"><div><span>Prossimo F24</span><b class="num">${nx?eur0(nx.importo):"—"}</b><small>${nx?dmy(nx.data):"nessuno in programma"}</small></div>${nxi?`<span class="cdp ${nxi.c}">${nxi.t}</span>`:""}</div>
      ${hasCT?`<div class="cov"><div class="cov-l"><span>Conto tasse</span><span><b class="num">${eur0(ctS.saldo)}</b> su ${eur0(d6)} di F24 in 6 mesi</span></div><div class="mbar"><i style="width:${(cov*100).toFixed(1)}%;background:${cov>=1?"var(--green-soft)":cov>=.5?"var(--amber-soft)":"var(--tax)"}"></i></div></div>`
        :`<div class="cov"><div class="cov-l"><span>F24 nei prossimi 6 mesi</span><b class="num">${eur0(d6)}</b></div><p class="muted">Registra il saldo del conto tasse per vedere se li copri.</p></div>`}
    </div>
  </section>
  ${PV?`<section class="panel h-card go" data-go-v="invest">
    <div class="panel-h"><h2>Patrimonio</h2><div class="spacer"></div><span class="eyebrow">oggi · esclusi conti correnti</span></div>
    <div class="panel-b">
      <div class="big-row"><div><b class="num">${eur0(PV.pat)}</b></div></div>
      <div class="mbar split"><i style="width:${PV.pat?(PV.rt/PV.pat*100).toFixed(1):0}%;background:var(--sky)"></i><i style="width:${PV.pat?(PV.it/PV.pat*100).toFixed(1):0}%;background:var(--c-ink)"></i></div>
      <div class="split-l"><span><i style="background:var(--sky)"></i>Risparmi <b class="num">${eur0(PV.rt)}</b></span><span><i style="background:var(--c-ink)"></i>Investimenti <b class="num">${eur0(PV.it)}</b></span></div>
      <div class="mini2">
        <!--feat--><div><span>Margine mensile</span><b class="num ${PV.marg<0?"neg":"pos"}">${PV.marg<0?"−":""}${eur0(Math.abs(PV.marg))}</b></div><!--/feat-->
        <div><span>Fondo emergenza</span><b class="num ${PV.mesi<3?"neg":""}">${PV.mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</b><div class="mbar thin"><i style="width:${Math.min(100,PV.mesi/PV.emT*100).toFixed(1)}%;background:${PV.mesi>=3?"var(--green-soft)":"var(--amber-soft)"}"></i></div></div>
      </div>
    </div>
  </section>`:""}
  </div></div>
  <div class="h-side">
  <section class="panel h-todo"><div class="panel-h"><h2>Da fare</h2><span class="eyebrow tday" style="margin-left:4px">oggi ${dmy(todayISO())}</span><div class="spacer"></div><button class="btn small ghost" data-calsync="1" type="button" title="Aggiorna Google Calendar">${ico("sync",14)}<span class="not-phone"> Calendario</span></button></div>
    <ul class="tlist">${todoShown.map(li).join("")}</ul>
    ${todo.length>TODO_MAX?`<div class="more"><button class="btn small ghost" type="button" data-todo-all="1">${S.todoAll?"Mostra solo le più urgenti":`Mostra tutte (altre ${todo.length-TODO_MAX})`}</button></div>`:""}
  </section>
  </div></div>`;
}
/** v2 Panoramica: the personal-finance figures of personalPanel, as values (same formulas). */
function persVals(FX){const R=rispCalc(),inv=invCalc((S.investimenti||[]).find(isMainInv)),st=speseStats();
  if(!R&&!inv&&!st)return null;
  const rt=R?R.tot:0,it=inv?inv.tot:0,pat=rt+it;
  const {inTot,outTot,spTot}=cashYear(FX);const netM=(inTot-outTot)/12,sp=st?st.avgRec:0,pac=inv?inv.pac:0,rm=R?R.mens:0,marg=netM-sp-pac-rm;
  return {rt,it,pat,marg,mesi:R?R.mesi:0,emT:(cfg().emergenzaMesi||6)}}
/** v2 Panoramica: monthly bars (collected · open invoices · forecast), rounded tops, compact labels without currency. */
function homeChart(a,b,c,curM,W=720,compact=false){c=c||Array(12).fill(0);
  const H=compact?210:240,L=compact?30:34,R=6,T=24,B=28,tot=a.map((v,i)=>v+b[i]+c[i]),max=Math.max(1000,...tot);
  const step=niceStep(max/3), top=Math.ceil(max/step)*step, sx=(W-L-R)/12, bw=Math.min(34,sx*(compact?.64:.6)), y=v=>T+(H-T-B)*(1-v/top), hh=v=>(H-T-B)*v/top;
  const k=v=>v>=1000?(v/1000).toLocaleString("it-IT",{maximumFractionDigits:1})+"k":String(Math.round(v));
  let g="";for(let t=step;t<=top+.1;t+=step)g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line-2)" stroke-dasharray="2 4"/><text x="${L-6}" y="${y(t)+4}" text-anchor="end" font-size="11" fill="var(--faint)">${k(t)}</text>`;
  const seg=(x,y0,h,col,round)=>{if(h<=0)return"";const r=round?Math.min(6,h,bw/2):0;return r?`<path d="M${x} ${y0+h}V${y0+r}Q${x} ${y0} ${x+r} ${y0}H${x+bw-r}Q${x+bw} ${y0} ${x+bw} ${y0+r}V${y0+h}Z" fill="${col}"/>`:`<rect x="${x}" y="${y0}" width="${bw}" height="${h}" fill="${col}"/>`};
  let bars="";a.forEach((v,i)=>{const x=L+sx*i+(sx-bw)/2,t=tot[i];
    const tl=[MESI_L[i].charAt(0)+MESI_L[i].slice(1).toLowerCase()];if(v)tl.push("Incassato: "+eur0(v));if(b[i])tl.push("Fatture aperte: "+eur0(b[i]));if(c[i])tl.push("Da contratto: "+eur0(c[i]));if(tl.length>2)tl.push("Totale: "+eur0(t));if(tl.length===1)tl.push("Nessun incasso");
    if(i===curM)bars+=`<rect x="${L+sx*i+2}" y="${T-18}" width="${sx-4}" height="${H-T-B+18+22}" rx="10" fill="var(--surface-2)"/>`;
    bars+=seg(x,y(v),hh(v),"var(--vz-real)",!b[i]&&!c[i])+seg(x,y(v+b[i]),hh(b[i]),"var(--vz-plan)",!c[i])+seg(x,y(t),hh(c[i]),"var(--vz-hyp)",true);
    if(t>0&&!compact)bars+=`<text x="${x+bw/2}" y="${y(t)-6}" text-anchor="middle" font-size="11" font-weight="600" fill="${!v&&!b[i]?"var(--lilac-ink)":"var(--muted)"}">${k(t)}</text>`;
    bars+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="${compact?10.5:11.5}" font-weight="${i===curM?700:500}" fill="${i===curM?"var(--fg)":"var(--faint)"}">${MESI[i]}</text>`;
    bars+=`<rect class="hov" x="${L+sx*i}" y="${T-18}" width="${sx}" height="${H-T-B+18}" data-tip="${esc(tl.join("\n"))}"></rect>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ricavi per mese">${g}<line x1="${L}" x2="${W-R}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/>${bars}</svg>`}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x)));const n=x/p;return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p}
function filtered(){
  const f=S.filter;
  return S.invoices.filter(v=>{
    if(f.stato==="anno"&&fy(v)!==S.year)return false;
    if(f.stato==="aperte"&&v.incasso)return false;
    if(f.stato==="scadute"&&stato(v)!=="Scaduta")return false;
    if(f.cliente&&v.cliente!==f.cliente)return false;
    if(f.q){const q=f.q.toLowerCase();const c=clientById(v.cliente);if(!((v.num||"").toLowerCase().includes(q)||(c&&c.nome.toLowerCase().includes(q))||(v.note||"").toLowerCase().includes(q)))return false}
    return true}).sort((a,b)=>(b.data||"").localeCompare(a.data||"")||(b.n||0)-(a.n||0));
}
function pillFor(v){const s=fase(v);if(s==="Incassata")return `<span class="pill quiet">${ico("check",12)}incassata</span>`;const cls=s==="Incassata"?"ok":s==="Scaduta"?"late":s==="Proforma"||s.startsWith("Inviata")?"est":"open";
  const ic=s==="Incassata"?"check":s==="Scaduta"?"alert":s==="Proforma"?"pen":s.startsWith("Inviata")?"send":"inbox";return `<span class="pill ${cls}">${ico(ic,12)}${esc(s)}</span>`}
function vInv(FX){
  const list=filtered(); const f=S.filter;
  const sum=list.reduce((a,v)=>{const t=tot(v),o=oneriInv(v,FX);a.doc+=t.documento;a.imp+=t.imponibile;a.net+=o.netto;a.on+=o.oneri;return a},{doc:0,imp:0,net:0,on:0});
  const yCount={};list.forEach(v=>{const k=(v.data||"").slice(0,4);yCount[k]=(yCount[k]||0)+1});let lastY="",lastYc="";
  const yHead=(v,cols)=>{const k=(v.data||"").slice(0,4);if(k===lastY)return "";lastY=k;return `<tr class="grp"><td colspan="${cols}">${k} · ${yCount[k]} ${yCount[k]>1?"fatture":"fattura"}</td></tr>`};
  const rows=list.map(v=>{const t=tot(v),o=oneriInv(v,FX),c=clientById(v.cliente);
    return yHead(v,12)+`<tr class="click" data-open="${v.id}"><td class="num">${dmyShort(v.data)}</td><td class="num"><b>${esc(v.num)}</b>${v.inviataCommercialista?' <span title="Inviata alla commercialista" style="color:var(--green)">✉</span>':""}${v.pdf?` <span title="Fattura elettronica caricata" class="att-ok">${ico("file",13)}</span>`:""}</td><td class="cli">${cliw(v.cliente,c?c.nome:v.cliente)}</td>
      <td class="r num money-in">${eur(t.comp)}</td><td class="r num">${t.ind?eur(t.ind):"—"}</td><td class="r num">${t.rimb?eur(t.rimb):"—"}</td><td class="r num"><b>${eur(t.documento)}</b></td>
      <td class="r num neg">${eur(o.oneri)}</td><td class="r num pos"><b>${eur(o.netto)}</b></td><td class="c">${pillFor(v)}</td><td class="num">${v.incasso?dmyShort(v.incasso):`<span class="muted">att. ${dmyShort(scadenza(v))}</span>`}</td><td class="c num">${fy(v)||""}</td></tr>`}).join("");
  const cards=list.map(v=>{const t=tot(v),c=clientById(v.cliente);const k=(v.data||"").slice(0,4);const hd=k!==lastYc?(lastYc=k,`<div class="igrp">${k} · ${yCount[k]} ${yCount[k]>1?"fatture":"fattura"}</div>`):"";return hd+`<div class="icard" data-open="${v.id}"><div class="t">${clg(v.cliente)}${esc(v.num)} · <span class="cli">${esc(c?c.nome:v.cliente)}</span></div><div class="a num">${eur(t.documento)}</div><div class="m">${dmy(v.data)} · ${v.incasso?"incassata "+dmy(v.incasso):"attesa "+dmy(scadenza(v))}</div><div style="text-align:right">${pillFor(v)}</div></div>`}).join("");
  return `<section class="panel">
    <div class="panel-h" style="flex-wrap:wrap"><h2>Registro fatture</h2><div class="spacer"></div>
      <div class="filters">
        <select id="fStato" aria-label="Filtra per stato"><option value="tutti">Tutte</option><option value="anno">Anno fiscale ${S.year}</option><option value="aperte">Da incassare</option><option value="scadute">Scadute</option></select>
        <select id="fCli" aria-label="Filtra per cliente"><option value="">Tutti i clienti</option>${S.clients.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>
        <input id="fQ" type="search" placeholder="Cerca n. o cliente" value="${esc(f.q)}" aria-label="Cerca">
        <button class="btn small" id="exportV3" type="button">${ico("down",14)} Excel v3</button><button class="btn small" id="exportX" type="button">Solo dati</button>
      </div></div>
    ${list.length?`<div class="tw itable"><table><thead><tr><th>Data</th><th>N.</th><th>Cliente</th><th class="r">Compenso</th><th class="r">Indennità</th><th class="r">Rimborsi</th><th class="r">Totale doc.</th><th class="r">Oneri</th><th class="r">Netto</th><th class="c">Stato</th><th>Incasso</th><th class="c">Anno fisc.</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="6" style="font-family:var(--f-ui);font-weight:700">Totale (${list.length})</td><td class="r num"><b>${eur(sum.doc)}</b></td><td class="r num neg"><b>${eur(sum.on)}</b></td><td class="r num pos"><b>${eur(sum.net)}</b></td><td colspan="3"></td></tr></tfoot></table></div>
      <div class="icards">${cards}</div>`:`<div class="empty">Nessuna fattura con questi filtri.</div>`}
  </section>`;
}
const c2n=id=>(clientById(id)||{nome:id}).nome;
function intro(t){return `<details class="help"><summary>${ico("info",14)} Come funziona questa sezione</summary><p>${t}</p></details>`}
function vPrev(FX){
  const PR=projections(), today=todayISO();
  const now=PR.filter(x=>x.data<=addDays(today,10)), later=PR.filter(x=>x.data>addDays(today,10));
  const byYear={};PR.forEach(x=>{byYear[x.anno]=(byYear[x.anno]||0)+x.imponibile});
  const card=x=>`<div class="pcard"><div class="pc-top"><span class="cli">${cliw(x.cliente,c2n(x.cliente))}</span>${x.data<today?'<span class="pill late">'+ico("alert",12)+'in ritardo</span>':'<span class="pill open">'+ico("clock",12)+dayName(x.data)+' '+dmyShort(x.data)+'</span>'}</div>
    <div class="pc-per">${x.label}${x.ipotesi?' <span class="pill est">ipotesi</span>':""}</div>
    <div class="pc-amt num">${eur(x.comp+x.ind+x.bollo)}</div>
    <div class="muted" style="font-size:13px">${eur(x.comp)} compenso${x.ind?` + ${x.gg} gg trasferta (${eur(x.ind)})`:""} + bollo</div>
    <button class="btn primary" data-proj="${esc(x.contratto)}|${x.months[0]}" type="button" style="margin-top:10px;width:100%">${ico("pen",14)} Crea fattura</button></div>`;
  // v2: show the next 6 months; the rest on request (the list used to span ~2 years, 48 rows).
  const lim=addDays(today,183), shown=S.prevAll?later:later.filter(x=>x.data<=lim), hiddenN=later.length-shown.length;
  let lastM="";const rows=shown.map(x=>{const m=x.data.slice(0,7);const head=m!==lastM?`<tr class="mhead"><td colspan="6">${MESI_L[+m.slice(5)-1].toLowerCase()} ${m.slice(0,4)}</td></tr>`:"";lastM=m;
    return head+`<tr><td class="num">${dayName(x.data).slice(0,3)} ${dmyShort(x.data)}</td><td class="cli">${cliw(x.cliente,c2n(x.cliente))}</td><td>${x.label}${x.ipotesi?' <span class="pill est">ipotesi</span>':""}</td><td class="r num${x.ind?"":" m-hide"}">${x.ind?`<span class="muted">${x.gg} gg · </span>`+eur(x.ind):"—"}</td><td class="r num"><b>${eur(x.comp+x.ind+x.bollo)}</b></td><td class="r"><button class="btn small ghost" data-proj="${esc(x.contratto)}|${x.months[0]}" type="button">Crea</button></td></tr>`}).join("");
  return `${intro("Le fatture che dovrai emettere, calcolate dai <b>contratti</b> (importi e date) e dalle <b>missioni</b> (indennità). Quando crei una fattura, sparisce da qui e passa nel registro.")}
  <section class="panel"><div class="panel-h"><h2>${ico("pen",18)} Da emettere ora</h2></div><div class="panel-b">${now.length?`<div class="pgrid">${now.map(card).join("")}</div>`:`<div class="empty" style="padding:12px">Nessuna fattura da emettere nei prossimi 10 giorni.${PR[0]?` La prossima: <b>${esc(c2n(PR[0].cliente))}</b> il ${dmy(PR[0].data)}.`:""}</div>`}</div></section>
  <section class="panel"><div class="panel-h"><h2>${ico("cal",18)} In arrivo</h2></div>
   <div class="tw"><table class="tl"><thead><tr><th>Emissione</th><th>Cliente</th><th>Periodo</th><th class="r">Trasferta</th><th class="r">Totale</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="empty">Nessuna altra fattura prevista.</td></tr>`}</tbody></table></div>
   ${hiddenN>0||S.prevAll?`<div class="panel-b" style="text-align:center;padding:10px"><button class="btn small ghost" type="button" data-prev-all="1">${S.prevAll?"Mostra solo i prossimi 6 mesi":`Mostra tutte (altre ${hiddenN})`}</button></div>`:""}
   ${Object.keys(byYear).length?`<div class="panel-b yrtot"><span class="muted">Previsto per anno di incasso</span>${Object.entries(byYear).map(([y,v])=>`<span><b>${y}</b> <span class="num">${eur0(v)}</span></span>`).join("")}</div>`:""}
   <div class="panel-b note" style="margin:0">"Ipotesi" = da un rinnovo non ancora firmato o da giorni di missione stimati.</div></section>`;
}
function vContr(FX){
  const today=todayISO(), nowM=ym(today);
  const ctr=[...S.contratti].sort((a,b)=>(a.dal||"").localeCompare(b.dal||""));
  const groups=[["In corso",c=>c.attivo!==false&&!c.ipotesi&&c.al>=nowM],["Ipotesi di rinnovo",c=>c.attivo!==false&&c.ipotesi],["Conclusi o esclusi",c=>c.attivo===false||(!c.ipotesi&&c.al<nowM)]];
  const card=c=>{let months=0;for(let m=c.dal;m<=c.al;m=addMonths(m,1))months++;let el=0;for(let m=c.dal;m<=c.al&&m<=nowM;m=addMonths(m,1))el++;
    const perMese=(+c.importo||0)/(+c.ogni||1);
    return `<div class="ccard"><div class="pc-top"><span class="cli" style="font-size:16px">${cliw(c.cliente,c2n(c.cliente),1)}</span>${c.ipotesi?'<span class="pill open">ipotesi</span>':c.al<nowM?'<span class="pill ok">concluso</span>':'<span class="pill ok">'+ico("check",12)+'in corso</span>'}</div>
      <div class="cc-amt num">${eur0(perMese)}<small> / mese</small></div>
      <div class="cc-grid"><span>Fattura</span><b>${eur0(c.importo)} ${c.ogni>1?"ogni "+c.ogni+" mesi":"al mese"}</b><span>Trasferta</span><b>${c.tariffa?eur0(c.tariffa)+" al giorno":"—"}</b><span>Emissione</span><b>${regolaTxt(c)}</b><span>Durata</span><b>${mLabel(c.dal)} → ${mLabel(c.al)}</b></div>
      <div class="meter" style="height:8px;margin-top:10px" title="${el} di ${months} mesi"><i style="width:${months?Math.min(100,el/months*100):0}%"></i></div>
      ${c.note?`<p class="muted" style="font-size:13px;margin:8px 0 0">${esc(c.note)}</p>`:""}
      <button class="btn small ghost" data-ctr="${c.id}" type="button" style="margin-top:8px;align-self:flex-start">${ico("pen",13)} Modifica</button></div>`};
  return `${intro("Le condizioni economiche di ogni incarico. Da qui l'app calcola le <b>prossime fatture</b> e le previsioni fiscali. Quando firmi un rinnovo, togli la spunta \"ipotesi\".")}
   <div style="display:flex;justify-content:flex-end"><button class="btn dark" data-ctr="new" type="button">+ Nuovo contratto</button></div>
   ${groups.map(([t,f])=>{const l=ctr.filter(f);return l.length?`<section><div class="eyebrow" style="margin:6px 0 8px">${t}</div><div class="pgrid">${l.map(card).join("")}</div></section>${t==="Ipotesi di rinnovo"?`<div class="grid">${simPanel()}</div>`:""}`:""}).join("")||`<div class="panel empty">Nessun contratto.</div>`}`;
}
function vMis(FX){
  const today=todayISO();
  const quotas=S.missioni.filter(x=>x.tipo==="quota").sort((a,b)=>a.anno-b.anno||c2n(a.cliente).localeCompare(c2n(b.cliente)));
  const dated=S.missioni.filter(x=>x.tipo!=="quota").sort((a,b)=>(a.dal||"").localeCompare(b.dal||""));
  const fatt=(cl,Y)=>S.invoices.filter(v=>v.cliente===cl&&(v.data||"").startsWith(String(Y))).reduce((a,v)=>a+(v.righe||[]).filter(r=>r.tipo==="trasferta").reduce((b,r)=>b+(+r.qta||0),0),0);
  const datedIn=(cl,Y)=>dated.filter(x=>x.cliente===cl&&x.dal.startsWith(String(Y))).reduce((a,x)=>a+daysBetween(x.dal,x.al)+1,0);
  const qcard=q=>{const f=fatt(q.cliente,q.anno),d=datedIn(q.cliente,q.anno),rest=Math.max(0,q.giorni-f-d),pf=Math.min(100,f/q.giorni*100),pd=Math.min(100-pf,d/q.giorni*100);
    return `<div class="ccard"><div class="pc-top"><span class="cli">${cliw(q.cliente,c2n(q.cliente))}</span><span class="pill est">stima ${q.anno}</span></div>
     <div class="cc-amt num">${q.giorni}<small> giorni previsti</small></div>
     <div class="meter" style="height:10px;margin-top:6px"><i style="width:${pf}%"></i><i class="f" style="left:${pf}%;width:${pd}%"></i></div>
     <div class="meter-legend"><span>${f} fatturati</span><span>${d} con date</span><span><b>${rest}</b> da distribuire</span></div>
     <button class="btn small ghost" data-mis="${q.id}" type="button" style="margin-top:8px;align-self:flex-start">${ico("pen",13)} Modifica</button></div>`};
  const row=x=>{const n=daysBetween(x.dal,x.al)+1;return `<tr><td class="cli">${cliw(x.cliente,c2n(x.cliente))}</td><td class="num">${dmyShort(x.dal)} → ${dmyShort(x.al)}</td><td class="r num">${n}</td><td class="c">${x.ipotesi?'<span class="pill open">ipotesi</span>':x.al<today?'<span class="pill ok">svolta</span>':x.dal<=today?'<span class="pill open">'+ico("clock",12)+'in corso</span>':'<span class="pill ok">confermata</span>'}</td><td class="muted">${esc(x.note||"")}</td><td class="r"><button class="btn small ghost" data-mis="${x.id}" type="button">Modifica</button></td></tr>`};
  return `${intro("I giorni in Madagascar che generano l'indennità di trasferta. Se sai solo <b>quanti giorni</b> farai in un anno, usa la stima annua; quando conosci le date, aggiungi la missione: la stima si riduce da sola.")}
  <div style="display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap"><button class="btn" data-quota="new" type="button">+ Stima annua</button><button class="btn dark" data-mis="new" type="button">+ Missione con date</button></div>
  <section><div class="eyebrow" style="margin:6px 0 8px">Stime annue</div>${quotas.length?`<div class="pgrid">${quotas.map(qcard).join("")}</div>`:`<div class="panel empty">Nessuna stima annua.</div>`}</section>
  <section class="panel"><div class="panel-h"><h2>${ico("cal",18)} Missioni con date</h2></div><div class="tw"><table><thead><tr><th>Per conto di</th><th>Periodo</th><th class="r">Giorni</th><th class="c">Stato</th><th>Note</th><th></th></tr></thead><tbody>${dated.map(row).join("")||`<tr><td colspan="6" class="empty">Nessuna missione con date.</td></tr>`}</tbody></table></div></section>`;
}
function cdInfo(date,done){if(done)return{c:"ok",t:"fatto"};const dd=daysBetween(todayISO(),date);
  if(dd<0)return{c:"late",t:`scaduto da ${-dd} gg`,dd};if(dd===0)return{c:"late",t:"oggi",dd};if(dd===1)return{c:"late",t:"domani",dd};
  return{c:dd<=7?"late":dd<=30?"soon":dd<=90?"mid":"far",t:`tra ${dd} gg`,dd}}
const cdPill=(date,done)=>{const i=cdInfo(date,done);return `<span class="cdp ${i.c}">${i.t}</span>`};
function promemoriaPanel(f24=[]){
  const today=todayISO();
  // One status column (countdown, or "fatto"/"scaduto"), grouped by month like "Da emettere".
  const items=[...reminders().filter(r=>!r.fatto||r.data>=addDays(today,-30)),...f24.map(x=>({...x,_f24:1,fatto:!!x.versato}))].sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:0);
  let lastM="";const grp=d=>{const m=d.slice(0,7);if(m===lastM)return "";lastM=m;const L=MESI_L[+m.slice(5)-1];return `<tr class="grp"><td colspan="4">${L.charAt(0)+L.slice(1).toLowerCase()} ${m.slice(0,4)}</td></tr>`};
  const tags=r=>(r.stima?` <span class="pill est">stima</span>`:"")+(r.auto?` <span class="pill est">automatico</span>`:"")+(!r._f24&&!r.fatto&&remDue(r)&&daysBetween(today,r.data)>=0?` <span class="pill soon">in arrivo</span>`:"");
  return `<section class="panel"><div class="panel-h"><h2>${ico("clock",18)} Scadenze e promemoria</h2><div class="spacer"></div><button class="btn small dark" data-pm="new" type="button">+ Promemoria</button></div>
   <div class="tw"><table class="stack sched"><thead><tr><th>Entro il</th><th>Stato</th><th>Cosa</th><th></th></tr></thead><tbody>
   ${items.map(r=>{if(r._f24)return grp(r.data)+`<tr class="u-${cdInfo(r.data,r.versato).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.versato)}</td><td><b style="font-family:var(--f-ui)">${r.bollo?"Bollo fatture elettroniche":"F24"} · ${eur(r.importo)}</b>${tags(r)}<div class="muted" style="font-size:13px;max-width:75ch">${esc(r.descrizione)}${r.tributi?" · codici "+esc(r.tributi):""}</div></td><td class="r acts"><button class="btn small ghost" data-go-v="tasse" type="button">F24 e tasse</button></td></tr>`;
     return grp(r.data)+`<tr class="u-${cdInfo(r.data,r.fatto).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.fatto)}</td><td><b style="font-family:var(--f-ui)">${esc(r.titolo)}</b>${r.cliente?` <span class="cli" style="font-size:13px">· ${esc(c2n(r.cliente))}</span>`:""}${tags(r)}${r.dettaglio?`<div class="muted rem-d" style="font-size:13px;max-width:75ch" title="Tocca per leggere tutto">${esc(r.dettaglio)}</div>`:""}</td>
     <td class="r acts">${r.auto?`<button class="btn small ghost" data-go-v="contr" type="button">Contratti</button>`:`<button class="btn small ${r.fatto?"ghost":""}" data-pm-done="${r.id}" type="button">${r.fatto?"Riapri":"Fatto"}</button> <button class="btn small ghost" data-pm="${r.id}" type="button">Modifica</button>`}</td></tr>`}).join("")||`<tr><td colspan="4" class="empty">Nessun promemoria.</td></tr>`}
   </tbody></table></div></section>`;
}
function openFormFromProj(x){
  openForm();
  D.cliente=x.cliente;D.data=x.data<todayISO()?todayISO():x.data;D.anno=+D.data.slice(0,4);D.n=nextNumber(D.anno);
  D.mesi={start:x.months[0],count:x.months.length};D.righe=[];
  const c=S.contratti.find(k=>k.id===x.contratto)||{};const cl=clientById(x.cliente)||{};
  const step=x.months.length;
  x.months.forEach(m=>{const [yy,mm]=m.split("-").map(Number);D.righe.push({tipo:"compenso",desc:fillTpl(cl.desc||"Compenso professionale - {MESE}",{mese:monthLabel(yy,mm-1)}),qta:1,prezzo:r2((+c.importo||0)/(+c.ogni||1))})});
  D.trasf=null;
  x.trasf.filter(t=>!t.quota).forEach(t=>D.righe.push({tipo:"trasferta",desc:fillTpl(cl.descTrasf||"Indennità di trasferta estero - dal {DAL} al {AL}",{dal:dmy(t.dal),al:dmy(t.al)}),qta:t.n,prezzo:x.tariffa}));
  const dated=x.trasf.filter(t=>!t.quota);
  if(dated.length===1)D.trasf={dal:dated[0].dal,al:dated[0].al,tariffa:x.tariffa};
  else if(!dated.length&&x.quota)D.trasf={dal:"",al:"",tariffa:x.tariffa};
  D.mesiCopertiOverride=x.months.slice();
  autoBollo();renderForm();
}
function clientOptions(sel){return S.clients.map(k=>`<option value="${k.id}" ${k.id===sel?"selected":""}>${esc(k.nome)}</option>`).join("")}
function openContract(id){
  const c=id?S.contratti.find(x=>x.id===id):{cliente:(S.clients[0]||{}).id,importo:"",ogni:1,dal:ym(todayISO()),al:new Date().getFullYear()+"-12",tariffa:"",offset:0,regola:{n:1},ipotesi:false,attivo:true,note:""};
  sheet(id?"Modifica contratto":"Nuovo contratto",`<section class="panel"><div class="panel-b"><div class="fields">
   <div class="f s6"><label for="k-cli">Cliente</label><select id="k-cli">${clientOptions(c.cliente)}</select></div>
   <div class="f s2"><label for="k-imp">Importo per fattura (€)</label><input id="k-imp" class="in num" inputmode="decimal" value="${c.importo}"></div>
   <div class="f s2"><label for="k-ogni">Fatturo ogni</label><select id="k-ogni">${[1,2,3,6,12].map(n=>`<option value="${n}" ${+c.ogni===n?"selected":""}>${n===1?"mese":n+" mesi"}</option>`).join("")}</select></div>
   <div class="f s2"><label for="k-tar">Indennità trasferta €/gg</label><input id="k-tar" class="in num" inputmode="decimal" value="${c.tariffa}"></div>
   <div class="f s2"><label for="k-dal">Primo mese</label><input id="k-dal" type="month" value="${c.dal}"></div>
   <div class="f s2"><label for="k-al">Ultimo mese</label><input id="k-al" type="month" value="${c.al}"></div>
   <div class="f s4"><label for="k-reg">Emissione della fattura</label><select id="k-reg"><option value="0" ${!(c.regola&&c.regola.n)?"selected":""}>Giorni rispetto a fine periodo →</option><option value="1" ${c.regola&&c.regola.n===1?"selected":""}>Ultimo venerdì del mese di fine periodo</option><option value="2" ${c.regola&&c.regola.n===2?"selected":""}>Penultimo venerdì del mese di fine periodo</option></select><span class="help">La data di emissione è anche il giorno del promemoria.</span></div>
   <div class="f s2"><label for="k-off">Giorni da fine periodo</label><input id="k-off" class="in num" inputmode="numeric" value="${c.offset||0}"><span class="help">Solo se non usi il venerdì. Es. −13 o 25.</span></div>
   <div class="f s6" style="display:flex;gap:18px;flex-wrap:wrap"><label class="switch"><input type="checkbox" id="k-ip" ${c.ipotesi?"checked":""}> Ipotesi (rinnovo non ancora firmato)</label><label class="switch"><input type="checkbox" id="k-att" ${c.attivo!==false?"checked":""}> Includi nelle previsioni</label></div>
   <div class="f s6"><label for="k-note">Note</label><input id="k-note" value="${esc(c.note||"")}"></div>
  </div><div id="k-del" style="margin-top:14px"></div></div></section>`,`<button class="btn primary" id="kSave" type="button">Salva contratto</button>`);
  if(id){$("#k-del").innerHTML=`<button class="btn small danger" id="kDel" type="button">Elimina contratto</button>`;$("#kDel").onclick=()=>{$("#k-del").innerHTML=`<span class="muted">Eliminare il contratto? Le fatture già emesse restano.</span> <button class="btn small danger" id="kDel2" type="button">Sì, elimina</button>`;$("#kDel2").onclick=async()=>{if(await write(db=>db.doc("contratti/"+id).delete(),"Contratto eliminato"))closeSheet()}}}
  $("#kSave").onclick=async()=>{const doc={cliente:$("#k-cli").value,importo:readNum($("#k-imp").value),ogni:+$("#k-ogni").value,tariffa:readNum($("#k-tar").value),dal:$("#k-dal").value,al:$("#k-al").value,offset:parseInt($("#k-off").value)||0,regola:+$("#k-reg").value?{n:+$("#k-reg").value}:null,ipotesi:$("#k-ip").checked,attivo:$("#k-att").checked,note:$("#k-note").value.trim()};
    if(!doc.importo||!doc.dal||!doc.al){toast("Inserisci importo, primo e ultimo mese");return}if(doc.al<doc.dal){toast("L'ultimo mese è prima del primo");return}
    if(await write(db=>db.doc("contratti/"+(id||doc.cliente+"-"+doc.dal+"-"+uid())).set(doc),"Contratto salvato"))closeSheet()};
}
function openReminder(id){
  const r=id?S.promemoria.find(x=>x.id===id):{data:todayISO(),titolo:"",dettaglio:"",cliente:"",preavviso:14,fatto:false};
  sheet(id?"Modifica promemoria":"Nuovo promemoria",`<section class="panel"><div class="panel-b"><div class="fields">
   <div class="f s6"><label for="r-t">Cosa fare</label><input id="r-t" value="${esc(r.titolo)}" placeholder="Es. Inviare proposta di rinnovo via PEC"></div>
   <div class="f s2"><label for="r-d">Entro il</label><input id="r-d" type="date" value="${r.data}"></div>
   <div class="f s2"><label for="r-p">Avvisami (gg prima)</label><input id="r-p" class="in num" inputmode="numeric" value="${r.preavviso??14}"></div>
   <div class="f s2"><label for="r-c">Cliente</label><select id="r-c"><option value="">—</option>${clientOptions(r.cliente)}</select></div>
   <div class="f s6"><label for="r-x">Dettagli</label><textarea id="r-x" rows="3">${esc(r.dettaglio||"")}</textarea></div>
  </div><div id="r-del" style="margin-top:14px"></div></div></section>`,`<button class="btn primary" id="rSave" type="button">Salva</button>`);
  if(id){$("#r-del").innerHTML=`<button class="btn small danger" id="rDel" type="button">Elimina</button>`;$("#rDel").onclick=async()=>{if(await write(db=>db.doc("promemoria/"+id).delete(),"Promemoria eliminato"))closeSheet()}}
  $("#rSave").onclick=async()=>{const doc={titolo:$("#r-t").value.trim(),data:$("#r-d").value,preavviso:parseInt($("#r-p").value)||0,cliente:$("#r-c").value,dettaglio:$("#r-x").value.trim(),fatto:!!r.fatto};
    if(!doc.titolo||!validDay(doc.data)){toast("Inserisci cosa fare e la data");return}
    if(await write(db=>db.doc("promemoria/"+(id||doc.data+"-"+uid())).set(doc),"Promemoria salvato"))closeSheet()};
}
function openQuota(id){
  const q=id?S.missioni.find(m=>m.id===id):{tipo:"quota",cliente:(S.clients[0]||{}).id,anno:new Date().getFullYear()+1,giorni:"",note:""};
  sheet(id?"Modifica stima annua":"Stima annua dei giorni in missione",`<section class="panel"><div class="panel-b"><div class="fields">
   <div class="f s2"><label for="q-cli">Per conto di</label><select id="q-cli">${clientOptions(q.cliente)}</select></div>
   <div class="f s2"><label for="q-anno">Anno</label><input id="q-anno" class="in num" inputmode="numeric" value="${q.anno}"></div>
   <div class="f s2"><label for="q-gg">Giorni previsti nell'anno</label><input id="q-gg" class="in num" inputmode="numeric" value="${q.giorni}"></div>
   <div class="f s6"><span class="help">Usala quando sai quanti giorni farai ma non quando. L'app toglie i giorni già fatturati e le missioni con date di quell'anno, e distribuisce il resto sui periodi ancora da fatturare.</span></div>
   <div class="f s6"><label for="q-note">Note</label><input id="q-note" value="${esc(q.note||"")}"></div>
  </div><div id="q-del" style="margin-top:14px"></div></div></section>`,`<button class="btn primary" id="qSave" type="button">Salva stima</button>`);
  if(id){$("#q-del").innerHTML=`<button class="btn small danger" id="qDel" type="button">Elimina</button>`;$("#qDel").onclick=async()=>{if(await write(db=>db.doc("missioni/"+id).delete(),"Stima eliminata"))closeSheet()}}
  $("#qSave").onclick=async()=>{const doc={tipo:"quota",cliente:$("#q-cli").value,anno:parseInt($("#q-anno").value),giorni:parseInt($("#q-gg").value)||0,ipotesi:true,note:$("#q-note").value.trim()};
    if(!doc.anno||!doc.giorni){toast("Inserisci anno e giorni");return}
    if(await write(db=>db.doc("missioni/"+(id||"quota-"+doc.anno+"-"+doc.cliente)).set(doc),"Stima salvata"))closeSheet()};
}
function openMission(id){
  const x=id?S.missioni.find(m=>m.id===id):{cliente:(S.clients[0]||{}).id,dal:"",al:"",ipotesi:false,note:""};
  if(x.tipo==="quota")return openQuota(id);
  sheet(id?"Modifica missione":"Nuova missione",`<section class="panel"><div class="panel-b"><div class="fields">
   <div class="f s6"><label for="m-cli">Per conto di</label><select id="m-cli">${clientOptions(x.cliente)}</select></div>
   <div class="f s2"><label for="m-dal">Dal</label><input id="m-dal" type="date" value="${x.dal}"></div>
   <div class="f s2"><label for="m-al">Al</label><input id="m-al" type="date" value="${x.al}"></div>
   <div class="f s2"><label>Giorni</label><div class="num" id="m-gg" style="padding:8px 0;font-weight:600">—</div></div>
   <div class="f s6"><label class="switch"><input type="checkbox" id="m-ip" ${x.ipotesi?"checked":""}> Ipotesi (date non ancora confermate)</label></div>
   <div class="f s6"><label for="m-note">Note</label><input id="m-note" value="${esc(x.note||"")}" placeholder="Es. Ambanja – audit cooperative"></div>
  </div><div id="m-del" style="margin-top:14px"></div></div></section>`,`<button class="btn small" id="mQuota" type="button">Stima annua senza date</button><button class="btn primary" id="mSave" type="button">Salva missione</button>`);
  $("#mQuota").onclick=()=>openQuota(null);
  const upd=()=>{const a=$("#m-dal").value,b=$("#m-al").value;$("#m-gg").textContent=validDay(a)&&validDay(b)&&b>=a?(daysBetween(a,b)+1)+" giorni":"—";if(validDay(a))$("#m-al").min=a};
  ["#m-dal","#m-al"].forEach(i=>{$(i).addEventListener("input",upd);$(i).addEventListener("change",upd)});upd();
  if(id){$("#m-del").innerHTML=`<button class="btn small danger" id="mDel" type="button">Elimina missione</button>`;$("#mDel").onclick=async()=>{if(await write(db=>db.doc("missioni/"+id).delete(),"Missione eliminata"))closeSheet()}}
  $("#mSave").onclick=async()=>{const doc={cliente:$("#m-cli").value,dal:$("#m-dal").value,al:$("#m-al").value,ipotesi:$("#m-ip").checked,note:$("#m-note").value.trim()};
    if(!validDay(doc.dal)||!validDay(doc.al)){toast("Inserisci le date della missione");return}if(doc.al<doc.dal){toast("La data di fine è prima di quella di inizio");return}
    if(await write(db=>db.doc("missioni/"+(id||doc.dal+"-"+doc.cliente)).set(doc),"Missione salvata"))closeSheet()};
}
function compliancePanel(){const L=compliance();
  if(!L.length)return `<div class="okline" role="status">${ico("check",15)}<span><b>Controlli di conformità: tutto in regola.</b> Numerazione, invii allo SdI, bollo, fatture estere e soglie.</span></div>`;
  return `<section class="panel"><div class="panel-h"><h2>${ico("check",18)} Controlli di conformità</h2><div class="spacer"></div><span class="eyebrow">${L.length?L.length+" da verificare":"tutto in regola"}</span></div>
   ${L.length?`<ul class="tlist">${L.map(x=>`<li class="${x.lvl==="warn"?"warn":"do"}"><span class="dot ${x.lvl==="warn"?"warn":"do"}">${ico(x.lvl==="warn"?"alert":"clock",13)}</span><div class="tm"><div class="tt">${esc(x.t)}</div><div class="ts" style="white-space:normal">${esc(x.d)}</div></div><div class="tr"></div><div class="ta">${x.noAck?"":`<button class="btn small" data-ack="${esc(x.k)}" type="button">Verificato</button>`}</div></li>`).join("")}</ul>`
   :""}</section>`}
const TIPI_R={amministratore:"Compenso da amministratore (gérant)",dipendente:"Lavoro dipendente o assimilato",estero:"Altro reddito estero",altro:"Altro"};
function redditiPanel(){const L=[...(S.redditi||[])].sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  return `<section class="panel"><div class="panel-h"><h2>${ico("file",18)} Redditi fuori dalla partita IVA</h2><div class="spacer"></div><button class="btn small dark" data-red="new" type="button">+ Aggiungi</button></div>
   <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Per esempio il compenso da gérant della SARLU. Non entrano nel forfettario né nella soglia degli 85.000 €, ma vanno dichiarati a parte. I redditi da lavoro dipendente o assimilato (amministratore compreso) sopra 30.000 € in un anno escludono dal forfettario l'anno dopo.</p></details>
   <div class="tw"><table class="stack"><thead><tr><th>Data</th><th>Fonte</th><th>Tipo</th><th class="r">Lordo</th><th class="r">Imposte estere</th><th></th></tr></thead><tbody>
   ${L.map(r=>`<tr><td class="num">${dmy(r.data)}</td><td><b>${esc(r.fonte||"")}</b>${r.paese?` <span class="muted">· ${esc(r.paese)}</span>`:""}</td><td>${esc(TIPI_R[r.tipo]||r.tipo||"")}</td><td class="r num">${eur(+r.importo||0)}</td><td class="r num">${r.imposteEstere?eur(+r.imposteEstere):"—"}</td><td class="r"><button class="btn small ghost" data-red="${r.id}" type="button">Modifica</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">Nessun reddito registrato.</td></tr>`}
   </tbody></table></div></section>`}
function openReddito(id){const r=id?S.redditi.find(x=>x.id===id)||{}:{data:todayISO(),tipo:"amministratore",paese:"Madagascar",fonte:"Altromercato Madagascar SARLU"};
  sheet(id?"Modifica reddito":"Nuovo reddito",`<div class="fields">
   <div class="f s2"><label for="r-d">Data di incasso</label><input id="r-d" type="date" value="${r.data||""}"></div>
   <div class="f s4"><label for="r-f">Chi ti paga</label><input id="r-f" value="${esc(r.fonte||"")}"></div>
   <div class="f s3"><label for="r-t">Tipo</label><select id="r-t">${Object.entries(TIPI_R).map(([k,l])=>`<option value="${k}" ${r.tipo===k?"selected":""}>${l}</option>`).join("")}</select></div>
   <div class="f s3"><label for="r-p">Paese</label><input id="r-p" value="${esc(r.paese||"")}"></div>
   <div class="f s3"><label for="r-i">Importo lordo (€)</label><input id="r-i" class="in num" inputmode="decimal" value="${r.importo??""}"></div>
   <div class="f s3"><label for="r-e">Imposte pagate all'estero (€)</label><input id="r-e" class="in num" inputmode="decimal" value="${r.imposteEstere??""}"></div>
   <div class="f s6"><label for="r-n">Note</label><input id="r-n" value="${esc(r.note||"")}"></div></div>
   ${id?`<div style="margin-top:12px"><button class="btn small danger" id="rDel" type="button">Elimina</button></div>`:""}`,
   `<button class="btn small dark" id="rSave" type="button">Salva</button>`);
  $("#rSave").onclick=async()=>{const d={data:$("#r-d").value,fonte:$("#r-f").value.trim(),tipo:$("#r-t").value,paese:$("#r-p").value.trim(),importo:readNum($("#r-i").value)||0,imposteEstere:readNum($("#r-e").value)||0,note:$("#r-n").value.trim()};
    if(!d.data||!d.importo){toast("Servono data e importo");return}const k=id||(d.data+"-"+Math.random().toString(36).slice(2,6));
    if(await write(db=>db.doc("redditi/"+k).set(d),"Reddito salvato"))closeSheet()};
  const del=$("#rDel");if(del)del.onclick=async()=>{if(await write(db=>db.doc("redditi/"+id).delete(),"Reddito eliminato"))closeSheet()}}
function logLabel(e){const [c,id]=(e.path||"").split("/");const p=e.prima||{};const cur=(S[{invoices:"invoices",clients:"clients",f24:"f24",contratti:"contratti",missioni:"missioni",promemoria:"promemoria",redditi:"redditi"}[c]]||[]).find(x=>x.id===id)||{};
  const n={invoices:"Fattura "+(p.num||cur.num||id),clients:"Cliente "+(p.nome||cur.nome||id),f24:"F24 "+(p.descrizione||cur.descrizione||id),contratti:"Contratto "+c2n(cur.cliente||p.cliente||"")+" "+(cur.dal||p.dal||""),missioni:"Missione "+c2n(cur.cliente||p.cliente||"")+" "+(cur.dal||p.dal||cur.anno||p.anno||""),promemoria:"Promemoria: "+(p.titolo||cur.titolo||id),redditi:"Reddito "+(p.fonte||cur.fonte||id),config:"Impostazioni"}[c];return n||e.path}
function historyPanel(){const L=[...(S.storico||[])].sort((a,b)=>(b.ts||"").localeCompare(a.ts||"")).slice(0,40);
  // Collapsed by default: it is long and mostly needed only to undo a change.
  return `<details class="panel c12 fold"><summary class="panel-h"><h2>${ico("clock",18)} Cronologia modifiche</h2><span class="spacer"></span><span class="eyebrow">ultime ${L.length} · mostra</span></summary>
   <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Ogni modifica salva com'era il dato prima. "Ripristina" lo riporta a quello stato; anche il ripristino finisce in cronologia, quindi si può annullare.</p></details>
   <div class="tw"><table class="stack"><thead><tr><th>Quando</th><th>Azione</th><th>Elemento</th><th></th></tr></thead><tbody>
   ${L.map(e=>`<tr><td class="num">${dmy((e.ts||"").slice(0,10))} ${(e.ts||"").slice(11,16)}</td><td>${esc(e.azione||"")}</td><td>${esc(logLabel(e))}</td><td class="r">${(e.path||"").startsWith("config")?"":`<button class="btn small ghost" data-restore="${e.id}" type="button">Ripristina</button>`}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">Nessuna modifica registrata finora.</td></tr>`}
   </tbody></table></div></details>`}
async function restoreLog(id){const e=S.storico.find(x=>x.id===id);if(!e)return;
  await write(db=>e.prima?db.doc(e.path).set(e.prima):db.doc(e.path).delete(),"Ripristinato")}
const approx=v=>"≈ "+eur0(Math.round((v||0)/500)*500);
const STRAORD=new Set(["Casa e lavori"]);
const SPAL=["var(--c-ink)","var(--green-soft)","var(--amber-soft)","var(--cat-rose)","var(--sky)","var(--c-green-soft)","var(--cat-olive)","var(--c-soft)"];
function spesePanel(inTot,outTot,opt={}){const st=speseStats();
  if(!st)return `<section class="panel c12"><div class="panel-h"><h2>Spese personali</h2></div><div class="panel-b muted">Carica gli estratti conto: le spese mensili per categoria compariranno qui.</div></section>`;
  const cats=Object.entries(st.tot).sort((a,b)=>b[1]-a[1]).map(([k])=>k);const top=cats.slice(0,7),rest=cats.slice(7);
  const ms=st.L.map(m=>m.mese);const lab=ms.map(m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4));
  const ser=top.map((k,i)=>({name:k,color:SPAL[i%SPAL.length],vals:st.L.map(m=>+((m.cat||{})[k])||0)}));
  if(rest.length)ser.push({name:"Altre",color:"var(--c-pale)",vals:st.L.map(m=>rest.reduce((a,k)=>a+(+((m.cat||{})[k])||0),0))});
  const chart=svgBars(lab,ser,{stacked:true,label:"Spese personali per mese"});
  const netto=inTot-outTot-(opt.spTot??st.avgRec*12);
  const rows=cats.map(k=>`<tr><td>${esc(k)}${STRAORD.has(k)?' <span class="pill est">straordinaria</span>':""}</td><td class="r num">${eur0(st.tot[k]/st.n)}</td><td class="r num muted">${eur0(st.tot[k])}</td></tr>`).join("");
  return `<div class="c7" style="display:flex;flex-direction:column;gap:18px;min-width:0"><section class="panel"><div class="panel-h"><h2>Spese per mese</h2><div class="spacer"></div>${lg(ser.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${chart}<div class="chart-note">${lab[0]} – ${lab[lab.length-1]} · fonti: ${esc([...new Set(st.L.map(m=>m.fonti).filter(Boolean))].join(", "))}. Esclusi giroconti tra i tuoi conti, F24 e investimenti. Contanti: l'uso effettivo non è tracciato.</div></div></section>
   ${opt.extra||""}</div>
   <section class="panel c5"><div class="panel-h"><h2>Per categoria</h2></div><div class="panel-b">${opt.noMini?"":`<div class="mini">
     <div><span>Spesa ricorrente / mese</span><b class="num">${eur0(st.avgRec)}</b></div>
     <div><span>Lavori casa (${st.n} mesi)</span><b class="num">${eur0(st.straTot)}</b></div>
     <div><span>Investito / mese</span><b class="num pos">${eur0(st.avgInv)}</b></div>
     <!--feat--><div><span>Cassa libera netta ${new Date().getFullYear()}</span><b class="num ${netto>=0?"pos":"bad"}">${eur0(netto)}</b></div><!--/feat-->
   </div>`}<div class="tw" style="${opt.noMini?"":"margin-top:12px"}"><table><thead><tr><th>Categoria</th><th class="r">/ mese</th><th class="r">Totale</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`}
function vSpese(FX){const st=speseStats();const {inTot,outTot,spTot}=cashYear(FX);
  const head=intro("Le tue spese personali, ricavate dagli estratti conto: solo totali mensili per categoria, nessun movimento singolo né IBAN. Sono esclusi i giroconti tra i tuoi conti, gli F24 (stanno in F24 e tasse) e gli investimenti. I lavori di casa sono tenuti a parte perché straordinari. Per aggiornarle usa Importa movimenti con gli estratti UniCredit e Revolut: i file restano sul dispositivo.")+`<div class="fonti srcbar"><span class="src-l">Fonti</span><span class="src">${logoImg("unicredit","UniCredit").replace('class="lgo"','class="lgo s"')}UniCredit · conto corrente</span><span class="src">${logoImg("revolut","Revolut").replace('class="lgo"','class="lgo s"')}Revolut · conto corrente</span>${S.writable?`<button class="btn small primary" id="speseImp" type="button">${ico("plus",14)} Importa movimenti</button>`:""}</div>`;
  if(!st)return head+`<section class="panel empty">Nessuna spesa registrata.</section>`;
  const net=inTot-outTot-spTot;const last=st.L[st.L.length-1];
  const ml=st.L.map(m=>MESI[+m.mese.slice(5)-1]+" "+m.mese.slice(2,4));const sp=spTot;
  const KS={rec:VZ.cols(st.rec,[],"Spesa ricorrente per mese\n"+st.rec.map((v,i)=>ml[i]+": "+eur0(v)).join("\n")+"\nMedia: "+eur0(st.avgRec),i=>st.rec[i]>st.avgRec?"var(--c-ink)":"var(--c-mid)"),
    stra:VZ.cols(st.stra,[],"Lavori casa per mese\n"+st.stra.map((v,i)=>ml[i]+": "+eur0(v)).join("\n"),()=>"var(--amber-soft)"),
    inv:VZ.cols(st.L.map(m=>+m.investito||0),[],"Investito per mese\n"+st.L.map((m,i)=>ml[i]+": "+eur0(+m.investito||0)).join("\n"),()=>"var(--green-soft)"),
    net:VZ.stack([{v:Math.max(0,net),c:"var(--green-soft)"},{v:sp,c:"var(--amber-soft)"},{v:outTot,c:"var(--c-mid)"}],Math.max(1,inTot),[],`Entrate ${new Date().getFullYear()}: ${eur0(inTot)}\nLibero: ${eur0(net)}\nSpese: ${eur0(sp)}\nF24: ${eur0(outTot)}`)+`<div class="vzl"><span>libero</span><span>spese</span><span>F24</span></div>`};
  const monthRows=st.L.map((m,i)=>`<tr><td class="num nw">${MESI[+m.mese.slice(5)-1]} ${m.mese.slice(0,4)}</td><td class="r num">${eur0(st.rec[i])}</td><td class="r num muted">${st.stra[i]?eur0(st.stra[i]):"—"}</td><td class="r num">${eur0(+m.investito||0)}</td></tr>`).join("");
  return head+`<div class="kpis">
    <div class="kpi"><div class="l">Spesa ricorrente al mese</div><div class="v">${eur0(st.avgRec)}</div>${KS.rec}<div class="s">media di ${st.n} mesi</div></div>
    <div class="kpi"><div class="l">Lavori casa</div><div class="v">${eur0(st.straTot)}</div>${KS.stra}<div class="s">straordinari, ${st.n} mesi</div></div>
    <div class="kpi green"><div class="l">Investito al mese</div><div class="v">${eur0(st.avgInv)}</div>${KS.inv}<div class="s">Trading 212 e salvadanaio</div></div>
    <!--feat--><div class="kpi ${net<0?"alert":""}"><div class="l">Cassa libera netta ${new Date().getFullYear()}</div><div class="v">${eur0(net)}</div>${KS.net}<div class="s">entrate − F24 − spese dell'anno</div></div><!--/feat-->
   </div>
   <div class="grid">${spesePanel(inTot,outTot,{spTot,noMini:1,extra:`<section class="panel"><div class="panel-h"><h2>Mese per mese</h2><div class="spacer"></div><span class="eyebrow">ultimo mese caricato: ${MESI[+last.mese.slice(5)-1]} ${last.mese.slice(0,4)}</span></div><div class="tw"><table><thead><tr><th>Mese</th><th class="r">Spesa ricorrente</th><th class="r">Lavori casa</th><th class="r">Investito</th></tr></thead><tbody>${monthRows}</tbody></table></div></section>`})}
   </div>`}
const IPAL=["var(--cost)","var(--sky)","var(--amber-soft)","var(--green-soft)","var(--c-soft)","var(--c-mid)","var(--c-pale)"];
/** Rebalancing check on the PAC (see rebalanceCheck): band = the alert threshold set for the PAC (default 5 points). */
const rebal=c=>rebalanceCheck(c.T.map(t=>({isin:t.isin,ticker:t.ticker,valore:t.valore,target:+t.target||0,costo:+t.costo||0})),c.pac,{abs:c.soglia});
const rebalText=(c,r)=>{const o=r.out.slice().sort((a,b)=>Math.abs(b.drift)-Math.abs(a.drift))[0];const w=o?`${esc(o.ticker)} pesa ${pct(o.peso)} contro ${o.target.toLocaleString("it-IT",{maximumFractionDigits:1})}%`:"";
  if(r.action==="sell")return `${w}: i versamenti dei prossimi 3 mesi non bastano a riallinearlo. ${r.trades.filter(t=>t.amount<0).map(t=>"Vendi circa "+eur0(-t.amount)+" di "+esc(t.ticker)).join(", ")}; ${r.trades.filter(t=>t.amount>0).map(t=>"compra "+eur0(t.amount)+" di "+esc(t.ticker)).join(", ")}.${r.tax?` Tasse stimate sulle plusvalenze: ${eur0(r.tax)}.`:""}`;
  if(r.action==="contributions")return `${w}: basta indirizzare i versamenti dei prossimi ${r.months===1?"mese":r.months+" mesi"} su ${r.plan.map(p=>esc(p.ticker)+" ("+eur0(p.add)+")").join(", ")}. Nessuna vendita.`;
  return "";};
const addMonthsD=(s,n)=>{const [y,m,d]=s.split("-").map(Number);const x=new Date(y,m-1+n,1);const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();return x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(Math.min(d,last))};
function invProj(c,r){const i=Math.pow(1+r,1/12)-1;const fv=k=>c.tot*Math.pow(1+i,k)+c.pac*(i?(Math.pow(1+i,k)-1)/i:k);return fv}
function invTodos(T){const a=(S.investimenti||[]).find(isMainInv);const c=invCalc(a);if(!c)return;const today=todayISO();
  const go=`<button class="btn small" data-go-v="invest" type="button">Investimenti</button>`;
  {const r=rebal(c);if(r.action==="sell")T({lvl:"warn",ic:"%",title:"È il momento di ribilanciare il PAC",sub:rebalText(c,r),act:go});
   else if(r.action==="contributions")T({lvl:"do",ic:"%",title:"PAC: indirizza i prossimi versamenti",sub:rebalText(c,r),act:go});}
  if(a.aggiornato&&daysBetween(a.aggiornato,today)>45)T({lvl:"do",ic:"↧",title:"Aggiorna Trading 212",sub:`Valori fermi al ${dmy(a.aggiornato)}. ${env.t212?"Apri Investimenti e premi Sincronizza.":"Aggiorna i prezzi dall'app."}`,act:go});
  if(a.movimentiAl&&daysBetween(a.movimentiAl,today)<=3){const pc=pacCheck(a.mensile||{},c.p,today).slice(-2).filter(x=>x.state==="missing"||x.state==="short");
    pc.forEach(x=>T({lvl:"warn",ic:"€",title:`PAC di ${MESI[+x.m.slice(5)-1].toLowerCase()} ${x.m.slice(0,4)}: ${x.amount>0?"arrivati solo "+eur0(x.amount):"nessun versamento"}`,sub:`Attesi ${eur0(c.pac)} il ${c.p.giorno||1} del mese su Trading 212. Controlla il bonifico programmato o la ricarica.`,act:go}))}
  {const m=+today.slice(5,7),ly=+today.slice(0,4)-1,fy=(a.fiscoAnni||[]).find(x=>x.year===ly);if(fy&&m>=5&&m<=9&&(fy.tax>0||fy.ivafe>0||fy.losses>0))T({lvl:"do",ic:"€",title:`Dichiarazione ${ly+1}: dati Trading 212 del ${ly}`,sub:`Quadro RM ${eur0(fy.gains+fy.income)} (imposta circa ${eur0(fy.tax)})${fy.losses?`, RT minusvalenze ${eur0(fy.losses)}`:""}, quadro RW e IVAFE circa ${eur0(fy.ivafe||0)}. Dettagli in Investimenti → Costi e fisco.`,act:go})}
  const idle=idleCash(a.storico,today);if(idle)T({lvl:"do",ic:"€",title:`${eur0(idle.cash)} fermi sul conto Trading 212`,sub:`Liquidità non investita dal ${dmy(idle.since)}. Se non è voluta, investila con il prossimo acquisto o spostala sul conto remunerato.`,act:go})}
function donut(T,tot){const R=74,W=26,C=2*Math.PI*R;let acc=0;
  const seg=T.map((t,i)=>{const f=t.valore/tot;const s=`<circle cx="100" cy="100" r="${R}" fill="none" stroke="${IPAL[i%IPAL.length]}" stroke-width="${W}" stroke-dasharray="${Math.max(0,f*C-1.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" transform="rotate(-90 100 100)" data-tip="${esc(`${t.ticker} · ${t.nome}\nValore: ${eur(t.valore)}\nPeso: ${pct(t.peso)} (obiettivo ${t.target}%)`)}"></circle>`;acc+=f;return s}).join("");
  return `<svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Allocazione ETF">${seg}<text x="100" y="94" text-anchor="middle" font-size="11" fill="var(--muted)">Valore</text><text x="100" y="114" text-anchor="middle" font-size="19" font-weight="700" fill="var(--navy)">${eur0(tot)}</text></svg>`}
function vInvest(FX){const a=(S.investimenti||[]).find(isMainInv);
  const head=intro("I tuoi investimenti e risparmi. Per ora c'è Trading 212 (PAC in ETF); seguiranno il salvadanaio remunerato Satispay e i risparmi Revolut. Quote, valori e costi arrivano da Trading 212 in sola lettura: Cairn si aggiorna da solo una volta al giorno quando apri l'app online, oppure con Sincronizza. Rendimenti e proiezione sono stime: i rendimenti futuri non sono garantiti.");
  const c=invCalc(a);if(!c)return head+`<section class="panel empty">Nessun investimento registrato.</section>`;
  const today=todayISO(),cy=new Date().getFullYear();
  const mm=Object.entries(a.mensile||{}).sort();const ml=mm.map(([m])=>MESI[+m.slice(5)-1]+" "+m.slice(2,4));
  const K={val:VZ.stack([{v:Math.min(c.costo,c.tot),c:"var(--c-ink)"},{v:Math.max(0,c.pl),c:"var(--green-soft)"}],Math.max(c.tot,c.costo),[],`Costo di carico: ${eur(c.costo)}\nPlusvalenza latente: ${eur(c.pl)}\nValore: ${eur(c.tot)}`)+`<div class="vzl"><span>costo ${eur0(c.costo)}</span><span>+ ${eur0(c.pl)}</span></div>`,
    dep:VZ.cols(mm.map(([,v])=>v),[],"Versamenti netti per mese\n"+mm.map(([,v],i)=>ml[i]+": "+eur0(v)).join("\n"),i=>mm[i][1]<0?"var(--tax)":mm[i][1]>=c.pac?"var(--c-ink)":"var(--c-mid)"),
    pl:VZ.cols(c.T.map(t=>t.pl),[],"Plus/minus per ETF\n"+c.T.map(t=>t.ticker+": "+(t.pl>=0?"+":"−")+eur(Math.abs(t.pl))).join("\n"),i=>c.T[i].pl>=0?"var(--green-soft)":"var(--tax)"),
    pac:VZ.stack([{v:c.trasc,c:"var(--c-ink)"},{v:c.n,c:"var(--line-2)"}],c.mesiTot,[],`Mesi passati: ${c.trasc}\nMesi rimanenti: ${c.n}\nFine PAC: ${dmy(c.fine)}`)+`<div class="vzl"><span>${c.trasc} mesi</span><span>${c.n} da fare</span></div>`};
  const real=(a.realizzate||[]).reduce((s,x)=>s+(+x.importo||0),0);
  const dPill=t=>{const d=t.drift,ad=Math.abs(d);if(ad<.05)return `<span class="cdp far">0 pt</span>`;return `<span class="cdp ${ad>c.soglia?"late":ad>c.soglia/2?"soon":"far"}">${d>=0?"+":"−"}${ad.toLocaleString("it-IT",{maximumFractionDigits:1})} pt</span>`};
  const legend=c.T.map((t,i)=>`<div class="alrow"><i style="background:${IPAL[i%IPAL.length]}"></i><div class="an"><b>${esc(t.ticker)}</b> <span class="muted">${esc(t.classe||"")}</span></div><div class="ap num">${pct(t.peso)}</div><div class="at num muted">obiettivo ${t.target}%</div></div>`).join("");
  const rows=c.T.map((t,i)=>`<tr><td><span class="sw" style="background:${IPAL[i%IPAL.length]}"></span><b>${esc(t.ticker)}</b><div class="muted" style="font-size:12px">${esc(t.nome)} · ${esc(t.isin)}${t.valuta&&t.valuta!=="EUR"?" · quotato in "+esc(t.valuta):""}</div></td><td class="r num">${(+t.quote).toLocaleString("it-IT",{maximumFractionDigits:3})}</td><td class="r num">${eur(t.costo)}</td><td class="r num"><b>${eur(t.valore)}</b></td><td class="r num ${t.pl>=0?"pos":"bad"}">${t.pl>=0?"+":"−"}${eur(Math.abs(t.pl))}<div style="font-size:12px">${t.pl>=0?"+":"−"}${pct(Math.abs(t.pl/(+t.costo||1)))}</div></td><td class="r num">${pct(t.peso)}</td><td class="r num">${t.target}%</td><td class="r">${dPill(t)}</td></tr>`).join("");
  // proiezione
  const rates=[[.03,"Prudente 3%","var(--sky)"],[.05,"Medio 5%","var(--cost)"],[.07,"Dinamico 7%","var(--green-soft)"]];
  const endY=+c.fine.slice(0,4);const ys=[];for(let y=cy;y<=endY;y++)ys.push(y);
  const kAt=y=>{if(y===cy)return 0;const t=y===endY?c.fine:y+"-12-31";let k=0,d=today.slice(0,8)+pad(+c.p.giorno||1);if(d<=today)d=addMonthsD(d,1);while(d<=t&&d<=c.fine){k++;d=addMonthsD(d,1)}return k};
  const ks=ys.map(kAt);const series=[{name:"Versato",vals:ks.map(k=>c.netDep+c.pac*k),color:"var(--gold-d)",dash:"5 4",w:2}].concat(rates.map(([r,n,col])=>{const f=invProj(c,r);return {name:n,vals:ks.map(k=>f(k)),color:col,area:r===.05}}));
  const vers=c.netDep+c.pac*c.n;
  const pRows=rates.map(([r,n])=>{const v=invProj(c,r)(c.n);const g=v-vers;return `<div><span>${n}</span><b class="num">${eur0(v)}</b><small>+${eur0(g)} di guadagno · ${eur0(v-g*0.26)} netto 26%</small></div>`}).join("");
  const glide=c.anniRes<=7?`Mancano meno di 7 anni: valuta di spostare gradualmente quota azionaria verso obbligazioni (es. +5 punti l'anno) per ridurre il rischio vicino alla scadenza.`:`Orizzonte lungo (oltre ${Math.floor(c.anniRes)} anni): l'azionario al ${c.T.filter(t=>!/obblig/i.test(t.classe||"")).reduce((s,t)=>s+(+t.target||0),0)}% è coerente. Dal ${endY-7} conviene aumentare gradualmente le obbligazioni.`;
  const ivafe=c.tot*0.002;const govG=(a.realizzate||[]).filter(x=>/obblig/i.test((c.T.find(t=>t.isin===x.isin)||{}).classe||"")).reduce((s,x)=>s+(+x.importo||0),0);const taxR=(real-govG)*0.26+govG*0.125;
  const revDays=daysBetween(today,c.rev);
  return head+`<div class="acct">${logoImg("t212","Trading 212")}<div><b>Trading 212</b><span>Conto Invest · PAC in ETF · dati al ${dmy(a.aggiornato)}</span></div><div class="spacer"></div>${env.t212?`<button class="btn small primary" id="invSync" type="button">${ico("sync",14)} Sincronizza</button>`:""}</div>
  <div class="kpis">
    <div class="kpi"><div class="l">Valore portafoglio</div><div class="v">${eur0(c.tot)}</div>${K.val}<div class="s">prezzi al ${dmy(a.aggiornato)}</div></div>
    <div class="kpi"><div class="l">Versato netto</div><div class="v">${eur0(c.netDep)}</div>${K.dep}<div class="s">da ${MESI[+a.pac.inizio.slice(5,7)-1].toLowerCase()} ${a.pac.inizio.slice(0,4)} · ${mm.length} mesi</div></div>
    <div class="kpi ${c.pl>=0?"green":"red"}"><div class="l">Plus/minus latente</div><div class="v">${c.pl>=0?"+":"−"}${eur0(Math.abs(c.pl))}</div>${K.pl}<div class="s">${c.pl>=0?"+":"−"}${pct(Math.abs(c.pl/(c.costo||1)))} sul costo · ${eur0(real)} realizzati</div></div>
    <div class="kpi amber"><div class="l">PAC mensile</div><div class="v">${eur0(c.pac)}</div>${K.pac}<div class="s">il ${c.p.giorno||1}° di ogni mese · fino a ${MESI[+c.fine.slice(5,7)-1].toLowerCase()} ${c.fine.slice(0,4)}</div></div>
  </div>
  <div class="grid">
    <section class="panel c5"><div class="panel-h"><h2>Allocazione ETF</h2><div class="spacer"></div><span class="eyebrow">peso attuale</span></div><div class="panel-b"><div class="alloc">${donut(c.T,c.tot)}<div class="alist">${legend}</div></div></div></section>
    ${(()=>{const r=rebal(c);const st=r.action==="sell"?`<span class="pill late">ribilancia ora</span>`:r.action==="contributions"?`<span class="pill soon">con i versamenti</span>`:`<span class="pill ok">in linea</span>`;
      const verdict=r.action==="sell"?`<b class="bad">È il momento di ribilanciare.</b> ${rebalText(c,r)} Su Trading 212: vendi dalla pie le quote in eccesso e reinvesti subito; in alternativa aumenta per qualche mese il versamento solo sugli ETF sotto peso.`
        :r.action==="contributions"?`<b>Fuori banda, ma senza vendere.</b> ${rebalText(c,r)} Il riparto è in <b>Prossimo versamento</b>.`
        :`<b class="pos">In linea:</b> tutti gli ETF sono entro ${c.soglia} punti (e entro un quarto del loro peso) dall'obiettivo. Nessuna azione.`;
      const tr=r.action==="sell"&&r.trades.length?`<div class="tw"><table><thead><tr><th>ETF</th><th class="r">Peso</th><th class="r">Obiettivo</th><th class="r">Operazione</th></tr></thead><tbody>${r.trades.map(t=>{const h=c.T.find(x=>x.isin===t.isin)||{};return `<tr><td class="nw"><b>${esc(t.ticker)}</b></td><td class="r num">${pct(h.peso||0)}</td><td class="r num">${(+h.target||0)}%</td><td class="r num ${t.amount<0?"neg":"pos"}"><b>${t.amount<0?"vendi "+eur0(-t.amount):"compra "+eur0(t.amount)}</b></td></tr>`}).join("")}</tbody></table></div>`:"";
      return `<section class="panel c7"><div class="panel-h"><h2>Ribilanciamento</h2><div class="spacer"></div>${st}</div>
      <div class="sstrip"><div><span>Scostamento massimo</span><b class="num ${r.action!=="none"?"neg":""}">${r.maxDrift.toLocaleString("it-IT",{maximumFractionDigits:1})} pt</b><small>${esc(c.maxD.ticker)} · banda ${c.soglia} pt o un quarto del peso</small></div><div><span>Anni rimanenti</span><b class="num">${c.anniRes.toLocaleString("it-IT",{maximumFractionDigits:1})}</b><small>${c.n} versamenti da ${eur0(c.pac)}</small></div><div><span>Ancora da versare</span><b class="num">${eur0(c.pac*c.n)}</b><small>fino al ${dmy(c.fine)}</small></div><div><span>Ultimo controllo</span><b class="num">${a.aggiornato?dmy(a.aggiornato):"—"}</b><small>a ogni sincronizzazione</small></div></div>
      <!--feat-->${tr}<!--/feat--><div class="panel-b" style="border-top:1px solid var(--line-2)"><ul class="chk">
        <li><!--feat-->${verdict}<!--/feat--></li>
        <li>${glide}</li>
        <li>Il controllo gira a ogni sincronizzazione con Trading 212. Ribilanciare conviene solo quando un ETF esce dalla banda e i versamenti dei prossimi 3 mesi non bastano a riportarlo in linea: vendere costa il 26% sulle plusvalenze. Quando succede ti avviso in <b>Da fare ora</b> e con un evento sul calendario collegato.</li>
      </ul></div></section>`})()}
    <section class="panel c12" data-mfold="1"><div class="panel-h"><h2>ETF in portafoglio</h2><div class="spacer"></div><span class="eyebrow">${c.T.length} ETF ad accumulazione · domicilio Irlanda</span></div><div class="tw"><table><thead><tr><th>ETF</th><th class="r">Quote</th><th class="r">Costo</th><th class="r">Valore</th><th class="r">Plus/minus</th><th class="r">Peso</th><th class="r">Obiettivo</th><th class="r">Scostamento</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td><b>Totale</b></td><td></td><td class="r num">${eur(c.costo)}</td><td class="r num"><b>${eur(c.tot)}</b></td><td class="r num ${c.pl>=0?"pos":"bad"}">${c.pl>=0?"+":"−"}${eur(Math.abs(c.pl))}</td><td class="r num">100%</td><td class="r num">${c.T.reduce((s,t)=>s+(+t.target||0),0)}%</td><td></td></tr></tfoot></table></div></section>
    ${perfPanels(a,c,today)}
    <section class="panel c12" data-mfold="1"><div class="panel-h"><h2>Proiezione PAC fino al ${c.fine.slice(0,4)}</h2><div class="spacer"></div>${lg([["Versato","var(--gold-d)",0],...rates.map(([,n,col])=>[n,col,0])])}</div>
      <div class="panel-b chart">${svgLines(ys.map(String).map((y,i)=>i%2&&ys.length>12?"":y),series,{wide:true,label:"Proiezione PAC"})}</div>
      <div class="sstrip"><div><span>Versato a fine piano</span><b class="num">${eur0(vers)}</b><small>${eur0(c.netDep)} già versati + ${c.n} rate</small></div>${pRows}</div>
      <p class="muted" style="font-size:13px;margin:0;padding:10px 16px 14px;border-top:1px solid var(--line-2)">Rendimenti annui netti dei costi, ipotetici e costanti: i mercati non vanno in linea retta. Valori nominali, non scontati per l'inflazione. "Netto 26%" applica l'aliquota piena al guadagno (la quota in titoli di Stato paga meno).</p></section>
    <section class="panel c7" data-mfold="1"><div class="panel-h"><h2>Versamenti mese per mese</h2><div class="spacer"></div>${lg([["Versato","var(--cost)",0]])}</div><div class="panel-b chart">${svgBars(ml,[{name:"Versato",vals:mm.map(([,v])=>Math.max(0,v)),color:"var(--cost)"}],{w:860,h:300,min:400,refs:[{v:c.pac,color:"var(--gold-d)",label:"PAC "+eur0(c.pac)}],label:"Versamenti mensili"})}</div>${pacStrip(a,c,today)}</section>
    <details class="panel c5 fold"><summary class="panel-h"><h2>Costi e fisco</h2><span class="spacer"></span><span class="eyebrow">dettagli</span></summary><div class="panel-b"><ul class="chk">
      <li><b>Commissioni di deposito: ${eur(a.commDeposito)}</b>. Dal 2026 la ricarica con carta costa lo 0,7% (${eur(c.pac*0.007)} al mese, ${eur0(c.pac*0.007*12)} l'anno). Il bonifico SEPA è gratuito: conviene un bonifico programmato il 1° del mese.</li>
      <li><b>Cambio valuta: ${eur(a.commCambio)}</b>. Lo 0,15% su EIMI e RBOT, comprati sulla quotazione in dollari. Se esiste la stessa classe quotata in euro su Xetra o Borsa Italiana, il costo sparisce.</li>
      <li><b>Plusvalenze realizzate ${(a.realizzate||[])[0]?(a.realizzate[0].data.slice(0,4)):""}: ${eur(real)}</b> (ribilanciamento del ${dmy(((a.realizzate||[])[0]||{}).data)}). Trading 212 non è sostituto d'imposta: vanno nel 730/Redditi ${cy+1}, quadro RM, circa <b>${eur0(taxR)}</b> di imposta (26%, 12,5% sulla quota in titoli di Stato).</li>
      <li><b>IVAFE e quadro RW</b>: conto estero, 2‰ sul valore al 31/12, circa <b>${eur0(ivafe)}</b> per il ${cy}. Si versa con l'F24 di giugno insieme al saldo.</li>
    </ul></div>${taxTable(a)}</details>
  </div>`}
/** Real performance (from the daily Trading 212 snapshots) and the split of the next contribution. New figures: marked for the parity test. */
function perfPanels(a,c,today){const st=a.storico||[],last=st[st.length-1],cash=last&&last.cash!=null?+last.cash:null;
  const pf=pacFlows(a.mensile||{},+c.p.giorno||1,a.movimentiAl?0:c.pac,today);const irr=xirr(pf.flows,c.tot+(cash||0),today);const dz=dietz(st);
  const sg=(x,d=1)=>(x>=0?"+":"−")+pct(Math.abs(x),d);
  const pts=thin(st,24);let chart;
  if(pts.length>=2){const cats=pts.map((x,i)=>{const lab=x.d.slice(8)+"/"+x.d.slice(5,7);return pts.length>12&&i%2&&i!==pts.length-1?"":lab});
    chart=svgLines(cats,[{name:"Valore ETF",vals:pts.map(x=>x.v),color:"var(--c-ink)",area:1},{name:"Costo di carico",vals:pts.map(x=>x.c),color:"var(--gold-d)",dash:"5 4",w:2}],{wide:true,label:"Valore e costo nel tempo"})}
  else chart=`<div class="perf-empty"><b>Il grafico si costruisce da oggi.</b><span>A ogni sincronizzazione (una volta al giorno) Cairn salva valore e costo di carico: dopo qualche giorno qui vedi l'andamento reale, non una proiezione.</span></div>`;
  const s1=irr==null?`<div><span>Rendimento annuo</span><b class="num">—</b><small>serve almeno un trimestre di versamenti</small></div>`:`<div><span>Rendimento annuo stimato</span><b class="num ${irr>=0?"pos":"neg"}">${sg(irr)}</b><small>money-weighted dal ${dmy(pf.flows[0].d)}${pf.estimated?` · ${pf.estimated} ${pf.estimated===1?"mese stimato":"mesi stimati"} a ${eur0(c.pac)}`:""}</small></div>`;
  const s2=dz?`<div><span>${dz.annual!=null?"Dal primo rilevamento, annuo":"Dal primo rilevamento"}</span><b class="num ${dz.r>=0?"pos":"neg"}">${sg(dz.annual!=null?dz.annual:dz.r)}</b><small>${dz.days} giorni · ${dz.annual!=null?sg(dz.r)+" nel periodo · ":""}esclusi i versamenti</small></div>`:`<div><span>Dal primo rilevamento</span><b class="num">—</b><small>${st.length?"pronto dopo una settimana di dati":"parte dalla prima sincronizzazione"}</small></div>`;
  const s3=cash!=null?`<div><span>Liquidità sul conto</span><b class="num">${eur(cash)}</b><small>non investita · al ${dmy(last.d)}</small></div>`:`<div><span>Liquidità sul conto</span><b class="num">—</b><small>arriva con la sincronizzazione</small></div>`;
  const sp=splitContribution(c.T.map(t=>({isin:t.isin,valore:t.valore,target:+t.target||0})),c.pac);const by=Object.fromEntries(sp.map(x=>[x.isin,x]));
  const maxAfter=Math.max(...c.T.map(t=>Math.abs(by[t.isin].after*100-(+t.target||0))));
  const pr=c.T.map((t,i)=>{const x=by[t.isin];return `<tr><td class="nw"><span class="sw" style="background:${IPAL[i%IPAL.length]}"></span><b>${esc(t.ticker)}</b></td><td class="r num">${t.target}%</td><td class="r num">${pct(t.peso)}</td><td class="r num"><b>${x.add?eur0(x.add):"—"}</b></td><td class="r num">${pct(x.after)}</td></tr>`}).join("");
  return `<!--feat--><section class="panel c7" data-mfold="1"><div class="panel-h"><h2>Andamento reale</h2><div class="spacer"></div>${pts.length>=2?lg([["Valore ETF","var(--c-ink)"],["Costo di carico","var(--gold-d)",0]]):`<span class="eyebrow">dai dati di Trading 212</span>`}</div>
      <div class="sstrip sv">${s1}${s2}${s3}</div>
      <div class="panel-b chart">${chart}</div>
      <p class="muted" style="font-size:13px;margin:0;padding:10px 16px 14px;border-top:1px solid var(--line-2)">Stime, non rendiconti: il rendimento annuo pesa ogni versamento per il tempo in cui è stato investito (include la liquidità); quello dal primo rilevamento esclude gli acquisti dal guadagno (metodo Modified Dietz).</p></section>
    <section class="panel c5"><div class="panel-h"><h2>Prossimo versamento</h2><div class="spacer"></div><span class="eyebrow">${eur0(c.pac)} senza vendere</span></div>
      <div class="tw"><table><thead><tr><th>ETF</th><th class="r">Obiettivo</th><th class="r">Ora</th><th class="r">Metti</th><th class="r">Dopo</th></tr></thead><tbody>${pr}</tbody></table></div>
      <p class="muted" style="font-size:13px;margin:0;padding:10px 16px 14px;border-top:1px solid var(--line-2)">Prima colma gli ETF sotto obiettivo, poi divide il resto secondo le %. ${maxAfter<=.5?"Dopo questo versamento i pesi sono in linea.":`Dopo questo versamento lo scostamento massimo resta di ${maxAfter.toLocaleString("it-IT",{maximumFractionDigits:1})} punti: servono altri mesi.`} La pie di Trading 212 divide da sola per %: usala come acquisto manuale o per ritoccare la pie per un mese.</p></section><!--/feat-->`}
/** PAC month by month, from the real deposits (Trading 212 history). New figures: marked for the parity test. */
function pacStrip(a,c,today){if(!a.movimentiAl)return "";const pc=pacCheck(a.mensile||{},c.p,today);if(!pc.length)return "";
  const done=pc.filter(x=>x.state==="ok"||x.state==="extra").length,closed=pc.filter(x=>x.state!=="due").length,bad=pc.filter(x=>x.state==="missing"||x.state==="short");
  const ml=x=>MESI[+x.m.slice(5)-1].toLowerCase()+" "+x.m.slice(2,4),cur=pc[pc.length-1];
  const miss=bad.filter(x=>x.state==="missing"),short=bad.filter(x=>x.state==="short");
  return `<!--feat--><div class="sstrip sv"><div><span>Mesi con il PAC regolare</span><b class="num">${done} su ${closed}</b><small>da ${ml(pc[0])} · storico al ${dmy(a.movimentiAl)}</small></div><div><span>Mesi senza versamento</span><b class="num ${miss.length?"neg":""}">${miss.length}</b><small>${miss.length?miss.slice(-4).map(ml).join(", "):"nessuno"}${short.length?` · sotto ${eur0(c.pac)}: ${short.slice(-3).map(x=>ml(x)+" ("+eur0(x.amount)+")").join(", ")}`:""}</small></div><div><span>Questo mese</span><b class="num">${cur.amount>0?eur0(cur.amount):"—"}</b><small>${cur.state==="due"?"atteso il "+(c.p.giorno||1)+" del mese":cur.state==="ok"||cur.state==="extra"?"arrivato":"manca"}</small></div></div><!--/feat-->`}
/** Per-year figures for the Redditi PF, computed at sync time from the Trading 212 history. */
function taxTable(a){const Y=(a.fiscoAnni||[]).slice().sort((x,y)=>y.year-x.year);if(!Y.length)return "";
  const src={snapshot:"valore al 31/12",current:"valore di oggi (stima)",cost:"costo di carico (stima)"};
  const rwY=Y.find(x=>x.year<new Date().getFullYear()&&x.rw.length)||Y[0];
  return `<!--feat--><div class="panel-b" style="border-top:1px solid var(--line-2)"><h3 class="eyebrow" style="margin:0 0 8px">Per la dichiarazione (Redditi PF)</h3><div class="tw"><table><thead><tr><th>Anno</th><th class="r">RM</th><th class="r">RT</th><th class="r">Imposta</th><th class="r">IVAFE</th></tr></thead><tbody>${Y.map(y=>`<tr><td class="num"><b>${y.year}</b></td><td class="r num" data-tip="${esc(`Plusvalenze ETF: ${eur(y.gains)}${y.govGains?` (di cui titoli di Stato ${eur(y.govGains)})`:""}\nInteressi e dividendi: ${eur(y.income)}`)}">${eur0(y.gains+y.income)}</td><td class="r num">${y.losses?eur0(y.losses):"—"}</td><td class="r num">${eur0(y.tax)}</td><td class="r num" data-tip="${esc(y.valueSource?"Su "+src[y.valueSource]+": "+eur(y.valueEnd):"")}">${y.ivafe!=null?eur0(y.ivafe):"—"}</td></tr>`).join("")}</tbody></table></div>
    ${rwY&&rwY.rw.length?`<h3 class="eyebrow" style="margin:14px 0 8px">Quadro RW ${rwY.year} · un rigo per ETF</h3><div class="tw"><table><thead><tr><th>ETF</th><th class="r">Quote</th><th class="r">Valore</th><th class="r">Giorni</th></tr></thead><tbody>${rwY.rw.map(r=>`<tr><td><b>${esc(r.ticker)}</b><div class="muted" style="font-size:12px">${esc(r.isin)}</div></td><td class="r num">${r.units.toLocaleString("it-IT",{maximumFractionDigits:3})}</td><td class="r num">${eur(rwY.valueSource==="cost"?r.cost:r.value??r.cost)}</td><td class="r num">${r.days}</td></tr>`).join("")}</tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0">Valori: ${src[rwY.valueSource]||"—"}.</p>`:""}
    <p class="muted" style="font-size:12px;margin:8px 0 0">Stime da verificare con il commercialista. RM: plusvalenze su ETF armonizzati, interessi e dividendi (26%, 12,5% sulla quota in titoli di Stato). RT: minusvalenze, compensabili solo con altri redditi diversi. IVAFE 2‰ in proporzione ai giorni di possesso.</p></div><!--/feat-->`}
/** History (permission "History") → account fields; null if absent or not complete enough to replace what Cairn already has. */
function histPatch(a,body,next,storico,today){if(!body||!body.history)return null;const acc=accountFromHistory(body.history);if(!historyCovers(acc,a))return null;
  const T=next||a.titoli||[];const tick=Object.fromEntries(T.map(t=>[t.isin,t.ticker])),cls=Object.fromEntries(T.map(t=>[t.isin,t.classe||""]));
  const fiscoAnni=taxByYear(body.history,{isGov:i=>/obblig/i.test(cls[i]||""),yearEnd:y=>yearEndValues(storico,y),current:Object.fromEntries(T.map(t=>[t.isin,t.quote*t.prezzoEur])),today,tickers:tick});
  return {mensile:acc.mensile,depositi:acc.depositi,prelievi:acc.prelievi,commDeposito:Math.max(acc.commDeposito,+a.commDeposito||0),commCambio:Math.max(acc.commCambio,+a.commCambio||0),realizzate:acc.realizzate.length||!(a.realizzate||[]).length?acc.realizzate:a.realizzate,proventi:acc.proventi,fiscoAnni,movimentiAl:today}}
const HIST_MSG={scope:"la chiave non ha il permesso «History»",rate:"Trading 212 chiede di riprovare tra un minuto",too_long:"lo storico è troppo lungo da leggere in una volta",error:"Trading 212 non ha risposto"};
/** Monthly reminder: import last month's statements (from the 3rd, once last month is closed). */
function speseTodos(T){const st=speseStats();if(!st||!S.writable)return;const today=todayISO();if(+today.slice(8,10)<3)return;
  const d=new Date(+today.slice(0,4),+today.slice(5,7)-2,1),prev=d.getFullYear()+"-"+pad(d.getMonth()+1),last=st.L[st.L.length-1].mese;
  if(last<prev)T({lvl:"do",ic:"↧",title:`Importa i movimenti di ${MESI[d.getMonth()].toLowerCase()}`,sub:`Spese ferme a ${MESI[+last.slice(5)-1].toLowerCase()} ${last.slice(0,4)}. Scarica l'estratto UniCredit e quello Revolut (PDF o CSV) e caricali in Spese → Importa movimenti.`,act:`<button class="btn small" data-go-v="spese" type="button">Spese</button>`})}
/* ---- Spese › Importa movimenti: statements read on the device, only monthly totals saved ---- */
let SI=null;
const SI_KIND={"unicredit-pdf":["UniCredit","estratto conto PDF"],"revolut-pdf":["Revolut","estratto PDF"],"revolut-csv":["Revolut","CSV"]};
function openSpeseImport(){SI={files:[],tx:[],over:{},learn:{},pick:{},busy:false};
  sheet("Importa movimenti",`<section class="panel"><div class="panel-b"><p class="muted" style="margin:0 0 12px;font-size:13px">Estratti <b>UniCredit</b> (PDF) e <b>Revolut</b> (PDF o CSV), anche più file insieme. Vengono letti su questo dispositivo: Cairn salva solo i totali del mese per categoria, mai i movimenti. Giroconti tra i tuoi conti, F24 e investimenti restano fuori dalle spese.</p>
   <label class="btn primary" for="siFile" style="display:inline-flex">${ico("plus",14)} Scegli i file</label><input id="siFile" type="file" multiple accept=".pdf,.csv,application/pdf,text/csv" class="vh"></div><div id="siBody"></div></section>`,`<button class="btn primary" id="siSave" type="button" disabled>Salva</button>`);
  $("#siFile").onchange=e=>{siRead([...e.target.files]);e.target.value=""};$("#siSave").onclick=siSave}
async function siRead(files){const body=$("#siBody");if(!body)return;SI.busy=true;body.innerHTML=`<div class="panel-b muted">Lettura di ${files.length} file…</div>`;
  for(const f of files){try{let kind,txs,text;
      if(/\.pdf$/i.test(f.name)||f.type==="application/pdf"){const rows=await pdfToRows(await loadPdfLib(),await f.arrayBuffer());text=rows.map(r=>r.text).join("\n");kind=detect(f.name,rows.slice(0,150).map(r=>r.text).join("\n"));
        txs=kind==="unicredit-pdf"?parseUniCredit(rows):kind==="revolut-pdf"?parseRevolutPdf(rows.map(r=>r.text)):null}
      else{text=await f.text();kind=detect(f.name,text.split(/\r?\n/)[0]||"");txs=kind==="revolut-csv"?parseRevolutCsv(text):null}
      if(!kind||!txs){SI.files.push({name:f.name,err:"formato non riconosciuto: servono estratti UniCredit o Revolut"});continue}
      if(!txs.length){SI.files.push({name:f.name,err:"nessun movimento trovato"});continue}
      const per=statementPeriod(kind,text,txs);const src=SI_KIND[kind][0];
      if(SI.files.some(x=>x.src===src&&x.from===per.from&&x.to===per.to)){SI.files.push({name:f.name,err:"stesso periodo di un file già caricato"});continue}
      SI.files.push({name:f.name,kind,src,from:per.from,to:per.to,n:txs.length});SI.tx.push(...txs)}
    catch(e){console.warn(e);SI.files.push({name:f.name,err:"non leggibile ("+String(e&&e.message||e).slice(0,60)+")"})}}
  SI.busy=false;siRender()}
function siPlan(){const learned=[...(cfg().speseRegole||[]),...Object.entries(SI.learn).map(([k,c])=>({k,c}))];
  const T=SI.tx.map((t,i)=>({...t,i,c:SI.over[i]??categorize(t,learned)}));const imp={};
  for(const src of ["UniCredit","Revolut"]){const fs=SI.files.filter(f=>f.src===src);if(fs.length)imp[src]={months:aggregate(T.filter(t=>t.source===src)),periods:fs.map(f=>({from:f.from,to:f.to}))}}
  const plan=planMonths(imp,(S.spese||[]).map(m=>({mese:m.mese,cat:m.cat||{},investito:+m.investito||0,fonti:m.fonti||"",perFonte:m.perFonte||{}})),todayISO());
  plan.forEach(p=>{if(!(p.mese in SI.pick))SI.pick[p.mese]=(p.state==="update"||(p.state==="new"&&!p.missing))});return {T,plan}}
function siRender(){const body=$("#siBody");if(!body)return;const {T,plan}=siPlan();
  const fl=SI.files.map(f=>`<tr><td>${esc(f.name)}</td><td>${f.err?`<span class="bad">${esc(f.err)}</span>`:`${esc(f.src)} · ${esc(SI_KIND[f.kind][1])}`}</td><td class="num">${f.err?"":dmy(f.from)+" – "+dmy(f.to)}</td><td class="r num">${f.err?"":f.n}</td></tr>`).join("");
  const ST={new:"nuovo",update:"aggiorna",same:"già uguale",partial:"mese non completo",["needs-other"]:"serve anche"};
  const mrow=p=>{const can=p.next&&p.state!=="same";const lab=MESI[+p.mese.slice(5)-1]+" "+p.mese.slice(0,4);
    const note=p.state==="needs-other"?`salvato prima con ${esc(p.before.fonti)}: carica anche ${esc(p.missing.join(", "))}`:p.state==="partial"?"il file non copre tutto il mese":p.missing?`manca ${esc(p.missing.join(", "))}`:p.state==="update"?`prima ${eur0(p.prevTotal)}`:"";
    return `<tr><td>${can?`<input type="checkbox" data-sipick="${p.mese}" ${SI.pick[p.mese]?"checked":""} aria-label="Salva ${lab}">`:""}</td><td class="num"><b>${lab}</b></td><td>${p.next?esc(p.next.fonti):"—"}</td><td class="r num">${p.next?eur0(p.total):"—"}</td><td class="r num">${p.next?eur0(p.next.investito):"—"}</td><td><span class="pill ${p.state==="new"||p.state==="update"?"":"quiet"}">${ST[p.state]}${p.state==="needs-other"?" "+esc(p.missing.join(", ")):""}</span> <span class="muted" style="font-size:12px">${note}</span></td></tr>`};
  const sel=new Set(plan.filter(p=>SI.pick[p.mese]).map(p=>p.mese));
  const chk=T.filter(t=>t.amount<0&&sel.has(t.date.slice(0,7))&&t.c==="Altro").slice(0,60);
  const opts=c=>CATEGORIES.map(k=>`<option ${k===c?"selected":""}>${esc(k)}</option>`).join("");
  const crow=t=>`<tr><td class="num">${dmy(t.date)}</td><td>${esc(t.text.slice(0,90))}<div class="muted" style="font-size:12px">${esc(t.source)}</div></td><td class="r num">${eur(-t.amount)}</td><td><select class="in" data-sicat="${t.i}" aria-label="Categoria">${opts(t.c)}</select></td></tr>`;
  body.innerHTML=(SI.files.length?`<div class="tw"><table><thead><tr><th>File</th><th>Tipo</th><th>Periodo</th><th class="r">Movimenti</th></tr></thead><tbody>${fl}</tbody></table></div>`:"")
   +(plan.length?`<div class="panel-b" style="border-top:1px solid var(--line-2)"><h3 class="eyebrow" style="margin:0 0 8px">Mesi trovati</h3><div class="tw"><table><thead><tr><th></th><th>Mese</th><th>Fonti</th><th class="r">Spese</th><th class="r">Investito</th><th>Stato</th></tr></thead><tbody>${plan.map(mrow).join("")}</tbody></table></div></div>`:"")
   +(chk.length?`<div class="panel-b" style="border-top:1px solid var(--line-2)"><h3 class="eyebrow" style="margin:0 0 8px">Da controllare · ${chk.length} movimenti senza categoria</h3><p class="muted" style="margin:0 0 8px;font-size:13px">Scegli la categoria: Cairn la ricorda per lo stesso esercente nei prossimi import.</p><div class="tw"><table><thead><tr><th>Data</th><th>Movimento</th><th class="r">Importo</th><th>Categoria</th></tr></thead><tbody>${chk.map(crow).join("")}</tbody></table></div></div>`:"");
  body.querySelectorAll("[data-sipick]").forEach(c=>c.onchange=()=>{SI.pick[c.dataset.sipick]=c.checked;siRender()});
  body.querySelectorAll("[data-sicat]").forEach(c=>c.onchange=()=>{const t=SI.tx[+c.dataset.sicat];SI.over[+c.dataset.sicat]=c.value;const k=merchantKey(t.text);if(k)SI.learn[k]=c.value;siRender()});
  const n=plan.filter(p=>SI.pick[p.mese]&&p.next&&p.state!=="same").length;const b=$("#siSave");if(b){b.disabled=!n;b.textContent=n?`Salva ${n} ${n===1?"mese":"mesi"}`:"Salva"}}
async function siSave(){if(SI.busy)return;const {plan}=siPlan();
  // Months already equal but saved before the per-bank split: store the split too, so a later single-bank import can update them.
  const go=plan.filter(p=>p.next&&((SI.pick[p.mese]&&p.state!=="same")||(p.state==="same"&&!Object.keys((p.before||{}).perFonte||{}).length)));if(!go.length)return;
  const learned=Object.entries(SI.learn).map(([k,c])=>({k,c}));
  const ok=await write(async db=>{for(const p of go){const ex=(S.spese||[]).find(m=>m.mese===p.mese);const n=p.next;
      const doc={mese:n.mese,cat:n.cat,investito:n.investito,fonti:n.fonti,note:"Da estratti conto; esclusi giroconti, F24 e investimenti"+(p.missing?` · manca ${p.missing.join(", ")}`:""),perFonte:n.perFonte};
      await db.doc("spese/"+(ex?ex.id:n.mese)).set(doc)}
    if(learned.length){const keep=(cfg().speseRegole||[]).filter(r=>!SI.learn[r.k]);await saveCfg(db,{speseRegole:[...keep,...learned]})}},
    `${go.filter(p=>p.state!=="same").length||go.length} ${go.length===1?"mese salvato":"mesi salvati"}`);
  if(ok)closeSheet()}
/* ---- E-invoice files from Gmail (inbox read by the runtime): match, attach, mark as sent to SdI ---- */
function inboxRefs(){return (S.invoices||[]).map(v=>{const t=tot(v),c=clientById(v.cliente)||{};return {id:v.id,n:+v.n,anno:+v.anno,data:v.data,cliente:v.cliente,documento:t.documento,imponibile:t.imponibile,clienteIds:[c.idFiscale].filter(Boolean),hasFile:!!v.pdf}})}
/** Attaches a file from the inbox to its invoice (found from the file's data, or the one chosen by hand).
 *  A PDF replaces an XML/P7M already attached (the PDF is what you open); otherwise an existing file is kept. */
async function inboxAttach({bytes,filename,mime,data,received,invoiceId}){
  let id=invoiceId;if(!id){const m=matchInvoice(data,inboxRefs());if(!m.ok)return {ok:false,reason:m.reason};id=m.id}
  const v=(S.invoices||[]).find(x=>x.id===id);if(!v)return {ok:false,reason:"fattura non trovata"};
  const isPdf=mime==="application/pdf";
  if(v.pdf&&!(isPdf&&/\.(xml|p7m)$/i.test(v.pdf.nome||"")))return {ok:true,id:v.id,num:v.num,skipped:true};
  if(!assetsCap)return {ok:false,reason:"caricamento file non disponibile"};
  let r;try{r=await assetsCap.upload(new File([bytes],filename,{type:mime}))}catch(e){return {ok:false,reason:"caricamento non riuscito"}}
  const patch={pdf:{id:r.id,url:r.url,nome:filename}};if(!emessa(v))patch.emessaSdi=String(received||todayISO()).slice(0,10);
  return await write(db=>db.doc("invoices/"+v.id).update(patch),null)?{ok:true,id:v.id,num:v.num}:{ok:false,reason:"salvataggio non riuscito"}}
function inboxTodos(T){const P=S.inboxPending||[];if(!P.length||!env.inbox)return;
  T({lvl:"warn",ic:"📎",title:P.length>1?`${P.length} fatture elettroniche da Gmail da abbinare`:`Fattura elettronica da Gmail da abbinare`,sub:P.slice(0,3).map(p=>`${esc(p.filename)}: ${esc(p.reason)}`).join(" · "),act:`<button class="btn small" data-inbox-open="1" type="button">Abbina</button>`})}
function openInboxSheet(){const P=S.inboxPending||[];if(!P.length){closeSheet();return}
  const inv=[...(S.invoices||[])].sort((a,b)=>(b.data||"").localeCompare(a.data||""));const cn=id=>(clientById(id)||{nome:id}).nome;
  const opts=p=>`<option value="">Scegli la fattura…</option>`+inv.map(v=>`<option value="${esc(v.id)}" ${p.candidate===v.id?"selected":""}>${esc(v.num)} · ${esc(cn(v.cliente))} · ${eur(tot(v).documento)}${v.pdf?" · ha già un file":""}</option>`).join("");
  sheet("Fatture elettroniche da Gmail",`<section class="panel"><div class="panel-b"><p class="muted" style="margin:0 0 12px;font-size:13px">Questi file sono arrivati da Gmail ma non corrispondono a una fattura di Cairn. Scegli la fattura a cui allegarli, oppure ignorali.</p></div>
   <div class="tw"><table><thead><tr><th>File</th><th>Motivo</th><th>Fattura</th><th></th></tr></thead><tbody>${P.map(p=>`<tr><td>${esc(p.filename)}<div class="muted" style="font-size:12px">${p.data?`n. ${esc(p.data.numero)} del ${dmy(p.data.data)}${p.data.totale!=null?" · "+eur(p.data.totale):""}`:""}</div></td><td class="muted" style="font-size:13px">${esc(p.reason)}</td><td><select class="in" data-inbox-sel="${esc(p.id)}" aria-label="Fattura per ${esc(p.filename)}">${opts(p)}</select></td><td style="white-space:nowrap"><button class="btn small primary" data-inbox-ok="${esc(p.id)}" type="button">Allega</button> <button class="btn small ghost" data-inbox-no="${esc(p.id)}" type="button">Ignora</button></td></tr>`).join("")}</tbody></table></div></section>`);
  document.querySelectorAll("[data-inbox-ok]").forEach(b=>b.onclick=async()=>{const id=b.dataset.inboxOk,sel=document.querySelector(`[data-inbox-sel="${id}"]`);if(!sel||!sel.value){toast("Scegli la fattura");return}
    b.disabled=true;if(await env.inbox.attach(id,sel.value)){toast("File allegato");openInboxSheet()}else{b.disabled=false;toast("Non riuscito: riprova")}});
  document.querySelectorAll("[data-inbox-no]").forEach(b=>b.onclick=async()=>{b.disabled=true;if(await env.inbox.ignore(b.dataset.inboxNo))openInboxSheet()})}
function openInvRev(){const a=(S.investimenti||[]).find(isMainInv);const c=invCalc(a);if(!c)return;
  sheet("Rivedi suddivisione PAC",`<section class="panel"><div class="panel-b"><p class="muted" style="margin:0 0 12px;font-size:13px">Imposta le percentuali obiettivo (totale 100%), come nella pie di Trading 212. Salvando, la revisione risulta fatta oggi e la prossima scade tra i mesi indicati.</p><div class="tw"><table><thead><tr><th>ETF</th><th class="r">Peso attuale</th><th class="r">Obiettivo %</th></tr></thead><tbody>${c.T.map(t=>`<tr><td><b>${esc(t.ticker)}</b> <span class="muted">${esc(t.classe||"")}</span></td><td class="r num">${pct(t.peso)}</td><td class="r"><input class="in num" style="max-width:90px" data-tg="${esc(t.isin)}" inputmode="decimal" value="${t.target}"></td></tr>`).join("")}</tbody><tfoot><tr><td><b>Totale</b></td><td></td><td class="r num"><b id="tgSum"></b></td></tr></tfoot></table></div>
   <div class="fields" style="margin-top:14px"><div class="f s2"><label for="ip-imp">PAC € / mese</label><input id="ip-imp" class="in num" inputmode="decimal" value="${c.pac}"></div><div class="f s2"><label for="ip-g">Giorno del mese</label><input id="ip-g" class="in num" inputmode="numeric" value="${c.p.giorno||1}"></div><div class="f s2"><label for="ip-m">Revisione ogni (mesi)</label><input id="ip-m" class="in num" inputmode="numeric" value="${c.p.revisioneMesi||6}"></div><div class="f s2"><label for="ip-s">Allerta scostamento (punti)</label><input id="ip-s" class="in num" inputmode="decimal" value="${c.soglia}"></div></div></div></section>`,`<button class="btn primary" id="ipSave" type="button">Salva revisione</button>`);
  const upd=()=>{const s=[...document.querySelectorAll("[data-tg]")].reduce((a,i)=>a+readNum(i.value),0);const el=$("#tgSum");el.textContent=s.toLocaleString("it-IT",{maximumFractionDigits:1})+"%";el.className=Math.abs(s-100)>.05?"bad":"pos";return s};upd();
  document.querySelectorAll("[data-tg]").forEach(i=>i.addEventListener("input",upd));
  $("#ipSave").onclick=async()=>{if(Math.abs(upd()-100)>.05){toast("Le percentuali devono sommare 100%");return}
    const tg=Object.fromEntries([...document.querySelectorAll("[data-tg]")].map(i=>[i.dataset.tg,readNum(i.value)]));
    const titoli=a.titoli.map(t=>({...t,target:tg[t.isin]??t.target}));const pac={...a.pac,importo:readNum($("#ip-imp").value)||c.pac,giorno:Math.min(28,Math.max(1,parseInt($("#ip-g").value)||1)),revisioneMesi:Math.max(1,parseInt($("#ip-m").value)||6),soglia:readNum($("#ip-s").value)||5,ultimaRevisione:todayISO()};
    if(await write(db=>db.doc("investimenti/trading212").update({titoli,pac}),"Revisione salvata"))closeSheet()}}
/** Trading 212 → Cairn: read positions (read-only key on the server), show what changes, apply on confirmation. */
const T212_MSG={t212_not_configured:"La chiave di Trading 212 non è ancora impostata sul server (Vercel → T212_API_KEY e T212_API_SECRET).",t212_bad_key:"Trading 212 ha rifiutato la chiave: rigenerala nell'app e aggiornala su Vercel.",t212_scope:"La chiave di Trading 212 non ha il permesso «Portfolio»: rigenerala con i permessi di sola lettura indicati.",t212_rate:"Trading 212 chiede di aspettare qualche secondo: riprova.",t212_unreachable:"Trading 212 non risponde in questo momento: riprova più tardi.",unauthorized:"Sessione scaduta: esci e rientra.",forbidden:"Il tuo account è in sola lettura."};
async function openT212Sync(){const a=(S.investimenti||[]).find(isMainInv);if(!a||!env.t212)return;
  if(!navigator.onLine){toast("Serve internet per leggere Trading 212");return}
  const b=$("#invSync");if(b){b.disabled=true;b.textContent="Lettura…"}
  let res;try{res=await env.t212({history:true})}catch(e){res={status:0,body:{code:"t212_unreachable"}}}finally{if(b){b.disabled=false;b.innerHTML=`${ico("sync",14)} Sincronizza`}}
  if(res.status!==200){toast(T212_MSG[res.body&&res.body.code]||"Sincronizzazione non riuscita");return}
  let d;try{d=applyPositions(a.titoli||[],res.body.positions||[])}catch(e){toast(e.message);return}
  const q=x=>x==null?"—":Number(x).toLocaleString("it-IT",{maximumFractionDigits:3});
  const row=c=>`<tr><td><b>${esc(c.ticker)}</b><div class="muted" style="font-size:12px">${esc(c.isin)}</div></td><td class="r num" data-l="Quote"><span>${c.before?q(c.before.quote):"—"} → <b>${c.after?q(c.after.quote):"0"}</b></span></td><td class="r num" data-l="Valore"><span>${c.before?eur(c.before.quote*c.before.prezzoEur):"—"} → <b>${c.after?eur(c.after.quote*c.after.prezzoEur):"—"}</b></span></td><td class="r num" data-l="Costo"><span>${c.after?eur(c.after.costo):"venduto"}</span></td></tr>`;
  const tot=d.next.reduce((s,t)=>s+t.quote*t.prezzoEur,0);
  const storico=addSnapshot(a.storico,snapshotOf(d.next,res.body.cash,todayISO()));const hp=histPatch(a,res.body,d.next,storico,todayISO());
  const hNote=hp?`<p class="muted" style="margin:12px 0 0;font-size:13px"><b>Storico letto:</b> ${Object.keys(hp.mensile).length} mesi di versamenti (netto ${eur0(hp.depositi-hp.prelievi)}), ${hp.realizzate.length} vendite, commissioni ${eur(hp.commDeposito+hp.commCambio)}. Aggiorno anche versamenti, commissioni e dati fiscali.</p>`
    :res.body.historyError?`<p class="muted" style="margin:12px 0 0;font-size:13px">Storico non letto: ${HIST_MSG[res.body.historyError]||"errore"}. Versamenti e dati fiscali restano quelli di prima.</p>`
    :res.body.history?`<p class="muted" style="margin:12px 0 0;font-size:13px">Lo storico di Trading 212 ha meno versamenti di quelli già in Cairn: non lo applico.</p>`:"";
  sheet("Sincronizza Trading 212",`<section class="panel t212s"><div class="panel-b"><p class="muted" style="margin:0 0 12px;font-size:13px">Dati letti adesso da Trading 212 (sola lettura). Controlla e conferma: aggiorno quote, valore e costo di ogni ETF. Obiettivi e classi restano i tuoi.</p>
   <div class="sstrip"><div><span>Valore ETF</span><b class="num">${eur(tot)}</b><small>${d.next.length} posizioni</small></div>${res.body.cash!=null?`<div><span>Liquidità sul conto</span><b class="num">${eur(res.body.cash)}</b><small>non investita</small></div>`:""}${res.body.total!=null?`<div><span>Totale conto</span><b class="num">${eur(res.body.total)}</b><small>secondo Trading 212</small></div>`:""}</div>${hNote}</div>
   ${d.changed.length?`<div class="tw"><table><thead><tr><th>ETF</th><th class="r">Quote</th><th class="r">Valore</th><th class="r">Costo</th></tr></thead><tbody>${d.changed.map(row).join("")}</tbody></table></div>`:`<div class="panel-b"><b>Già allineato:</b> nessuna differenza rispetto a Cairn.</div>`}</section>`,
   d.changed.length?`<button class="btn primary" id="t212Ok" type="button">Applica</button>`:"");
  const ok=$("#t212Ok");if(ok)ok.onclick=async()=>{if(await write(db=>db.doc("investimenti/"+a.id).update({titoli:d.next,aggiornato:todayISO(),storico,...(hp||{})}),"Trading 212 sincronizzato"))closeSheet()};
  if(!d.changed.length)await write(db=>db.doc("investimenti/"+a.id).update({aggiornato:todayISO(),storico,...(hp||{})}),a.aggiornato!==todayISO()||hp?"Trading 212: già allineato"+(hp?", storico aggiornato":""):null)}
/** Daily automatic sync (called once per app start, online): applies quietly when only units, prices and costs change;
 *  a new or sold ETF is left to the manual preview. Always records today's snapshot. Returns "ok", "review" or "skip". */
async function autoT212(){const a=(S.investimenti||[]).find(isMainInv);const today=todayISO();
  if(!a||!env.t212||!S.writable||!navigator.onLine||(a.storico||[]).some(x=>x.d===today))return "skip";
  let res;try{res=await env.t212({history:true})}catch(e){return "skip"}
  if(!res||res.status!==200)return "skip";
  let d;try{d=applyPositions(a.titoli||[],res.body.positions||[])}catch(e){return "skip"}
  if(d.changed.some(x=>!x.before||!x.after))return "review";
  const storico=addSnapshot(a.storico,snapshotOf(d.next,res.body.cash,today));const hp=histPatch(a,res.body,d.next,storico,today);
  return await write(db=>db.doc("investimenti/"+a.id).update({titoli:d.next,aggiornato:today,storico,...(hp||{})}),d.changed.length?"Trading 212 aggiornato":null)?"ok":"skip"}
function openInvPrices(){const a=(S.investimenti||[]).find(isMainInv);if(!a)return;
  sheet("Aggiorna prezzi Trading 212",`<section class="panel"><div class="panel-b"><p class="muted" style="margin:0 0 12px;font-size:13px">Inserisci il prezzo in euro di ogni ETF (lo trovi nell'app Trading 212). Serve solo se Trading 212 non risponde: le quote restano quelle attuali e si aggiornano con Sincronizza.</p><div class="tw"><table><thead><tr><th>ETF</th><th class="r">Quote</th><th class="r">Prezzo €</th></tr></thead><tbody>${a.titoli.map(t=>`<tr><td><b>${esc(t.ticker)}</b> <span class="muted">${esc(t.nome)}</span></td><td class="r num">${(+t.quote).toLocaleString("it-IT",{maximumFractionDigits:3})}</td><td class="r"><input class="in num" style="max-width:110px" data-px="${esc(t.isin)}" inputmode="decimal" value="${String(t.prezzoEur).replace(".",",")}"></td></tr>`).join("")}</tbody></table></div>
   <div class="fields" style="margin-top:14px"><div class="f s2"><label for="px-d">Prezzi al</label><input id="px-d" type="date" value="${todayISO()}"></div></div></div></section>`,`<button class="btn primary" id="pxSave" type="button">Salva</button>`);
  $("#pxSave").onclick=async()=>{const px=Object.fromEntries([...document.querySelectorAll("[data-px]")].map(i=>[i.dataset.px,readNum(i.value)]));if(Object.values(px).some(v=>!(v>0))){toast("Inserisci tutti i prezzi");return}
    const titoli=a.titoli.map(t=>({...t,prezzoEur:px[t.isin],valore:r2(t.quote*px[t.isin])}));
    if(await write(db=>db.doc("investimenti/trading212").update({titoli,aggiornato:$("#px-d").value||todayISO()}),"Prezzi aggiornati"))closeSheet()}}
const LOGOS={"satispay": "data:image/png;base64,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", "unicredit": "data:image/png;base64,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", "t212": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAIAAABt+uBvAAAKE0lEQVR42u2c23MUxxXGz+me216l1a4AYYNBxoBUBoQFAklru2xcBbGpYBspr6lU5SF/Qh7zlD8hr35NjE2ci+0kcspQCDA2F0PACcZOAQYSFavVSnuZmZ3pPnlYFDuOjadnZ+SYzJQemWHm669Pf+c3PYvbRyYhOb7+YIkEiUCJQIlAiUCJQIlAiUCJQMmRCJQIlAiUCJQIlAiUCPR/dWgr/18SYwgARGqnIRIASvmgC4So2XUCJE2H4BIhoO8jSGFllZX9LgmEjLmt6uj3quMHhZlTOpW79b733iyc+6M000DyARSIGON2ozay78ZPfg4SQPUZGdR3TOAvvN4LMyKVW7G5tnICIREwbe65H4FP2HKJc7XThaC0Obfvh70X38UVnGVsxezDnGZ98257cAhdQZoOyJT+SNPRFfbgcH3zbuY0ibEHSqCOgypPToOG4SsISdCwUp5+4ByEjLt2a/3w0uOTYAtiPKwNOdhiadtka/0Qd21A9oAIRIjouZWJlyitoxRdSS0FpY3KxMvouYT4QAiEyDzXXfVIbXQ/OJK6G3ZCBo6sje53V61nngvxa8Titw9jbqs6dlAUcuj73T4SIvq+KOSqYweZ26L4ZxmL3T/C9/PF+b2HoE2RPA8hgzbN7z3k54sofAD8DgtEjHGnURt5zhtYg20/mhmBiG3fGxiojTzHnUbc6328V0cppZmulKdAEGGE0xZAUGVyShqpuCM1i9M+nDuNpaEJe+MWdP0oV2Vk6Pr24Jal4QnuNELnhm/bQUSErPLkNCBE34ITAUKl/ANCFmt/H5tAyLjbag7uqA/tBkdEPsjEODiiPry7Obidu634QmNc1yVEFF5lcgoM3mU4vE9oBINXJqdQePGFxngEQmRtxxnYtLjzGXBkTAsNMQaOXBx51hl4lLWdmEJjPLeOjLXt+fFDMpeKM6ogCl/mU/N7D7G2HVNoZLGUH7/tFdZUx14Al2INu4QMXKqOHfQKa5jfjmMkWBzOZ05zYdcBv7+Inhdvu4SInuevKi6M7o8JEkV/RZRCpPOViZfBoxVouAkRPKpMHBbpfByrAYvaPpzbjcVtT7vrNiiFQ5QCUrz3w3d6L8xASmXhQ4au767fsLjtaW5HHxojFghJkqZXytNAyoULJPQf/1X/8V+CBOXKRVApT5OmY9QvPFjk1af+2K7m5h3g+MErApIkS0t/fDl980r65l/TH18CSwveZBFj4PjNzTvqj+2KvBJF6yBEkh3wrDaSBMCgNPsq+h4Kr3/2iOpyhJ/jahntWhZhA4ncbbXWDS1tK6uBZ5JkaMatmz2XjkkzLc10z6Vj5q2bZGrB8f4yri631g1xtxXh0hmZQIQMPXd+4mVKG0qrCRKBgaVTv9aaNWKcGOfNxeKpo6Cj0tsLlIIyxvzES+i5EYYvFpV9mOe6/esWdu1X6y2ISNe0ykLh7NvSyiBJJCmtTOHs29rdKula8E6903ksjB5w+9dFiKtZVPZZBs959BV6CyQJJit88JYxf0dqBhABkdQMo/qPwgdvgclUahmi74u+fHXshQhxdTRXQeH7ueL8+IuK4JmIc2w4xdNvSMP6txZIUhpW8fQbWHeIaxA4Mizj6hf9XB8K/39FoA45rI086w0MKIFnlBIs3nPxWOr2x9JIfT6biKSRSt251nvxXbCYAlTt4Oq1a2sj+6IijREIhCSlkaqUp0GAEngm5NCWpdnXiGtfqsdIRFwrzb4GbUnIVa4JIOAero4iNLKu7cO43VgaGrcHtyr3FhbPXj2X/fSCMDNfXtFJCjOT+fuH2b+dDdF52I8O1YfGuR3BO4+uHURAiMvgWWnEEABKJ15FKb96ViKilP0nXgUCtexHEhDulqcJEejbdVAHPG/cXh/aowaeSZKlWdev9Vw5KazMVxoEpRBWJv/RSev6NbIUQ6Mj6sN7WhsjwNVdvinvgOfDYHHlcMixdPJ15jTvIysxztxW6eRrwJVDI1i8Mnm4e1zdhUAd8Lzm0cWd+8BWDYe6PjfXe2FGpDL3WaRQSmFlCudn9H/OkaGrhUZb1nbuc9YMdomrWRf2Yaxtz+/9vsynlcAzkgQT+977rb54l7h+35hDxHVtqdJ35jdgoFpoFL7Mp7vH1Sy8ffy2V1hd3XNQETwTaRqrNYpnfifN9Dc+M5KUZrp45ves1iBNpfPo4Oo9B73Caua3Q5uIhbeP01x4Yr+/qqQEnlFKsFjh/Iw5d13q5jc/MJHUTXPueuH8n8BS6Tzu4erSwhP7mdMMbaKQp6EUIp2rTB5WBc/EONpe8eTrpJsB6y4SkW4WTx5F21MKx/dw9eRhkc6FxtVhBLoHnh9/yl2/MUQ4zF0+nb5xRZipoCs3SWGm0jeu5C6fUlsu7+HqjYuPPxUaV4cRCInCgWdCBhJKs0fCVATE0uyR7nA1rYRAnerT2DTa3LJTFTyDpaU/uZy7ekZaGaV9PSiltDK5q++nP/kLWBqSIq7esrOxaTRcJWIhRhJJ3C1PhQbPzGuHuFFCxrx26cQRYKDk3A6uvlueQhIhnKt4o8i422o9vHVp+1OhwPNnvRePiVQmRMlEKUQq03vpmHHrMzLUcfX2J1sPbw3ReTDFYUT03PmJlygTDjwf5c0asZAfiBDTeLNWOnUUjBC42lzG1RibQIjMc9uldQu7DqjteCYiTedfAM/hwZOVKZx9m1cWSNPVQqMjF3YdaJeUcTVTqwJuqzr2vOjrUdrxjCTBwr4vgueQFiKpGcb8nb4P3gIL1UKj74u+nurY86q4WuGfovD9bJ86eAbiGvsv8NwFvbSKp99gjQ6uVkkYbZoff9HPquFqFrzUdcBze+1DiuBZgMXyF4+nbl/7D/Ac2kRGKnX7Wv7icbCYSmhEbPvttQ/VRp5VwtVMaegq5Sl18MygLUuzR4jzSD5jQiLifBlXK5UIAAGV8pSSkVlQ+9iN+tZxe3BYfVOLlr16Lvvph18BnkOaSEozk/30QvbqOUhpyrh6cLi+dTx458ECGpsQK+UpYOrgmTrgWUT4vpwQUYrSiSNhcDWDSnkq+O5qLcjsZZ7rrt5Q3zSKtq/w8boUlDLNWzd6Pvpa8ByeJViZ/Eez5q0b7tr1aLsQzA4EgLbf2PSEu/oRo3Kb9G9eUgMvBFKSbkCGgx+sBhEA6sBh9cwr6Noy6v1xxLjWaq5+55WbP/4ZcQsomJMISANqIgTuBLVA80s3zOqdDa/8dGHsgNTTAV3N282e838uXJiRqWzkuwdRCpHK9r3/Jnrt2ug+qWeCRg6v1fv+H8zqnUC4DgCD/pYrInOaKIl48AotAUCk4vytBERuN+517UHTnCSG0spEV4OWfSRSWQCFJogQASjez5WI/HQu1rvSVFyt9qi4It9ux31Xyc/jJAIlAiUCJQIlAiUCJQIlAiVHIlAiUCJQIlAiUCJQIlAiUHJ84fgXBzySGvYS5wYAAAAASUVORK5CYII=", "revolut": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0yMCAtOCAxMjAgMTE2Ij48cmVjdCB4PSItMjAiIHk9Ii04IiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjExNiIgZmlsbD0iI2ZmZiIvPjxnIHRyYW5zZm9ybT0ibWF0cml4KDAuMDE2NCwwLDAsLTAuMDE2MzE2LC0xOS4zODUxNTUsMTA3LjEwODI5MykiPjxwYXRoIGQ9Ik0xMjAzLDY1NjJMMTE4Miw2NTU5TDExODIsNjA2OUMxMTgyLDU3MTAgMTE4NSw1NTgwIDExOTQsNTU3OUMxMjAwLDU1NzkgMTg1OCw1NTc4IDI2NTUsNTU3N0MzODI3LDU1NzUgNDExNSw1NTcyIDQxNTUsNTU2MUM0MzUxLDU1MDkgNDQ4NCw1NDMyIDQ2MDEsNTMwMUM0NzU1LDUxMzAgNDgyMiw0OTE3IDQ3OTUsNDY4MEM0NzkxLDQ2NDQgNDc4Niw0NjEyIDQ3ODMsNDYwN0M0NzgxLDQ2MDMgNDc3Niw0NTg3IDQ3NzQsNDU3MkM0NzcxLDQ1NTcgNDc1Niw0NTE1IDQ3NDEsNDQ3OEM0NjYxLDQyODkgNDUwMCw0MTMwIDQzMDgsNDA1M0M0MTY5LDM5OTYgNDE3NCwzOTk3IDM1MTUsMzk5NUMyODcxLDM5OTMgMjg2NiwzOTkzIDI4NTUsMzk0N0MyODUyLDM5MzUgMjg1MSwzNzIwIDI4NTIsMzQ3MEwyODU1LDMwMTVMMjk0MiwyODk1QzMwNDksMjc0OSAzMDIxLDI3ODcgMzI0NiwyNDc1QzMzNDksMjMzMiAzNDQ1LDIxOTkgMzQ1OSwyMTgwQzM0NzMsMjE2MSAzNDk0LDIxMzIgMzUwNiwyMTE1QzM1MzEsMjA3OCAzOTQ0LDE1MDUgMzk3MCwxNDcwQzM5ODAsMTQ1NiA0MTQ0LDEyMjkgNDMzNSw5NjVDNDUyNSw3MDEgNDY4OCw0NzQgNDY5OCw0NjFMNDcxNiw0MzZMNTM5Miw0MzZDNjA2NSw0MzUgNjA2OCw0MzUgNjA1OCw0NTVDNjA1Miw0NjYgNjA0NCw0NzcgNjA0MSw0ODBDNjAzNyw0ODMgNTk3Niw1NjYgNTkwNSw2NjVDNTc3Miw4NTEgNTU1MCwxMTYwIDU1MjQsMTE5NUM1NTE2LDEyMDYgNTQzNywxMzE2IDUzNDgsMTQ0MEM1MTQwLDE3MjkgNDg1NSwyMTI1IDQ4MjEsMjE3MEM0ODA3LDIxODkgNDc3NSwyMjM0IDQ3NTEsMjI2OUM0NzI3LDIzMDQgNDcwMiwyMzQwIDQ2OTQsMjM0OUM0Njg2LDIzNTggNDY2NSwyMzg2IDQ2NDgsMjQxMkM0NjMwLDI0MzcgNDU2NywyNTI1IDQ1MDgsMjYwN0M0MjcxLDI5MzUgNDIyOSwyOTk0IDQyMjcsMzAwM0M0MjI1LDMwMTQgNDIzMiwzMDE1IDQzMjMsMzAyNEM0NjM3LDMwNTMgNDk4NiwzMjAxIDUyNTEsMzQxOUM1NTM1LDM2NTMgNTc1OCw0MDAzIDU4NDYsNDM1NUM1ODUwLDQzNzIgNTg1NCw0MzkwIDU4NTYsNDM5NUM1ODYyLDQ0MTkgNTg4MSw0NTE5IDU4ODgsNDU2NUM1ODk3LDQ2MzAgNTg5Nyw0OTE2IDU4ODgsNTAwMEM1ODUzLDUzMTUgNTcxNCw1NjQzIDU1MDYsNTkwMEM1NDM4LDU5ODMgNTMwNyw2MTE2IDUyNTEsNjE1OEM1MjMxLDYxNzMgNTIwOSw2MTkxIDUyMDEsNjE5OEM1MTcxLDYyMjYgNTAzNCw2MzE0IDQ5NTIsNjM1N0M0NzMyLDY0NzIgNDQ5OSw2NTM5IDQyNjUsNjU1NkM0MTc3LDY1NjMgMTI0Niw2NTY4IDEyMDMsNjU2MloiIGZpbGw9IiMxMTEiLz48cGF0aCBkPSJNMTE4Miw1MDUwTDExODIsNDQwTDEyMDQsNDM5QzEyMTUsNDM5IDE0NzAsNDM4IDE3NjksNDM4QzIxMzYsNDM3IDIzMTQsNDQxIDIzMTksNDQ4QzIzMjIsNDUzIDIzMjUsMTQ5MCAyMzI0LDI3NTJMMjMyNCw1MDQ1TDE3NTMsNTA0OEwxMTgyLDUwNTBaIiBmaWxsPSIjMTExIi8+PC9nPjwvc3ZnPg=="};
const logoImg=(k,alt)=>LOGOS[k]?`<img class="lgo" src="${LOGOS[k]}" alt="${esc(alt||k)}">`:`<span class="bkb">${esc((alt||k).slice(0,2))}</span>`;
function rispFV(P,pmt,ann,m){const i=Math.pow(1+ann/100,1/12)-1;return P*Math.pow(1+i,m)+pmt*(i?(Math.pow(1+i,m)-1)/i:m)}
function rispTodos(T){(S.risparmi||[]).forEach(c=>{if(c.aggiornato&&daysBetween(c.aggiornato,todayISO())>35)T({lvl:"do",ic:"↧",title:`Aggiorna ${esc(c.nome)}${c.prodotto?" · "+esc(c.prodotto):""}`,sub:`Saldo fermo al ${dmy(c.aggiornato)}. ${RISP_HINT[c.logo]||"Copia saldo e guadagno dall'app del conto."}`,act:`<button class="btn small" data-go-v="risp" type="button">Risparmi</button>`})})}
function vRisp(FX){const head=intro("La liquidità messa da parte: salvadanai e conti remunerati, separati dagli investimenti di lungo periodo. Il fondo emergenza è misurato in mesi di spese ricorrenti (dalla scheda Spese). Questi conti non hanno un collegamento automatico: aggiorna saldo e guadagno con Aggiorna (Cairn te lo ricorda ogni mese). Con più aggiornamenti calcola il rendimento effettivo.");
  const R=rispCalc();if(!R)return head+`<section class="panel empty">Nessun conto di risparmio registrato.</section>`;
  const today=todayISO(),cfgE=cfg().emergenzaMesi||6,target=R.avg*cfgE;
  const inv=invCalc((S.investimenti||[]).find(isMainInv));const pat=R.tot+(inv?inv.tot:0);
  const plan=ctPlan(FX);
  const fv=m=>R.L.reduce((s,c)=>s+rispFV(+c.saldo||0,+((c.versamento||{}).importo)||0,c.netto-(+c.bollo||0),m),0);
  const toTarget=(()=>{if(R.tot>=target)return 0;for(let m=1;m<=600;m++)if(fv(m)>=target)return m;return null})();
  const K={tot:VZ.stack(R.L.map((c,i)=>({v:+c.saldo||0,c:IPAL[i%IPAL.length]})),Math.max(1,R.tot),[],R.L.map(c=>c.nome+": "+eur(c.saldo)).join("\n"))+`<div class="vzl">${R.L.slice(0,2).map(c=>`<span>${esc(c.nome)}</span>`).join("")}</div>`,
    gain:(()=>{const yE=new Date().getFullYear(),mr=12-new Date().getMonth()-1,nY=fv(mr+12)-fv(mr)-R.mens*12,nR=fv(mr)-R.tot-R.mens*mr;return VZ.bars2([{v:R.gain,c:"var(--green-soft)"},{v:nY,c:"var(--c-green-soft)"}],`Interessi maturati finora: ${eur(R.gain)}\nAttesi da qui al 31/12/${yE}: ${eur(nR)}\nAttesi nel ${yE+1}: ${eur(nY)}`)+`<div class="vzl"><span>finora ${eur0(R.gain)}</span><span><!--feat-->nel ${yE+1} ${eur0(nY)}<!--/feat--></span></div>`})(),
    rend:VZ.bars2([{v:R.lordo,c:"var(--c-mid)"},{v:Math.max(0,R.reale),c:"var(--green-soft)"}],`Rendimento lordo: ${R.lordo.toFixed(2).replace(".",",")}%\nNetto costi: ${R.netto.toFixed(2).replace(".",",")}%\nNetto bollo e tasse: ${R.reale.toFixed(2).replace(".",",")}%`)+`<div class="vzl"><span>lordo ${R.lordo.toFixed(2).replace(".",",")}%</span><span>in tasca ${R.reale.toFixed(2).replace(".",",")}%</span></div>`,
    em:VZ.stack([{v:Math.min(R.mesi,cfgE),c:R.mesi>=3?"var(--green-soft)":"var(--amber-soft)"}],cfgE,[{v:3,c:"var(--gold-d)",dash:1}],`Coperti: ${R.mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi\nObiettivo: ${cfgE} mesi (${eur0(target)})\nSpesa ricorrente: ${eur0(R.avg)}/mese`)+`<div class="vzl"><span>0</span><span>3 mesi</span><span>${cfgE}</span></div>`};
  const f2=v=>(+v||0).toFixed(2).replace(".",",")+"%";
  const conti=R.L.map((c,i)=>`<div class="acrow">${logoImg(c.logo,c.nome)}<div class="acn"><b>${esc(c.nome)} · ${esc(c.prodotto||"")}</b><span>${f2(c.tassoLordo)} lordo${c.fondo?" · "+esc(c.fondo):""}</span><span>${(c.versamento||{}).importo?`${eur0(c.versamento.importo)} al mese${c.versamento.giorno?" il "+c.versamento.giorno:""}${c.versamento.nota?" + "+esc(c.versamento.nota):""}`:""} · dati al ${dmy(c.aggiornato)}</span></div><div class="acv"><b class="num">${eur(c.saldo)}</b><span class="pos">+${eur(c.guadagno||0)}</span><span>${f2(c.reale)} in tasca</span>${(()=>{const y=savingsYield(c.storico);return y?`<!--feat--><span data-tip="${esc(`Guadagno ${eur(y.gained)} in ${y.days} giorni sul saldo medio, al lordo del 26%`)}">${f2(y.annual*100)} effettivo</span><!--/feat-->`:""})()}</div><button class="btn small ghost" data-risp="${esc(c.id)}" type="button">${ico("pen",14)} Aggiorna</button></div>`).join("")
    ;
  const notes=R.L.flatMap(c=>(c.note||[]).map(n=>`<li><b>${esc(c.nome)}</b>: ${esc(n)}</li>`)).join("");
  const mm=v=>v==null?"oltre 50 anni":v>=24?`${(v/12).toLocaleString("it-IT",{maximumFractionDigits:1})} anni`:`${v} mesi`;
  return head+`<div class="kpis">
    <div class="kpi"><div class="l">Totale risparmi</div><div class="v">${eur0(R.tot)}</div>${K.tot}<div class="s">${R.L.length} ${R.L.length>1?"conti":"conto"} · ${eur0(R.mens)} al mese</div></div>
    <div class="kpi green"><div class="l">Interessi maturati</div><div class="v">${eur(R.gain)}</div>${K.gain}<div class="s">${pct(R.gain/Math.max(1,R.tot-R.gain))} sul versato</div></div>
    <div class="kpi"><div class="l">Rendimento in tasca</div><div class="v">${f2(R.reale)}</div>${K.rend}<div class="s">dopo costi, bollo e 26%</div></div>
    <div class="kpi ${R.mesi<3?"alert":""}"><div class="l">Fondo emergenza</div><div class="v">${R.mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</div>${K.em}<div class="s">obiettivo ${cfgE} mesi = ${eur0(target)}</div></div>
  </div>
  <div class="grid">
    <section class="panel c7"><div class="panel-h"><h2>Conti di risparmio</h2></div><div class="panel-b" style="padding-top:4px;padding-bottom:4px">${conti}</div>
      <div class="sstrip"><div><span>Risparmi</span><b class="num">${eur0(R.tot)}</b><small>liquidità</small></div><div><span>Investimenti</span><b class="num">${inv?eur0(inv.tot):"—"}</b><small>Trading 212</small></div><div><span>Patrimonio</span><b class="num">${eur0(pat)}</b><small>esclusi conti correnti</small></div><div><span>Quota liquida</span><b class="num">${pct(R.tot/Math.max(1,pat),0)}</b><small>del patrimonio</small></div></div></section>
    <section class="panel c5"><div class="panel-h"><h2>Fondo emergenza</h2></div>
      <div class="sstrip sv"><div><span>Mancano all'obiettivo</span><b class="num ${R.tot<target?"neg":"pos"}">${R.tot<target?eur0(target-R.tot):"raggiunto"}</b><small>${cfgE} mesi × ${eur0(R.avg)} di spese ricorrenti</small></div><div><span>Al ritmo attuale</span><b class="num">${toTarget===0?"—":mm(toTarget)}</b><small>con ${eur0(R.mens)} al mese più interessi</small></div><div><span>Spesa ricorrente</span><b class="num">${eur0(R.avg)}</b><small>al mese, dalla scheda Spese</small></div></div>
      <div class="panel-b" style="border-top:1px solid var(--line-2)"><ul class="chk"><li>${R.mesi<3?`Sotto i 3 mesi la riserva è fragile: un imprevisto o un incasso in ritardo ti costringerebbe a disinvestire dal PAC. `:R.mesi<cfgE?"Riserva sufficiente per un imprevisto medio: continua ad accantonare fino all'obiettivo.":"Obiettivo raggiunto: l'eccedenza può andare al PAC."}</li><li>Tieni separati fondo emergenza e accantonamento tasse: i soldi degli F24 non sono risparmi.</li></ul></div></section>
    ${ctRowR(plan)}
    <section class="panel c12"><div class="panel-h"><h2>Proiezione dei risparmi</h2><div class="spacer"></div><span class="eyebrow">versamenti attuali · rendimento netto costi e bollo · al lordo del 26%</span></div>
      <div class="sstrip">${(()=>{const yE=new Date().getFullYear(),mr=12-new Date().getMonth()-1;return [0,1,4].map(k=>{const m=mr+12*k;return `<!--feat--><div><span>Al 31/12/${yE+k}</span><b class="num">${eur0(fv(m))}</b><small>${eur0(R.tot+R.mens*m)} versati · +${eur0(fv(m)-R.tot-R.mens*m)}</small></div><!--/feat-->`}).join("")})()}<div><span>Obiettivo emergenza</span><b class="num">${eur0(target)}</b><small>${toTarget===0?"raggiunto":"tra "+mm(toTarget)}</small></div></div></section>
    ${notes?`<details class="panel c12 fold"><summary class="panel-h"><h2>Costi e fisco</h2><span class="spacer"></span><span class="eyebrow">dettagli</span></summary><div class="panel-b"><ul class="chk">${notes}</ul></div></details>`:""}
  </div>`}
/** Risparmi: the tax account is shown as one row (saldo + update); its plan lives in Fisco › Tasse e F24. */
function ctRowR(P){if(!P||!P.ct.linked)return "";const c=P.ct.linked;
  return `<section class="panel c12 ctrow"><div class="panel-h">${logoImg(c.logo,c.nome)}<h2 style="margin-left:10px">Conto tasse</h2><span class="muted" style="margin-left:8px;font-size:13px">${esc(c.nome)} · ${esc(c.prodotto||"")}</span><div class="spacer"></div><b class="num" style="font-size:20px">${eur(P.ct.saldo)}</b></div>
   <div class="panel-b ctrow-b"><span class="muted">Non entra nel fondo emergenza né nel patrimonio: sono soldi già dovuti allo Stato. Piano di accantonamento e scadenze in Fisco.</span><span class="ctrow-a"><button class="btn small" data-risp="${esc(c.id)}" type="button">${ico("pen",13)} Aggiorna saldo</button><button class="btn small" data-go-v="tasse" data-ttab-go="conto" type="button">Apri il piano</button></span></div></section>`}
function ctPanelR(P){if(!P||!P.ct.linked)return "";const c=P.ct.linked,ok=P.min>=0;const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;
  const rows=P.pre.map(r=>`<div><span class="muted num">${dmy(r.data)}</span><span class="muted">${esc(r.descrizione)} · dal conto corrente</span><span class="muted num">−${eur0(r.importo)}</span><span></span></div>`).join("")+P.pts.map(p=>`<div><span class="muted num">${dmy(p.d)}</span><span>${esc(p.desc)}</span><b class="num">−${eur0(p.imp)}</b><b class="num ${p.bal<0?"bad":"pos"}">${eur0(p.bal)}</b></div>`).join("");
  return `<section class="panel c12"><div class="panel-h">${logoImg(c.logo,c.nome)}<h2 style="margin-left:10px">Accantonamento tasse</h2><span class="muted" style="margin-left:8px;font-size:13px">${esc(c.nome)} · ${esc(c.prodotto||"")} · ${(+c.tassoLordo||0).toFixed(2).replace(".",",")}% lordo</span><div class="spacer"></div><button class="btn small ghost" data-risp="${esc(c.id)}" type="button">${ico("pen",14)} Aggiorna</button></div>
   <div class="sstrip"><div><span>Saldo</span><b class="num">${eur(P.ct.saldo)}</b><small>al ${dmy(P.ct.data)}</small></div><div><span>Versamento</span><b class="num">${eur0(P.ct.mens)}</b><small>al mese</small></div><div><span>F24 da coprire</span><b class="num neg">${eur0(P.tot)}</b><small>${P.f.length} scadenze${P.ct.dal?" dal "+dmy(P.ct.dal):""}, comprese le stime</small></div><div><span>Per coprirli tutti</span><b class="num ${nd!=null&&nd>P.ct.mens?"neg":"pos"}">${nd==null?"—":eur0(nd)+" / mese"}</b><small>${nd!=null&&nd>P.ct.mens?"più di quanto versi ora":"il versamento attuale basta"}</small></div></div>
   <div class="grid" style="gap:0"><div class="c7 panel-b"><div class="eyebrow" style="margin-bottom:8px">Saldo del conto dopo ogni F24, con ${eur0(P.ct.mens)} al mese</div><div class="ctl">${rows}</div></div>
   <div class="c5 panel-b" style="border-left:1px solid var(--line-2)"><ul class="chk">
     <li>${ok?`<b class="pos">Coperto:</b> con questo ritmo il conto non va mai in rosso.`:`<b class="bad">Scoperto dal ${dmy(P.first.d)}:</b> il saldo scende fino a ${eur0(P.min)} il ${dmy(P.minD)}. Quegli F24 vanno pagati dal conto corrente o servono versamenti più alti.`}</li>
     ${P.pre.length?`<li>Gli F24 fino al ${dmy(addDays(P.ct.dal,-1))} (${eur0(P.pre.reduce((a,r)=>a+r.importo,0))}) arrivano prima che il conto si riempia: li paghi dal conto corrente.</li>`:""}
     <li>Giugno è il mese pesante: saldo dell'anno prima più primo acconto, di imposta e INPS insieme. Gli importi del 2027 sono stime dell'app e si aggiornano con fatture e contratti.</li>
     <li>Questo conto non entra nel fondo emergenza né nel patrimonio: sono soldi già dovuti allo Stato.</li></ul></div></div></section>`}
const RISP_HINT={satispay:"Nell'app Satispay: Salvadanaio → saldo e «guadagno totale».",revolut:"Nell'app Revolut: Patrimonio → Risparmi → saldo e interessi ricevuti."};
function openRisp(id){const c=(S.risparmi||[]).find(x=>x.id===id);if(!c)return;const v=c.versamento||{};
  const f=(k,l,val,cls="s2")=>`<div class="f ${cls}"><label for="rs-${k}">${l}</label><input id="rs-${k}" class="in num" inputmode="decimal" value="${String(val??"").replace(".",",")}"></div>`;
  sheet("Aggiorna "+c.nome,`<section class="panel"><div class="panel-b">${RISP_HINT[c.logo]?`<p class="muted" style="margin:0 0 12px;font-size:13px">${esc(RISP_HINT[c.logo])}</p>`:""}<div class="fields">${f("saldo","Saldo €",c.saldo)}${f("gain","Guadagno totale €",c.guadagno)}<div class="f s2"><label for="rs-d">Dati al</label><input id="rs-d" type="date" value="${todayISO()}"></div>${f("tl","Rendimento lordo %",c.tassoLordo)}${f("co","Costi annui %",c.costi)}${f("vi","Versamento € / mese",v.importo)}</div></div></section>`,`<button class="btn primary" id="rsSave" type="button">Salva</button>`);
  $("#rsSave").onclick=async()=>{const d={saldo:readNum($("#rs-saldo").value),guadagno:readNum($("#rs-gain").value),aggiornato:$("#rs-d").value||todayISO(),tassoLordo:readNum($("#rs-tl").value),costi:readNum($("#rs-co").value),versamento:{...v,importo:readNum($("#rs-vi").value)}};
    d.storico=addSavingsPoint(c.storico,{d:c.aggiornato,saldo:c.saldo,guadagno:c.guadagno},{d:d.aggiornato,saldo:d.saldo,guadagno:d.guadagno});
    if(await write(db=>db.doc("risparmi/"+id).update(d),"Conto aggiornato"))closeSheet()}}
function personalAnal(FX){const R=rispCalc(),inv=invCalc((S.investimenti||[]).find(isMainInv)),st=speseStats();if(!R&&!inv&&!st)return "";
  const {inTot,outTot,spTot}=cashYear(FX);const netM=(inTot-outTot)/12;const rt=R?R.tot:0,it=inv?inv.tot:0,pat=rt+it;const pac=inv?inv.pac:0,rm=R?R.mens:0,sp=st?st.avgRec:0;
  const f2=v=>pct(v,0);
  // 1. entrate vs uscite mese per mese
  let p1="";if(st){const ml=st.L.map(m=>MESI[+m.mese.slice(5)-1]+" "+m.mese.slice(2,4));
    p1=`<!--feat--><section class="panel c7"><div class="panel-h"><h2>Dove vanno i soldi ogni mese</h2><div class="spacer"></div>${lg([["Spese ricorrenti","var(--amber-soft)"],["Lavori casa","var(--c-sun-soft)"],["Investito","var(--cost)"]])}</div><div class="panel-b chart">${svgBars(ml,[{name:"Spese ricorrenti",vals:st.rec,color:"var(--amber-soft)"},{name:"Lavori casa",vals:st.stra,color:"var(--c-sun-soft)"},{name:"Investito",vals:st.L.map(m=>+m.investito||0),color:"var(--cost)"}],{stacked:1,h:250,refs:[{v:netM,color:"var(--green-soft)",label:"entrate nette medie "+new Date().getFullYear()+" "+eur0(netM)}],label:"Uscite mensili"})}</div></section><!--/feat-->`}
  // 2. composizione patrimonio
  const comp=[];if(R)R.L.forEach(c=>comp.push({ticker:c.nome,nome:c.prodotto||"",valore:+c.saldo||0}));
  if(inv){const az=inv.T.filter(t=>!/obblig/i.test(t.classe||"")).reduce((a,t)=>a+t.valore,0),ob=inv.T.filter(t=>/obblig/i.test(t.classe||"")).reduce((a,t)=>a+t.valore,0);comp.push({ticker:"ETF azionari",nome:"Trading 212",valore:az},{ticker:"ETF obbligazionari",nome:"Trading 212",valore:ob})}
  comp.forEach(x=>x.peso=x.valore/Math.max(1,pat));
  const PC=["var(--sky)","var(--c-sky-soft)","var(--cost)","var(--c-mid)","var(--green-soft)"];
  let acc=0;const Rr=74,C=2*Math.PI*Rr;const seg=comp.map((x,i)=>{const s=`<circle cx="100" cy="100" r="${Rr}" fill="none" stroke="${PC[i%PC.length]}" stroke-width="26" stroke-dasharray="${Math.max(0,x.peso*C-1.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" transform="rotate(-90 100 100)" data-tip="${esc(x.ticker+" · "+x.nome+"\n"+eur(x.valore)+" · "+pct(x.peso))}"></circle>`;acc+=x.peso;return s}).join("");
  const p2=`<section class="panel c5"><div class="panel-h"><h2>Composizione del patrimonio</h2></div><div class="panel-b"><div class="alloc"><svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Composizione del patrimonio">${seg}<text x="100" y="94" text-anchor="middle" font-size="11" fill="var(--muted)">Patrimonio</text><text x="100" y="114" text-anchor="middle" font-size="19" font-weight="700" fill="var(--navy)">${eur0(pat)}</text></svg><div class="alist">${comp.map((x,i)=>`<div class="alrow"><i style="background:${PC[i%PC.length]}"></i><div class="an"><b>${esc(x.ticker)}</b> <span class="muted">${esc(x.nome)}</span></div><div class="ap num">${pct(x.peso)}</div><div class="at num muted">${eur0(x.valore)}</div></div>`).join("")}</div></div></div></section>`;
  // 3. indicatori
  const tr=netM>0?(pac+rm)/netM:0,se=netM>0?sp/netM:0,mp=sp?pat/sp:0,cy=new Date().getFullYear(),op=(FX[cy]||{}).oneriPct||0;
  const ind=`<!--feat--><section class="panel c12"><div class="panel-h"><h2>Indicatori di salute finanziaria</h2><div class="spacer"></div><span class="eyebrow">entrate nette ${new Date().getFullYear()} = incassi − F24, ${eur0(netM)} / mese</span></div>
   <div class="sstrip"><div><span>Tasso di risparmio</span><b class="num ${tr>=.2?"pos":tr<.1?"neg":""}">${f2(tr)}</b><small>PAC e risparmi su entrate nette · buono oltre 20%</small></div><div><span>Spese su entrate</span><b class="num ${se>.8?"neg":""}">${f2(se)}</b><small>${eur0(sp)} di ${eur0(netM)} al mese</small></div><div><span>Patrimonio in mesi di spese</span><b class="num">${mp.toLocaleString("it-IT",{maximumFractionDigits:1})}</b><small>di cui liquidi ${(R?R.mesi:0).toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</small></div><div><span>Peso del fisco ${cy}</span><b class="num">${f2(op)}</b><small>INPS + imposta sui ricavi</small></div></div></section><!--/feat-->`;
  // 4. proiezione patrimonio 10 anni
  let p4="";{const Y=10,ys=[];for(let k=0;k<=Y;k++)ys.push(String(cy+k));const inS=ys.map((_,k)=>inv?invProj(inv,.05)(Math.min(k*12,inv.n))*(k*12>inv.n?Math.pow(1.05,(k*12-inv.n)/12):1):0);
    const rS=ys.map((_,k)=>R?R.L.reduce((s,c)=>s+rispFV(+c.saldo||0,+((c.versamento||{}).importo)||0,c.netto-(+c.bollo||0),k*12),0):0);
    const vS=ys.map((_,k)=>(inv?inv.netDep+inv.pac*Math.min(k*12,inv.n):0)+rt+rm*k*12);
    p4=`<section class="panel c12"><div class="panel-h"><h2>Patrimonio tra 10 anni, con i versamenti attuali</h2><div class="spacer"></div>${lg([["Totale","var(--green-soft)"],["Investimenti al 5%","var(--cost)"],["Risparmi","var(--sky)"],["Versato","var(--gold-d)"]])}</div><div class="panel-b chart">${svgLines(ys,[{name:"Totale",vals:ys.map((_,k)=>inS[k]+rS[k]),color:"var(--green-soft)",area:1},{name:"Investimenti al 5%",vals:inS,color:"var(--cost)"},{name:"Risparmi",vals:rS,color:"var(--sky)"},{name:"Versato",vals:vS,color:"var(--gold-d)",dash:"5 4",w:2}],{wide:true,label:"Proiezione patrimonio"})}
     <p class="muted" style="font-size:13px;margin:6px 0 0">Ipotesi illustrativa: PAC ${eur0(pac)} al mese al 5% annuo, risparmi ${eur0(rm)} al mese ai tassi attuali al netto di costi e bollo. Valori nominali, al lordo delle tasse sui guadagni. Il conto tasse è escluso.</p></div></section>`}
  return `<div class="grid">${p1}${p2}${ind}${p4}</div>`}
function vEntrate(FX){const cy=new Date().getFullYear();const Y=S.entY===cy+1?cy+1:cy;const nowY=Y===cy;
  const head=intro("Le tue entrate per anno solare e per data di incasso. Nell'anno in corso i mesi passati sono quelli reali (fatture incassate, F24 registrati, spese degli estratti conto), da questo mese a dicembre c'è la previsione (fatture aperte e fatture previste dai contratti). L'anno prossimo è tutto previsione. La tabella in basso mette insieme entrate, F24, spese, PAC e risparmi mese per mese: è il tuo flusso di cassa personale.");
  const F=flowYear(FX,Y);const ml=m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4);const fut=F.rows.filter(r=>!r.past);
  const fixedM=F.sp+F.pac+F.rm;const netM=(F.tin-F.tf24)/12;const firmQ=F.tin?F.tfirm/F.tin:0;
  const cl=id=>(clientById(id)||{nome:id}).nome;
  const tabs=`<div class="segs" role="tablist" aria-label="Anno" style="margin:0 0 14px">${[cy,cy+1].map(y=>`<button type="button" role="tab" data-enty="${y}" aria-selected="${y===Y}">${y===cy?`${y} · anno in corso`:`${y} · previsione`}</button>`).join("")}</div>`;
  const colsTip=(t,f)=>t+"\n"+F.rows.map(r=>ml(r.m)+": "+eur0(f(r))).join("\n");
  const K={tot:VZ.cols(F.rows.map(r=>r.in),[],colsTip(`Entrate ${Y}`,r=>r.in),i=>{const r=F.rows[i];return r.past||r.done>=r.in*.99?"var(--vz-real)":r.ipo>r.firm-r.done?"var(--vz-hyp)":"var(--vz-plan)"}),
    done:VZ.cols(F.rows.map(r=>r.done),[],colsTip(`Incassato ${Y}`,r=>r.done),()=>"var(--vz-real)"),
    f24:VZ.cols(F.rows.map(r=>r.f24),[],colsTip(`F24 ${Y}`,r=>r.f24),()=>"var(--tax)"),
    net:VZ.stack([{v:F.tf24/12,c:"var(--tax)"},{v:fixedM,c:"var(--amber-soft)"},{v:Math.max(0,netM-fixedM),c:"var(--green-soft)"}],Math.max(1,F.tin/12),[],`Entrate medie: ${eur0(F.tin/12)}\nF24: ${eur0(F.tf24/12)}\nSpese, PAC e risparmi: ${eur0(fixedM)}\nMargine: ${eur0(netM-fixedM)}`)+`<div class="vzl"><span>F24</span><span>uscite fisse</span><span>margine</span></div>`,
    firm:VZ.stack([{v:F.tdone,c:"var(--vz-real)"},{v:F.tfirm-F.tdone,c:"var(--vz-plan)"},{v:F.tipo,c:"var(--vz-hyp)"}],Math.max(1,F.tin),[],`Incassato: ${eur0(F.tdone)}\nFatture aperte e contratti firmati: ${eur0(F.tfirm-F.tdone)}\nDa rinnovi ipotizzati: ${eur0(F.tipo)}`)+`<div class="vzl"><span>${F.tdone?"incassato":"firmato"}</span><span>${F.tdone?"firmato":""}</span><span>ipotesi</span></div>`};
  const rest=fut.reduce((a,r)=>a+r.in-r.done,0);
  const k2=nowY?`<div class="kpi"><div class="l">Incassato da gennaio</div><div class="v">${eur0(F.tdone)}</div>${K.done}<div class="s">mancano ${eur0(rest)} entro dicembre</div></div>`
    :`<div class="kpi"><div class="l">F24 ${Y}</div><div class="v">${eur0(F.tf24)}</div>${K.f24}<div class="s">stima dal Calcolo fiscale</div></div>`;
  const cats=F.rows.map(r=>MESI[+r.m.slice(5)-1]);
  const chart=svgBars(cats,[{name:"Incassato",color:"var(--vz-real)",vals:F.rows.map(r=>r.done)},{name:"Previsto (firmato)",color:"var(--vz-plan)",vals:F.rows.map(r=>r.firm-r.done)},{name:"Previsto (ipotesi)",color:"var(--vz-hyp)",vals:F.rows.map(r=>r.ipo),dashed:cats.map(()=>true)}],{stacked:1,w:1000,h:300,refs:[{v:fixedM,color:"var(--gold-d)",label:"spese + PAC + risparmi "+eur0(fixedM)}],label:`Entrate ${Y}`});
  const byC={};F.rows.forEach(r=>Object.entries(r.src).forEach(([k,v])=>byC[k]=(byC[k]||0)+v));const cr=Object.entries(byC).sort((a,b)=>b[1]-a[1]);
  const cRows=cr.map(([k,v],i)=>`<div class="alrow">${clg(k)}<div class="an"><b>${esc(cl(k))}</b></div><div class="ap num">${eur0(v)}</div><div class="at num muted">${pct(v/Math.max(1,F.tin),0)} delle entrate · ${eur0(v/12)} al mese</div></div>`).join("")||`<div class="muted">Nessuna entrata nel ${Y}.</div>`;
  const neg=v=>v<0?"bad":"pos";
  const tRows=F.rows.map(r=>`<tr class="${r.past?"is-past":""}"><td class="num nw">${MESI[+r.m.slice(5)-1]}</td><td class="r num">${eur0(r.in)}${!r.past&&r.done?`<div class="muted" style="font-size:12px">incassati ${eur0(r.done)}</div>`:""}${r.ipo?`<div class="muted" style="font-size:12px">ipotesi ${eur0(r.ipo)}</div>`:""}</td><td class="r num">${r.f24?"−"+eur0(r.f24):"—"}</td><td class="r num m-hide">−${eur0(r.sp)}${r.past&&!r.spReal?`<div class="muted" style="font-size:12px">media</div>`:""}</td><td class="r num m-hide">−${eur0(r.pac+r.rm)}</td><td class="r num ${neg(r.saldo)}"><b>${r.saldo<0?"−":"+"}${eur0(Math.abs(r.saldo))}</b></td><td class="r num ${neg(r.cum)}">${eur0(r.cum)}</td></tr>`).join("");
  const RR=fut.length?fut:F.rows,minC=Math.min(...RR.map(r=>r.cum)),minR=RR.find(r=>r.cum===minC);
  return head+tabs+`<!--feat--><div class="kpis">
    <div class="kpi"><div class="l">${nowY?`Entrate ${Y}`:`Entrate previste ${Y}`}</div><div class="v">${eur0(F.tin)}</div>${K.tot}<div class="s">${eur0(F.tin/12)} al mese in media</div></div>
    ${k2}
    <div class="kpi green"><div class="l">Netto dopo F24</div><div class="v">${eur0(netM)}<small style="font-size:14px;font-weight:600"> / mese</small></div>${K.net}<div class="s">uscite fisse ${eur0(fixedM)} al mese</div></div>
    <div class="kpi ${firmQ<.5?"alert":""}"><div class="l">Entrate già firmate</div><div class="v">${pct(firmQ,0)}</div>${K.firm}<div class="s">${firmQ>=.995?"nessun rinnovo da firmare":"il resto dipende dai rinnovi"}</div></div>
  </div>
  <div class="grid">
    <section class="panel c12"><div class="panel-h"><h2>Entrate mese per mese, ${Y}</h2><div class="spacer"></div>${lg([["Incassato","var(--vz-real)"],["Previsto firmato","var(--vz-plan)"],["Previsto ipotesi","var(--vz-hyp)",1]])}</div><div class="panel-b chart">${chart}<div class="chart-note">Per data di incasso. La linea arancione è quanto esce ogni mese per spese ricorrenti, PAC e risparmi: i mesi sotto la linea si reggono sulla cassa accumulata.</div></div></section>
    <section class="panel c8"><div class="panel-h"><h2>Flusso di cassa ${Y}</h2><div class="spacer"></div><span class="eyebrow">entrate − F24 − spese − PAC e risparmi</span></div><div class="tw"><table><thead><tr><th>Mese</th><th class="r">Entrate</th><th class="r">F24</th><th class="r m-hide">Spese</th><th class="r m-hide">PAC e risp.</th><th class="r">Saldo mese</th><th class="r">Da gennaio</th></tr></thead><tbody>${tRows}</tbody><tfoot><tr><td><b>Totale</b></td><td class="r num"><b>${eur0(F.tin)}</b></td><td class="r num">−${eur0(F.tf24)}</td><td class="r num m-hide">−${eur0(F.tsp)}</td><td class="r num m-hide">−${eur0((F.pac+F.rm)*12)}</td><td class="r num ${neg(F.tsal)}"><b>${F.tsal<0?"−":"+"}${eur0(Math.abs(F.tsal))}</b></td><td></td></tr></tfoot></table></div></section>
    <section class="panel c4"><div class="panel-h"><h2>Da chi arrivano</h2><div class="spacer"></div><span class="eyebrow">${Y}</span></div><div class="panel-b"><div class="alist">${cRows}</div>
      <ul class="chk" style="margin-top:14px"><li>${minC<0?`<b class="bad">Cassa sotto zero</b> a ${MESI_L[+minR.m.slice(5)-1].toLowerCase()} (${eur0(minC)}, contato da gennaio): serve la liquidità accumulata sul conto corrente.`:`<b class="pos">Cassa sempre positiva</b> ${nowY?"da qui a dicembre":"nel "+Y}: il saldo più basso, contato da gennaio, è ${eur0(minC)} a ${MESI_L[+minR.m.slice(5)-1].toLowerCase()}.`}</li>
      <li>${pct(1-firmQ,0)} delle entrate del ${Y} viene da rinnovi non ancora firmati: se un contratto salta, la tabella cambia di conseguenza.</li>
      <li>${nowY?"Spese dei mesi passati dagli estratti conto (media dove mancano); da questo mese, la media dei mesi caricati, senza lavori di casa.":"Le spese sono la media dei mesi caricati, senza lavori di casa."}</li></ul></div></section>
  </div<!--/feat-->`}
function personalPanel(FX){const R=rispCalc(),inv=invCalc((S.investimenti||[]).find(isMainInv)),st=speseStats(),P=ctPlan(FX);
  if(!R&&!inv&&!st)return "";const cy=new Date().getFullYear(),f=FX[cy]||{};
  const rt=R?R.tot:0,it=inv?inv.tot:0,pat=rt+it;
  const {inTot,outTot,spTot}=cashYear(FX);const netM=(inTot-outTot)/12,sp=st?st.avgRec:0,pac=inv?inv.pac:0,rm=R?R.mens:0,marg=netM-sp-pac-rm;
  const mesi=R?R.mesi:0,emT=(cfg().emergenzaMesi||6);
  const t=[];
  t.push(`<div class="kpi go" data-go-v="invest"><div class="l">Patrimonio</div><div class="v">${eur0(pat)}</div>${VZ.stack([{v:rt,c:"var(--sky)"},{v:it,c:"var(--cost)"}],Math.max(1,pat),[],`Risparmi: ${eur0(rt)}\nInvestimenti: ${eur0(it)}${inv?`\nPlus/minus latente: ${eur0(inv.pl)}`:""}`)}<div class="vzl"><span>risparmi ${eur0(rt)}</span><span>investimenti ${eur0(it)}</span></div><div class="s">esclusi conti correnti e conto tasse</div></div>`);
  t.push(`<!--feat--><div class="kpi go ${marg<0?"alert":""}" data-go-v="spese"><div class="l">Margine mensile</div><div class="v">${marg<0?"−":""}${eur0(Math.abs(marg))}</div>${VZ.stack([{v:sp,c:"var(--amber-soft)"},{v:pac+rm,c:"var(--cost)"},{v:Math.max(0,marg),c:"var(--green-soft)"}],Math.max(1,netM,sp+pac+rm),[],`Entrate nette medie ${new Date().getFullYear()}: ${eur0(netM)} / mese\nSpese ricorrenti: ${eur0(sp)}\nPAC e risparmi: ${eur0(pac+rm)}\nMargine: ${eur0(marg)}`)}<div class="vzl"><span>spese</span><span>PAC e risparmi</span><span>margine</span></div><div class="s">entrate nette ${eur0(netM)} − spese − PAC e risparmi</div></div><!--/feat-->`);
  t.push(`<div class="kpi go ${mesi<3?"alert":""}" data-go-v="risp"><div class="l">Fondo emergenza</div><div class="v">${mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</div>${VZ.stack([{v:Math.min(mesi,emT),c:mesi>=3?"var(--green-soft)":"var(--amber-soft)"}],emT,[{v:3,c:"var(--gold-d)",dash:1}],`Risparmi: ${eur0(rt)}\nCoprono ${mesi.toFixed(1).replace(".",",")} mesi di spese\nObiettivo ${emT} mesi: ${eur0(sp*emT)}`)}<div class="vzl"><span>0</span><span>3</span><span>${emT} mesi</span></div><div class="s">${eur0(rt)} su ${eur0(sp*emT)} di obiettivo</div></div>`);
  if(P){const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;const ok=!P.first;
    t.push(`<div class="kpi go ${ok?"":"alert"}" data-go-v="tasse"><div class="l">Accantonamento tasse</div><div class="v">${eur0(P.ct.mens)}<small style="font-size:14px;font-weight:600"> / mese</small></div>${VZ.bars2([{v:P.ct.mens,c:"var(--cost)"},{v:nd||0,c:ok?"var(--green-soft)":"var(--tax)"}],`Versi: ${eur0(P.ct.mens)} al mese\nServono: ${nd?eur0(nd):"—"} al mese\nSaldo: ${eur0(P.ct.saldo)}\nF24 da coprire: ${eur0(P.tot)}`)}<div class="vzl"><span>versi ${eur0(P.ct.mens)}</span><span>servono ${nd?eur0(nd):"—"}</span></div><div class="s">${ok?"F24 coperti":`scoperto dal ${dmy(P.first.d)}`}</div></div>`)}
  else{const inc=pac+rm;t.push(`<div class="kpi go" data-go-v="invest"><div class="l">Messo da parte al mese</div><div class="v">${eur0(inc)}</div><div class="s">PAC ${eur0(pac)} + risparmi ${eur0(rm)}</div></div>`)}
  return `<section style="margin-top:18px"><div class="eyebrow" style="margin-bottom:8px">Finanze personali · oggi${st?` · spese fino a ${MESI[+st.L[st.L.length-1].mese.slice(5)-1].toLowerCase()} ${st.L[st.L.length-1].mese.slice(0,4)}`:""}</div><div class="kpis">${t.join("")}</div></section>`}
const VZ={
 ring:(p,col,tip)=>{const r=19,c=2*Math.PI*r,v=Math.max(0,Math.min(1,p));return `<svg class="vzr" viewBox="0 0 46 46" data-tip="${esc(tip||"")}"><circle cx="23" cy="23" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="6"/><circle cx="23" cy="23" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(v*c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 23 23)"/></svg>`},
 stack:(segs,max,marks=[],tip)=>{let x=0,out="";const W=200,sc=v=>v/max*W;segs.forEach(g=>{const w=sc(g.v);if(w>0.5)out+=`<rect x="${x.toFixed(1)}" y="10" width="${Math.max(0,w-1).toFixed(1)}" height="14" rx="3" fill="${g.c}"></rect>`;x+=w});
   marks.forEach(m=>{const mx=Math.min(W,sc(m.v));out+=`<line x1="${mx}" x2="${mx}" y1="4" y2="30" stroke="${m.c}" stroke-width="1.6" stroke-dasharray="${m.dash?"2 2":"0"}"/>`});
   return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${out}</svg>`},
 cols:(vals,hi,tip,colorFn)=>{const n=vals.length;if(!n||!vals.some(v=>v))return"";const mx=Math.max(1,...vals.map(v=>Math.abs(v||0)));const bw=200/n;let out="";
   vals.forEach((v,i)=>{const h=Math.max(1.5,(Math.abs(v||0)/mx)*30);out+=`<rect x="${(i*bw+bw*.18).toFixed(1)}" y="${(32-h).toFixed(1)}" width="${(bw*.64).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${colorFn?colorFn(i):(hi.includes(i)?"var(--c-ink)":"var(--band)")}"></rect>`});
   return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${out}</svg>`},
 bars2:(rows,tip)=>{const mx=Math.max(1,...rows.map(r=>r.v));return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${rows.slice(0,2).map((r,i)=>`<rect x="0" y="${3+i*16}" width="${Math.max(2,r.v/mx*200).toFixed(1)}" height="11" rx="3" fill="${r.c}"></rect>`).join("")}</svg>`}
};
function tileViz(t,ctx){const {fA,fN,FX,s,sel,nowY,cliRows,totSel,fast,tr,ggPrev,inM,outM,m12,inTot,outTot,spTot}=ctx;const l=t.l;const ys=years().filter(y=>FX[y]&&FX[y].ric>0);
  const yl=ys.map(y=>y+": "+eur0(FX[y].ric));
  if(/già firmati/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;t.ring=VZ.ring(q,"var(--gold-d)",t.s);
    t.viz=VZ.stack([{v:q,c:"var(--c-ink)"},{v:1-q,c:"var(--c-faint)"}],1,[],t.s);t.vzl=`<div class="vzl"><span>firmato</span><span>da rinnovare</span></div>`}
  else if(/^Previsione chiusura|^Ricavi previsti|^Ricavi \d/.test(l)&&fA){const max=Math.max(s.s85,fA.ric)*1.02;
    t.viz=VZ.stack([{v:fA.inc,c:"var(--vz-real)"},{v:fA.att,c:"var(--vz-plan)"},{v:fA.contr+fA.stima,c:"var(--vz-hyp)"}],max,[{v:s.allerta,c:"var(--gold-d)",dash:1},{v:s.s85,c:"var(--tax)"}],`Incassato: ${eur0(fA.inc)}\nFatture aperte: ${eur0(fA.att)}\nDa contratti: ${eur0(fA.contr+fA.stima)}\nAllerta: ${eur0(s.allerta)}\nSoglia: ${eur0(s.s85)}`);
    t.vzl=`<div class="vzl"><span>0</span><span>allerta ${eur0(s.allerta)}</span><span>${eur0(s.s85)}</span></div>`}
  else if(/^Netto \d/.test(l))t.viz=VZ.cols(ys.map(y=>FX[y].netto),[ys.indexOf(sel)],"Netto per anno\n"+ys.map(y=>y+": "+eur0(FX[y].netto)).join("\n"),i=>ys[i]===sel?"var(--green-soft)":ys[i]>nowY?"var(--c-green-pale)":"var(--c-green-soft)");
  else if(/^Ricavi vs/.test(l))t.viz=VZ.cols(ys.map(y=>FX[y].ric),[ys.indexOf(sel),ys.indexOf(sel-1)],"Ricavi per anno\n"+yl.join("\n"),i=>ys[i]===sel?"var(--c-ink)":ys[i]===sel-1?"var(--c-mid)":"var(--band)");
  else if(/^Oneri sui ricavi/.test(l)){const tp=`Oneri ${sel}: ${pct(fA.oneriPct)}${fN&&fN.ric>0?`\nOneri ${sel+1}: ${pct(fN.oneriPct)}`:""}`;t.ring=VZ.ring(fA.oneriPct/0.3,"var(--gold-d)",tp);
    if(fN&&fN.ric>0){t.viz=VZ.bars2([{v:fA.oneriPct,c:"var(--c-mid)"},{v:fN.oneriPct,c:"var(--amber-soft)"}],tp);t.vzl=`<div class="vzl"><span>${sel}: ${pct(fA.oneriPct,0)}</span><span>${sel+1}: ${pct(fN.oneriPct,0)}</span></div>`}}
  else if(/^F24 di giugno/.test(l)){if(sel===nowY&&outM){const hi=m12.map((m,i)=>m.endsWith("-06")?i:-1).filter(i=>i>=0);t.viz=VZ.cols(outM,hi,"F24 "+sel+"\n"+m12.map((m,i)=>outM[i]?MESI[+m.slice(5)-1]+" "+m.slice(2,4)+": "+eur0(outM[i]):null).filter(Boolean).join("\n"),i=>hi.includes(i)?"var(--cost)":"var(--c-soft)")}
    else t.viz=VZ.cols(ys.map(y=>FX[y].giugno),[ys.indexOf(sel)],"F24 di giugno dell'anno dopo\n"+ys.map(y=>(y+1)+": "+eur0(FX[y].giugno)).join("\n"))}
  else if(/^Cassa libera/.test(l)){const st=speseStats();const sp=st?(spTot??st.avgRec*12):0;const net=Math.max(0,inTot-outTot-sp);
    t.viz=VZ.stack([{v:net,c:"var(--green-soft)"},{v:sp,c:"var(--amber-soft)"},{v:outTot,c:"var(--c-mid)"}],Math.max(1,inTot),[],`Entrate ${sel}: ${eur0(inTot)}\nLibero: ${eur0(net)}\nSpese: ${eur0(sp)}\nF24: ${eur0(outTot)}`);
    t.vzl=`<div class="vzl"><span>libero</span><span>spese</span><span>F24</span></div>`}
  else if(/^Peso di/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;const cr=cliRows.filter(r=>r.ricSel>0);const tp=cr.map(r=>r.c.nome+": "+pct(r.ricSel/totSel,0)).join("\n");t.ring=VZ.ring(q,q>.6?"var(--gold-d)":"var(--c-ink)",tp);
    t.viz=VZ.stack(cr.map((r,i)=>({v:r.ricSel/totSel,c:["var(--c-ink)","var(--c-mid)","var(--c-soft)","var(--c-pale)"][i%4]})),1,[],tp);t.vzl=`<div class="vzl">${cr.slice(0,2).map(r=>`<span>${esc(r.c.nome.split(" ")[0])} ${pct(r.ricSel/totSel,0)}</span>`).join("")}</div>`}
  else if(/^Giorni medi/.test(l)&&fast&&fast.length>1){const a=fast[0],b=fast[fast.length-1];t.viz=VZ.bars2([{v:a.avg,c:"var(--green-soft)"},{v:b.avg,c:"var(--amber-soft)"}],`${a.c.nome}: ${Math.round(a.avg)} gg\n${b.c.nome}: ${Math.round(b.avg)} gg`)}
  else if(/^Netto per giorno/.test(l)){t.viz=VZ.stack([{v:tr.gg||0,c:"var(--sky)"},{v:ggPrev||0,c:"var(--c-sky-soft)"}],Math.max(1,(tr.gg||0)+(ggPrev||0)),[],`Giorni fatturati: ${tr.gg||0}\nGiorni previsti: ${ggPrev||0}`);t.vzl=`<div class="vzl"><span>fatturati ${tr.gg||0}</span><span>previsti ${ggPrev||0}</span></div>`}
  else if(/^Da accantonare/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;t.ring=VZ.ring(q/0.35,"var(--c-ink)",t.s)}
  else if(/^Ricavo medio mensile/.test(l)){t.viz=VZ.cols(ys.map(y=>FX[y].ric/12),[ys.indexOf(sel)],"Ricavo medio mensile\n"+ys.map(y=>y+": "+eur0(FX[y].ric/12)).join("\n"))}
  return t}
function simDefaults(){const nowY=new Date().getFullYear(),Y=nowY+1;const rows={};
  S.contratti.filter(c=>c.ipotesi).forEach(c=>{const q=S.missioni.find(x=>x.tipo==="quota"&&x.cliente===c.cliente&&+x.anno===Y);
    rows[c.id]={mese:c.attivo===false?0:Math.round((+c.importo||0)/(+c.ogni||1)),tariffa:+c.tariffa||0,gg:q?+q.giorni||0:0}});
  return {Y,rows}}
function simApply(sim){return (C,M)=>{Object.entries(sim.rows).forEach(([id,r])=>{const c=C.find(x=>x.id===id);if(!c)return;
    const ogni=+c.ogni||1;c.importo=(+r.mese||0)*ogni;c.tariffa=+r.tariffa||0;c.attivo=(+r.mese||0)>0;
    [sim.Y,sim.Y+1].forEach(Y=>{const q=M.find(x=>x.tipo==="quota"&&x.cliente===c.cliente&&+x.anno===Y);
      if(q)q.giorni=c.attivo?(+r.gg||0):0;else if(c.attivo&&+r.gg>0)M.push({id:"sim-"+c.cliente+"-"+Y,tipo:"quota",anno:Y,cliente:c.cliente,giorni:+r.gg,ipotesi:true})})})}}
function simPanel(){
  if(!S.sim)S.sim=simDefaults();const sim=S.sim;const ids=Object.keys(sim.rows);
  if(!ids.length)return "";
  const inp=(id,k,v,lab)=>`<input class="in num" data-sim="${id}:${k}" inputmode="decimal" value="${v}" aria-label="${lab}">`;
  const rows=ids.map(id=>{const c=S.contratti.find(x=>x.id===id)||{};const r=sim.rows[id];
    return `<tr><td class="cli">${cliw(c.cliente,c2n(c.cliente))}</td>
      <td>${inp(id,"mese",r.mese,"Compenso al mese")}</td><td>${inp(id,"tariffa",r.tariffa,"Indennità al giorno")}</td><td>${inp(id,"gg",r.gg,"Giorni di missione all'anno")}</td></tr>`}).join("");
  return `<section class="panel c12 simp"><div class="panel-h"><h2>${ico("calc",18)} E se i rinnovi ${sim.Y} fossero diversi?</h2><div class="spacer"></div><button class="btn small ghost" id="simReset" type="button">Ripristina</button><button class="btn small dark" id="simSave" type="button">Salva come ipotesi</button></div>
   <div class="grid" style="gap:0">
    <div class="c6 panel-b sim-in"><p class="muted" style="margin:0 0 10px;font-size:13px"><b>1.</b> Cambia compenso, indennità o giorni di trasferta dei rinnovi che stai trattando. <b>2.</b> A destra vedi subito cosa cambia nel ${sim.Y} rispetto alle ipotesi salvate: ricavi, tasse, netto. Non si salva nulla finché non premi «Salva come ipotesi».</p>
     <div class="tw"><table class="simt"><thead><tr><th>Cliente</th><th>€ al mese</th><th>€ al giorno in trasferta</th><th>Giorni di trasferta nell'anno</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="c6 panel-b"><div class="tw" id="simOut"></div></div>
   </div></section>`}
function simOutHTML(){const sim=S.sim,Y=sim.Y,s=cfg().soglie;const B=fisco(),X=withScenario(simApply(sim),fisco);const b=B[Y]||{},x=X[Y]||{};
  const d=(a,c,neg)=>{const v=c-a;if(Math.abs(v)<1)return `<span class="muted">=</span>`;const good=neg?v<0:v>0;return `<b class="${good?"pos":"bad"}">${v>0?"+":"−"}${eur0(Math.abs(v))}</b>`};
  const rowsD=[["Ricavi "+Y,b.ric,x.ric,0],["Oneri (INPS + imposta)",b.oneri,x.oneri,1],["Netto "+Y,b.netto,x.netto,0],["Netto al mese",b.netto/12,x.netto/12,0],["F24 di giugno "+(Y+1),b.giugno,x.giugno,1],["Margine sulla soglia",s.s85-b.ric,s.s85-x.ric,0]];
  return `<table><thead><tr><th>${Y}</th><th class="r">Ipotesi salvate</th><th class="r">Con questi valori</th><th class="r">Differenza</th></tr></thead><tbody>${rowsD.map(([l,a,c,n])=>`<tr><td>${l}</td><td class="r num">${eur0(a||0)}</td><td class="r num"><b>${eur0(c||0)}</b></td><td class="r num">${d(a||0,c||0,n)}</td></tr>`).join("")}</tbody></table>
   ${x.ric>=s.allerta?`<p class="note" style="margin:10px 0 0">Con questo scenario superi l'allerta di ${eur0(s.allerta)}: valuta i tempi di fatturazione a dicembre.</p>`:""}`}
function bindSim(){const out=$("#simOut");if(!out)return;out.innerHTML=simOutHTML();
  document.querySelectorAll("[data-sim]").forEach(i=>i.addEventListener("input",()=>{const [id,k]=i.dataset.sim.split(":");const v=readNum(i.value);S.sim.rows[id][k]=isNaN(v)||v==null?0:v;clearTimeout(bindSim._t);bindSim._t=setTimeout(()=>{$("#simOut").innerHTML=simOutHTML()},150)}));
  document.querySelectorAll("[data-simp]").forEach(b=>b.onclick=()=>{const [id,m,t,g]=b.dataset.simp.split(":");Object.assign(S.sim.rows[id],{mese:+m,tariffa:+t,gg:+g});render()});
  const r=$("#simReset");if(r)r.onclick=()=>{S.sim=simDefaults();render()};
  const sv=$("#simSave");if(sv)sv.onclick=async()=>{const sim=S.sim;
    const ok=await write(async db=>{for(const [id,r] of Object.entries(sim.rows)){const c=S.contratti.find(x=>x.id===id);if(!c)continue;const on=(+r.mese||0)>0;
        await db.doc("contratti/"+id).update({importo:(+r.mese||0)*(+c.ogni||1),tariffa:+r.tariffa||0,attivo:on});
        for(const Y of [sim.Y,sim.Y+1]){const q=S.missioni.find(x=>x.tipo==="quota"&&x.cliente===c.cliente&&+x.anno===Y);
          if(q)await db.doc("missioni/"+q.id).update({giorni:on?(+r.gg||0):0});else if(on&&+r.gg>0)await db.doc("missioni/quota-"+Y+"-"+c.cliente).set({tipo:"quota",anno:Y,cliente:c.cliente,giorni:+r.gg,ipotesi:true,note:"Dal simulatore"})}}},"Ipotesi aggiornate");
    if(ok){S.sim=null}};
}
const PAL=["var(--c-ink)","var(--green-soft)","var(--amber-soft)","var(--c-mid)","var(--c-soft)","var(--tax)","var(--sky)","var(--c-sky-soft)"];
function axis(top,step,L,W,R,y){let g="";for(let t=0;t<=top+.1;t+=step){g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line-2)"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${t>=1000?(t/1000).toLocaleString("it-IT")+"k":Math.round(t)}</text>`}return g}
/** Phone: charts of up to a year are drawn narrow and tall instead of scrolling sideways (redrawn when the width class changes). */
const PHONE=()=>typeof window!=="undefined"&&!!window.matchMedia&&window.matchMedia("(max-width:760px)").matches;
function svgBars(cats,series,opt={}){
  const ph=PHONE()&&cats.length<=12;
  const W=ph?380:(opt.w||720),H=ph?260:(opt.h||(opt.wide?200:260)),L=ph?44:56,R=10,T=16,B=30,n=cats.length,k=series.length;
  const tot=i=>opt.stacked?series.reduce((a,s)=>a+(s.vals[i]||0),0):Math.max(...series.map(s=>s.vals[i]||0));
  const max=Math.max(opt.min||1000,...cats.map((_,i)=>tot(i)),...(opt.refs||[]).map(r=>r.v));
  const step=niceStep(max/4),top=Math.ceil(max/step)*step,sx=(W-L-R)/n,y=v=>T+(H-T-B)*(1-v/top),hh=v=>(H-T-B)*v/top;
  let out=axis(top,step,L,W,R,y);
  cats.forEach((c,i)=>{const gw=Math.min(sx*.7,opt.stacked?46:22*series.length),x0=L+sx*i+(sx-gw)/2;let acc=0;
    series.forEach((s,j)=>{const v=s.vals[i]||0;if(v<=0)return;const st=s.dashed&&s.dashed[i];
      const tip=`${esc(c)} · ${esc(s.name)}: ${eur(v)}`;
      if(opt.stacked){out+=`<rect x="${x0}" y="${y(acc+v)}" width="${gw}" height="${hh(v)}" fill="${st?"var(--band)":s.color}" ${st?`stroke="${s.color}" stroke-dasharray="3 2"`:""}></rect>`;acc+=v}
      else{const bw=gw/k;out+=`<rect x="${x0+bw*j+1}" y="${y(v)}" width="${bw-2}" height="${hh(v)}" fill="${st?"var(--band)":s.color}" ${st?`stroke="${s.color}" stroke-dasharray="3 2"`:""} rx="2"></rect>`;
        if(opt.labels)out+=`<text class="vl" x="${x0+bw*j+bw/2}" y="${y(v)-4}" text-anchor="middle" font-size="10" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("it-IT",{maximumFractionDigits:1})+"k":Math.round(v)}</text>`}});
    {const tl=[c];let sum=0;series.forEach(s=>{const v=s.vals[i]||0;if(v>0){tl.push(s.name+": "+eur0(v));sum+=v}});if(opt.stacked&&tl.length>2)tl.push("Totale: "+eur0(sum));if(tl.length===1)tl.push("—");
     out+=`<rect class="hov" x="${L+sx*i}" y="${T}" width="${sx}" height="${H-T-B}" data-tip="${esc(tl.join("\n"))}"></rect>`}
    out+=`<text x="${L+sx*i+sx/2}" y="${H-9}" text-anchor="middle" font-size="11.5" fill="var(--muted)">${esc(c)}</text>`});
  (opt.refs||[]).forEach(r=>{out+=`<line x1="${L}" x2="${W-R}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.color}" stroke-dasharray="5 4" stroke-width="1.5"/><text class="ref" x="${W-R}" y="${y(r.v)-5}" text-anchor="end" font-size="11" fill="${r.color}">${esc(r.label)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label||"grafico")}">${out}</svg>`;
}
function svgLines(cats,series,opt={}){
  const ph=PHONE()&&cats.length<=24;
  const W=ph?380:720,H=ph?240:(opt.h||(opt.wide?200:260)),L=ph?44:56,R=12,T=16,B=30,n=cats.length;
  const max=Math.max(1000,...series.flatMap(s=>s.vals.filter(v=>v!=null)),...(opt.refs||[]).map(r=>r.v));
  const step=niceStep(max/4),top=Math.ceil(max/step)*step,sx=(W-L-R)/(n-1||1),y=v=>T+(H-T-B)*(1-v/top),x=i=>L+sx*i;
  let out=axis(top,step,L,W,R,y);
  (opt.refs||[]).forEach(r=>{out+=`<line x1="${L}" x2="${W-R}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.color}" stroke-dasharray="5 4" stroke-width="1.5"/><text class="ref" x="${L+6}" y="${y(r.v)-5}" font-size="11" fill="${r.color}">${esc(r.label)}</text>`});
  series.forEach(s=>{const pts=s.vals.map((v,i)=>v==null?null:[x(i),y(v)]);let d="";pts.forEach((p,i)=>{if(!p)return;d+=(d&&pts[i-1]?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)});
    if(s.area){const last=pts.map((p,i)=>p?i:-1).filter(i=>i>=0);if(last.length)out+=`<path d="${d}L${x(last[last.length-1])} ${y(0)}L${x(last[0])} ${y(0)}Z" fill="${s.color}" opacity=".12"/>`}
    out+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||2.4}" ${s.dash?`stroke-dasharray="${s.dash}"`:""} stroke-linejoin="round"/>`;
    const li=s.vals.map((v,i)=>v!=null?i:-1).filter(i=>i>=0).pop();
    if(li!=null&&li>=0)out+=`<circle cx="${x(li)}" cy="${y(s.vals[li])}" r="4" fill="${s.color}"></circle>`;});
  cats.forEach((c,i)=>{const tl=[c];series.forEach(s=>{if(s.vals[i]!=null)tl.push(s.name+": "+eur0(s.vals[i]))});const w=sx||(W-L-R);out+=`<rect class="hov" x="${Math.max(L,x(i)-w/2)}" y="${T}" width="${w}" height="${H-T-B}" data-tip="${esc(tl.join("\n"))}"></rect>`});
  cats.forEach((c,i)=>{const a=i===n-1&&n>1?"end":"middle";out+=`<text x="${i===n-1&&n>1?x(i)+4:x(i)}" y="${H-9}" text-anchor="${a}" font-size="11.5" fill="var(--muted)">${esc(c)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label||"grafico")}">${out}</svg>`;
}
const lg=items=>`<div class="legend">${items.map(([n,c,d])=>`<span><i style="background:${d?"var(--band)":c};${d?`border:1px dashed ${c}`:""}"></i>${esc(n)}</span>`).join("")}</div>`;
function vAnal(FX){
  const FMIN=fiscoMin();
  const ys=years().filter(y=>FX[y]&&(FX[y].ric>0));
  const sel=S.year, s=cfg().soglie, nowY=new Date().getFullYear(), nowM=new Date().getMonth();
  // per-year breakdown from invoices (by fiscal year)
  const by={};ys.forEach(y=>by[y]={comp:0,ind:0,rimb:0,bollo:0,gg:0,nInc:0,days:[],n:0});
  S.invoices.forEach(v=>{const y=fy(v);if(!by[y])return;const t=tot(v);const b=by[y];b.comp+=t.comp;b.ind+=t.ind;b.rimb+=t.rimb;b.bollo+=t.bollo;b.n++;
    (v.righe||[]).forEach(r=>{if(r.tipo==="trasferta")b.gg+=+r.qta||0});if(v.incasso){b.days.push(daysBetween(v.data,v.incasso))}});
  // 1. annual comparison
  const cats=ys.map(String);
  const isEst=ys.map(y=>FX[y].stima>0||FX[y].att>0);
  const annual=svgBars(cats,[{name:"Ricavi",color:"var(--c-ink)",vals:ys.map(y=>FX[y].ric),dashed:ys.map(y=>FX[y].stima>0)},{name:"Oneri",color:"var(--tax)",vals:ys.map(y=>FX[y].oneri)},{name:"Netto",color:"var(--green-soft)",vals:ys.map(y=>FX[y].netto),dashed:ys.map(y=>FX[y].stima>0)}],{labels:true,refs:[{v:s.s85,label:"soglia "+eur0(s.s85),color:"var(--tax)"}],label:"Ricavi, oneri e netto per anno"});
  const aRows=ys.map((y,i)=>{const f=FX[y],p=i?FX[ys[i-1]]:null;const g=p&&p.ric?f.ric/p.ric-1:null;
    return `<tr><td class="num"><b>${y}</b>${f.stima>0?' <span class="pill est">stima</span>':""}</td><td class="r num muted">${eur0((FMIN[y]||{}).ric||0)}</td><td class="r num">${eur0(f.ric)}</td><td class="r num">${g==null?"—":(g>=0?"+":"")+pct(g)}</td><td class="r num neg">${eur0(f.oneri)}</td><td class="r num">${pct(f.oneriPct)}</td><td class="r num pos"><b>${eur0(f.netto)}</b></td><td class="r num pos">${eur0(f.netto/12)}</td><td class="c num">${by[y].n}</td></tr>`}).join("");
  // 2. cumulative vs threshold, selected year vs previous
  const cum=y=>{const m=Array(12).fill(0);S.invoices.forEach(v=>{if(fy(v)!==y)return;m[+effDate(v).slice(5,7)-1]+=tot(v).imponibile});let a=0;return m.map(v=>a+=v)};
  const cSel=cum(sel), cPrev=cum(sel-1);
  const cumSeries=[{name:String(sel),color:"var(--c-ink)",vals:cSel,area:true,w:2.8}];
  if(cPrev[11]>0)cumSeries.push({name:String(sel-1),color:"var(--c-mid)",vals:cPrev,dash:"5 4",w:2});
  const cumChart=svgLines(MESI,cumSeries,{refs:[{v:s.s85,label:"soglia "+eur0(s.s85),color:"var(--tax)"},{v:s.allerta,label:"allerta "+eur0(s.allerta),color:"var(--gold-d)"}],label:"Ricavi cumulati"});
  // run-rate
  const mesiT=sel<nowY?12:sel>nowY?0:nowM+1;
  const incSel=S.invoices.filter(v=>fy(v)===sel&&v.incasso).reduce((a,v)=>a+tot(v).imponibile,0);
  const runRate=mesiT?incSel/mesiT*12:0;
  // 3. clients over years
  const cIds=[...new Set(S.invoices.map(v=>v.cliente))];
  const cSer=cIds.map((id,i)=>({name:(clientById(id)||{nome:id}).nome,color:PAL[i%PAL.length],vals:ys.map(y=>S.invoices.filter(v=>v.cliente===id&&fy(v)===y).reduce((a,v)=>a+tot(v).imponibile,0))})).filter(x=>x.vals.some(v=>v>0));
  const cliChart=svgBars(cats,cSer,{stacked:true,label:"Ricavi per cliente e anno"});
  const cliRows=cIds.map(id=>{const inv=S.invoices.filter(v=>v.cliente===id);const c=clientById(id)||{nome:id};
    const ric=inv.reduce((a,v)=>a+tot(v).imponibile,0), net=inv.reduce((a,v)=>a+oneriInv(v,FX).netto,0);
    const d=inv.filter(v=>v.incasso).map(v=>daysBetween(v.data,v.incasso));const avg=d.length?d.reduce((a,b)=>a+b,0)/d.length:null;
    const ricSel=inv.filter(v=>fy(v)===sel).reduce((a,v)=>a+tot(v).imponibile,0);
    const gg=inv.reduce((a,v)=>a+(v.righe||[]).filter(r=>r.tipo==="trasferta").reduce((x,r)=>x+(+r.qta||0),0),0);
    const open=inv.filter(v=>!v.incasso).reduce((a,v)=>a+tot(v).documento,0);
    return {c,ric,net,avg,min:d.length?Math.min(...d):null,max:d.length?Math.max(...d):null,n:inv.length,ricSel,gg,open}}).sort((a,b)=>b.ric-a.ric);
  const totSel=cliRows.reduce((a,r)=>a+r.ricSel,0)||1;
  // 4. composition per year
  const compChart=svgBars(cats,[{name:"Compenso",color:"var(--c-ink)",vals:ys.map(y=>by[y].comp)},{name:"Indennità trasferta",color:"var(--sky)",vals:ys.map(y=>by[y].ind)},{name:"Rimborsi (non tassati)",color:"var(--green-soft)",vals:ys.map(y=>by[y].rimb)}],{stacked:true,label:"Composizione del fatturato"});
  // 5. F24 calendar (next 24 months + this year)
  const fr=f24Rows(FX);const start=new Date(nowY,0,1);const months=[];for(let i=0;i<30;i++){const d=new Date(start.getFullYear(),start.getMonth()+i,1);months.push(d.getFullYear()+"-"+pad(d.getMonth()+1))}
  const usedM=months.filter(m=>fr.some(r=>r.data.slice(0,7)===m));
  const f24Chart=usedM.length?svgBars(usedM.map(m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4)),[
     {name:"Versato",color:"var(--green-soft)",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&r.versato).reduce((a,r)=>a+r.importo,0))},
     {name:"Da versare",color:"var(--tax)",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&!r.versato&&!r.stima).reduce((a,r)=>a+r.importo,0))},
     {name:"Stima",color:"var(--vz-plan)",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&r.stima).reduce((a,r)=>a+r.importo,0)),dashed:usedM.map(()=>true)}],{stacked:true,wide:true,label:"Calendario F24"}):`<div class="empty">Nessuna scadenza.</div>`;
  const f24next12=fr.filter(r=>!r.versato&&r.data>=todayISO()&&r.data<=addDays(todayISO(),365)).reduce((a,r)=>a+r.importo,0);
  // 6. trasferte
  const tr=by[sel]||{gg:0,ind:0};const fs=FX[sel]||{oneriPct:0};
  const indNet=tr.ind*(1-fs.oneriPct);
  // 7. insights as tiles
  const ins=[];
  const fA=FX[sel],fP=FX[sel-1],fN=FX[sel+1];
  const PRa=projections();
  if(fA&&fA.ric>0){
    ins.push({v:sel>nowY?approx(fA.ric):eur0(fA.ric),l:sel===nowY?`Previsione chiusura ${sel}`:sel>nowY?`Ricavi previsti ${sel}`:`Ricavi ${sel}`,s:sel>=nowY?`incassato ${eur0(fA.inc)} + aperte ${eur0(fA.att)} + contratti ${eur0(fA.contr)}${fA.stima?" + stime "+eur0(fA.stima):""} · minimo garantito ${eur0((FMIN[sel]||{}).ric||0)}`:`${by[sel]?by[sel].n:0} fatture · ${pct(fA.ric/s.s85,0)} della soglia`,tone:fA.ric>=s.allerta?"neg":""});
    ins.push({v:sel>nowY?approx(fA.netto):eur0(fA.netto),l:`Netto ${sel}${sel>=nowY?" (previsione)":""}`,s:`${eur0(fA.netto/12)} al mese dopo INPS e imposta${fP&&fP.netto>0?` · ${eur0(fP.netto)} nel ${sel-1}`:""}`,tone:"pos"});
    if(fP&&fP.ric>0){const g=fA.ric/fP.ric-1;ins.push({v:(g>=0?"+":"−")+pct(Math.abs(g),0),l:`Ricavi vs ${sel-1}`,s:`${eur0(fA.ric)} contro ${eur0(fP.ric)}${sel-1>=nowY?" · entrambi previsioni":sel>=nowY?" · previsione contro anno chiuso":""}`,tone:g>=0?"pos":"neg"})}
    ins.push({v:pct(fA.oneriPct),l:`Oneri sui ricavi ${sel}`,s:fN&&fN.ric>0?`nel ${sel+1} ${pct(fN.oneriPct)}${P(sel+1).imp>P(sel).imp?` (imposta ${pct(P(sel+1).imp,0)})`:""}: ${eur0(Math.abs(fN.oneriPct-fA.oneriPct)*fA.ric)} ${fN.oneriPct>fA.oneriPct?"in meno":"in più"} a parità di ricavi`:`INPS ${eur0(fA.inps)} + imposta ${eur0(fA.imp)}`,tone:fN&&fN.oneriPct>fA.oneriPct?"amb":""});
    ins.push({v:eur0(fA.giugno),l:`F24 di giugno ${sel+1}`,s:`saldo ${sel} + primi acconti ${sel+1}${sel===nowY?` · ${eur0(f24next12)} nei prossimi 12 mesi`:""}`,tone:"neg"});
  }
  const top=cliRows.filter(r=>r.ricSel>0)[0];if(top)ins.push({v:pct(top.ricSel/totSel,0),l:`Peso di ${esc(top.c.nome)}`,s:top.ricSel/totSel>.6?`dei ricavi fatturati ${sel}: un ritardo di pagamento pesa molto sulla cassa`:`dei ricavi fatturati ${sel}`,tone:top.ricSel/totSel>.6?"amb":""});
  const fast=cliRows.filter(r=>r.avg!=null&&r.n>=3).sort((a,b)=>a.avg-b.avg);if(fast.length>1)ins.push({v:`${Math.round(fast[0].avg)} / ${Math.round(fast[fast.length-1].avg)} gg`,l:"Giorni medi di incasso",s:`${esc(fast[0].c.nome)} il più rapido, ${esc(fast[fast.length-1].c.nome)} il più lento (dalla data fattura al bonifico)`,tone:""});
  const ggPrev=PRa.filter(x=>x.anno===sel).reduce((a,x)=>a+x.gg,0);
  const indPrev=PRa.filter(x=>x.anno===sel).reduce((a,x)=>a+x.ind,0);
  if(tr.gg||ggPrev)ins.push({v:tr.gg?eur(indNet/tr.gg):eur(indPrev*(1-fs.oneriPct)/ggPrev),l:"Netto per giorno di trasferta",s:`${tr.gg} gg fatturati${ggPrev?` + ${ggPrev} previsti = ${tr.gg+ggPrev} gg`:""} · ${eur0(tr.ind)} lordi, ${eur0(indNet)} netti`,tone:""});
  // 8. where 100 EUR go (selected year and next)
  const split=f=>f&&f.ric>0?{inps:f.inps/f.ric,imp:f.imp/f.ric,net:f.netto/f.ric}:null;
  const hb=(lab,f)=>{const x=split(f);if(!x)return"";const seg=(w,c,t)=>`<i style="width:${Math.max(0,w*100)}%;background:${c}" title="${t}">${w>=.07?Math.round(w*100)+" €":""}</i>`;
    return `<div style="margin:8px 0 14px"><div style="display:flex;justify-content:space-between;font-family:var(--f-ui);font-weight:600;font-size:13px;margin-bottom:4px"><span>${lab}</span><span class="muted">${eur0(f.ric)} di ricavi</span></div><div class="hbar">${seg(x.net,"var(--green-soft)","Netto")}${seg(x.inps,"var(--tax2)","INPS")}${seg(x.imp,"var(--tax)","Imposta")}</div></div>`};
  const hundred=hb(String(sel),fA)+hb(String(sel+1)+(fN&&fN.contr>0?" (previsione)":""),fN)+(()=>{const F=flowYear(FX,sel);if(!F.tin)return"";const q=v=>v/F.tin;const seg=(w,c,t)=>`<i style="width:${Math.max(0,w*100)}%;background:${c}" title="${t}">${w>=.07?Math.round(w*100)+" €":""}</i>`;const mg=Math.max(0,F.tsal);
    return `<!--feat--><div style="margin:8px 0 14px"><div style="display:flex;justify-content:space-between;font-family:var(--f-ui);font-weight:600;font-size:13px;margin-bottom:4px"><span>${sel}, dove vanno le entrate</span><span class="muted">${eur0(F.tin)} di entrate</span></div><div class="hbar">${seg(q(F.tf24),"var(--tax)","F24")}${seg(q(F.sp*12),"var(--amber-soft)","Spese")}${seg(q(F.pac*12),"var(--cost)","PAC")}${seg(q(F.rm*12),"var(--sky)","Risparmi")}${seg(q(mg),"var(--green-soft)","Margine")}</div></div><!--/feat-->`})();
  // 9. cash next 12 months: expected receipts vs F24
  // Calendar year of the selector: months already gone are actual, the rest forecast.
  const FY=flowYear(FX,sel);const m12=FY.rows.map(r=>r.m);const inM=FY.rows.map(r=>r.in);const outM=FY.rows.map(r=>r.f24);
  let cumC=0;const cumM=m12.map((m,i)=>cumC+=inM[i]-outM[i]);
  const cashChart=svgBars(m12.map(m=>MESI[+m.slice(5)-1]),[{name:"Entrate",color:"var(--c-ink)",vals:inM},{name:"F24",color:"var(--tax)",vals:outM},{name:"Spese, PAC e risparmi",color:"var(--amber-soft)",vals:FY.rows.map(r=>r.sp+r.pac+r.rm)}],{wide:true,label:"Cassa "+sel});
  const inTot=inM.reduce((a,b)=>a+b,0),outTot=outM.reduce((a,b)=>a+b,0),peakF=Math.max(...outM),peakI=outM.indexOf(peakF);
  // extra tiles: free cash after F24 and next-year revenue already secured by signed contracts
  {const extra=[];
   if(sel>=nowY){const st=speseStats();const net=inTot-outTot-(st?FY.tsp:0);
     extra.push({feat:1,v:eur0(net),l:`Cassa libera netta ${sel}`,s:st?`entrate ${eur0(inTot)} − F24 ${eur0(outTot)} − spese ${eur0(FY.tsp)} (${sel===nowY?"reali fino al mese scorso, poi media":"media"} dei mesi caricati; esclusi lavori casa)`:`entrate ${eur0(inTot)} meno F24 ${eur0(outTot)}; esclude le spese personali`,tone:net>=0?"pos":"bad"})}
   const fN2=FX[sel+1];
   if(sel>=nowY&&fN2&&fN2.ric>0){const firm=PRa.filter(x=>x.anno===sel+1&&!((S.contratti.find(c=>c.id===x.contratto)||{}).ipotesi)).reduce((a,x)=>a+x.comp,0)+S.invoices.filter(v=>fy(v)===sel+1).reduce((a,v)=>a+tot(v).imponibile,0);
     const q=firm/fN2.ric;extra.push({v:pct(q,0),l:`Ricavi ${sel+1} già firmati`,s:`${eur0(firm)} da contratti firmati su ${eur0(fN2.ric)} previsti: il resto dipende dai rinnovi`,tone:q<.5?"amb":"pos"})}
   let idx=ins.findIndex(t=>/^Peso|^Giorni medi|^Netto per giorno/.test(t.l));if(idx<0)idx=ins.length;ins.splice(idx,0,...extra);
   if(fA&&fA.ric>0){ins.push({v:pct(fA.oneriPct*(1+P(sel).margine),0),l:`Da accantonare ${sel}`,s:`di ogni incasso, per coprire INPS e imposta con margine del ${pct(P(sel).margine,0)}`,tone:""});ins.push({v:eur0(fA.ric/12),l:`Ricavo medio mensile ${sel}`,s:`lordo, prima di INPS e imposta`,tone:""});
     if(by[sel]&&by[sel].n)ins.push({v:String(by[sel].n),l:`Fatture ${sel}`,s:`importo medio ${eur0(by[sel].comp/by[sel].n+by[sel].ind/by[sel].n)}`,tone:""})}}
  // Six tiles at most, in a 3 × 2 grid: the essentials of the year. Client timing, per-day allowance and signed share
  // stay in Clienti and Entrate.
  {const n0=ins.length;ins.length=n0>=10?10:n0>=8?8:n0>=6?6:n0>1?n0-(n0%2):n0;
   const drop=/^Ricavi vs|già firmati|^Giorni medi|^Netto per giorno|^Fatture \d|^Da accantonare/;const keep=ins.filter(t=>!drop.test(t.l));
   const pick=keep.length>=6?keep.slice(0,6):keep.concat(ins.filter(t=>drop.test(t.l))).slice(0,6);ins.splice(0,ins.length,...pick)}
  const nT=ins.length, kT=nT>1?nT-(nT%2):nT;ins.length=kT;const colsT=kT===6?3:kT>=4?kT/2:kT;
  {const ctx={fA,fN,FX,s,sel,nowY,cliRows,totSel,fast,tr,ggPrev,inM,outM,m12,inTot,outTot,spTot:FY.tsp};ins.forEach(t=>tileViz(t,ctx))}
  // 10. heatmap months x years (cash basis, incl. contracts)
  const hy=years().filter(y=>S.invoices.some(v=>fy(v)===y)||PRa.some(x=>x.anno===y));
  const hv={},hp={};S.invoices.forEach(v=>{const d=effDate(v);if(!d)return;const k=d.slice(0,7);hv[k]=(hv[k]||0)+tot(v).imponibile});
  PRa.forEach(x=>{const k=x.incasso.slice(0,7);hv[k]=(hv[k]||0)+x.imponibile;hp[k]=1});
  const hmax=Math.max(1,...Object.values(hv));
  const heat=`<table class="heat"><thead><tr><th></th>${MESI.map(m=>`<th>${m}</th>`).join("")}<th>Tot.</th></tr></thead><tbody>${hy.map(y=>{let t=0;return `<tr><td class="y">${y}</td>${MESI.map((_,i)=>{const k=y+"-"+pad(i+1),v=hv[k]||0;t+=v;const a=v/hmax;return `<td style="background:${v?`color-mix(in srgb,var(--slate) ${Math.round(12+a*78)}%,var(--surface))`:"var(--surface-2)"};color:${a>.45?"#fff":"var(--fg)"};${hp[k]?"outline:1px dashed var(--slate-2);outline-offset:-2px;":""}" data-tip="${MESI[i]} ${y}\n${eur0(v)}${hp[k]?"\ninclude previsioni da contratto":""}">${v?(v/1000).toLocaleString("it-IT",{maximumFractionDigits:1})+"k":""}</td>`}).join("")}<td class="num" style="font-weight:700">${(t/1000).toLocaleString("it-IT",{maximumFractionDigits:1})}k</td></tr>`}).join("")}</tbody></table>`;
  const AT=[["sintesi","Sintesi"],["cassa","Cassa e F24"],["clienti","Clienti"],["personali","Finanze"]];
  const at=AT.some(x=>x[0]===S.atab)?S.atab:"sintesi", hid=k=>k===at?"":" hidden";
  return `
  <div class="segs" role="tablist" aria-label="Viste dell'analisi">${AT.map(([k,l])=>`<button type="button" role="tab" aria-selected="${k===at}" data-atab-go="${k}">${l}</button>`).join("")}</div>
  <div class="atab"${hid("sintesi")}>
  <section class="panel"><div class="panel-h"><h2>In sintesi</h2><div class="spacer"></div><span class="eyebrow">anno selezionato ${sel}</span></div><div class="itiles" style="--cols:${colsT}">${ins.map(t=>`${t.feat?"<!--feat-->":""}<div class="itile">${t.ring||""}<div class="iv ${t.tone}" ${t.ring?'style="padding-right:52px"':""}>${t.v}</div><div class="il" ${t.ring?'style="padding-right:52px"':""}>${t.l}</div>${t.viz||""}${t.vzl||""}<div class="is">${t.s}</div></div>${t.feat?"<!--/feat-->":""}`).join("")||`<div class="empty">Servono più dati per le osservazioni.</div>`}</div></section>
  <div class="grid">
   <section class="panel c6"><div class="panel-h"><h2>Andamento pluriennale</h2><div class="spacer"></div>${lg([["Ricavi","var(--c-ink)"],["Oneri","var(--tax)"],["Netto","var(--green-soft)"],["stima","var(--c-ink)",1]])}</div><div class="panel-b chart">${annual}<div class="chart-note">Anni con riquadro tratteggiato = includono ricavi stimati non ancora fatturati.</div></div></section>
   <section class="panel c6"><div class="panel-h"><h2>Ricavi cumulati ${sel}</h2><div class="spacer"></div>${lg(cumSeries.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${cumChart}<div class="chart-note">Include le fatture aperte alla data di incasso attesa.</div></div></section>
   <section class="panel c12"><div class="panel-h"><h2>Confronto annuale</h2></div><div class="tw"><table><thead><tr><th>Anno</th><th class="r">Minimo</th><th class="r">Ricavi</th><th class="r">Var.</th><th class="r">Oneri</th><th class="r">%</th><th class="r">Netto</th><th class="r">/mese</th><th class="c">Fatt.</th></tr></thead><tbody>${aRows}</tbody></table></div></section>
  </div></div>
  <div class="atab"${hid("cassa")}><div class="grid">
   <!--feat--><section class="panel c12"><div class="panel-h"><h2>Cassa ${sel}</h2><div class="spacer"></div>${lg([["Entrate","var(--c-ink)"],["F24","var(--tax)"],["Spese, PAC e risparmi","var(--amber-soft)"]])}</div><div class="panel-b chart">${cashChart}<div class="chart-note">Gennaio–dicembre ${sel}: i mesi passati sono reali (incassi, F24 registrati, spese degli estratti conto), gli altri previsti da fatture aperte e contratti. Spese senza lavori di casa. Saldo dell'anno: <b class="${FY.tsal<0?"bad":"pos"}">${FY.tsal<0?"−":"+"}${eur0(Math.abs(FY.tsal))}</b>. Dettaglio mese per mese nella scheda Entrate.</div></div></section><!--/feat-->
   <section class="panel c12"><div class="panel-h"><h2>Dove vanno 100 €</h2><div class="spacer"></div>${lg([["Netto / margine","var(--green-soft)"],["INPS","var(--tax2)"],["Imposta / F24","var(--tax)"],["Spese","var(--amber-soft)"],["PAC","var(--cost)"],["Risparmi","var(--sky)"]])}</div><div class="panel-b split2"><div>${hundred||`<div class="empty">Nessun dato.</div>`}</div>
     <div class="mini">
      <!--feat--><div><span>Entrate ${sel}</span><b class="num">${eur0(inTot)}</b></div>
      <div><span>F24 ${sel}</span><b class="num neg">${eur0(outTot)}</b></div>
      <div><span>Disponibile dopo F24</span><b class="num pos">${eur0(inTot-outTot)}</b></div>
      <div><span>Mese più pesante</span><b class="num">${peakF>0?MESI[+m12[peakI].slice(5)-1]+" · "+eur0(peakF):"—"}</b></div><!--/feat-->
     </div></div></section>
   <section class="panel c12"><div class="panel-h"><h2>Incassi mese per mese</h2><div class="spacer"></div><span class="eyebrow">per data di incasso · bordo tratteggiato = include previsioni da contratto</span></div><div class="panel-b" style="overflow-x:auto">${heat}</div></section>
   <section class="panel c12"><div class="panel-h"><h2>Calendario F24</h2><div class="spacer"></div>${lg([["Versato","var(--green-soft)"],["Da versare","var(--tax)"],["Stima","var(--vz-plan)",1]])}</div><div class="panel-b chart">${f24Chart}</div></section>
  </div></div>
  <div class="atab"${hid("clienti")}><div class="grid">
   <section class="panel c6"><div class="panel-h"><h2>Ricavi per cliente</h2><div class="spacer"></div>${lg(cSer.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${cliChart}</div></section>
   <section class="panel c6"><div class="panel-h"><h2>Composizione del fatturato</h2><div class="spacer"></div>${lg([["Compenso","var(--c-ink)"],["Indennità","var(--sky)"],["Rimborsi","var(--green-soft)"]])}</div><div class="panel-b chart">${compChart}</div></section>
   <section class="panel c12"><div class="panel-h"><h2>Clienti a confronto</h2></div><div class="tw"><table><thead><tr><th>Cliente</th><th class="r">Ricavi totali</th><th class="r">Netto stimato</th><th class="r">Quota ${sel}</th><th class="c">Fatture</th><th class="r">Gg incasso medi</th><th class="r">min–max</th><th class="r">Gg trasferta</th><th class="r">Da incassare</th></tr></thead><tbody>
     ${cliRows.map(r=>`<tr><td class="cli">${cliw(r.c,r.c.nome)}</td><td class="r num">${eur0(r.ric)}</td><td class="r num pos">${eur0(r.net)}</td><td class="r num ${r.ricSel/totSel>.6?"neg":""}">${pct(r.ricSel/totSel,0)}</td><td class="c num">${r.n}</td><td class="r num">${r.avg==null?"—":Math.round(r.avg)}</td><td class="r num muted">${r.min==null?"":r.min+"–"+r.max}</td><td class="r num">${r.gg||"—"}</td><td class="r num">${r.open?eur0(r.open):"—"}</td></tr>`).join("")}
   </tbody></table></div></section>
   <section class="panel c12"><div class="panel-h"><h2>Trasferte ${sel}</h2></div><div class="panel-b"><div class="mini">
      <div><span>Giorni fatturati</span><b>${tr.gg||0}</b></div>
      <div><span>Indennità lorda</span><b>${eur0(tr.ind||0)}</b></div>
      <div><span>Indennità netta stimata</span><b class="pos">${eur0(indNet)}</b></div>
      <div><span>Netto per giorno</span><b>${tr.gg?eur(indNet/tr.gg):"—"}</b></div>
   </div><p class="note" style="margin:12px 0 0">L'indennità è tassata come compenso. Le spese documentate riaddebitate voce per voce (voli, trasporti, alloggio fuori sede) restano fuori dal reddito e dalla soglia.</p></div></section>

  </div></div>
  <div class="atab"${hid("personali")}>${personalAnal(FX)}</div>`;
}
function contoTassePanel(rows){
  const ct=ctInfo()||{};const today=todayISO();
  const due=(days)=>rows.filter(r=>!r.versato&&r.data>=today&&r.data<=addDays(today,days)).reduce((a,r)=>a+r.importo,0);
  const d6=due(183),d12=due(365);const saldo=+ct.saldo||0;const cov=d12?saldo/d12:1;
  const FX=fisco();const y=new Date().getFullYear();
  const accYTD=S.invoices.filter(v=>v.incasso&&v.incasso.startsWith(String(y))&&(!ct.data||v.incasso>ct.data)).reduce((a,v)=>a+oneriInv(v,FX).accantona,0);
  return `<div class="panel-b" style="border-top:1px solid var(--line-2)">
   <div style="display:flex;align-items:baseline;gap:4px 10px;flex-wrap:wrap;margin-bottom:10px"><b style="font-family:var(--f-ui);font-size:16px;white-space:nowrap;display:inline-flex;align-items:center;gap:8px">${ico("piggy",18)}Conto tasse</b><span class="muted" style="font-size:13px">quanto hai messo da parte contro quanto dovrai versare</span></div>
   <div class="mini m3">
    <div><span>Saldo accantonato${ct.data?" al "+dmy(ct.data):""}</span><b class="num">${eur0(saldo)}</b></div>
    <div><span>F24 nei prossimi 6 mesi</span><b class="num neg">${eur0(d6)}</b></div>
    <div><span>F24 nei prossimi 12 mesi</span><b class="num neg">${eur0(d12)}</b></div>
    <div><span>Copertura 12 mesi</span><b class="num ${cov>=1?"pos":"bad"}">${pct(Math.min(cov,9.99),0)}</b></div>
    <div><span>${saldo>=d12?"Margine":"Mancano"}</span><b class="num ${saldo>=d12?"pos":"bad"}">${eur0(Math.abs(saldo-d12))}</b></div>
    <div><span>Da aggiungere per incassi recenti</span><b class="num">${eur0(accYTD)}</b></div>
   </div>
   ${ct.linked?`<p class="muted" style="margin:12px 0 0;font-size:13px">${logoImg(ct.linked.logo,ct.linked.nome).replace('class="lgo"','class="lgo s"')}Saldo preso dal conto ${esc(ct.linked.nome)} "${esc(ct.linked.prodotto)}": si aggiorna con «Aggiorna» nel piano di accantonamento qui sotto.</p>`:`<div class="inline-pop" style="margin-top:12px"><label for="ct-saldo" class="muted">Saldo attuale €</label><input id="ct-saldo" inputmode="decimal" class="num" style="width:120px" value="${ct.saldo??""}"><button class="btn small dark" id="ctSave" type="button">Aggiorna saldo</button><span class="muted" style="font-size:12px">Aggiornalo quando sposti soldi sul conto delle tasse o paghi un F24.</span></div>`}
  </div>`;
}
function vTasse(FX,part){
  // Fisco › Tasse e F24 has two views: "f24" (payments) and "conto" (tax account and its saving plan).
  if(part==="conto"){const rowsAll=f24Rows(FX);return intro("Il conto dove metti da parte le tasse: quanto hai accantonato contro quello che dovrai versare con gli F24, e quanto versarci ogni mese per coprirli tutti.")+`<section class="panel">${contoTassePanel(rowsAll).replace('style="border-top:1px solid var(--line-2)"',"")}</section>${ctPanelR(ctPlan(FX))}`}
  const rowsAll=f24Rows(FX);const lim12=addDays(todayISO(),365);const rows=S.f24all?rowsAll:rowsAll.filter(r=>r.data<=lim12);const hidden=rowsAll.length-rows.length; const today=todayISO(); const cy=new Date().getFullYear();
  const open=rows.filter(r=>!r.versato&&r.data>=today);
  const resid=open.filter(r=>r.data.slice(0,4)===String(cy)).reduce((a,r)=>a+r.importo,0);
  const nx=open[0], d12=open.filter(r=>r.data<=addDays(today,365)).reduce((a,r)=>a+r.importo,0);
  const vers=rows.filter(r=>r.versato&&r.data.startsWith(String(cy))).reduce((a,r)=>a+r.importo,0);
  const ci=nx?cdInfo(nx.data):null;
  // v2: payments of previous years are history: collapsed by default.
  const pastN=rows.filter(r=>r.versato&&r.data<cy+"-01-01").length, rowsT=S.f24past?rows:rows.filter(r=>!(r.versato&&r.data<cy+"-01-01"));
  const KT={};{const lab=r=>dmy(r.data).slice(0,5)+" · "+(r.bollo?"bollo":r.descrizione.split(" – ")[0].split(" (")[0])+": "+eur0(r.importo);
   const nx6=open.filter(r=>r.data<=addDays(today,120)).slice(0,6);if(nx6.length)KT.nx=VZ.cols(nx6.map(r=>r.importo),[0],"Prossimi versamenti\n"+nx6.map(lab).join("\n"),i=>i===0?"var(--cost)":"var(--c-soft)")+`<div class="vzl"><span>${dmy(nx6[0].data).slice(0,5)}</span><span>${dmy(nx6[nx6.length-1].data).slice(0,5)}</span></div>`;
   const yr=open.filter(r=>r.data.slice(0,4)===String(cy));const PC=["var(--cost)","var(--c-mid)","var(--c-soft)","var(--c-pale)","var(--c-faint)"];
   if(yr.length)KT.yr=VZ.stack(yr.map((r,i)=>({v:r.importo,c:PC[i%PC.length]})),Math.max(1,resid),[],yr.map(lab).join("\n"))+`<div class="vzl"><span>${dmy(yr[0].data).slice(0,5)}</span><span>${dmy(yr[yr.length-1].data).slice(0,5)}</span></div>`;
   const m12=[];{const d=new Date();for(let i=0;i<12;i++){const x=new Date(d.getFullYear(),d.getMonth()+i,1);m12.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}}
   const vv=m12.map(m=>open.filter(r=>r.data.slice(0,7)===m).reduce((a,r)=>a+r.importo,0));
   KT.d12=VZ.cols(vv,[],"F24 nei prossimi 12 mesi\n"+m12.map((m,i)=>vv[i]?MESI[+m.slice(5)-1]+" "+m.slice(2,4)+": "+eur0(vv[i]):null).filter(Boolean).join("\n"),i=>vv[i]===Math.max(...vv)?"var(--cost)":"var(--c-soft)");
   const mm=Array.from({length:12},(_,i)=>rows.filter(r=>r.versato&&r.data.startsWith(cy+"-"+pad(i+1))).reduce((a,r)=>a+r.importo,0));
   KT.vers=VZ.cols(mm,[],"Versato nel "+cy+"\n"+mm.map((v,i)=>v?MESI[i]+": "+eur0(v):null).filter(Boolean).join("\n"),()=>"var(--green-soft)")}
  return `${intro("Tutti i versamenti con F24: imposta sostitutiva, contributi INPS e bollo delle fatture elettroniche. Le scadenze compaiono anche in Scadenze, in Dashboard e nel tuo Google Calendar.")}
  <div class="kpis k3">
    <div class="kpi"><div class="l">Prossimo versamento</div><div class="v">${nx?eur0(nx.importo):"—"}</div>${KT.nx||""}<div class="s">${nx?dmy(nx.data)+` · <span class="cdp ${ci.c}">${ci.t}</span>`:"nessuno"}</div></div>
    <div class="kpi"><div class="l">Da versare entro il 31/12</div><div class="v">${eur0(resid)}</div>${KT.yr||""}<div class="s">${open.filter(r=>r.data.slice(0,4)===String(cy)).length} versamenti</div></div>
    <div class="kpi green"><div class="l">Versato nel ${cy}</div><div class="v">${eur0(vers)}</div>${KT.vers||""}<div class="s">registrato nell'app</div></div>
  </div>
  <section class="panel"><div class="panel-h"><h2>${ico("euro",18)} Versamenti F24</h2><div class="spacer"></div><button class="btn small" id="addF24" type="button">+ Aggiungi versamento</button></div>
  <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Le righe "stima" sono calcolate dal Calcolo fiscale. Con «Modifica» metti l'importo vero (quello dell'F24 della commercialista): la riga diventa un versamento da fare e la stima sparisce. Lo stesso succede quando aggiungi il versamento reale dello stesso mese. Il bollo delle fatture elettroniche (€2 a fattura) lo precompila l'Agenzia nel portale Fatture e Corrispettivi: verifica con ${esc((cfg().commercialista||{}).nome||"la commercialista")} se lo versa già lei o con addebito diretto.</p></details>
  ${pastN?`<div class="panel-b" style="padding:8px 16px"><button class="btn small ghost" type="button" data-f24-past="1">${S.f24past?"Nascondi i versamenti degli anni precedenti":`Mostra i versamenti degli anni precedenti (${pastN})`}</button></div>`:""}
  <div class="tw"><table class="stack"><thead><tr><th>Data</th><th>Mancano</th><th>Descrizione</th><th>Tributi</th><th class="r">Importo</th><th class="c">Stato</th><th></th></tr></thead><tbody>
  ${rowsT.map(r=>{const late=!r.versato&&r.data<today, soon=!r.versato&&!late&&daysBetween(today,r.data)<=30;
    return `<tr class="u-${cdInfo(r.data,r.versato).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.versato)}</td><td>${esc(r.descrizione)}</td><td class="muted">${esc(r.tributi||"")}</td><td class="r num"><b class="neg">${eur(r.importo)}</b></td>
    <td class="c">${r.stima?`<span class="pill est">stima</span>`:r.versato?`<span class="pill ok">Versato</span>`:late?`<span class="pill late">Scaduto</span>`:`<span class="pill quiet">da versare</span>`}</td>
    <td class="r acts">${r.stima?`<button class="btn small" data-f24est="${r.id}" data-paid="1">Segna versato</button> <button class="btn small ghost" data-f24est="${r.id}" aria-label="Modifica la stima">Modifica</button>`:`<button class="btn small ${r.versato?"ghost":""}" data-f24pay="${r.id}">${r.versato?"Annulla":"Segna versato"}</button> <button class="btn small ghost" data-f24edit="${r.id}" aria-label="Modifica">Modifica</button>`}</td></tr>`}).join("")||`<tr><td colspan="7" class="empty">Nessuna scadenza.</td></tr>`}
  </tbody></table></div>${hidden||S.f24all?`<div class="panel-b" style="text-align:center"><button class="btn small ghost" id="f24more" type="button">${S.f24all?"Mostra solo i prossimi 12 mesi":"Mostra anni successivi ("+hidden+")"}</button></div>`:""}</section>`;
}
function vF24(FX){
  return `${intro("Tutto quello che ha una data: promemoria, scadenze dei contratti e versamenti F24 dei prossimi 12 mesi. I dettagli degli F24 sono nella scheda F24 e tasse.")}${promemoriaPanel(f24Rows(FX).filter(r=>!r.versato&&r.data>=addDays(todayISO(),-30)&&r.data<=addDays(todayISO(),365)))}`;
}
function vFisco(FX){
  const ST=fiscoCore(null);
  const ys=years().filter(y=>FX[y]&&(FX[y].ric>0||y<=S.year+1));
  const F=cfg().fisco||{};
  const inp=(y,k)=>{const o=F[String(y)]||{};return `<input class="num" data-fov="${y}:${k}" inputmode="decimal" value="${o[k]!=null&&o[k]!==""?String(o[k]).replace(".",","):""}" placeholder="—" aria-label="${k} ${y}">`};
  const row=(lab,fn,cls="",help="")=>`<tr class="${cls}"><td>${lab}${help?`<div class="muted" style="font-size:12px">${help}</div>`:""}</td>${ys.map(y=>`<td class="r num">${fn(FX[y],y)}</td>`).join("")}</tr>`;
  const sec=t=>`<tr class="sec"><td colspan="${ys.length+1}">${t}</td></tr>`;
  return `<section class="panel"><div class="panel-h"><h2>Calcolo fiscale annuale</h2><div class="spacer"></div><button class="btn small dark" id="dossier" data-y="${S.year<new Date().getFullYear()?S.year:new Date().getFullYear()-1}" type="button">${ico("file",14)} Riepilogo dichiarazione ${S.year<new Date().getFullYear()?S.year:new Date().getFullYear()-1}</button></div>
  <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Principio di cassa: ricavi per anno di <b>incasso</b>, INPS dedotto nell'anno in cui è <b>versato</b>. I campi in azzurro accettano i dati reali (dichiarazione, prospetto F24) o le tue stime; lasciati vuoti, il valore si calcola.</p></details>
  <div class="tw fisco"><table><thead><tr><th>Voce</th>${ys.map(y=>`<th class="r">${y}</th>`).join("")}</tr></thead><tbody>
  ${sec("A · Ricavi dell'anno")}
  ${row("Ricavi incassati",f=>eur(f.inc))}
  ${row("Fatture emesse da incassare",f=>eur(f.att))}
  ${row("Ricavi da contratti (da fatturare)",f=>eur(f.contr),"","Dalla sezione Contratti e missioni.")}
  ${row("Altri ricavi stimati",(f,y)=>inp(y,"stima"),"","Solo incarichi extra non coperti da contratto.")}
  ${row("Ricavi totali anno",f=>`<b style="color:var(--amber)">${eur(f.ric)}</b>`,"tot")}
  ${row("Soglia €85.000 usata",f=>pct(f.soglia))}
  ${sec("B · Reddito e INPS (Gestione Separata)")}
  ${row("Coefficiente di redditività",f=>pct(f.p.coef,0))}
  ${row("Reddito forfettario",f=>eur(f.red))}
  ${row("INPS dovuto – calcolato",f=>eur(f.inpsCalc),"",`Aliquota ${pct(P(S.year).inps,2)}`)}
  ${row("INPS dovuto – dato reale",(f,y)=>inp(y,"inps"),"","Quadro RR della dichiarazione.")}
  ${row("INPS dovuto (usato)",f=>`<b class="neg">${eur(f.inps)}</b>`,"tot")}
  ${row("Acconti INPS versati nell'anno",(f,y)=>`${eur(f.accInps)}<br>${inp(y,"accontiInps")}`,"","Vuoto = 80% del dovuto dell'anno prima.")}
  ${row("Saldo INPS (giugno anno dopo)",f=>eur(f.saldoInps))}
  ${row("INPS versati nell'anno (deducibili)",(f,y)=>`${eur(f.inpsVers)}<br>${inp(y,"inpsVersati")}`,"","Saldo anno prima + acconti dell'anno.")}
  ${sec("C · Imposta sostitutiva")}
  ${row("Base imponibile",f=>eur(f.base))}
  ${row("Aliquota",f=>pct(f.p.imp,0))}
  ${row("Imposta – calcolata",f=>eur(f.impCalc))}
  ${row("Imposta – dato reale",(f,y)=>inp(y,"imposta"),"","Codice 1792 / dichiarazione.")}
  ${row("Imposta (usata)",f=>`<b class="neg">${eur(f.imp)}</b>`,"tot")}
  ${row("Acconti imposta versati nell'anno",(f,y)=>`${eur(f.accImp)}<br>${inp(y,"accontiImp")}`,"","Metodo storico: 100% dell'imposta dell'anno prima.")}
  ${row("Saldo imposta (giugno anno dopo)",f=>eur(f.saldoImp))}
  ${sec("D · F24 generati (si pagano l'anno dopo)")}
  ${row("Metodo acconti per l'anno dopo",(f,y)=>`<select class="accsel" data-acc="${y+1}" aria-label="Metodo acconti ${y+1}"><option value="storico" ${accMeth(y+1)==="storico"?"selected":""}>storico</option><option value="previsionale" ${accMeth(y+1)==="previsionale"?"selected":""}>previsionale</option></select>`,"","Storico: acconti sull'imposta di quest'anno. Previsionale: sui ricavi attesi l'anno dopo; se li sottostimi oltre la tolleranza paghi sanzioni e interessi.")}
  ${row("Differenza rispetto allo storico",(f,y)=>{const d=(f.giugno+f.novembre)-((ST[y]||{}).giugno+(ST[y]||{}).novembre||0);return Math.abs(d)<1?"—":`<b class="${d<0?"pos":"neg"}">${d>0?"+":"−"}${eur(Math.abs(d))}</b>`},"","F24 di giugno + novembre dell'anno dopo.")}
  ${row("F24 di giugno: saldi + I acconti",f=>`<b class="neg">${eur(f.giugno)}</b>`,"tot")}
  ${row("F24 di novembre: II acconti",f=>`<b class="neg">${eur(f.novembre)}</b>`,"tot")}
  ${sec("E · Sintesi")}
  ${row("Oneri dell'anno",f=>`<b class="neg">${eur(f.oneri)}</b>`,"tot")}
  ${row("Netto reale dell'anno",f=>`<b class="pos">${eur(f.netto)}</b>`,"tot")}
  ${row("Oneri % sui ricavi",f=>pct(f.oneriPct))}
  ${row("Da accantonare (oneri + margine)",f=>eur(f.accantona))}
  ${row("Netto medio mensile",f=>`<span class="pos">${eur(f.netto/12)}</span>`)}
  </tbody></table></div></section>`;
}
function vSet(){
  const c=cfg(), ys=years(), fo=c.fornitore||{};
  return `<div class="grid">
  <section class="panel c6"><div class="panel-h"><h2>Clienti</h2><div class="spacer"></div><button class="btn small" id="addCli" type="button">+ Cliente</button></div>
   <div class="tw"><table><thead><tr><th>Cliente</th><th class="r">Compenso/mese</th><th class="r">€/gg trasf.</th><th class="r">Gg pagam.</th><th></th></tr></thead><tbody>
   ${S.clients.map(k=>`<tr><td class="cli">${cliw(k,k.nome)}</td><td class="r num">${k.compenso?eur(k.compenso):"—"}</td><td class="r num">${k.tariffa?eur(k.tariffa):"—"}</td><td class="r num">${k.gg??"—"}</td><td class="r"><button class="btn small ghost" data-cli="${k.id}">Modifica</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">Nessun cliente.</td></tr>`}
   </tbody></table></div></section>
  <section class="panel c6"><div class="panel-h"><h2>Parametri fiscali per anno</h2></div>
   <div class="tw"><table><thead><tr><th>Anno</th><th class="r">Coeff.</th><th class="r">INPS</th><th class="r">Imposta</th><th class="r">Margine</th></tr></thead><tbody>
   ${ys.map(y=>{const p=c.params[y];return `<tr><td class="num"><b>${y}</b></td>${["coef","inps","imp","margine"].map(k=>`<td class="r"><input class="cell-in in num" style="width:84px;text-align:right" data-par="${y}:${k}" value="${(p[k]*100).toLocaleString("it-IT",{maximumFractionDigits:2})}" inputmode="decimal" aria-label="${k} ${y} in %"></td>`).join("")}</tr>`}).join("")}
   </tbody></table></div>
   <div class="panel-b note">Valori in %. Coefficiente 67% (ATECO 94.99.40). Imposta 5% fino al 2026, 15% dal 2027. Aggiorna l'aliquota INPS a gennaio.</div></section>
  <section class="panel c12"><div class="panel-h"><h2>Dati in intestazione proforma</h2><div class="spacer"></div><button class="btn small dark" id="saveForn" type="button">Salva</button></div>
   <div class="panel-b"><div class="fields">
    <div class="f"><label for="fo-nome">Nome</label><input id="fo-nome" value="${esc(fo.nome)}"></div>
    <div class="f"><label for="fo-piva">P.IVA</label><input id="fo-piva" value="${esc(fo.piva)}"></div>
    <div class="f"><label for="fo-cf">Codice fiscale</label><input id="fo-cf" value="${esc(fo.cf)}"></div>
    <div class="f"><label for="fo-tel">Telefono</label><input id="fo-tel" value="${esc(fo.tel)}"></div>
    <div class="f s6"><label for="fo-ind">Indirizzo</label><textarea id="fo-ind" rows="2">${esc(fo.indirizzo)}</textarea></div>
    <div class="f"><label for="fo-email">E-mail</label><input id="fo-email" value="${esc(fo.email)}"></div>
    <div class="f"><label for="pg-banca">Banca</label><input id="pg-banca" value="${esc(c.pagamento.banca)}"></div>
    <div class="f s4"><label for="pg-iban">IBAN</label><input id="pg-iban" value="${esc(c.pagamento.iban)}"></div>
    <div class="f s2"><label for="pg-bic">BIC/SWIFT</label><input id="pg-bic" value="${esc(c.pagamento.bic)}"></div>
    <div class="f s2"><label for="cm-nome">Commercialista</label><input id="cm-nome" value="${esc((c.commercialista||{}).nome||"")}"></div>
    <div class="f s4"><label for="cm-mail">E-mail commercialista</label><input id="cm-mail" type="email" value="${esc((c.commercialista||{}).email||"")}"></div>
    <div class="f s2"><label for="em-dic">Giorno di emissione a dicembre</label><input id="em-dic" class="in num" inputmode="numeric" value="${(c.emissione||{}).dicembre||""}"><span class="help">Vale per tutti i clienti. Vuoto = regola del contratto. Weekend e festivi anticipano al giorno lavorativo prima.</span></div>
   </div></div></section>
  ${historyPanel()}
  <section class="panel c12"><div class="panel-h"><h2>Backup ed esportazione</h2></div><div class="panel-b" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <button class="btn dark" id="exportV3b" type="button">Scarica Excel v3 aggiornato</button><button class="btn" id="exportX2" type="button">Esporta solo dati (tabella semplice)</button><button class="btn" id="exportJ" type="button">Scarica backup completo</button>
    <span class="muted" style="font-size:13px">"Excel v3 aggiornato" è il tuo file completo (dashboard, formule, grafici) riempito con tutte le fatture, gli incassi, gli F24 e i parametri di oggi: sostituisci la versione precedente.</span></div></section>
  </div>`;
}
function bindView(FX){
  const app=$("#app");
  app.querySelectorAll("[data-proj]").forEach(b=>b.onclick=()=>{const [cid,m]=b.dataset.proj.split("|");const x=projections().find(p=>p.contratto===cid&&p.months[0]===m);if(x)openFormFromProj(x)});
  app.querySelectorAll("[data-risp]").forEach(b=>b.onclick=()=>openRisp(b.dataset.risp));{const r=$("#invRev");if(r)r.onclick=openInvRev;const p=$("#invPrices");if(p)p.onclick=openInvPrices;const sy=$("#invSync");if(sy)sy.onclick=openT212Sync;const si=$("#speseImp");if(si)si.onclick=openSpeseImport}
  app.querySelectorAll("[data-calsync]").forEach(b=>b.onclick=async()=>{b.disabled=true;await syncCalendar();b.disabled=false});
  app.querySelectorAll("[data-mail]").forEach(b=>b.onclick=()=>{const v=S.invoices.find(x=>x.id===b.dataset.mail);if(v)openMail(v)});
  app.querySelectorAll("[data-pm-done]").forEach(b=>b.onclick=()=>{const r=S.promemoria.find(x=>x.id===b.dataset.pmDone);if(r)write(db=>db.doc("promemoria/"+r.id).update({fatto:!r.fatto}),r.fatto?"Riaperto":"Segnato come fatto")});
  app.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>openReminder(b.dataset.pm==="new"?null:b.dataset.pm));
  app.querySelectorAll("[data-go-v]").forEach(b=>b.onclick=()=>setView(b.dataset.goV));
  app.querySelectorAll("[data-inbox-open]").forEach(b=>b.onclick=openInboxSheet);
  app.querySelectorAll("[data-ctr]").forEach(b=>b.onclick=()=>openContract(b.dataset.ctr==="new"?null:b.dataset.ctr));
  app.querySelectorAll("[data-mis]").forEach(b=>b.onclick=()=>openMission(b.dataset.mis==="new"?null:b.dataset.mis));
  app.querySelectorAll("[data-quota]").forEach(b=>b.onclick=()=>openQuota(null));
  const tv=$("#todoV3");if(tv)tv.onclick=()=>exportV3(FX);
  app.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{const g=b.dataset.go;if(g==="f24"||g==="tasse")setView("tasse");else{S.filter.stato=g==="inv-late"?"scadute":"aperte";setView("inv")}}));
  app.querySelectorAll("[data-open]").forEach(r=>r.addEventListener("click",()=>openDetail(r.dataset.open)));
  const fs=$("#fStato");if(fs){fs.value=S.filter.stato;fs.onchange=e=>{S.filter.stato=e.target.value;render()}}
  const fc=$("#fCli");if(fc){fc.value=S.filter.cliente;fc.onchange=e=>{S.filter.cliente=e.target.value;render()}}
  const fq=$("#fQ");if(fq){fq.oninput=e=>{S.filter.q=e.target.value;clearTimeout(fq._t);fq._t=setTimeout(()=>{render();const n=$("#fQ");if(n){n.focus();n.setSelectionRange(n.value.length,n.value.length)}},250)}}
  ["#exportX","#exportX2"].forEach(id=>{const b=$(id);if(b)b.onclick=()=>exportXlsx(FX)});
  ["#exportV3","#exportV3b"].forEach(id=>{const b=$(id);if(b)b.onclick=()=>exportV3(FX)});
  const ej=$("#exportJ");if(ej)ej.onclick=fullBackup;const ec=$("#exportCairn");if(ec)ec.onclick=exportCairn;
  app.querySelectorAll("[data-f24pay]").forEach(b=>b.onclick=()=>{const r=S.f24.find(x=>x.id===b.dataset.f24pay);if(r)write(db=>db.doc("f24/"+r.id).update({versato:!r.versato}),r.versato?"Segnato come da versare":"Versamento registrato")});
  app.querySelectorAll("[data-f24edit]").forEach(b=>b.onclick=()=>openF24(b.dataset.f24edit));
  // Estimates: "Modifica" opens them as a new payment with the estimated figures (the real row then replaces the estimate);
  // "Segna versato" records the estimated amount as paid.
  app.querySelectorAll("[data-f24est]").forEach(b=>b.onclick=()=>{const r=f24Rows(fisco()).find(x=>x.id===b.dataset.f24est);if(!r)return;
    const pre={data:r.data,importo:r.importo,descrizione:String(r.descrizione||"").replace(/\s*\(stima\)$/,""),tributi:r.tributi||"",versato:false};
    if(b.dataset.paid)write(db=>db.doc("f24/"+r.data+"-"+uid()).set({...pre,versato:true}),"Versamento registrato");else openF24(null,pre)});
  const af=$("#addF24");if(af)af.onclick=()=>openF24(null);
  const cs=$("#ctSave");if(cs)cs.onclick=()=>{const v=readNum($("#ct-saldo").value);write(db=>saveCfg(db,{contoTasse:{saldo:v,data:todayISO()}}),"Saldo aggiornato")};
  app.querySelectorAll("[data-fov]").forEach(i=>i.addEventListener("change",()=>{const [y,k]=i.dataset.fov.split(":");const v=i.value.trim()===""?null:parseFloat(i.value.replace(/\./g,"").replace(",","."));
    const F=JSON.parse(JSON.stringify(cfg().fisco||{}));F[y]=F[y]||{};if(v==null||isNaN(v))delete F[y][k];else F[y][k]=v;
    write(db=>saveCfg(db,{fisco:F}),"Calcolo aggiornato")}));
  app.querySelectorAll("[data-par]").forEach(i=>i.addEventListener("change",()=>{const [y,k]=i.dataset.par.split(":");const v=parseFloat(i.value.replace(",","."))/100;if(isNaN(v))return;
    const pr=JSON.parse(JSON.stringify(cfg().params));pr[y][k]=v;write(db=>saveCfg(db,{params:pr}),"Parametri salvati")}));
  const sf=$("#saveForn");if(sf)sf.onclick=()=>{const g=id=>$(id).value;write(db=>saveCfg(db,{fornitore:{nome:g("#fo-nome"),piva:g("#fo-piva"),cf:g("#fo-cf"),tel:g("#fo-tel"),indirizzo:g("#fo-ind"),email:g("#fo-email")},pagamento:{banca:g("#pg-banca"),iban:g("#pg-iban").replace(/\s+/g,""),bic:g("#pg-bic")},emissione:{dicembre:parseInt(g("#em-dic"))||null},commercialista:{nome:g("#cm-nome").trim(),email:g("#cm-mail").trim()}}),"Dati salvati")};
  const ac=$("#addCli");if(ac)ac.onclick=()=>openClient(null);
  bindSim();bindExtras();
  const fm=$("#f24more");if(fm)fm.onclick=()=>{S.f24all=!S.f24all;render()};
  app.querySelectorAll("[data-ack]").forEach(b=>b.onclick=()=>{const a=[...(cfg().ack||[]),b.dataset.ack];write(db=>saveCfg(db,{ack:a}),"Segnato come verificato")});
  app.querySelectorAll("[data-red]").forEach(b=>b.onclick=()=>openReddito(b.dataset.red==="new"?null:b.dataset.red));
  app.querySelectorAll("[data-restore]").forEach(b=>b.onclick=()=>restoreLog(b.dataset.restore));
  app.querySelectorAll("[data-acc]").forEach(x=>x.onchange=()=>{const A=Object.assign({},cfg().acconti||{});A[x.dataset.acc]=x.value;write(db=>saveCfg(db,{acconti:A}),"Metodo acconti salvato")});
  app.querySelectorAll("[data-cli]").forEach(b=>b.onclick=()=>openClient(b.dataset.cli));
}
async function saveCfg(db,patch){const ref=db.doc("config/main");const snap=await ref.get();if(snap.exists)await ref.update(patch);else await ref.set(Object.assign(JSON.parse(JSON.stringify(DEFAULT_CFG)),patch))}
function sheet(title,body,actions){
  const root=$("#sheetRoot");
  root.innerHTML=`<div class="sheet-bg" id="sbg"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="sheet-h"><h2>${esc(title)}</h2><div class="spacer"></div>${actions?`<div class="sheet-acts">${actions}</div>`:""}<button class="btn ghost" id="sClose" type="button" aria-label="Chiudi">✕</button></div><div class="sheet-b" id="sBody">${body}</div></div></div>`;
  document.body.style.overflow="hidden";
  $("#sClose").onclick=closeSheet; $("#sbg").addEventListener("click",e=>{if(e.target.id==="sbg")closeSheet()});
  document.addEventListener("keydown",escClose);
}
function escClose(e){if(e.key==="Escape")closeSheet()}
function closeSheet(){$("#sheetRoot").innerHTML="";document.body.style.overflow="";document.removeEventListener("keydown",escClose)}
function openDetail(id){
  const v=S.invoices.find(x=>x.id===id);if(!v)return;const FX=fisco();const t=tot(v),o=oneriInv(v,FX),c=clientById(v.cliente)||{nome:v.cliente};
  const st=stato(v);
  sheet(`Fattura ${v.num}`,`
   <div class="grid">
    <section class="panel c7"><div class="panel-h"><h2>${esc(c.nome)}</h2><div class="spacer"></div>${pillFor(v)}</div>
      <div class="panel-b"><div class="tw"><table class="dlines"><thead><tr><th>Descrizione</th><th class="r">Q.tà</th><th class="r">Prezzo</th><th class="r">Importo</th></tr></thead><tbody>
      ${(v.righe||[]).map(r=>`<tr class="dl"><td class="dl-d">${esc(r.desc)}${r.tipo==="rimborso"?' <span class="pill est">non tassato</span>':""}</td><td class="r num" data-l="Q.tà">${String(r.qta).replace(".",",")}</td><td class="r num" data-l="Prezzo">${eur(r.prezzo)}</td><td class="r num" data-l="Importo">${eur(r.qta*r.prezzo)}</td></tr>`).join("")}
      ${t.bollo?`<tr class="dl"><td class="dl-d">Imposta di bollo</td><td></td><td></td><td class="r num" data-l="Importo">${eur(t.bollo)}</td></tr>`:""}
      </tbody></table></div>
      ${v.note?`<p class="note" style="margin-top:12px">${esc(v.note)}</p>`:""}</div></section>
    <section class="panel c5"><div class="panel-h"><h2>Riepilogo</h2></div><div class="panel-b">
      <div class="sum-row"><span>Data fattura</span><b class="num">${dmy(v.data)}</b></div>
      <div class="sum-row"><span>Totale documento</span><b class="num">${eur(t.documento)}</b></div>
      <div class="sum-row"><span>Ricavi tassabili</span><span class="num">${eur(t.imponibile)}</span></div>
      <div class="sum-row"><span>Oneri stimati</span><span class="num neg">${eur(o.oneri)}</span></div>
      <div class="sum-row big"><span>Netto</span><span class="num pos">${eur(o.netto)}</span></div>
      <div class="sum-row"><span>Da accantonare</span><b class="num">${eur(o.accantona)}</b></div>
      <div class="sum-row"><small>Anno fiscale</small><small class="num">${fy(v)} ${v.incasso?"":"(atteso)"}</small></div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><div class="eyebrow" style="margin-bottom:6px">Fattura elettronica</div>
        <div class="sum-row"><span>${ico("pen",14)} Proforma</span><small class="num">${dmyShort(v.data)}</small></div>
        <div class="sum-row"><span>${ico("send",14)} Inviata a ${esc((cfg().commercialista||{}).nome||"commercialista")}</span>${v.inviataCommercialista?`<small class="num">${dmyShort(v.inviataCommercialista)}</small>`:`<button class="btn small dark" id="dMail" type="button">${ico("mail",13)} Prepara email</button>`}</div>
        <div class="sum-row"><span>${ico("stamp",14)} Emessa allo SdI</span>${emessa(v)?`<small class="num">${v.emessaSdi?dmyShort(v.emessaSdi):"sì"}${v.numeroSdi?" · n. "+esc(v.numeroSdi):""}</small>`:`<span class="inline-pop"><input id="sdiDate" type="date" value="${todayISO()}" aria-label="Data emissione SdI"><input id="sdiNum" placeholder="n. SdI (opz.)" style="width:96px" aria-label="Numero SdI"><button class="btn small primary" id="sdiOk" type="button">Confermata</button></span>`}</div>
      </div>
      <div class="sum-row" style="margin-top:6px"><span>${ico("file",14)} File della fattura elettronica</span>${v.pdf?`<span class="inline-pop file-acts"><a class="btn small" href="${esc(v.pdf.url||("/_blob/"+v.pdf.id))}" target="_blank" rel="noopener" title="${esc(v.pdf.nome||"")}">Apri</a>${env.attachmentBlob&&String(v.pdf.url||"").startsWith("cairn-att:")?`<button class="btn small" id="pdfDl" type="button" title="Scarica ${esc(v.pdf.nome||"")}">Scarica</button>`:""}</span>`:`<small class="muted">non caricato</small>`}</div>
      ${assetsCap?`<div class="inline-pop" style="margin-top:6px"><label class="btn small ${!v.pdf&&emessa(v)?"primary":""}" for="pdfUp" style="cursor:pointer">${ico("file",13)} ${v.pdf?"Sostituisci file":"Carica fattura elettronica"}</label><input id="pdfUp" type="file" accept=".pdf,.xml,.p7m,application/pdf,application/xml,text/xml,application/pkcs7-mime" style="display:none"><span class="muted" id="pdfMsg" style="font-size:12px"></span></div>`:""}
      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)">
        ${v.incasso?`<div class="sum-row"><span>Incassata il</span><b class="num">${dmy(v.incasso)}</b></div><button class="btn small" id="unpay" type="button">Annulla incasso</button>`
        :`<div class="eyebrow" style="margin-bottom:6px">${st==="Scaduta"?"Scaduta il "+dmy(scadenza(v)):"Incasso atteso il "+dmy(scadenza(v))}</div><div class="inline-pop"><label for="payDate" class="muted">Incassata il</label><input id="payDate" type="date" value="${todayISO()}"><button class="btn dark small" id="pay" type="button">Segna incassata</button></div>`}
      </div></div></section>
   </div>
   <div id="delZone"></div>`,
   `<button class="btn small" id="pfBtn" type="button">Proforma</button><button class="btn small" id="editBtn" type="button">Modifica</button>`);
  const pay=$("#pay");if(pay)pay.onclick=async()=>{const d=$("#payDate").value;if(!d)return;if(await write(db=>db.doc("invoices/"+v.id).update({incasso:d}),"Incasso registrato"))closeSheet()};
  const un=$("#unpay");if(un)un.onclick=async()=>{if(await write(db=>db.doc("invoices/"+v.id).update({incasso:null}),"Incasso annullato"))closeSheet()};
  $("#delZone").innerHTML=`<button class="btn small danger" id="delInv" type="button">Elimina fattura</button>`;
  $("#delInv").onclick=()=>{$("#delZone").innerHTML=`<span class="muted">Eliminare definitivamente la fattura ${esc(v.num)}?</span> <button class="btn small danger" id="delInv2" type="button">Sì, elimina</button> <button class="btn small ghost" id="delNo" type="button">No</button>`;
    $("#delInv2").onclick=async()=>{if(await write(db=>db.doc("invoices/"+v.id).delete(),"Fattura eliminata"))closeSheet()};$("#delNo").onclick=()=>openDetail(v.id)};
  $("#editBtn").onclick=()=>openForm(v);
  $("#pfBtn").onclick=()=>openProforma(v);
  const dm=$("#dMail");if(dm)dm.onclick=()=>openMail(v);
  // Download of the e-invoice file: fetched as soon as the detail opens, so the tap saves at once (on iPhone the share
  // sheet must open right after the tap).
  const dl=$("#pdfDl");if(dl&&v.pdf){const pending=navigator.onLine?env.attachmentBlob(v.pdf.url).catch(()=>null):Promise.resolve(null);
    dl.onclick=async()=>{const b=await pending;if(!b){toast(navigator.onLine?"File non disponibile":"I file allegati si scaricano solo online");return}await save(v.pdf.nome||`Fattura_${v.n}_${v.anno}.pdf`,b)}}
  const pu=$("#pdfUp");if(pu)pu.onchange=async()=>{const f=pu.files&&pu.files[0];if(!f)return;$("#pdfMsg").textContent="Caricamento…";
    try{const r=await assetsCap.upload(f);if(await write(db=>db.doc("invoices/"+v.id).update({pdf:{id:r.id,url:r.url,nome:f.name}}),"Fattura elettronica caricata"))openDetail(v.id)}
    catch(e){$("#pdfMsg").textContent=e&&e.code==="too_large"?"File troppo grande (max 15 MB)":e&&e.code==="offline"?"Serve internet per caricare il file":e&&e.code==="type"?"Formato non supportato: carica il PDF o l'XML della fattura":"Caricamento non riuscito: riprova"}};
  const so=$("#sdiOk");if(so)so.onclick=async()=>{const d=$("#sdiDate").value||todayISO();if(await write(db=>db.doc("invoices/"+v.id).update({emessaSdi:d,numeroSdi:$("#sdiNum").value.trim()}),"Fattura segnata come emessa: ora puoi caricare il file"))openDetail(v.id)};
}
let D=null;
function monthLabel(y,m){return MESI_L[m]+" "+y}
function fillTpl(t,o){return String(t||"").replace(/\{MESE\}/g,o.mese||"").replace(/\{DAL\}/g,o.dal||"").replace(/\{AL\}/g,o.al||"")}
function openForm(existing){
  const today=todayISO();
  if(existing){D=JSON.parse(JSON.stringify(existing));D._edit=true;D.trasf=D.trasf||null;
    const tl=(D.righe||[]).find(r=>r.tipo==="trasferta");
    if(tl&&!D.trasf){const m=String(tl.desc).match(/dal\s+(\d{2})\/(\d{2})\/(\d{4})\s+al\s+(\d{2})\/(\d{2})\/(\d{4})/i);
      D.trasf=m?{dal:`${m[3]}-${m[2]}-${m[1]}`,al:`${m[6]}-${m[5]}-${m[4]}`,tariffa:+tl.prezzo||0}:{dal:"",al:"",tariffa:+tl.prezzo||0}}}
  else{
    const c=S.clients[0];const d=new Date();const pm=new Date(d.getFullYear(),d.getMonth()-1,1);
    D={_edit:false,id:null,data:today,anno:d.getFullYear(),n:nextNumber(d.getFullYear()),cliente:c?c.id:"",righe:[],bollo:2,bolloAuto:true,incasso:null,note:"",
       mesi:{start:pm.getFullYear()+"-"+pad(pm.getMonth()+1),count:1},trasf:null};
    applyClient(true);
  }
  renderForm();
}
function applyClient(resetLines){
  const c=clientById(D.cliente);
  if(!resetLines||!c)return;
  D.righe=[];buildMonthLines();
}
function buildMonthLines(){
  const c=clientById(D.cliente)||{};
  D.righe=D.righe.filter(r=>r.tipo!=="compenso"||r.custom);
  const [y,m]=(D.mesi.start||"").split("-").map(Number);if(!y)return;
  const lines=[];for(let i=0;i<D.mesi.count;i++){const dt=new Date(y,m-1+i,1);lines.push({tipo:"compenso",desc:fillTpl(c.desc||"Compenso professionale - {MESE}",{mese:monthLabel(dt.getFullYear(),dt.getMonth())}),qta:1,prezzo:+c.compenso||0})}
  D.righe=lines.concat(D.righe.filter(r=>r.tipo!=="compenso"));
}
function validDay(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||"")&&+v.slice(0,4)>=2000&&+v.slice(0,4)<=2100}
function trasfState(){const t=D.trasf;if(!t)return {ok:false,msg:""};
  if(!validDay(t.dal)||!validDay(t.al))return {ok:false,msg:"Inserisci data di inizio e di fine (gg/mm/aaaa)."};
  if(t.al<t.dal)return {ok:false,err:true,msg:"La data di fine è precedente a quella di inizio."};
  const gg=daysBetween(t.dal,t.al)+1;return {ok:true,gg,msg:`${gg} ${gg===1?"giorno":"giorni"} × ${eur(+t.tariffa||0)} = <b>${eur(gg*(+t.tariffa||0))}</b>`};}
function syncTrasf(remove){
  if(remove||!D.trasf){D.righe=D.righe.filter(r=>r.tipo!=="trasferta");return}
  const ts=trasfState();if(ts.err){D.righe=D.righe.filter(r=>r.tipo!=="trasferta");return}
  if(ts.ok){D.righe=D.righe.filter(r=>r.tipo!=="trasferta");
    const c=clientById(D.cliente)||{};const gg=daysBetween(D.trasf.dal,D.trasf.al)+1;
    const comp=D.righe.filter(r=>r.tipo==="compenso"),rest=D.righe.filter(r=>r.tipo!=="compenso");
    D.righe=comp.concat([{tipo:"trasferta",desc:fillTpl(c.descTrasf||"Indennità di trasferta estero - dal {DAL} al {AL}",{dal:dmy(D.trasf.dal),al:dmy(D.trasf.al)}),qta:gg,prezzo:+D.trasf.tariffa||0}],rest);
  }
}
function autoBollo(){if(!D.bolloAuto)return;const t=D.righe.reduce((a,r)=>a+(+r.qta||0)*(+r.prezzo||0),0);D.bollo=t>cfg().soglie.bolloMin?cfg().soglie.bollo:0}
function lineHtml(r,i){return `<div class="line" data-i="${i}"><div class="tag">${r.tipo==="trasferta"?"Indennità trasferta · tassata":r.tipo==="rimborso"?"Rimborso spesa documentata · non tassato":"Compenso"}</div>
    <textarea class="cell-in" data-k="desc" rows="2" aria-label="Descrizione riga ${i+1}">${esc(r.desc)}</textarea>
    <label class="lf"><span>Quantità</span><input class="cell-in in num" data-k="qta" inputmode="decimal" value="${r.qta}" aria-label="Quantità riga ${i+1}"></label>
    <label class="lf"><span>Prezzo €</span><input class="cell-in in num" data-k="prezzo" inputmode="decimal" value="${String(r.prezzo).replace(".",",")}" aria-label="Prezzo riga ${i+1}"></label>
    <button class="icon-x" type="button" data-del="${i}" aria-label="Elimina riga ${i+1}">✕</button></div>`;}
function renderLines(){const l=$("#lines");if(l)l.innerHTML=D.righe.map(lineHtml).join("");const b=$("#fm-bollo");if(b&&D.bolloAuto!==false)b.value=String(D.bollo).replace(".",",");
  const st=trasfState(),info=$("#tr-info");if(info){info.innerHTML=st.msg;info.style.color=st.err?"var(--pink-fg)":"";}updateSummary()}
function renderForm(){
  const c=clientById(D.cliente)||{};
  const months=[];const now=new Date();for(let i=-3;i<=10;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push([d.getFullYear()+"-"+pad(d.getMonth()+1),MESI_L[d.getMonth()].toLowerCase()+" "+d.getFullYear()])}

  sheet(D._edit?`Modifica fattura ${D.anno?D.n+"/"+D.anno:""}`:"Nuova fattura",`
  <div class="form-grid">
   <div style="display:grid;gap:16px;min-width:0">
    <section class="panel"><div class="panel-h"><h2>Intestazione</h2></div><div class="panel-b"><div class="fields">
      <div class="f s6"><label for="fm-cli">Cliente</label><select id="fm-cli">${S.clients.map(k=>`<option value="${k.id}" ${k.id===D.cliente?"selected":""}>${esc(k.nome)}</option>`).join("")}</select></div>
      <div class="f s2"><label for="fm-n">Numero</label><input id="fm-n" class="in num" inputmode="numeric" value="${D.n}"></div>
      <div class="f s2"><label for="fm-data">Data</label><input id="fm-data" type="date" value="${D.data}"></div>
      <div class="f s2"><label>Registro</label><div class="num" style="padding:8px 0;font-weight:600" id="fm-num">${D.n}/${D.anno}</div></div>
    </div></div></section>
    <section class="panel"><div class="panel-h"><h2>Compenso</h2></div><div class="panel-b" style="display:grid;gap:12px">
      ${D._edit?"":`<div class="fields"><div class="f s4"><label for="fm-mstart">Mese di riferimento</label><select id="fm-mstart">${months.map(([v,l])=>`<option value="${v}" ${v===D.mesi.start?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="f s2"><label>Mesi in fattura</label><div class="chips" id="fm-mcount">${[1,2,3].map(n=>`<button type="button" class="chip" data-n="${n}" aria-pressed="${D.mesi.count===n}">${n}</button>`).join("")}</div></div></div>`}
      <div class="lines" id="lines">${D.righe.map(lineHtml).join("")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" type="button" id="addLine">+ Riga compenso</button><button class="btn small" type="button" id="addRimb">+ Rimborso spesa documentata</button></div>
    </div></section>
    <section class="panel"><div class="panel-h"><h2>Trasferta</h2><div class="spacer"></div><label class="switch"><input type="checkbox" id="fm-tr" ${D.trasf?"checked":""}> In fattura</label></div>
      ${D.trasf?`<div class="panel-b"><div class="fields">
        <div class="f s2"><label for="fm-dal">Dal</label><input id="fm-dal" type="date" value="${D.trasf.dal||""}"></div>
        <div class="f s2"><label for="fm-al">Al</label><input id="fm-al" type="date" value="${D.trasf.al||""}"></div>
        <div class="f s2"><label for="fm-tar">€ al giorno</label><input id="fm-tar" class="in num" inputmode="decimal" value="${D.trasf.tariffa}"></div>
        <div class="f s6"><div id="tr-info" class="num" style="font-size:14px">${trasfState().msg}</div><span class="help">Giorni calcolati inclusi gli estremi. L'indennità è compenso tassato; le spese documentate vanno come "rimborso".</span></div>
      </div></div>`:""}
    </section>
    <section class="panel"><div class="panel-h"><h2>Altro</h2></div><div class="panel-b"><div class="fields">
      <div class="f s2"><label for="fm-bollo">Bollo (€)</label><input id="fm-bollo" class="in num" inputmode="decimal" value="${String(D.bollo).replace(".",",")}"></div>
      <div class="f s4"><label class="switch" style="margin-top:22px"><input type="checkbox" id="fm-bauto" ${D.bolloAuto!==false?"checked":""}> €2 automatico oltre €77,47</label></div>
      <div class="f s6"><label for="fm-note">Note (solo per te)</label><input id="fm-note" value="${esc(D.note||"")}"></div>
      ${D._edit?`<div class="f s2"><label for="fm-inc">Incassata il</label><input id="fm-inc" type="date" value="${D.incasso||""}"></div>`:""}
    </div></div></section>
   </div>
   <aside class="panel sum"><div class="panel-h"><h2>Riepilogo</h2></div><div class="panel-b" id="sumBox"></div></aside>
  </div>`,`<button class="btn primary" id="fmSave" type="button">${D._edit?"Salva modifiche":"Salva fattura"}</button>`);
  bindForm();updateSummary();
}
function readNum(v){return parseFloat(String(v).replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."))||0}
function bindForm(){
  $("#fm-cli").onchange=e=>{D.cliente=e.target.value;const c=clientById(D.cliente)||{};if(!D._edit){buildMonthLines()}if(D.trasf){D.trasf.tariffa=+c.tariffa||D.trasf.tariffa;syncTrasf()}autoBollo();renderForm()};
  $("#fm-n").oninput=e=>{D.n=parseInt(e.target.value)||D.n;$("#fm-num").textContent=D.n+"/"+D.anno};
  $("#fm-data").onchange=e=>{D.data=e.target.value||todayISO();const y=+D.data.slice(0,4);if(!D._edit&&y!==D.anno){D.anno=y;D.n=nextNumber(y);$("#fm-n").value=D.n}D.anno=y;$("#fm-num").textContent=D.n+"/"+D.anno;updateSummary()};
  const ms=$("#fm-mstart");if(ms)ms.onchange=e=>{D.mesi.start=e.target.value;buildMonthLines();autoBollo();renderForm()};
  const mc=$("#fm-mcount");if(mc)mc.onclick=e=>{const b=e.target.closest("[data-n]");if(!b)return;D.mesi.count=+b.dataset.n;buildMonthLines();autoBollo();renderForm()};
  $("#lines").addEventListener("input",e=>{const l=e.target.closest(".line");if(!l)return;const r=D.righe[+l.dataset.i];const k=e.target.dataset.k;r[k]=k==="desc"?e.target.value:readNum(e.target.value);if(k!=="desc"){autoBollo();const b=$("#fm-bollo");if(b&&D.bolloAuto!==false)b.value=String(D.bollo).replace(".",",")}updateSummary()});
  $("#lines").addEventListener("click",e=>{const b=e.target.closest("[data-del]");if(!b)return;const r=D.righe[+b.dataset.del];D.righe.splice(+b.dataset.del,1);if(r.tipo==="trasferta"){D.trasf=null;autoBollo();renderForm();return}autoBollo();renderLines()});
  $("#addLine").onclick=()=>{const c=clientById(D.cliente)||{};const comp=D.righe.filter(r=>r.tipo==="compenso"),rest=D.righe.filter(r=>r.tipo!=="compenso");D.righe=comp.concat([{tipo:"compenso",custom:true,desc:"",qta:1,prezzo:+c.compenso||0}],rest);autoBollo();renderForm()};
  $("#addRimb").onclick=()=>{D.righe.push({tipo:"rimborso",desc:"Rimborso spese documentate: ",qta:1,prezzo:0});renderForm()};
  $("#fm-tr").onchange=e=>{const c=clientById(D.cliente)||{};if(e.target.checked){D.trasf={dal:"",al:"",tariffa:+c.tariffa||0};syncTrasf()}else{D.trasf=null;syncTrasf(true)}autoBollo();renderForm();if(D.trasf){const f=$("#fm-dal");if(f)f.focus()}};
  const trUpd=()=>{if(!D.trasf)return;D.trasf.dal=$("#fm-dal").value;D.trasf.al=$("#fm-al").value;D.trasf.tariffa=readNum($("#fm-tar").value);
    if(validDay(D.trasf.dal)&&!validDay(D.trasf.al)){const a=$("#fm-al");if(a&&!a.value){/* suggest same month end left to user */}}
    syncTrasf();autoBollo();renderLines()};
  ["#fm-dal","#fm-al","#fm-tar"].forEach(id=>{const el=$(id);if(el){el.addEventListener("input",trUpd);el.addEventListener("change",trUpd)}});
  const da=$("#fm-dal");if(da)da.addEventListener("change",()=>{const a=$("#fm-al");if(a&&validDay(da.value))a.min=da.value});
  $("#fm-bollo").oninput=e=>{D.bollo=readNum(e.target.value);D.bolloAuto=false;const ba=$("#fm-bauto");if(ba)ba.checked=false;updateSummary()};
  $("#fm-bauto").onchange=e=>{D.bolloAuto=e.target.checked;autoBollo();$("#fm-bollo").value=String(D.bollo).replace(".",",");updateSummary()};
  $("#fm-note").oninput=e=>{D.note=e.target.value};
  const inc=$("#fm-inc");if(inc)inc.onchange=e=>{D.incasso=e.target.value||null;updateSummary()};
  $("#fmSave").onclick=saveForm;
}
function updateSummary(){
  const FX=fisco();const v={...D,num:D.n+"/"+D.anno};const t=tot(v);
  const y=+(effDate(v)||D.data).slice(0,4);const o=oneriInv(v,FX);
  const dup=S.invoices.some(x=>x.anno===D.anno&&x.n===D.n&&x.id!==D.id);
  $("#sumBox").innerHTML=`
    <div class="sum-row"><span>Servizi</span><span class="num">${eur(t.servizi)}</span></div>
    <div class="sum-row"><span>Imposta di bollo</span><span class="num">${eur(t.bollo)}</span></div>
    <div class="sum-row big"><span>Totale documento</span><span class="num">${eur(t.documento)}</span></div>
    <div style="height:10px"></div>
    <div class="eyebrow">Per te · anno fiscale ${y}</div>
    <div class="sum-row"><span>Ricavi tassabili</span><span class="num">${eur(t.imponibile)}</span></div>
    ${t.rimb?`<div class="sum-row"><small>Rimborsi non tassati</small><small class="num">${eur(t.rimb)}</small></div>`:""}
    <div class="sum-row"><span>Oneri stimati</span><span class="num neg">${eur(o.oneri)}</span></div>
    <div class="sum-row"><span><b>Netto</b></span><b class="num pos">${eur(o.netto)}</b></div>
    <div class="sum-row"><span>Da accantonare</span><b class="num">${eur(o.accantona)}</b></div>
    <p class="note" style="margin:10px 0 0">Incasso atteso il ${dmy(scadenza(v))} (${gg(v)} gg medi del cliente).${dup?`<br><b style="color:var(--pink-fg)">Il numero ${D.n}/${D.anno} esiste già.</b>`:""}</p>`;
}
async function saveForm(){
  if(!D.cliente){toast("Scegli un cliente");return}
  if(!D.righe.length||!D.righe.some(r=>r.tipo!=="rimborso"&&r.prezzo>0)){toast("Aggiungi almeno una riga di compenso");return}
  if(S.invoices.some(x=>x.anno===D.anno&&x.n===D.n&&x.id!==D.id)){toast("Numero già usato: cambialo");return}
  if(D.trasf&&(trasfState().err||(!trasfState().ok&&!D.righe.some(r=>r.tipo==="trasferta")))){toast("Trasferta: controlla le date di inizio e fine");const f=$("#fm-dal");if(f)f.focus();return}
  const id=D.id||(D.anno+"-"+pad(D.n));
  const doc={num:D.n+"/"+D.anno,n:D.n,anno:D.anno,data:D.data,cliente:D.cliente,righe:D.righe.map(r=>({tipo:r.tipo,desc:r.desc,qta:+r.qta||0,prezzo:r2(r.prezzo)})),
    bollo:+D.bollo||0,bolloAuto:D.bolloAuto!==false,incasso:D.incasso||null,note:D.note||"",trasf:D.trasf||null,aggiornata:new Date().toISOString(),
    statoTracking:D._edit?(D.statoTracking||false):true,emessaSdi:D._edit?(D.emessaSdi||null):null,numeroSdi:D._edit?(D.numeroSdi||""):"",inviataCommercialista:D._edit?(D.inviataCommercialista||null):null,
    mesiCoperti:D._edit?(D.mesiCoperti||[]):(D.mesiCopertiOverride||Array.from({length:D.mesi.count},(_,i)=>addMonths(D.mesi.start,i)))};
  const ok=await write(db=>db.doc("invoices/"+id).set(doc),D._edit?"Fattura aggiornata":"Fattura "+doc.num+" salvata");
  if(ok){const saved={id,...doc};closeSheet();if(!D._edit)openProforma(saved)}
}
function proformaHTML(v){
  const c=clientById(v.cliente)||{nome:v.cliente};const k=cfg();const t=tot(v);const fo=k.fornitore,pg=k.pagamento;
  const nr=v.n+"/"+String(v.anno).slice(2);
  const cliLines=[c.ragione||c.nome,c.idFiscale,c.indirizzo,c.pec?"PEC: "+c.pec:""].filter(Boolean).join("\n");
  return `<div class="pf" id="pfDoc">
   <div class="hd"><h1>FATTURA PROFORMA</h1><div>nr. ${esc(nr)} del ${dmy(v.data)}</div></div>
   <div class="parties"><div class="party"><h3>FORNITORE</h3><p><b>${esc(fo.nome)}</b>\nP.IVA ${esc(fo.piva)}\nC.F. ${esc(fo.cf)}\n${esc(fo.indirizzo)}${fo.tel?"\nTel.: "+esc(fo.tel):""}${fo.email?"\nE-mail: "+esc(fo.email):""}</p></div>
   <div class="party cl"><h3>CLIENTE</h3><p><b>${esc(c.ragione||c.nome)}</b>\n${esc([c.idFiscale,c.indirizzo,c.pec?"PEC: "+c.pec:""].filter(Boolean).join("\n"))}</p></div></div>
   <h3 class="ttl">PRODOTTI E SERVIZI</h3>
   <table><thead><tr><th style="width:34px">NR</th><th>DESCRIZIONE</th><th class="r">QUANTITA'</th><th class="r">PREZZO</th><th class="r">IMPORTO</th></tr></thead><tbody>
   ${(v.righe||[]).map((r,i)=>`<tr><td>${i+1}</td><td style="max-width:300px">${esc(r.desc)}</td><td class="r">${String(r.qta).replace(".",",")}</td><td class="r">${eur(r.prezzo).replace("€","").trim()} €</td><td class="r">${eur(r.qta*r.prezzo).replace("€","").trim()} €</td></tr>`).join("")}
   </tbody></table>
   <h3 class="ttl">METODO DI PAGAMENTO</h3>
   <table><thead><tr><th>NR RATA</th><th>MODALITA'</th><th>PAGAMENTO</th><th>BANCA</th><th>IBAN</th><th>BIC/SWIFT</th><th class="r">IMPORTO</th></tr></thead><tbody>
   <tr><td>1</td><td>Bonifico</td><td>Pagamento in unica soluzione</td><td>${esc(pg.banca)}</td><td>${esc(pg.iban)}</td><td>${esc(pg.bic)}</td><td class="r">${eur(t.documento).replace("€","").trim()} €</td></tr></tbody></table>
   <h3 class="ttl">REGIME FISCALE</h3>
   <div class="reg"><div>● REGIME FISCALE<br>&nbsp;&nbsp;&nbsp;RF19 - Forfettario</div><div>● Operazione in regime forfettario ai sensi dell'art. 1, commi 54-89, L. 190/2014. Non soggetta ad IVA né a ritenuta d'acconto.${t.bollo?" Imposta di bollo assolta in modo virtuale.":""}</div></div>
   <h3 class="ttl" style="text-align:right;border:0;padding-right:40px">CALCOLO FATTURA</h3>
   <div class="calc"><div><span>Importo prodotti e servizi</span><span>${eur(t.servizi).replace("€","").trim()} €</span></div><div><span>IVA</span><span>0,00 €</span></div><div><span>Imposta di bollo</span><span>${eur(t.bollo).replace("€","").trim()} €</span></div><div><b>Totale documento</b><b>${eur(t.documento).replace("€","").trim()} €</b></div><div class="net"><span>Netto a pagare</span><span>${eur(t.documento).replace("€","").trim()} €</span></div></div>
  </div>`;
}
function openProforma(v){
  sheet(`Proforma ${v.n}/${String(v.anno).slice(2)}`,`
   <div class="note">Stesso impianto del tuo modello Word. Per la fattura elettronica copia le descrizioni nel software di fatturazione${(v.righe||[]).some(r=>r.tipo==="rimborso")?"; i rimborsi documentati vanno in righe separate dal compenso":""}.</div>
   <div class="pf-wrap">${proformaHTML(v)}</div>`,
   `<button class="btn small dark" id="mailBtn" type="button">Email a ${esc((cfg().commercialista||{}).nome||"commercialista")}</button><button class="btn small" id="cpBtn" type="button">Copia descrizioni</button><button class="btn small" id="v3Btn" type="button">Excel v3</button><button class="btn small" id="pdfBtn" type="button">${ico("down",14)} Scarica PDF</button>`);
  $("#v3Btn").onclick=()=>exportV3(fisco());
  $("#mailBtn").onclick=()=>openMail(v);
  $("#cpBtn").onclick=()=>{const txt=(v.righe||[]).map((r,i)=>`${i+1}. ${r.desc} — ${String(r.qta).replace(".",",")} × ${eur(r.prezzo)} = ${eur(r.qta*r.prezzo)}`).join("\n")+(v.bollo?`\nImposta di bollo: ${eur(v.bollo)}`:"")+`\nTotale documento: ${eur(tot(v).documento)}`;
    const done=()=>toast("Descrizioni copiate");
    try{navigator.clipboard.writeText(txt).then(done,()=>fallbackCopy(txt))}catch(e){fallbackCopy(txt)}};
  $("#pdfBtn").onclick=()=>pdfProforma(v);preloadPdf();
  fitProforma();
}
/** The proforma is drawn at A4 width (760px): on a phone it is scaled down to the screen width instead of being cut off. */
function fitProforma(){const w=$(".pf-wrap"),pf=w&&w.querySelector(".pf");if(!pf)return;
  const fit=()=>{if(!pf.isConnected){removeEventListener("resize",fit);return}pf.style.zoom="";const k=Math.min(1,(w.clientWidth-2)/pf.offsetWidth);pf.style.zoom=k<1?k.toFixed(3):""};
  fit();addEventListener("resize",fit);}
function fallbackCopy(t){const ta=document.createElement("textarea");ta.value=t;ta.style.cssText="position:fixed;left:0;top:0;width:90%;height:160px;z-index:70";document.body.appendChild(ta);ta.select();toast("Testo selezionato: copialo con Ctrl/⌘+C");setTimeout(()=>ta.remove(),8000)}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector(`script[src="${src}"]`)){res();return}const s=document.createElement("script");s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s)})}
async function save(filename,data){
  if(!downloads){toast("Download non disponibile in questa vista");return}
  try{await downloads.save({filename,data});return true}catch(e){if(e&&e.code!=="declined")toast("Download non riuscito");return false}
}
/** Loads the PDF generator ahead of the tap: generating then saves within the tap (needed for the iPhone share sheet). */
function preloadPdf(){loadScript("/vendor/jspdf.umd.min.js").then(()=>loadScript("/vendor/jspdf.plugin.autotable.min.js")).catch(()=>{})}
async function pdfProforma(v){
  try{
    await loadScript("/vendor/jspdf.umd.min.js");
    await loadScript("/vendor/jspdf.plugin.autotable.min.js");
  }catch(e){toast("Impossibile caricare il generatore PDF");return}
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:"mm",format:"a4"});
  const c=clientById(v.cliente)||{nome:v.cliente};const k=cfg();const t=tot(v);const fo=k.fornitore,pg=k.pagamento;
  const E=x=>eur(x).replace("€","").trim()+" €"; const W=210,M=16;
  doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("FATTURA PROFORMA",W-M,20,{align:"right"});
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text(`nr. ${v.n}/${String(v.anno).slice(2)} del ${dmy(v.data)}`,W-M,25,{align:"right"});
  // parties
  doc.setFillColor(242,242,242);doc.rect(W/2+4,30,W/2-4-M,44,"F");
  doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.text("FORNITORE",M,37);doc.text("CLIENTE",W/2+8,37);
  doc.setFontSize(9);doc.text(fo.nome,M,44);
  const cname=doc.splitTextToSize(c.ragione||c.nome,W/2-M-12);doc.text(cname,W/2+8,44);
  doc.setFont("helvetica","normal");
  doc.text([`P.IVA ${fo.piva}`,`C.F. ${fo.cf}`,...String(fo.indirizzo).split("\n"),fo.tel?`Tel.: ${fo.tel}`:"",fo.email?`E-mail: ${fo.email}`:""].filter(Boolean),M,49);
  doc.text([c.idFiscale,...String(c.indirizzo||"").split("\n"),c.pec?`PEC: ${c.pec}`:""].filter(Boolean),W/2+8,44+cname.length*4.2+1);
  const sect=(y,label)=>{doc.setDrawColor(207,207,207);doc.line(M,y-5,W-M,y-5);doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.text(label,W/2,y,{align:"center"})};
  sect(84,"PRODOTTI E SERVIZI");
  const head={fillColor:[217,217,217],textColor:20,fontStyle:"bold",fontSize:8.5};
  doc.autoTable({startY:87,margin:{left:M,right:M},theme:"plain",styles:{fontSize:8.5,cellPadding:2,textColor:20},headStyles:head,
    head:[["NR","DESCRIZIONE","QUANTITA'","PREZZO","IMPORTO"]],
    body:(v.righe||[]).map((r,i)=>[i+1,r.desc,String(r.qta).replace(".",","),E(r.prezzo),E(r.qta*r.prezzo)]),
    columnStyles:{0:{cellWidth:12},1:{cellWidth:86},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"}}});
  let y=doc.lastAutoTable.finalY+13; sect(y,"METODO DI PAGAMENTO");
  doc.autoTable({startY:y+3,margin:{left:M,right:M},theme:"plain",styles:{fontSize:8,cellPadding:1.8,textColor:20},headStyles:{...head,fontSize:8},
    head:[["NR RATA","MODALITA'","PAGAMENTO","BANCA","IBAN","BIC/SWIFT","IMPORTO"]],
    body:[["1","Bonifico","Pagamento in unica soluzione",pg.banca,pg.iban,pg.bic,E(t.documento)]],columnStyles:{6:{halign:"right"},2:{cellWidth:28},4:{cellWidth:50}}});
  y=doc.lastAutoTable.finalY+13; sect(y,"REGIME FISCALE");
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(["•  REGIME FISCALE","    RF19 - Forfettario"],M,y+7);
  doc.text(doc.splitTextToSize("•  Operazione in regime forfettario ai sensi dell'art. 1, commi 54-89, L. 190/2014. Non soggetta ad IVA né a ritenuta d'acconto."+(t.bollo?" Imposta di bollo assolta in modo virtuale.":""),W/2-M),W/2+4,y+7);
  y+=24; doc.line(M,y-5,W-M,y-5); doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.text("CALCOLO FATTURA",W-M-30,y+2,{align:"center"});
  const bx=W-M-62;y+=9;doc.setFont("helvetica","normal");doc.setFontSize(8.5);
  [["Importo prodotti e servizi",E(t.servizi)],["IVA","0,00 €"],["Imposta di bollo",E(t.bollo)]].forEach(([a,b])=>{doc.text(a,bx+2,y);doc.text(b,W-M-2,y,{align:"right"});y+=4.2});
  doc.setFont("helvetica","bold");doc.text("Totale documento",bx+2,y);doc.text(E(t.documento),W-M-2,y,{align:"right"});y+=3;
  doc.setFillColor(191,191,191);doc.rect(bx,y,62,9,"F");doc.setFontSize(11);doc.setFont("helvetica","normal");doc.text("Netto a pagare",bx+2,y+6);doc.setFont("helvetica","bold");doc.text(E(t.documento),W-M-2,y+6,{align:"right"});
  const cl=(c.nome||"").replace(/[^A-Za-z0-9]+/g,"_");
  await save(`Proforma_${v.n}-${String(v.anno).slice(2)}_${cl}.pdf`,doc.output("blob"));
}
async function pdfDossier(y){
  try{await loadScript("/vendor/jspdf.umd.min.js");await loadScript("/vendor/jspdf.plugin.autotable.min.js")}catch(e){toast("Impossibile caricare il generatore PDF");return}
  const FX=fisco(),f=FX[y];if(!f){toast("Nessun dato per il "+y);return}
  const {jsPDF}=window.jspdf;const doc=new jsPDF({unit:"mm",format:"a4"});const k=cfg(),fo=k.fornitore||{},p=P(y);const M=14,W=210;
  const E=x=>eur(x||0).replace("€","").trim()+" €";const head={fillColor:[68,84,106],textColor:255,fontStyle:"bold",fontSize:8.5};
  doc.setFont("helvetica","bold");doc.setFontSize(15);doc.text(`Riepilogo per la dichiarazione ${y+1} (redditi ${y})`,M,18);
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text([`${fo.nome||""} · P.IVA ${fo.piva||""} · C.F. ${fo.cf||""}`,`Regime forfettario · coefficiente di redditività ${pct(p.coef,0)} · imposta sostitutiva ${pct(p.imp,0)} · INPS Gestione Separata ${pct(p.inps,2)}`,`Generato il ${dmy(todayISO())} dall'app Cairn: valori da verificare con ${(k.commercialista||{}).nome||"la commercialista"}.`],M,25);
  const inc=S.invoices.filter(v=>v.incasso&&v.incasso.startsWith(String(y))).sort((a,b)=>a.incasso.localeCompare(b.incasso));
  doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("1. Compensi incassati nel "+y+" (principio di cassa)",M,42);
  doc.autoTable({startY:45,margin:{left:M,right:M},styles:{fontSize:8,cellPadding:1.6},headStyles:head,
    head:[["Fattura","Data","Cliente","Incasso","Compenso","Indennità","Rimborsi","Bollo","Ricavo"]],
    body:inc.map(v=>{const t=tot(v);return [v.num,dmy(v.data),(clientById(v.cliente)||{}).nome||v.cliente,dmy(v.incasso),E(t.comp),E(t.ind),E(t.rimb),E(t.bollo),E(t.imponibile)]}),
    foot:[["Totale","","","",E(inc.reduce((a,v)=>a+tot(v).comp,0)),E(inc.reduce((a,v)=>a+tot(v).ind,0)),E(inc.reduce((a,v)=>a+tot(v).rimb,0)),E(inc.reduce((a,v)=>a+tot(v).bollo,0)),E(f.inc)]],
    footStyles:{fillColor:[218,227,243],textColor:20,fontStyle:"bold"},columnStyles:{4:{halign:"right"},5:{halign:"right"},6:{halign:"right"},7:{halign:"right"},8:{halign:"right"}}});
  let yy=doc.lastAutoTable.finalY+9;doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("2. Calcolo del reddito e dell'imposta sostitutiva",M,yy);
  const att=f.att+f.contr+f.stima;
  doc.autoTable({startY:yy+3,margin:{left:M,right:M},theme:"grid",styles:{fontSize:8.5,cellPadding:1.8},headStyles:head,head:[["Voce","Importo"]],columnStyles:{1:{halign:"right",cellWidth:40}},
    body:[["Compensi incassati nell'anno",E(f.inc)],...(att>1?[["Compensi attesi entro fine anno (stima, non ancora incassati)",E(att)]]:[]),["Totale ricavi considerati",E(f.ric)],[`Reddito lordo (ricavi × ${pct(p.coef,0)})`,E(f.red)],
      ["Contributi INPS versati nell'anno (deducibili)",E(f.inpsVers)],["Reddito imponibile",E(f.base)],[`Imposta sostitutiva ${pct(p.imp,0)}`,E(f.imp)],["Acconti d'imposta già versati",E(f.accImp)],["Saldo imposta",E(f.saldoImp)]]});
  yy=doc.lastAutoTable.finalY+9;doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("3. Contributi INPS Gestione Separata",M,yy);
  doc.autoTable({startY:yy+3,margin:{left:M,right:M},theme:"grid",styles:{fontSize:8.5,cellPadding:1.8},headStyles:head,head:[["Voce","Importo"]],columnStyles:{1:{halign:"right",cellWidth:40}},
    body:[[`Contributo dovuto (reddito lordo × ${pct(p.inps,2)})`,E(f.inps)],["Acconti INPS già versati",E(f.accInps)],["Saldo INPS",E(f.saldoInps)],[`Primo acconto ${y+1} a giugno (40% imposta + 40% INPS, stima)`,E((f.imp>257.52?f.imp*.4:0)+f.inps*.4)],[`F24 di giugno ${y+1} (saldi + primi acconti, stima)`,E(f.giugno)],[`F24 di novembre ${y+1} (secondi acconti, stima)`,E(f.novembre)]]});
  const fv=S.f24.filter(r=>(r.data||"").startsWith(String(y))).sort((a,b)=>a.data.localeCompare(b.data));
  yy=doc.lastAutoTable.finalY+9;if(yy>250){doc.addPage();yy=18}doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("4. F24 registrati nel "+y,M,yy);
  doc.autoTable({startY:yy+3,margin:{left:M,right:M},styles:{fontSize:8,cellPadding:1.6},headStyles:head,head:[["Data","Descrizione","Codici","Importo","Stato"]],
    body:fv.length?fv.map(r=>[dmy(r.data),r.descrizione||"",r.tributi||"",E(r.importo),r.versato?"versato":"da versare"]):[["—","Nessun F24 registrato nell'app per questo anno","","",""]],columnStyles:{3:{halign:"right"}}});
  const cross=S.invoices.filter(v=>(v.data||"").startsWith(String(y))&&(!v.incasso||!v.incasso.startsWith(String(y))));
  if(cross.length){yy=doc.lastAutoTable.finalY+9;if(yy>250){doc.addPage();yy=18}doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("5. Fatture del "+y+" incassate in un altro anno",M,yy);
    doc.autoTable({startY:yy+3,margin:{left:M,right:M},styles:{fontSize:8,cellPadding:1.6},headStyles:head,head:[["Fattura","Data","Cliente","Incasso","Importo","Anno fiscale"]],
      body:cross.map(v=>[v.num,dmy(v.data),(clientById(v.cliente)||{}).nome||v.cliente,v.incasso?dmy(v.incasso):"non ancora",E(tot(v).imponibile),String(fy(v))]),columnStyles:{4:{halign:"right"}}})}
  const rr=(S.redditi||[]).filter(r=>(r.data||"").startsWith(String(y)));
  if(rr.length){let y6=doc.lastAutoTable.finalY+9;if(y6>250){doc.addPage();y6=18}doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("6. Redditi fuori dalla partita IVA",M,y6);
    doc.autoTable({startY:y6+3,margin:{left:M,right:M},styles:{fontSize:8,cellPadding:1.6},headStyles:head,head:[["Data","Fonte","Tipo","Paese","Lordo","Imposte estere"]],
      body:rr.map(r=>[dmy(r.data),r.fonte||"",TIPI_R[r.tipo]||r.tipo||"",r.paese||"",E(r.importo),E(r.imposteEstere)]),columnStyles:{4:{halign:"right"},5:{halign:"right"}}})}
  await save(`Riepilogo_dichiarazione_redditi_${y}.pdf`,doc.output("blob"));
}
async function fullBackup(){const data={app:"Cairn",creato:new Date().toISOString(),invoices:S.invoices,clients:S.clients,contratti:S.contratti,missioni:S.missioni,promemoria:S.promemoria,f24:S.f24,calsync:S.calsync,spese:S.spese,redditi:S.redditi,investimenti:S.investimenti,risparmi:S.risparmi,config:cfg()};
  if(await save(`CassaFisco_backup_${todayISO()}.json`,JSON.stringify(data,null,2))){try{localStorage.setItem("fa-backup",todayISO())}catch(e){}render()}}
function bindExtras(){const b=$("#dossier");if(b)b.onclick=()=>pdfDossier(+b.dataset.y);document.querySelectorAll("[data-backup]").forEach(x=>x.onclick=fullBackup)}
async function exportXlsx(FX){
  try{await loadScript("/vendor/xlsx.full.min.js")}catch(e){toast("Impossibile caricare il generatore Excel");return}
  const rows=[...S.invoices].sort((a,b)=>(a.data||"").localeCompare(b.data||"")).map(v=>{const t=tot(v),o=oneriInv(v,FX),c=clientById(v.cliente);
    const tr=(v.righe||[]).find(r=>r.tipo==="trasferta");const f=fy(v),p=P(f);const ratio=t.imponibile?o.oneri/t.imponibile:0;
    const fxy=FX[f];const inps=fxy&&fxy.ric?t.imponibile*fxy.inps/fxy.ric:o.oneri*0.85;
    return {"DATA":parse(v.data),"N. FATTURA":v.num,"CLIENTE":c?c.nome:v.cliente,"DATA INCASSO":v.incasso?parse(v.incasso):null,"MESE":MESI[+effDate(v).slice(5,7)-1],"ANNO FISCALE":f,
      "COMPENSO (€)":t.comp,"GG TRASFERTA":tr?tr.qta:null,"TARIFFA €/GG":tr?tr.prezzo:null,"INDENNITÀ TRASFERTA (€)":t.ind,"RIMBORSI SPESE (€)":t.rimb,"MARCA DA BOLLO (€)":t.bollo,
      "TOT. INCASSATO (€)":t.documento,"IMPONIBILE REALE (€)":t.imponibile,"IMPONIBILE FORFETTARIO (€)":r2(t.imponibile*p.coef),"INPS (€)":r2(inps),"IMPOSTA (€)":r2(o.oneri-inps),
      "TOT. ONERI (€)":r2(o.oneri),"NETTO REALE (€)":r2(o.netto),"ACCANTONAMENTO (€)":o.accantona,"STATO":stato(v),"SCADENZA":parse(scadenza(v)),"GG INCASSO":v.incasso?daysBetween(v.data,v.incasso):null,"ANNO FATTURA":v.anno,"NOTE":v.note||""}});
  const X=window.XLSX;const ws=X.utils.json_to_sheet(rows,{cellDates:true,dateNF:"dd/mm/yy"});
  ws["!cols"]=Object.keys(rows[0]||{}).map(k=>({wch:Math.max(10,k.length+2)}));
  const wb=X.utils.book_new();X.utils.book_append_sheet(wb,ws,"Fatture Register");
  const fs=X.utils.json_to_sheet(years().filter(y=>FX[y].ric>0).map(y=>{const f=FX[y];return {"ANNO":y,"RICAVI":r2(f.ric),"INPS":r2(f.inps),"IMPOSTA":r2(f.imp),"ONERI":r2(f.oneri),"NETTO":r2(f.netto),"F24 GIUGNO ANNO DOPO":r2(f.giugno),"F24 NOVEMBRE ANNO DOPO":r2(f.novembre)}}));
  X.utils.book_append_sheet(wb,fs,"FISCO");
  const out=X.write(wb,{bookType:"xlsx",type:"array"});
  await save(`Fatture_Andrea_Scialabba_${todayISO()}.xlsx`,new Blob([out]));
}
function mailText(v){
  const c=clientById(v.cliente)||{nome:v.cliente};const t=tot(v);const k=cfg();const who=(k.commercialista||{}).nome||"";
  const subject=`Emissione fattura elettronica n. ${v.num} – ${c.ragione||c.nome}`;
  const body=`Ciao ${who},

ho ricevuto la conferma per l'emissione della fattura n. ${v.num} del ${dmy(v.data)} verso ${c.ragione||c.nome} (totale ${eur(t.documento)}). Ti chiedo di inviarla al più presto come fattura elettronica tramite SdI.

In allegato trovi il proforma con tutti i dettagli.

Grazie,
${(k.fornitore||{}).nome||""}`;
  return {to:(k.commercialista||{}).email||"",subject,body};
}
function openMail(v){
  const m=mailText(v);const cl=clientById(v.cliente)||{nome:v.cliente};
  const href=`mailto:${encodeURIComponent(m.to)}?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body)}`;
  sheet(`Email per la fattura ${v.num}`,`
   <section class="panel"><div class="panel-b" style="display:grid;gap:12px">
    <div class="note">1) Scarica il PDF del proforma · 2) copia destinatario, oggetto e testo nella tua posta (o prova "Apri nella posta") · 3) allega il PDF e invia · 4) torna qui e premi "Segna come inviata".</div>
    <div class="fields">
     <div class="f s4"><label>A</label><div style="display:flex;gap:6px"><input id="ml-to" value="${esc(m.to)}" readonly><button class="btn small" data-copy="ml-to" type="button">Copia</button></div></div>
     <div class="f s2"><label>Allegato</label><button class="btn small" id="mlPdf" type="button">Scarica PDF proforma</button></div>
     <div class="f s6"><label>Oggetto</label><div style="display:flex;gap:6px"><input id="ml-sub" value="${esc(m.subject)}" readonly><button class="btn small" data-copy="ml-sub" type="button">Copia</button></div></div>
     <div class="f s6"><label>Testo</label><textarea id="ml-body" rows="16" readonly style="font-size:13px">${esc(m.body)}</textarea><div><button class="btn small" data-copy="ml-body" type="button">Copia testo</button></div></div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
     <a class="btn" href="${href}" target="_blank" rel="noopener">Apri nella posta</a>
     <span class="muted" style="font-size:13px">Se non si apre nulla, usa i pulsanti Copia: alcuni dispositivi bloccano questo collegamento. Gli allegati vanno aggiunti a mano.</span>
    </div>
    <div style="border-top:1px solid var(--line);padding-top:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
     ${v.inviataCommercialista?`<span class="pill ok">Inviata il ${dmy(v.inviataCommercialista)}</span>`:""}
     <button class="btn primary" id="mlSent" type="button">${v.inviataCommercialista?"Aggiorna data invio":"Segna come inviata a "+esc((cfg().commercialista||{}).nome||"commercialista")}</button>
    </div>
   </div></section>`);
  document.querySelectorAll("[data-copy]").forEach(b=>b.onclick=()=>{const el=$("#"+b.dataset.copy);const txt=el.value;
    try{navigator.clipboard.writeText(txt).then(()=>toast("Copiato"),()=>{el.removeAttribute("readonly");el.select();toast("Selezionato: copia con Ctrl/⌘+C")})}catch(e){el.select();toast("Selezionato: copia con Ctrl/⌘+C")}});
  $("#mlPdf").onclick=()=>pdfProforma(v);preloadPdf();
  $("#mlSent").onclick=async()=>{if(!S.invoices.some(x=>x.id===v.id)){toast("Salva prima la fattura");return}
    if(await write(db=>db.doc("invoices/"+v.id).update({inviataCommercialista:todayISO()}),"Segnata come inviata"))closeSheet()};
}
function calItems(FX){
  const today=todayISO(),lim=addDays(today,150),items=[];const cn=id=>(clientById(id)||{nome:id}).nome;
  reminders().filter(r=>!r.fatto&&r.data>=today&&r.data<=lim).forEach(r=>items.push({key:"pm-"+r.id,date:r.data,summary:"⏰ "+r.titolo,desc:r.dettaglio||"",rem:[900,Math.min(40320,Math.max(1440,(+r.preavviso||7)*1440))]}));
  projections().filter(x=>x.data>=today&&x.data<=lim).forEach(x=>items.push({key:"em-"+x.contratto+"-"+x.months[0],date:x.data,summary:`🧾 Emettere fattura ${cn(x.cliente)} – ${x.label}`,desc:`Compenso ${eur(x.comp)}${x.ind?` + indennità ${x.gg} gg ${eur(x.ind)}`:""}. Dall'app: Da fare ora → Crea fattura, poi Email a ${(cfg().commercialista||{}).nome||"commercialista"}.`,rem:[900]}));
  f24Rows(FX).filter(r=>!r.versato&&r.data>=today&&r.data<=addDays(today,250)).forEach(r=>items.push({key:"f24-"+r.id,date:r.data,summary:`💶 F24 ${eur0(r.importo)} – ${r.descrizione}`,desc:`Tributi: ${r.tributi||""}${r.stima?" · importo stimato":""}`,rem:[900,10080]}));
  {const c=invCalc((S.investimenti||[]).find(isMainInv));const r=c&&rebal(c);if(r&&r.action==="sell")items.push({key:"inv-rebal-"+today.slice(0,7),date:today,summary:"📊 Ribilancia il PAC Trading 212",desc:rebalText(c,r).replace(/<[^>]+>/g,"")+" Dettagli: Cairn → Investimenti → Ribilanciamento.",rem:[0,900]})}
  // Year end: the RW needs each ETF's value at 31/12; Cairn saves it when the app is opened online between 20/12 and 10/01.
  {const a=(S.investimenti||[]).find(isMainInv),y=+today.slice(0,4)-(today.slice(5)<="01-10"?1:0),d=y+"-12-28";if(a&&env.t212&&d>=today&&!yearEndValues(a.storico,y))items.push({key:"inv-ye-"+y,date:d,summary:"📈 Apri Cairn: valori Trading 212 al 31/12",desc:"Basta aprire l'app con internet entro il 10 gennaio: salva il valore di ogni ETF a fine anno per il quadro RW e l'IVAFE.",rem:[900]})}
  return items.map(i=>({...i,hash:[i.date,i.summary,i.desc].join("|")}));
}
const colN=c=>c.split("").reduce((a,ch)=>a*26+ch.charCodeAt(0)-64,0);
const xlDate=s=>{const [y,m,d]=s.split("-").map(Number);return (Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/864e5};
function xlSheet(doc){
  const NS=doc.documentElement.namespaceURI, sd=doc.getElementsByTagName("sheetData")[0], map={}, rows={};
  Array.from(sd.getElementsByTagName("row")).forEach(r=>{rows[r.getAttribute("r")]=r});
  Array.from(sd.getElementsByTagName("c")).forEach(c=>{map[c.getAttribute("r")]=c});
  const cell=ref=>{if(map[ref])return map[ref];const rn=ref.replace(/[A-Z]+/,""),cn=colN(ref.replace(/\d+/,""));
    let row=rows[rn];if(!row){row=doc.createElementNS(NS,"row");row.setAttribute("r",rn);const after=Array.from(sd.childNodes).find(x=>x.nodeType===1&&+x.getAttribute("r")>+rn);sd.insertBefore(row,after||null);rows[rn]=row}
    const c=doc.createElementNS(NS,"c");c.setAttribute("r",ref);const nxt=Array.from(row.childNodes).find(x=>x.nodeType===1&&colN(x.getAttribute("r").replace(/\d+/,""))>cn);row.insertBefore(c,nxt||null);map[ref]=c;return c};
  const wipe=c=>{while(c.firstChild)c.removeChild(c.firstChild);c.removeAttribute("t")};
  return {
    clear(ref){wipe(cell(ref))},
    num(ref,v){if(v==null||v===""||isNaN(v)){wipe(cell(ref));return}const c=cell(ref);wipe(c);c.setAttribute("t","n");const e=doc.createElementNS(NS,"v");e.textContent=String(v);c.appendChild(e)},
    str(ref,v){const c=cell(ref);wipe(c);if(v==null||v==="")return;c.setAttribute("t","inlineStr");const is=doc.createElementNS(NS,"is"),t=doc.createElementNS(NS,"t");t.textContent=String(v);t.setAttribute("xml:space","preserve");is.appendChild(t);c.appendChild(is)},
    fx(ref,f){const c=cell(ref);wipe(c);const e=doc.createElementNS(NS,"f");e.textContent=f;c.appendChild(e)},
    date(ref,s){if(!s){wipe(cell(ref));return}this.num(ref,xlDate(s))}
  };
}
async function exportV3_orig(FX){
  try{await loadScript("/vendor/jszip.min.js")}catch(e){toast("Impossibile caricare il generatore Excel");return}
  toast("Preparo il tuo Excel v3…");
  const bin=atob(V3_B64),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const zip=await window.JSZip.loadAsync(bytes);const P=new DOMParser(),Ser=new XMLSerializer();const docs={};
  const open=async n=>{const path=`xl/worksheets/sheet${n}.xml`;const d=P.parseFromString(await zip.file(path).async("string"),"application/xml");docs[path]=d;return xlSheet(d)};
  // Fatture Register (rows 15-134): only input columns, formulas untouched
  const R=await open(2);
  const inv=[...S.invoices].sort((a,b)=>(a.data||"").localeCompare(b.data||"")||(a.n||0)-(b.n||0));
  if(inv.length>120)toast("Attenzione: il v3 ha 120 righe, esporto le prime 120");
  for(let k=0;k<120;k++){const r=15+k,v=inv[k];
    if(!v){["B","C","D","E","H","I","J","L","M","Z"].forEach(c=>R.clear(c+r));continue}
    const t=tot(v),tr=(v.righe||[]).filter(x=>x.tipo==="trasferta"),gg=tr.reduce((a,x)=>a+(+x.qta||0),0),c=clientById(v.cliente);
    R.date("B"+r,v.data);R.str("C"+r,v.num);R.str("D"+r,c?c.nome:v.cliente);R.date("E"+r,v.incasso);
    R.num("H"+r,t.comp);R.num("I"+r,gg||null);R.num("J"+r,gg?r2(t.ind/gg):null);R.num("L"+r,t.rimb||null);R.num("M"+r,t.bollo);R.str("Z"+r,v.note||"")}
  // FISCO inputs (cols D-G = 2025-2028)
  const X=await open(3),F=cfg().fisco||{},cols=["D","E","F","G"],yrs=[2025,2026,2027,2028];
  const ov=(y,k)=>{const o=F[String(y)];return o&&o[k]!=null&&o[k]!==""?+o[k]:null};
  yrs.forEach((y,i)=>{const c=cols[i],p=cols[i-1];
    X.num(c+"10",r2((ov(y,"stima")||0)+((FX[y]||{}).contr||0)));X.num(c+"19",ov(y,"inps"));X.num(c+"29",ov(y,"imposta"));
    const a=ov(y,"accontiInps");if(a!=null)X.num(c+"21",a);else if(p)X.fx(c+"21",`IF(${p}20<=0,0,${p}20*PARAMETRI!$E$20)`);else X.num(c+"21",0);
    const iv=ov(y,"inpsVersati");if(iv!=null)X.num(c+"23",iv);else if(p)X.fx(c+"23",`${p}22+${c}21`);else X.num(c+"23",0);
    const ai=ov(y,"accontiImp");if(ai!=null)X.num(c+"31",ai);else if(p)X.fx(c+"31",`IF(${p}30<=PARAMETRI!$E$22,0,${p}30*PARAMETRI!$E$21)`);else X.num(c+"31",0)});
  // PARAMETRI: rates per year (rows 7-12) and clients (rows 28-35)
  const Pm=await open(6);
  [2025,2026,2027,2028,2029,2030].forEach((y,i)=>{const p=cfg().params[String(y)];if(!p)return;const r=7+i;Pm.num("C"+r,p.coef);Pm.num("D"+r,p.inps);Pm.num("E"+r,p.imp);Pm.num("F"+r,p.margine)});
  const so=cfg().soglie;Pm.num("E17",so.s85);Pm.num("E18",so.s100);Pm.num("E19",so.allerta);
  for(let k=0;k<8;k++){const r=28+k,c=S.clients[k];Pm.str("B"+r,c?c.nome:"");Pm.num("E"+r,c?c.gg:null);Pm.num("F"+r,c&&c.tariffa?c.tariffa:null)}
  // SCADENZE F24 (rows 6-40): real payments + live estimates linked to FISCO
  const Sc=await open(4);for(let r=6;r<=40;r++)["B","C","D","E","F","G"].forEach(c=>Sc.clear(c+r));
  const real=[...S.f24].sort((a,b)=>a.data<b.data?-1:1);let r=6;
  real.forEach(x=>{if(r>40)return;Sc.date("B"+r,x.data);Sc.str("C"+r,x.descrizione);Sc.str("D"+r,x.tributi||"");Sc.num("E"+r,x.importo);Sc.str("F"+r,x.versato?"Sì":"No");r++});
  [[2026,"E"],[2027,"F"],[2028,"G"]].forEach(([y,c])=>{[[`${y+1}-06-30`,`Saldo ${y} + I acconto ${y+1} (stima)`,"1792, 1790, PXXR",35],[`${y+1}-11-30`,`II acconto ${y+1} (stima)`,"1790, PXXR",36]].forEach(([d,de,tb,row])=>{
    if(r>40||d<todayISO()||real.some(x=>x.data&&x.data.slice(0,7)===d.slice(0,7)))return;
    Sc.date("B"+r,d);Sc.str("C"+r,de);Sc.str("D"+r,tb);Sc.fx("E"+r,`FISCO!${c}${row}`);Sc.str("F"+r,"No");Sc.str("G"+r,"Stima da FISCO");r++})});
  // DASHBOARD: open on the current year
  const Db=await open(1);Db.num("B7",Math.min(2028,Math.max(2025,new Date().getFullYear())));
  Object.entries(docs).forEach(([path,d])=>zip.file(path,Ser.serializeToString(d)));
  const blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",compression:"DEFLATE"});
  const ok=await save("Fatture_Andrea_Scialabba_v3.xlsx",blob);
  if(ok){try{localStorage.setItem("fa-v3",new Date().toISOString())}catch(e){}render()}
}
function openClient(id){
  const k=id?clientById(id):{nome:"",ragione:"",idFiscale:"",indirizzo:"",pec:"",compenso:"",tariffa:"",gg:30,desc:"Compenso professionale - {MESE}",descTrasf:"Indennità di trasferta estero (Madagascar) - dal {DAL} al {AL}"};
  let logo=k.logo||null;
  sheet(id?`Cliente · ${k.nome}`:"Nuovo cliente",`<section class="panel"><div class="panel-b"><div class="fields">
   <div class="f s6"><label>Logo</label><div class="logo-ed"><span id="c-lgv">${clg({...k,logo},1)}</span><label class="btn small" for="c-lgf" style="cursor:pointer">${logo?"Cambia logo":"Carica logo"}</label><input id="c-lgf" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none"><button class="btn small ghost" id="c-lgx" type="button" ${logo?"":"hidden"}>Togli</button><span class="help">PNG o JPG, meglio quadrato o con sfondo trasparente. Resta nei tuoi dati, ridotto a 256 px.</span></div></div>
   <div class="f"><label for="c-nome">Nome breve</label><input id="c-nome" value="${esc(k.nome)}"></div>
   <div class="f"><label for="c-rag">Ragione sociale (proforma)</label><input id="c-rag" value="${esc(k.ragione||"")}"></div>
   <div class="f"><label for="c-id">P.IVA / CF (come in fattura)</label><input id="c-id" value="${esc(k.idFiscale||"")}" placeholder="P.IVA: 01234567890"></div>
   <div class="f"><label for="c-pec">PEC</label><input id="c-pec" value="${esc(k.pec||"")}"></div>
   <div class="f s6"><label for="c-ind">Indirizzo</label><textarea id="c-ind" rows="2">${esc(k.indirizzo||"")}</textarea></div>
   <div class="f s2"><label for="c-comp">Compenso mensile (€)</label><input id="c-comp" class="in num" inputmode="decimal" value="${k.compenso??""}"></div>
   <div class="f s2"><label for="c-tar">Trasferta €/giorno</label><input id="c-tar" class="in num" inputmode="decimal" value="${k.tariffa??""}"></div>
   <div class="f s2"><label for="c-gg">Giorni medi di pagamento</label><input id="c-gg" class="in num" inputmode="numeric" value="${k.gg??""}"></div>
   <div class="f s6"><label for="c-desc">Descrizione compenso</label><input id="c-desc" value="${esc(k.desc||"")}"><span class="help">{MESE} diventa il mese, es. SETTEMBRE 2026.</span></div>
   <div class="f s6"><label for="c-dtr">Descrizione trasferta</label><input id="c-dtr" value="${esc(k.descTrasf||"")}"><span class="help">{DAL} e {AL} diventano le date.</span></div>
  </div></div></section>`,`<button class="btn primary" id="cSave" type="button">Salva cliente</button>`);
  const showLogo=()=>{$("#c-lgv").innerHTML=clg({...k,nome:$("#c-nome").value||k.nome,logo},1);$("#c-lgx").hidden=!logo};
  $("#c-lgf").onchange=async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{logo=await logoDataUrl(f);showLogo()}catch(err){toast("Immagine non leggibile")}};
  $("#c-lgx").onclick=()=>{logo=null;showLogo()};
  $("#cSave").onclick=async()=>{const g=s=>$(s).value.trim();const nome=g("#c-nome");if(!nome){toast("Inserisci il nome");return}
    const cid=id||nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,40)||uid();
    const {id:_i,...keep}=id?k:{};const doc={...keep,logo,nome,ragione:g("#c-rag"),idFiscale:g("#c-id"),pec:g("#c-pec"),indirizzo:$("#c-ind").value,compenso:readNum(g("#c-comp"))||0,tariffa:readNum(g("#c-tar"))||0,gg:parseInt(g("#c-gg"))||30,desc:g("#c-desc"),descTrasf:g("#c-dtr"),ordine:k.ordine??(S.clients.length+1)};
    if(await write(db=>db.doc("clients/"+cid).set(doc),"Cliente salvato"))closeSheet()};
}
/** Uploaded logo → square-ish PNG of at most 256 px, transparent margins trimmed. */
async function logoDataUrl(file){
  const url=URL.createObjectURL(file);try{const img=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url});
    const w0=img.naturalWidth||256,h0=img.naturalHeight||256,c=document.createElement("canvas");c.width=w0;c.height=h0;const x=c.getContext("2d");x.drawImage(img,0,0);
    let d;try{d=x.getImageData(0,0,w0,h0).data}catch(e){d=null}
    let L=0,T=0,R=w0-1,B=h0-1;if(d){const bg=(i)=>d[i+3]<16||(d[i]>245&&d[i+1]>245&&d[i+2]>245);L=w0;T=h0;R=-1;B=-1;
      for(let y=0;y<h0;y++)for(let xx=0;xx<w0;xx++){if(!bg((y*w0+xx)*4)){if(xx<L)L=xx;if(xx>R)R=xx;if(y<T)T=y;if(y>B)B=y}}if(R<0){L=0;T=0;R=w0-1;B=h0-1}}
    const cw=R-L+1,ch=B-T+1,k=Math.min(1,256/Math.max(cw,ch)),o=document.createElement("canvas");o.width=Math.max(1,Math.round(cw*k));o.height=Math.max(1,Math.round(ch*k));
    const ox=o.getContext("2d");ox.imageSmoothingQuality="high";ox.drawImage(c,L,T,cw,ch,0,0,o.width,o.height);return o.toDataURL("image/png")}
  finally{URL.revokeObjectURL(url)}}
function openF24(id,pre){
  const r=id?S.f24.find(x=>x.id===id):pre||{data:todayISO(),descrizione:"",tributi:"",importo:"",versato:false};
  sheet(id?"Modifica versamento":pre?"Modifica la stima":"Nuovo versamento F24",`<section class="panel">${pre?`<div class="panel-b note" style="margin:0">Importo calcolato da Cairn: correggilo con quello dell'F24 che ti ha mandato ${esc((cfg().commercialista||{}).nome||"la commercialista")}. Salvato, prende il posto della stima.</div>`:""}<div class="panel-b"><div class="fields">
   <div class="f s2"><label for="g-d">Data</label><input id="g-d" type="date" value="${r.data}"></div>
   <div class="f s2"><label for="g-i">Importo (€)</label><input id="g-i" class="in num" inputmode="decimal" value="${String(r.importo).replace(".",",")}"></div>
   <div class="f s2"><label class="switch" style="margin-top:22px"><input type="checkbox" id="g-v" ${r.versato?"checked":""}> Versato</label></div>
   <div class="f s6"><label for="g-de">Descrizione</label><input id="g-de" value="${esc(r.descrizione)}" placeholder="Saldo 2026 + I acconto 2027"></div>
   <div class="f s6"><label for="g-t">Codici tributo</label><input id="g-t" value="${esc(r.tributi||"")}" placeholder="1792, 1790, PXXR"></div>
  </div><div id="g-del" style="margin-top:14px"></div></div></section>`,`<button class="btn primary" id="gSave" type="button">Salva</button>`);
  if(id){$("#g-del").innerHTML=`<button class="btn small danger" id="gDel" type="button">Elimina versamento</button>`;$("#gDel").onclick=()=>{$("#g-del").innerHTML=`<span class="muted">Eliminare definitivamente?</span> <button class="btn small danger" id="gDel2" type="button">Sì, elimina</button>`;$("#gDel2").onclick=async()=>{if(await write(db=>db.doc("f24/"+id).delete(),"Versamento eliminato"))closeSheet()}}}
  $("#gSave").onclick=async()=>{const doc={data:$("#g-d").value,importo:readNum($("#g-i").value),versato:$("#g-v").checked,descrizione:$("#g-de").value.trim(),tributi:$("#g-t").value.trim()};
    if(!doc.data||!doc.importo){toast("Inserisci data e importo");return}
    if(await write(db=>db.doc("f24/"+(id||doc.data+"-"+uid())).set(doc),"Versamento salvato"))closeSheet()};
}
return { vHome, vInv, vPrev, vContr, vMis, vF24, vTasse, vFisco, compliancePanel, redditiPanel, vEntrate, vSpese, vInvest, vRisp, vAnal, vSet, bindView, openForm, toast, autoT212, inboxAttach, closeSheet, escClose, openDetail, calItems, _fisco: () => curE().fisco() };
}
