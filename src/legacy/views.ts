// @ts-nocheck
/* eslint-disable */
// GENERATED — do not edit by hand. Source: the original Cairn artifact (single-file app), view layer only.
// The engine calls are routed to src/domain/engine.ts (verified equal on real data); everything else here is the
// original rendering code, extracted verbatim. Equality with the original output is checked by tests/unit/views-golden.test.ts.
import { tot } from "@/domain/engine";
export type LegacyViews = Record<"vHome" | "vInv" | "vPrev" | "vContr" | "vMis" | "vF24" | "vTasse" | "vFisco" | "compliancePanel" | "redditiPanel" | "vEntrate" | "vSpese" | "vInvest" | "vRisp" | "vAnal" | "vSet", (...a: any[]) => string>;
export function createViews(S: any, E: any): LegacyViews {
const cfg = () => S.cfg;
const clientById = (id) => S.clients.find((c) => c.id === id);
const todayISO = () => E.today;
const projections=(...a)=>E.projections(...a);
const fy=(...a)=>E.fy(...a);
const fiscoMin=(...a)=>E.fiscoMin(...a);
const oneriInv=(...a)=>E.oneriInv(...a);
const nextF24=(...a)=>E.nextF24(...a);
const reminders=(...a)=>E.reminders(...a);
const remDue=(...a)=>E.remDue(...a);
const stato=(...a)=>E.stato(...a);
const f24Rows=(...a)=>E.f24Rows(...a);
const emessa=(...a)=>E.emessa(...a);
const compliance=(...a)=>E.compliance(...a);
const ctInfo=(...a)=>E.ctInfo(...a);
const ctPlan=(...a)=>E.ctPlan(...a);
const effDate=(...a)=>E.effDate(...a);
const fase=(...a)=>E.fase(...a);
const scadenza=(...a)=>E.scadenza(...a);
const speseStats=(...a)=>E.speseStats(...a);
const cash12=(...a)=>E.cash12(...a);
const invCalc=(...a)=>E.invCalc(...a);
const rispCalc=(...a)=>E.rispCalc(...a);
const flow12=(...a)=>E.flow12(...a);
const gg=(...a)=>E.gg(...a);
const invInM=(...a)=>E.invInM(...a);
const f24InM=(...a)=>E.f24InM(...a);
const fisco=(...a)=>E.fisco(...a);
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
const DOTICON={"!":"alert","€":"euro","↧":"inbox","⇩":"down","✓":"check","%":"pct","⏰":"clock","✎":"pen","✉":"mail","📅":"cal","€$":"piggy","§":"stamp","➤":"send"};
const years=()=>Object.keys(cfg().params).map(Number).sort((a,b)=>a-b);
const P=y=>cfg().params[String(y)]||cfg().params[String(years().slice(-1)[0])];
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
  if(ctS&&ctS.linked){const P=ctPlan(FX);if(P&&P.first){const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;T({lvl:daysBetween(todayISO(),P.first.d)<=120?"warn":"do",ic:"€$",title:`Accantonamento tasse insufficiente dal ${dmy(P.first.d)}`,sub:`Con ${eur0(P.ct.mens)} al mese il conto va a ${eur0(P.min)} il ${dmy(P.minD)}.${nd?` Per coprire gli F24 servono circa ${eur0(nd)} al mese.`:""}`,big:nd?eur0(nd):"",bigL:nd?"/ mese":"",act:`<button class="btn small" data-go-v="risp" type="button">Vedi</button>`})}}
  else if(ctS&&ctS.saldo!=null){if(+ctS.saldo<d6)T({lvl:"warn",ic:"€$",title:"Conto tasse scoperto",sub:`Hai ${eur0(ctS.saldo)}, nei prossimi 6 mesi verserai ${eur0(d6)} di F24.`,big:eur0(d6-ctS.saldo),act:`<button class="btn small" data-go-v="tasse" type="button">Vedi</button>`})}
  else T({lvl:"do",ic:"€$",title:"Registra il saldo del conto tasse",sub:`Così vedi se copri gli F24: giugno ${cy+1} ≈ ${eur0(fc.giugno||0)}.`,act:`<button class="btn small" data-go-v="tasse" type="button">Inserisci</button>`});
  if(fc.ric>=s.allerta)T({lvl:"warn",ic:"!",title:`Previsione ${cy} vicina alla soglia`,sub:`Valuta tempi di fatturazione e rimborsi analitici.`,big:eur0(fc.ric),act:""});
  // incasso a cavallo d'anno: principio di cassa, l'aliquota cambia
  if(P(cy+1).imp>P(cy).imp){const risk=[...PR.filter(x=>x.anno===cy&&x.incasso>=`${cy}-12-15`),...openAll.filter(v=>fy(v)===cy&&effDate(v)>=`${cy}-12-15`).map(v=>({cliente:v.cliente,imponibile:tot(v).imponibile,incasso:effDate(v),label:v.num}))];
    const amt=risk.reduce((a,x)=>a+x.imponibile,0);
    if(amt>0){const extra=amt*P(cy).coef*(1-P(cy).inps)*(P(cy+1).imp-P(cy).imp);
      T({lvl:"do",ic:"%",title:`Incassi a fine dicembre: chiedi il bonifico entro il 31/12`,sub:`${risk.map(x=>cn(x.cliente)+" "+x.label).join(" · ")}: se slittano a gennaio passano al ${cy+1} con imposta al ${pct(P(cy+1).imp,0)} (circa ${eur0(extra)} in più).`,date:risk[0].incasso,big:eur0(amt),act:`<button class="btn small" data-go-v="prev" type="button">Vedi</button>`})}}
  invTodos(T);rispTodos(T);
  const rank={warn:0,do:1,ok:2};
  todo.sort((a,b)=>(rank[a.lvl]-rank[b.lvl])||((a.date||"9999")<(b.date||"9999")?-1:1));
  const stato3=[
    {l:`Soglia ${eur0(s.s85)} · ${cy}`,v:eur0(s.s85-(fc.ric||0)),sub:`margine · previsione ${eur0(fc.ric||0)}`,tone:(fc.ric||0)>=s.allerta?"bad":"pos"},
    {l:"Da accantonare",v:pct((fc.oneriPct||0)*(1+P(cy).margine),0),sub:`di ogni incasso ${cy}`,tone:""},
    {l:`Da accantonare dal ${cy+1}`,v:pct(((FX[cy+1]||{}).oneriPct||0)*(1+P(cy+1).margine),0),sub:`imposta al ${pct(P(cy+1).imp,0)}`,tone:"neg"},
    {l:"F24 prossimi 6 mesi",v:eur0(d6),sub:ctS&&ctS.saldo!=null?`conto tasse ${eur0(ctS.saldo)}`:"conto tasse non registrato",tone:""}];
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
  const chart=barChart(mInc,mAtt,mPr);
  // clients
  const byC={};inYear.forEach(v=>{const k=v.cliente;byC[k]=byC[k]||{inc:0,att:0};const t=tot(v).imponibile;if(v.incasso)byC[k].inc+=t;else byC[k].att+=t});
  const totC=Object.values(byC).reduce((a,c)=>a+c.inc+c.att,0)||1;
  const cRows=Object.entries(byC).sort((a,b)=>(b[1].inc+b[1].att)-(a[1].inc+a[1].att)).map(([k,c])=>{const q=(c.inc+c.att)/totC;const cl=clientById(k);
    return `<div class="cbar"><div class="n">${esc(cl?cl.nome:k)}</div><div class="b" title="Incassato ${eur(c.inc)} · Atteso ${eur(c.att)}"><i style="width:${c.inc/totC*100}%;background:var(--slate)"></i><i style="width:${c.att/totC*100}%;background:var(--band)"></i></div><div class="p">${eur0(c.inc+c.att)} · <b class="${q>.6?"neg":""}">${pct(q,0)}</b></div></div>`}).join("")||`<div class="empty">Nessuna fattura nel ${y}.</div>`;
  const sogliaW=Math.min(100,(f.inc||0)/s.s85*100), sogliaF=Math.min(100-sogliaW,((f.att||0)+(f.contr||0)+(f.stima||0))/s.s85*100);
  // mini grafici dei riquadri
  const KV={};{const curM=y===cy?new Date().getMonth():11;const mn=i=>MESI_L[i].charAt(0)+MESI_L[i].slice(1).toLowerCase();
   KV.inc=VZ.cols(mInc,[curM],"Incassato per mese\n"+mInc.map((v,i)=>v?mn(i)+": "+eur0(v):null).filter(Boolean).join("\n"),i=>i===curM&&y===cy?"var(--amber-soft)":"var(--slate)");
   const op=f.oneriPct||0;KV.net=VZ.cols(mInc.map(v=>v*(1-op)),[],"Netto per mese (stima)\n"+mInc.map((v,i)=>v?mn(i)+": "+eur0(v*(1-op)):null).filter(Boolean).join("\n"),()=>"var(--green-soft)");
   const ip=f.oneri?f.inps/f.oneri:0;if(oneri>0)KV.one=VZ.stack([{v:oneri*ip,c:"#8497B0"},{v:oneri*(1-ip),c:"var(--amber-soft)"}],Math.max(1,oneri),[],`INPS: ${eur0(oneri*ip)}\nImposta: ${eur0(oneri*(1-ip))}`)+`<div class="vzl"><span>INPS ${eur0(oneri*ip)}</span><span>imposta ${eur0(oneri*(1-ip))}</span></div>`;
   if(accant>0)KV.acc=VZ.stack([{v:oneri,c:"#8497B0"},{v:Math.max(0,accant-oneri),c:"var(--amber-soft)"}],Math.max(1,accant),[],`Oneri stimati: ${eur0(oneri)}\nMargine di sicurezza: ${eur0(Math.max(0,accant-oneri))}`)+`<div class="vzl"><span>oneri</span><span>+ margine ${pct(P(y).margine,0)}</span></div>`;
   const op2=y>cy?projY.map(x=>({v:x.imponibile,c:"#C9D6EA",t:c2n(x.cliente)+" "+x.label})):open.map(v=>({v:tot(v).documento,c:stato(v)==="Scaduta"?"var(--tax)":"var(--slate)",t:v.num+" "+c2n(v.cliente)}));
   KV.ape=op2.length?VZ.stack(op2,Math.max(1,op2.reduce((a,x)=>a+x.v,0)),[],op2.map(x=>x.t+": "+eur0(x.v)).join("\n")):"";
   const max=Math.max(s.s85,f.ric||0)*1.02;const segs=[{v:f.inc||0,c:"var(--slate)"},{v:f.att||0,c:"#8497B0"},{v:(f.contr||0)+(f.stima||0),c:"#C9D6EA"}];const tp=`Incassato: ${eur0(f.inc||0)}\nFatture aperte: ${eur0(f.att||0)}\nDa contratti: ${eur0((f.contr||0)+(f.stima||0))}\nSoglia: ${eur0(s.s85)}`;
   KV.prev=VZ.stack(segs,max,[{v:s.s85,c:"var(--tax)"}],tp);
   KV.sog=VZ.stack([{v:f.ric||0,c:(f.ric||0)>=s.allerta?"var(--tax)":"var(--slate)"}],s.s85,[{v:s.allerta,c:"var(--gold-d)",dash:1}],`Previsione: ${eur0(f.ric||0)}\nAllerta: ${eur0(s.allerta)}\nSoglia: ${eur0(s.s85)}`);
   if(y===cy){const fr=f24Rows(FX);const m12=[];const d=new Date();for(let i=0;i<12;i++){const x=new Date(d.getFullYear(),d.getMonth()+i,1);m12.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}
     const vv=m12.map(m=>fr.filter(r=>!r.versato&&r.data.slice(0,7)===m).reduce((a,r)=>a+r.importo,0));const hi=nx?[m12.indexOf(nx.data.slice(0,7))]:[];
     KV.f24=VZ.cols(vv,hi,"F24 nei prossimi 12 mesi\n"+m12.map((m,i)=>vv[i]?MESI[+m.slice(5)-1]+" "+m.slice(2,4)+": "+eur0(vv[i]):null).filter(Boolean).join("\n"),i=>hi.includes(i)?"var(--cost)":"#ADB9CA")}}
  return `
  <section>
    <div class="eyebrow" style="margin-bottom:8px">Anno fiscale ${y} · per data di incasso${y>cy?" · anno futuro: valori da contratti":y<cy?" · anno chiuso":""}</div>
    <div class="kpis">
      <div class="kpi amber"><div class="l">Fatturato incassato</div><div class="v">${eur0(incassato)}</div>${KV.inc||""}<div class="s">${paid.length} fatture</div></div>
      <div class="kpi green"><div class="l">Netto reale</div><div class="v">${eur0(netto)}</div>${KV.net||""}<div class="s">${eur0(netto/mesiTrasc)} / mese</div></div>
      <div class="kpi"><div class="l">Oneri (INPS + imposta)</div><div class="v">${eur0(oneri)}</div>${KV.one||""}<div class="s">${pct(f.oneriPct||0)} dei ricavi</div></div>
      <div class="kpi"><div class="l">Da accantonare</div><div class="v">${eur0(accant)}</div>${KV.acc||""}<div class="s">sugli incassi ${y}</div></div>
      <div class="kpi ${late.length?"alert":""}"><div class="l">${y>cy?"Previsto da contratti":"Da incassare "+y}</div><div class="v">${aperto?eur0(aperto):"—"}</div>${KV.ape||""}<div class="s">${y>cy?projY.length+" fatture previste":open.length?open.length+" aperte"+(late.length?` · <b style="color:var(--pink-fg)">${late.length} scadute</b>`:""):"tutto incassato"}</div></div>
      <div class="kpi"><div class="l">Previsione anno</div><div class="v">${y>cy?approx(f.ric):eur0(f.ric||0)}</div>${KV.prev||""}<div class="s">${FMIN[y]&&FMIN[y].ric<(f.ric||0)-1?"minimo garantito "+eur0(FMIN[y].ric):"incassi + aperte + contratti"}</div></div>
      <div class="kpi ${(f.soglia||0)>=s.allerta/s.s85?"alert":""}"><div class="l">Soglia ${eur0(s.s85)}</div><div class="v">${pct(f.soglia||0)}</div>${KV.sog||""}<div class="s">usata (previsione)</div></div>
      ${y===cy?`<div class="kpi ${nx&&daysBetween(todayISO(),nx.data)<=7?"alert":""}"><div class="l">Prossimo F24</div><div class="v">${nx?eur0(nx.importo):"—"}</div>${KV.f24||""}<div class="s">${nx?dmy(nx.data):"nessuno"}</div></div>`
       :`<div class="kpi"><div class="l">F24 ${y>cy?"previsti":"versati"} nel ${y}</div><div class="v">${f24Ytot?eur0(f24Ytot):"—"}</div><div class="s">${f24Ytot?(y>cy?"stima":"registrati nell'app"):y<cy?"non registrati nell'app":"nessuno"}</div></div>`}
    </div>
  </section>
  ${personalPanel(FX)}
  <div class="grid">
    <section class="panel c7"><div class="panel-h"><h2>Da fare ora</h2><span class="eyebrow tday" style="margin-left:4px">oggi ${dmy(todayISO())}</span><div class="spacer"></div><button class="btn small ghost" data-calsync="1" type="button" title="Aggiorna Google Calendar">${ico("sync",14)} Calendario</button></div>
      <ul class="tlist">${todo.map(t=>{const ci=t.date?cdInfo(t.date):null;
        return `<li class="${t.lvl}"><span class="dot ${t.lvl}">${DOTICON[t.ic]?ico(DOTICON[t.ic],13):t.ic}</span><div class="tm"><div class="tt">${t.title}</div>${t.sub?`<div class="ts">${t.sub}</div>`:""}</div><div class="tr">${t.big?`<b class="num">${t.big}${t.bigL?` <small>${t.bigL}</small>`:""}</b>`:""}${ci?`<span class="cdp ${ci.c}">${ci.t}</span>`:""}</div><div class="ta">${t.act||""}</div></li>`}).join("")}</ul>
    </section>
    <section class="panel c5"><div class="panel-h"><h2>Stato ${cy}</h2></div>
      <div class="sstrip v">${stato3.map(k=>`<div><span>${k.l}</span><b class="num ${k.tone}">${k.v}</b><small>${k.sub}</small></div>`).join("")}</div>
      <div class="panel-b" style="border-top:1px solid var(--line-2)"><div class="eyebrow" style="margin-bottom:8px">Soglia forfettario ${y}</div>
      <div class="meter" role="img" aria-label="Soglia usata ${pct(f.soglia||0)}"><i style="width:${sogliaW}%"></i><i class="f" style="left:${sogliaW}%;width:${sogliaF}%"></i><span class="mk" style="left:${Math.min(99.5,s.allerta/s.s85*100)}%"></span></div>
      <div class="meter-legend"><span>Incassato ${eur0(f.inc||0)}</span><span>+ previsto ${eur0((f.att||0)+(f.contr||0)+(f.stima||0))}</span><span>allerta ${eur0(s.allerta)}</span></div>
      <div style="margin-top:16px" class="eyebrow">Clienti ${y}</div>
      <div style="margin-top:4px">${cRows}</div>
      </div>
    </section>
    <section class="panel c12"><div class="panel-h"><h2>Trend mensile ${y}</h2><div class="spacer"></div><div class="legend"><span><i style="background:var(--slate)"></i>Incassato</span><span><i style="background:var(--band);border:1px solid var(--line)"></i>Fatture aperte</span><span><i style="background:repeating-linear-gradient(135deg,#8497B0 0 3px,transparent 3px 6px);border:1px solid #8497B0"></i>Da contratto</span></div></div><div class="panel-b chart">${chart}</div></section>
  </div>`;
}
function barChart(a,b,c){c=c||Array(12).fill(0);
  const W=720,H=250,L=56,R=10,T=14,B=28,max=Math.max(1000,...a.map((v,i)=>v+b[i]+c[i]));
  const step=niceStep(max/4), top=Math.ceil(max/step)*step, sx=(W-L-R)/12, bw=sx*.56, y=v=>T+(H-T-B)*(1-v/top);
  let g="";for(let t=0;t<=top+.1;t+=step){g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line-2)"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${t>=1000?(t/1000).toLocaleString("it-IT")+"k":t}</text>`}
  let bars="";a.forEach((v,i)=>{const x=L+sx*i+(sx-bw)/2;const h1=(H-T-B)*v/top,h2=(H-T-B)*b[i]/top;
    if(v>0)bars+=`<rect x="${x}" y="${y(v)}" width="${bw}" height="${h1}" fill="var(--slate)" rx="2"></rect>`;
    if(b[i]>0)bars+=`<rect x="${x}" y="${y(v+b[i])}" width="${bw}" height="${h2}" fill="var(--band)" stroke="#8497B0" stroke-dasharray="3 2" rx="2"></rect>`;
    if(c[i]>0)bars+=`<rect x="${x}" y="${y(v+b[i]+c[i])}" width="${bw}" height="${(H-T-B)*c[i]/top}" fill="url(#hatch)" stroke="#8497B0" rx="2"></rect>`;
    {const tl=[MESI_L[i].charAt(0)+MESI_L[i].slice(1).toLowerCase()];if(v)tl.push("Incassato: "+eur0(v));if(b[i])tl.push("Fatture aperte: "+eur0(b[i]));if(c[i])tl.push("Da contratto: "+eur0(c[i]));if(tl.length>2)tl.push("Totale: "+eur0(v+b[i]+c[i]));if(tl.length===1)tl.push("Nessun incasso");bars+=`<rect class="hov" x="${L+sx*i}" y="${T}" width="${sx}" height="${H-T-B}" data-tip="${esc(tl.join("\n"))}"></rect>`}
    bars+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" font-size="11.5" fill="var(--muted)">${MESI[i]}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ricavi per mese"><defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><rect width="3" height="6" fill="#8497B0" opacity=".55"/></pattern></defs>${g}${bars}</svg>`;
}
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
function pillFor(v){const s=fase(v);const cls=s==="Incassata"?"ok":s==="Scaduta"?"late":s==="Proforma"||s.startsWith("Inviata")?"est":"open";
  const ic=s==="Incassata"?"check":s==="Scaduta"?"alert":s==="Proforma"?"pen":s.startsWith("Inviata")?"send":"inbox";return `<span class="pill ${cls}">${ico(ic,12)}${esc(s)}</span>`}
function vInv(FX){
  const list=filtered(); const f=S.filter;
  const sum=list.reduce((a,v)=>{const t=tot(v),o=oneriInv(v,FX);a.doc+=t.documento;a.imp+=t.imponibile;a.net+=o.netto;a.on+=o.oneri;return a},{doc:0,imp:0,net:0,on:0});
  const rows=list.map(v=>{const t=tot(v),o=oneriInv(v,FX),c=clientById(v.cliente);
    return `<tr class="click" data-open="${v.id}"><td class="num">${dmyShort(v.data)}</td><td class="num"><b>${esc(v.num)}</b>${v.inviataCommercialista?' <span title="Inviata alla commercialista" style="color:var(--green)">✉</span>':""}</td><td class="cli">${esc(c?c.nome:v.cliente)}</td>
      <td class="r num money-in">${eur(t.comp)}</td><td class="r num">${t.ind?eur(t.ind):"—"}</td><td class="r num">${t.rimb?eur(t.rimb):"—"}</td><td class="r num"><b>${eur(t.documento)}</b></td>
      <td class="r num neg">${eur(o.oneri)}</td><td class="r num pos"><b>${eur(o.netto)}</b></td><td class="c">${pillFor(v)}</td><td class="num">${v.incasso?dmyShort(v.incasso):`<span class="muted">att. ${dmyShort(scadenza(v))}</span>`}</td><td class="c num">${fy(v)||""}</td></tr>`}).join("");
  const cards=list.map(v=>{const t=tot(v),c=clientById(v.cliente);return `<div class="icard" data-open="${v.id}"><div class="t">${esc(v.num)} · <span class="cli">${esc(c?c.nome:v.cliente)}</span></div><div class="a num">${eur(t.documento)}</div><div class="m">${dmy(v.data)} · ${v.incasso?"incassata "+dmy(v.incasso):"attesa "+dmy(scadenza(v))}</div><div style="text-align:right">${pillFor(v)}</div></div>`}).join("");
  return `<section class="panel">
    <div class="panel-h" style="flex-wrap:wrap"><h2>Registro fatture</h2><div class="spacer"></div>
      <div class="filters">
        <select id="fStato" aria-label="Filtra per stato"><option value="tutti">Tutte</option><option value="anno">Anno fiscale ${S.year}</option><option value="aperte">Da incassare</option><option value="scadute">Scadute</option></select>
        <select id="fCli" aria-label="Filtra per cliente"><option value="">Tutti i clienti</option>${S.clients.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join("")}</select>
        <input id="fQ" type="search" placeholder="Cerca n. o cliente" value="${esc(f.q)}" aria-label="Cerca">
        <button class="btn small dark" id="exportV3" type="button">Excel v3 aggiornato</button><button class="btn small ghost" id="exportX" type="button">Solo dati</button>
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
  const card=x=>`<div class="pcard"><div class="pc-top"><span class="cli">${esc(c2n(x.cliente))}</span>${x.data<today?'<span class="pill late">'+ico("alert",12)+'in ritardo</span>':'<span class="pill open">'+ico("clock",12)+dayName(x.data)+' '+dmyShort(x.data)+'</span>'}</div>
    <div class="pc-per">${x.label}${x.ipotesi?' <span class="pill est">ipotesi</span>':""}</div>
    <div class="pc-amt num">${eur(x.comp+x.ind+x.bollo)}</div>
    <div class="muted" style="font-size:12.5px">${eur(x.comp)} compenso${x.ind?` + ${x.gg} gg trasferta (${eur(x.ind)})`:""} + bollo</div>
    <button class="btn primary" data-proj="${esc(x.contratto)}|${x.months[0]}" type="button" style="margin-top:10px;width:100%">${ico("pen",14)} Crea fattura</button></div>`;
  let lastM="";const rows=later.map(x=>{const m=x.data.slice(0,7);const head=m!==lastM?`<tr class="mhead"><td colspan="6">${MESI_L[+m.slice(5)-1].toLowerCase()} ${m.slice(0,4)}</td></tr>`:"";lastM=m;
    return head+`<tr><td class="num">${dayName(x.data).slice(0,3)} ${dmyShort(x.data)}</td><td class="cli">${esc(c2n(x.cliente))}</td><td>${x.label}${x.ipotesi?' <span class="pill est">ipotesi</span>':""}</td><td class="r num">${x.ind?`<span class="muted">${x.gg} gg · </span>`+eur(x.ind):"—"}</td><td class="r num"><b>${eur(x.comp+x.ind+x.bollo)}</b></td><td class="r"><button class="btn small ghost" data-proj="${esc(x.contratto)}|${x.months[0]}" type="button">Crea</button></td></tr>`}).join("");
  return `${intro("Le fatture che dovrai emettere, calcolate dai <b>contratti</b> (importi e date) e dalle <b>missioni</b> (indennità). Quando crei una fattura, sparisce da qui e passa nel registro.")}
  <section class="panel"><div class="panel-h"><h2>${ico("pen",18)} Da emettere ora</h2></div><div class="panel-b">${now.length?`<div class="pgrid">${now.map(card).join("")}</div>`:`<div class="empty" style="padding:12px">Nessuna fattura da emettere nei prossimi 10 giorni.${PR[0]?` La prossima: <b>${esc(c2n(PR[0].cliente))}</b> il ${dmy(PR[0].data)}.`:""}</div>`}</div></section>
  <section class="panel"><div class="panel-h"><h2>${ico("cal",18)} In arrivo</h2><div class="spacer"></div>${Object.entries(byYear).map(([y,v])=>`<span class="pill est">${y}: ${eur0(v)}</span>`).join(" ")}</div>
   <div class="tw"><table class="tl"><thead><tr><th>Emissione</th><th>Cliente</th><th>Periodo</th><th class="r">Trasferta</th><th class="r">Totale</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="6" class="empty">Nessuna altra fattura prevista.</td></tr>`}</tbody></table></div>
   <div class="panel-b note" style="margin:0">"Ipotesi" = da un rinnovo non ancora firmato o da giorni di missione stimati. I totali per anno sono per data di incasso.</div></section>`;
}
function vContr(FX){
  const today=todayISO(), nowM=ym(today);
  const ctr=[...S.contratti].sort((a,b)=>(a.dal||"").localeCompare(b.dal||""));
  const groups=[["In corso",c=>c.attivo!==false&&!c.ipotesi&&c.al>=nowM],["Ipotesi di rinnovo",c=>c.attivo!==false&&c.ipotesi],["Conclusi o esclusi",c=>c.attivo===false||(!c.ipotesi&&c.al<nowM)]];
  const card=c=>{let months=0;for(let m=c.dal;m<=c.al;m=addMonths(m,1))months++;let el=0;for(let m=c.dal;m<=c.al&&m<=nowM;m=addMonths(m,1))el++;
    const perMese=(+c.importo||0)/(+c.ogni||1);
    return `<div class="ccard"><div class="pc-top"><span class="cli" style="font-size:17px">${esc(c2n(c.cliente))}</span>${c.ipotesi?'<span class="pill open">ipotesi</span>':c.al<nowM?'<span class="pill ok">concluso</span>':'<span class="pill ok">'+ico("check",12)+'in corso</span>'}</div>
      <div class="cc-amt num">${eur0(perMese)}<small> / mese</small></div>
      <div class="cc-grid"><span>Fattura</span><b>${eur0(c.importo)} ${c.ogni>1?"ogni "+c.ogni+" mesi":"al mese"}</b><span>Trasferta</span><b>${c.tariffa?eur0(c.tariffa)+" al giorno":"—"}</b><span>Emissione</span><b>${regolaTxt(c)}</b><span>Durata</span><b>${mLabel(c.dal)} → ${mLabel(c.al)}</b></div>
      <div class="meter" style="height:8px;margin-top:10px" title="${el} di ${months} mesi"><i style="width:${months?Math.min(100,el/months*100):0}%"></i></div>
      ${c.note?`<p class="muted" style="font-size:12.5px;margin:8px 0 0">${esc(c.note)}</p>`:""}
      <button class="btn small ghost" data-ctr="${c.id}" type="button" style="margin-top:8px;align-self:flex-start">${ico("pen",13)} Modifica</button></div>`};
  return `${intro("Le condizioni economiche di ogni incarico. Da qui l'app calcola le <b>prossime fatture</b> e le previsioni fiscali. Quando firmi un rinnovo, togli la spunta \"ipotesi\".")}
   <div style="display:flex;justify-content:flex-end"><button class="btn dark" data-ctr="new" type="button">+ Nuovo contratto</button></div>
   ${groups.map(([t,f])=>{const l=ctr.filter(f);return l.length?`<section><div class="eyebrow" style="margin:6px 0 8px">${t}</div><div class="pgrid">${l.map(card).join("")}</div></section>`:""}).join("")||`<div class="panel empty">Nessun contratto.</div>`}`;
}
function vMis(FX){
  const today=todayISO();
  const quotas=S.missioni.filter(x=>x.tipo==="quota").sort((a,b)=>a.anno-b.anno||c2n(a.cliente).localeCompare(c2n(b.cliente)));
  const dated=S.missioni.filter(x=>x.tipo!=="quota").sort((a,b)=>(a.dal||"").localeCompare(b.dal||""));
  const fatt=(cl,Y)=>S.invoices.filter(v=>v.cliente===cl&&(v.data||"").startsWith(String(Y))).reduce((a,v)=>a+(v.righe||[]).filter(r=>r.tipo==="trasferta").reduce((b,r)=>b+(+r.qta||0),0),0);
  const datedIn=(cl,Y)=>dated.filter(x=>x.cliente===cl&&x.dal.startsWith(String(Y))).reduce((a,x)=>a+daysBetween(x.dal,x.al)+1,0);
  const qcard=q=>{const f=fatt(q.cliente,q.anno),d=datedIn(q.cliente,q.anno),rest=Math.max(0,q.giorni-f-d),pf=Math.min(100,f/q.giorni*100),pd=Math.min(100-pf,d/q.giorni*100);
    return `<div class="ccard"><div class="pc-top"><span class="cli">${esc(c2n(q.cliente))}</span><span class="pill est">stima ${q.anno}</span></div>
     <div class="cc-amt num">${q.giorni}<small> giorni previsti</small></div>
     <div class="meter" style="height:10px;margin-top:6px"><i style="width:${pf}%"></i><i class="f" style="left:${pf}%;width:${pd}%"></i></div>
     <div class="meter-legend"><span>${f} fatturati</span><span>${d} con date</span><span><b>${rest}</b> da distribuire</span></div>
     <button class="btn small ghost" data-mis="${q.id}" type="button" style="margin-top:8px;align-self:flex-start">${ico("pen",13)} Modifica</button></div>`};
  const row=x=>{const n=daysBetween(x.dal,x.al)+1;return `<tr><td class="cli">${esc(c2n(x.cliente))}</td><td class="num">${dmyShort(x.dal)} → ${dmyShort(x.al)}</td><td class="r num">${n}</td><td class="c">${x.ipotesi?'<span class="pill open">ipotesi</span>':x.al<today?'<span class="pill ok">svolta</span>':x.dal<=today?'<span class="pill open">'+ico("clock",12)+'in corso</span>':'<span class="pill ok">confermata</span>'}</td><td class="muted">${esc(x.note||"")}</td><td class="r"><button class="btn small ghost" data-mis="${x.id}" type="button">Modifica</button></td></tr>`};
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
  return `<section class="panel"><div class="panel-h"><h2>${ico("clock",18)} Scadenze e promemoria</h2><div class="spacer"></div><button class="btn small dark" data-pm="new" type="button">+ Promemoria</button></div>
   <div class="tw"><table class="stack"><thead><tr><th>Entro il</th><th>Mancano</th><th>Cosa</th><th class="c">Stato</th><th></th></tr></thead><tbody>
   ${[...reminders().filter(r=>!r.fatto||r.data>=addDays(today,-30)),...f24.map(x=>({...x,_f24:1,fatto:!!x.versato}))].sort((a,b)=>a.data<b.data?-1:a.data>b.data?1:0).map(r=>{if(r._f24)return `<tr class="u-${cdInfo(r.data,r.versato).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.versato)}</td><td><b style="font-family:var(--f-ui)">${r.bollo?"Bollo fatture elettroniche":"F24"} · ${eur(r.importo)}</b>${r.stima?` <span class="pill est">stima</span>`:""}<div class="muted" style="font-size:12.5px;max-width:75ch">${esc(r.descrizione)}${r.tributi?" · codici "+esc(r.tributi):""}</div></td><td class="c"><span class="pill ${r.data<today?"late":"open"}">${r.data<today?"scaduto":"da versare"}</span></td><td class="r"><button class="btn small ghost" data-go-v="tasse" type="button">F24 e tasse</button></td></tr>`;
     const dd=daysBetween(today,r.data);return `<tr class="u-${cdInfo(r.data,r.fatto).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.fatto)}</td><td><b style="font-family:var(--f-ui)">${esc(r.titolo)}</b>${r.cliente?` <span class="cli" style="font-size:12.5px">· ${esc(c2n(r.cliente))}</span>`:""}${r.dettaglio?`<div class="muted" style="font-size:12.5px;max-width:75ch">${esc(r.dettaglio)}</div>`:""}</td>
     <td class="c">${r.fatto?'<span class="pill ok">'+ico("check",12)+'fatto</span>':dd<0?'<span class="pill late">scaduto</span>':remDue(r)?'<span class="pill late">in arrivo</span>':'<span class="pill est">programmato</span>'}${r.auto?' <span class="pill est">automatico</span>':""}</td>
     <td class="r" style="white-space:nowrap">${r.auto?`<button class="btn small ghost" data-go-v="contr" type="button">Contratti</button>`:`<button class="btn small ${r.fatto?"ghost":""}" data-pm-done="${r.id}" type="button">${r.fatto?"Riapri":"Fatto"}</button> <button class="btn small ghost" data-pm="${r.id}" type="button">Modifica</button>`}</td></tr>`}).join("")||`<tr><td colspan="5" class="empty">Nessun promemoria.</td></tr>`}
   </tbody></table></div></section>`;
}
function compliancePanel(){const L=compliance();
  return `<section class="panel"><div class="panel-h"><h2>${ico("check",18)} Controlli di conformità</h2><div class="spacer"></div><span class="eyebrow">${L.length?L.length+" da verificare":"tutto in regola"}</span></div>
   ${L.length?`<ul class="tlist">${L.map(x=>`<li class="${x.lvl==="warn"?"warn":"do"}"><span class="dot ${x.lvl==="warn"?"warn":"do"}">${ico(x.lvl==="warn"?"alert":"clock",13)}</span><div class="tm"><div class="tt">${esc(x.t)}</div><div class="ts" style="white-space:normal">${esc(x.d)}</div></div><div class="tr"></div><div class="ta">${x.noAck?"":`<button class="btn small" data-ack="${esc(x.k)}" type="button">Verificato</button>`}</div></li>`).join("")}</ul>`
   :`<div class="panel-b muted">Numerazione, invii allo SdI, bollo, fatture estere e soglie: nessun problema rilevato.</div>`}</section>`}
const TIPI_R={amministratore:"Compenso da amministratore (gérant)",dipendente:"Lavoro dipendente o assimilato",estero:"Altro reddito estero",altro:"Altro"};
function redditiPanel(){const L=[...(S.redditi||[])].sort((a,b)=>(b.data||"").localeCompare(a.data||""));
  return `<section class="panel"><div class="panel-h"><h2>${ico("file",18)} Redditi fuori dalla partita IVA</h2><div class="spacer"></div><button class="btn small dark" data-red="new" type="button">+ Aggiungi</button></div>
   <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Per esempio il compenso da gérant della SARLU. Non entrano nel forfettario né nella soglia degli 85.000 €, ma vanno dichiarati a parte. I redditi da lavoro dipendente o assimilato (amministratore compreso) sopra 30.000 € in un anno escludono dal forfettario l'anno dopo.</p></details>
   <div class="tw"><table class="stack"><thead><tr><th>Data</th><th>Fonte</th><th>Tipo</th><th class="r">Lordo</th><th class="r">Imposte estere</th><th></th></tr></thead><tbody>
   ${L.map(r=>`<tr><td class="num">${dmy(r.data)}</td><td><b>${esc(r.fonte||"")}</b>${r.paese?` <span class="muted">· ${esc(r.paese)}</span>`:""}</td><td>${esc(TIPI_R[r.tipo]||r.tipo||"")}</td><td class="r num">${eur(+r.importo||0)}</td><td class="r num">${r.imposteEstere?eur(+r.imposteEstere):"—"}</td><td class="r"><button class="btn small ghost" data-red="${r.id}" type="button">Modifica</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">Nessun reddito registrato.</td></tr>`}
   </tbody></table></div></section>`}
function logLabel(e){const [c,id]=(e.path||"").split("/");const p=e.prima||{};const cur=(S[{invoices:"invoices",clients:"clients",f24:"f24",contratti:"contratti",missioni:"missioni",promemoria:"promemoria",redditi:"redditi"}[c]]||[]).find(x=>x.id===id)||{};
  const n={invoices:"Fattura "+(p.num||cur.num||id),clients:"Cliente "+(p.nome||cur.nome||id),f24:"F24 "+(p.descrizione||cur.descrizione||id),contratti:"Contratto "+id,missioni:"Missione "+id,promemoria:"Promemoria: "+(p.titolo||cur.titolo||id),redditi:"Reddito "+(p.fonte||cur.fonte||id),config:"Impostazioni"}[c];return n||e.path}
function historyPanel(){const L=[...(S.storico||[])].sort((a,b)=>(b.ts||"").localeCompare(a.ts||"")).slice(0,40);
  return `<section class="panel c12"><div class="panel-h"><h2>${ico("clock",18)} Cronologia modifiche</h2><div class="spacer"></div><span class="eyebrow">ultime ${L.length}</span></div>
   <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Ogni modifica salva com'era il dato prima. "Ripristina" lo riporta a quello stato; anche il ripristino finisce in cronologia, quindi si può annullare.</p></details>
   <div class="tw"><table class="stack"><thead><tr><th>Quando</th><th>Azione</th><th>Elemento</th><th></th></tr></thead><tbody>
   ${L.map(e=>`<tr><td class="num">${dmy((e.ts||"").slice(0,10))} ${(e.ts||"").slice(11,16)}</td><td>${esc(e.azione||"")}</td><td>${esc(logLabel(e))}</td><td class="r">${(e.path||"").startsWith("config")?"":`<button class="btn small ghost" data-restore="${e.id}" type="button">Ripristina</button>`}</td></tr>`).join("")||`<tr><td colspan="4" class="empty">Nessuna modifica registrata finora.</td></tr>`}
   </tbody></table></div></section>`}
const approx=v=>"≈ "+eur0(Math.round((v||0)/500)*500);
const STRAORD=new Set(["Casa e lavori"]);
const SPAL=["var(--slate)","var(--green-soft)","var(--amber-soft)","#8497B0","var(--sky)","#9FD3B2","#F2D58F","#ADB9CA"];
function spesePanel(inTot,outTot,opt={}){const st=speseStats();
  if(!st)return `<section class="panel c12"><div class="panel-h"><h2>Spese personali</h2></div><div class="panel-b muted">Carica gli estratti conto: le spese mensili per categoria compariranno qui.</div></section>`;
  const cats=Object.entries(st.tot).sort((a,b)=>b[1]-a[1]).map(([k])=>k);const top=cats.slice(0,7),rest=cats.slice(7);
  const ms=st.L.map(m=>m.mese);const lab=ms.map(m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4));
  const ser=top.map((k,i)=>({name:k,color:SPAL[i%SPAL.length],vals:st.L.map(m=>+((m.cat||{})[k])||0)}));
  if(rest.length)ser.push({name:"Altre",color:"#C9D1DC",vals:st.L.map(m=>rest.reduce((a,k)=>a+(+((m.cat||{})[k])||0),0))});
  const chart=svgBars(lab,ser,{stacked:true,label:"Spese personali per mese"});
  const netto=inTot-outTot-st.avgRec*12;
  const rows=cats.map(k=>`<tr><td>${esc(k)}${STRAORD.has(k)?' <span class="pill est">straordinaria</span>':""}</td><td class="r num">${eur0(st.tot[k]/st.n)}</td><td class="r num muted">${eur0(st.tot[k])}</td></tr>`).join("");
  return `<div class="c7" style="display:flex;flex-direction:column;gap:18px;min-width:0"><section class="panel"><div class="panel-h"><h2>Spese per mese</h2><div class="spacer"></div>${lg(ser.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${chart}<div class="chart-note">${lab[0]} – ${lab[lab.length-1]} · fonti: ${esc([...new Set(st.L.map(m=>m.fonti).filter(Boolean))].join(", "))}. Esclusi giroconti tra i tuoi conti, F24 e investimenti. Contanti: l'uso effettivo non è tracciato.</div></div></section>
   ${opt.extra||""}</div>
   <section class="panel c5"><div class="panel-h"><h2>Per categoria</h2></div><div class="panel-b">${opt.noMini?"":`<div class="mini">
     <div><span>Spesa ricorrente / mese</span><b class="num">${eur0(st.avgRec)}</b></div>
     <div><span>Lavori casa (${st.n} mesi)</span><b class="num">${eur0(st.straTot)}</b></div>
     <div><span>Investito / mese</span><b class="num pos">${eur0(st.avgInv)}</b></div>
     <div><span>Cassa libera netta 12 mesi</span><b class="num ${netto>=0?"pos":"bad"}">${eur0(netto)}</b></div>
   </div>`}<div class="tw" style="${opt.noMini?"":"margin-top:12px"}"><table><thead><tr><th>Categoria</th><th class="r">/ mese</th><th class="r">Totale</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`}
function vSpese(FX){const st=speseStats();const {inTot,outTot}=cash12(FX);
  const head=intro("Le tue spese personali, ricavate dagli estratti conto: solo totali mensili per categoria, nessun movimento singolo né IBAN. Sono esclusi i giroconti tra i tuoi conti, gli F24 (stanno in F24 e tasse) e gli investimenti. I lavori di casa sono tenuti a parte perché straordinari. Per aggiornarle carica in chat i nuovi estratti conto.")+`<div class="fonti"><span>Fonti:</span><span>${logoImg("unicredit","UniCredit").replace('class="lgo"','class="lgo s"')}UniCredit · conto corrente</span><span>${logoImg("revolut","Revolut").replace('class="lgo"','class="lgo s"')}Revolut · conto corrente</span></div>`;
  if(!st)return head+`<section class="panel empty">Nessuna spesa registrata.</section>`;
  const net=inTot-outTot-st.avgRec*12;const last=st.L[st.L.length-1];
  const ml=st.L.map(m=>MESI[+m.mese.slice(5)-1]+" "+m.mese.slice(2,4));const sp=st.avgRec*12;
  const KS={rec:VZ.cols(st.rec,[],"Spesa ricorrente per mese\n"+st.rec.map((v,i)=>ml[i]+": "+eur0(v)).join("\n")+"\nMedia: "+eur0(st.avgRec),i=>st.rec[i]>st.avgRec?"var(--slate)":"#8497B0"),
    stra:VZ.cols(st.stra,[],"Lavori casa per mese\n"+st.stra.map((v,i)=>ml[i]+": "+eur0(v)).join("\n"),()=>"var(--amber-soft)"),
    inv:VZ.cols(st.L.map(m=>+m.investito||0),[],"Investito per mese\n"+st.L.map((m,i)=>ml[i]+": "+eur0(+m.investito||0)).join("\n"),()=>"var(--green-soft)"),
    net:VZ.stack([{v:Math.max(0,net),c:"var(--green-soft)"},{v:sp,c:"var(--amber-soft)"},{v:outTot,c:"#8497B0"}],Math.max(1,inTot),[],`Entrate previste: ${eur0(inTot)}\nLibero: ${eur0(net)}\nSpese ricorrenti: ${eur0(sp)}\nF24: ${eur0(outTot)}`)+`<div class="vzl"><span>libero</span><span>spese</span><span>F24</span></div>`};
  const monthRows=st.L.map((m,i)=>`<tr><td class="num">${MESI[+m.mese.slice(5)-1]} ${m.mese.slice(0,4)}</td><td class="r num">${eur0(st.rec[i])}</td><td class="r num muted">${st.stra[i]?eur0(st.stra[i]):"—"}</td><td class="r num">${eur0(+m.investito||0)}</td></tr>`).join("");
  return head+`<div class="kpis">
    <div class="kpi"><div class="l">Spesa ricorrente al mese</div><div class="v">${eur0(st.avgRec)}</div>${KS.rec}<div class="s">media di ${st.n} mesi</div></div>
    <div class="kpi"><div class="l">Lavori casa</div><div class="v">${eur0(st.straTot)}</div>${KS.stra}<div class="s">straordinari, ${st.n} mesi</div></div>
    <div class="kpi green"><div class="l">Investito al mese</div><div class="v">${eur0(st.avgInv)}</div>${KS.inv}<div class="s">Trading 212 e salvadanaio</div></div>
    <div class="kpi ${net<0?"alert":""}"><div class="l">Cassa libera netta 12 mesi</div><div class="v">${eur0(net)}</div>${KS.net}<div class="s">entrate − F24 − spese ricorrenti</div></div>
   </div>
   <div class="grid">${spesePanel(inTot,outTot,{noMini:1,extra:`<section class="panel"><div class="panel-h"><h2>Mese per mese</h2><div class="spacer"></div><span class="eyebrow">ultimo mese caricato: ${MESI[+last.mese.slice(5)-1]} ${last.mese.slice(0,4)}</span></div><div class="tw"><table><thead><tr><th>Mese</th><th class="r">Spesa ricorrente</th><th class="r">Lavori casa</th><th class="r">Investito</th></tr></thead><tbody>${monthRows}</tbody></table></div></section>`})}
   </div>`}
const IPAL=["var(--cost)","var(--sky)","var(--amber-soft)","var(--green-soft)","#ADB9CA","#8497B0","#C9D6EA"];
const INV_REV_SUM="📈 Rivedi le % del PAC Trading 212",INV_REV_DESC="Controlla la suddivisione degli ETF (attuale contro obiettivo) e l'orizzonte residuo del PAC. Nell'app: Cairn → Investimenti → Rivedi suddivisione.";
const addMonthsD=(s,n)=>{const [y,m,d]=s.split("-").map(Number);const x=new Date(y,m-1+n,1);const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();return x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(Math.min(d,last))};
function invProj(c,r){const i=Math.pow(1+r,1/12)-1;const fv=k=>c.tot*Math.pow(1+i,k)+c.pac*(i?(Math.pow(1+i,k)-1)/i:k);return fv}
function invTodos(T){const a=(S.investimenti||[]).find(x=>x.id==="trading212");const c=invCalc(a);if(!c)return;const today=todayISO();
  const go=`<button class="btn small" data-go-v="invest" type="button">Investimenti</button>`;
  if(Math.abs(c.maxD.drift)>c.soglia)T({lvl:"warn",ic:"%",title:`PAC: ${esc(c.maxD.ticker)} fuori obiettivo di ${Math.abs(c.maxD.drift).toLocaleString("it-IT",{maximumFractionDigits:1})} punti`,sub:`Peso ${pct(c.maxD.peso)} contro obiettivo ${c.maxD.target}%. Ribilancia con i prossimi versamenti o rivedi le percentuali.`,act:go});
  const dd=daysBetween(today,c.rev);if(dd<=21)T({lvl:dd<0?"warn":"do",ic:"%",title:"Rivedi la suddivisione del PAC",sub:`Revisione ogni ${c.p.revisioneMesi||6} mesi · ultima il ${dmy(c.p.ultimaRevisione)} · mancano ${c.anniRes.toLocaleString("it-IT",{maximumFractionDigits:1})} anni alla fine del PAC.`,date:c.rev,act:go});
  if(a.aggiornato&&daysBetween(a.aggiornato,today)>45)T({lvl:"do",ic:"↧",title:"Aggiorna Trading 212",sub:`Valori fermi al ${dmy(a.aggiornato)}. Carica in chat l'export CSV o aggiorna i prezzi dall'app.`,act:go})}
function donut(T,tot){const R=74,W=26,C=2*Math.PI*R;let acc=0;
  const seg=T.map((t,i)=>{const f=t.valore/tot;const s=`<circle cx="100" cy="100" r="${R}" fill="none" stroke="${IPAL[i%IPAL.length]}" stroke-width="${W}" stroke-dasharray="${Math.max(0,f*C-1.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" transform="rotate(-90 100 100)" data-tip="${esc(`${t.ticker} · ${t.nome}\nValore: ${eur(t.valore)}\nPeso: ${pct(t.peso)} (obiettivo ${t.target}%)`)}"></circle>`;acc+=f;return s}).join("");
  return `<svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Allocazione ETF">${seg}<text x="100" y="94" text-anchor="middle" font-size="11" fill="var(--muted)">Valore</text><text x="100" y="114" text-anchor="middle" font-size="19" font-weight="700" fill="var(--navy)">${eur0(tot)}</text></svg>`}
function vInvest(FX){const a=(S.investimenti||[]).find(x=>x.id==="trading212");
  const head=intro("I tuoi investimenti e risparmi. Per ora c'è Trading 212 (PAC in ETF); seguiranno il salvadanaio remunerato Satispay e i risparmi Revolut. I valori vengono dall'export CSV di Trading 212: per aggiornarli carica in chat il nuovo file, oppure inserisci a mano i prezzi con Aggiorna prezzi. La proiezione è illustrativa: i rendimenti non sono garantiti.");
  const c=invCalc(a);if(!c)return head+`<section class="panel empty">Nessun investimento registrato.</section>`;
  const today=todayISO(),cy=new Date().getFullYear();
  const mm=Object.entries(a.mensile||{}).sort();const ml=mm.map(([m])=>MESI[+m.slice(5)-1]+" "+m.slice(2,4));
  const K={val:VZ.stack([{v:Math.min(c.costo,c.tot),c:"var(--slate)"},{v:Math.max(0,c.pl),c:"var(--green-soft)"}],Math.max(c.tot,c.costo),[],`Costo di carico: ${eur(c.costo)}\nPlusvalenza latente: ${eur(c.pl)}\nValore: ${eur(c.tot)}`)+`<div class="vzl"><span>costo ${eur0(c.costo)}</span><span>+ ${eur0(c.pl)}</span></div>`,
    dep:VZ.cols(mm.map(([,v])=>v),[],"Versamenti netti per mese\n"+mm.map(([,v],i)=>ml[i]+": "+eur0(v)).join("\n"),i=>mm[i][1]<0?"var(--tax)":mm[i][1]>=c.pac?"var(--slate)":"#8497B0"),
    pl:VZ.cols(c.T.map(t=>t.pl),[],"Plus/minus per ETF\n"+c.T.map(t=>t.ticker+": "+(t.pl>=0?"+":"−")+eur(Math.abs(t.pl))).join("\n"),i=>c.T[i].pl>=0?"var(--green-soft)":"var(--tax)"),
    pac:VZ.stack([{v:c.trasc,c:"var(--slate)"},{v:c.n,c:"var(--line-2)"}],c.mesiTot,[],`Mesi passati: ${c.trasc}\nMesi rimanenti: ${c.n}\nFine PAC: ${dmy(c.fine)}`)+`<div class="vzl"><span>${c.trasc} mesi</span><span>${c.n} da fare</span></div>`};
  const real=(a.realizzate||[]).reduce((s,x)=>s+(+x.importo||0),0);
  const dPill=t=>{const d=t.drift,ad=Math.abs(d);if(ad<.05)return `<span class="cdp far">0 pt</span>`;return `<span class="cdp ${ad>c.soglia?"late":ad>c.soglia/2?"soon":"far"}">${d>=0?"+":"−"}${ad.toLocaleString("it-IT",{maximumFractionDigits:1})} pt</span>`};
  const legend=c.T.map((t,i)=>`<div class="alrow"><i style="background:${IPAL[i%IPAL.length]}"></i><div class="an"><b>${esc(t.ticker)}</b> <span class="muted">${esc(t.classe||"")}</span></div><div class="ap num">${pct(t.peso)}</div><div class="at num muted">obiettivo ${t.target}%</div></div>`).join("");
  const rows=c.T.map((t,i)=>`<tr><td><span class="sw" style="background:${IPAL[i%IPAL.length]}"></span><b>${esc(t.ticker)}</b><div class="muted" style="font-size:12px">${esc(t.nome)} · ${esc(t.isin)}${t.valuta&&t.valuta!=="EUR"?" · quotato in "+esc(t.valuta):""}</div></td><td class="r num">${(+t.quote).toLocaleString("it-IT",{maximumFractionDigits:3})}</td><td class="r num">${eur(t.costo)}</td><td class="r num"><b>${eur(t.valore)}</b></td><td class="r num ${t.pl>=0?"pos":"bad"}">${t.pl>=0?"+":"−"}${eur(Math.abs(t.pl))}<div style="font-size:11.5px">${t.pl>=0?"+":"−"}${pct(Math.abs(t.pl/(+t.costo||1)))}</div></td><td class="r num">${pct(t.peso)}</td><td class="r num">${t.target}%</td><td class="r">${dPill(t)}</td></tr>`).join("");
  // proiezione
  const rates=[[.03,"Prudente 3%","#8497B0"],[.05,"Medio 5%","var(--cost)"],[.07,"Dinamico 7%","var(--green-soft)"]];
  const endY=+c.fine.slice(0,4);const ys=[];for(let y=cy;y<=endY;y++)ys.push(y);
  const kAt=y=>{if(y===cy)return 0;const t=y===endY?c.fine:y+"-12-31";let k=0,d=today.slice(0,8)+pad(+c.p.giorno||1);if(d<=today)d=addMonthsD(d,1);while(d<=t&&d<=c.fine){k++;d=addMonthsD(d,1)}return k};
  const ks=ys.map(kAt);const series=[{name:"Versato",vals:ks.map(k=>c.netDep+c.pac*k),color:"var(--gold-d)",dash:"5 4",w:2}].concat(rates.map(([r,n,col])=>{const f=invProj(c,r);return {name:n,vals:ks.map(k=>f(k)),color:col,area:r===.05}}));
  const vers=c.netDep+c.pac*c.n;
  const pRows=rates.map(([r,n])=>{const v=invProj(c,r)(c.n);const g=v-vers;return `<div><span>${n}</span><b class="num">${eur0(v)}</b><small>+${eur0(g)} di guadagno · ${eur0(v-g*0.26)} netto 26%</small></div>`}).join("");
  const glide=c.anniRes<=7?`Mancano meno di 7 anni: valuta di spostare gradualmente quota azionaria verso obbligazioni (es. +5 punti l'anno) per ridurre il rischio vicino alla scadenza.`:`Orizzonte lungo (oltre ${Math.floor(c.anniRes)} anni): l'azionario al ${c.T.filter(t=>!/obblig/i.test(t.classe||"")).reduce((s,t)=>s+(+t.target||0),0)}% è coerente. Dal ${endY-7} conviene aumentare gradualmente le obbligazioni.`;
  const ivafe=c.tot*0.002;const govG=(a.realizzate||[]).filter(x=>/obblig/i.test((c.T.find(t=>t.isin===x.isin)||{}).classe||"")).reduce((s,x)=>s+(+x.importo||0),0);const taxR=(real-govG)*0.26+govG*0.125;
  const revDays=daysBetween(today,c.rev);
  return head+`<div class="acct">${logoImg("t212","Trading 212")}<div><b>Trading 212</b><span>Conto Invest · PAC in ETF · dati al ${dmy(a.aggiornato)}</span></div><div class="spacer"></div><button class="btn small ghost" id="invPrices" type="button">${ico("pen",14)} Aggiorna prezzi</button><button class="btn small dark" id="invRev" type="button">${ico("pct",14)} Rivedi suddivisione</button></div>
  <div class="kpis">
    <div class="kpi"><div class="l">Valore portafoglio</div><div class="v">${eur0(c.tot)}</div>${K.val}<div class="s">prezzi al ${dmy(a.aggiornato)}</div></div>
    <div class="kpi"><div class="l">Versato netto</div><div class="v">${eur0(c.netDep)}</div>${K.dep}<div class="s">da ${MESI[+a.pac.inizio.slice(5,7)-1].toLowerCase()} ${a.pac.inizio.slice(0,4)} · ${mm.length} mesi</div></div>
    <div class="kpi ${c.pl>=0?"green":"red"}"><div class="l">Plus/minus latente</div><div class="v">${c.pl>=0?"+":"−"}${eur0(Math.abs(c.pl))}</div>${K.pl}<div class="s">${c.pl>=0?"+":"−"}${pct(Math.abs(c.pl/(c.costo||1)))} sul costo · ${eur0(real)} realizzati</div></div>
    <div class="kpi amber"><div class="l">PAC mensile</div><div class="v">${eur0(c.pac)}</div>${K.pac}<div class="s">il ${c.p.giorno||1}° di ogni mese · fino a ${MESI[+c.fine.slice(5,7)-1].toLowerCase()} ${c.fine.slice(0,4)}</div></div>
  </div>
  <div class="grid">
    <section class="panel c5"><div class="panel-h"><h2>Allocazione ETF</h2><div class="spacer"></div><span class="eyebrow">peso attuale</span></div><div class="panel-b"><div class="alloc">${donut(c.T,c.tot)}<div class="alist">${legend}</div></div></div></section>
    <section class="panel c7"><div class="panel-h"><h2>Revisione della suddivisione</h2><div class="spacer"></div>${cdPill(c.rev)}</div>
      <div class="sstrip"><div><span>Prossima revisione</span><b class="num">${dmy(c.rev)}</b><small>ogni ${c.p.revisioneMesi||6} mesi · ultima ${dmy(c.p.ultimaRevisione)}</small></div><div><span>Scostamento massimo</span><b class="num ${Math.abs(c.maxD.drift)>c.soglia?"neg":""}">${Math.abs(c.maxD.drift).toLocaleString("it-IT",{maximumFractionDigits:1})} pt</b><small>${esc(c.maxD.ticker)} · allerta oltre ${c.soglia} pt</small></div><div><span>Anni rimanenti</span><b class="num">${c.anniRes.toLocaleString("it-IT",{maximumFractionDigits:1})}</b><small>${c.n} versamenti da ${eur0(c.pac)}</small></div><div><span>Ancora da versare</span><b class="num">${eur0(c.pac*c.n)}</b><small>fino al ${dmy(c.fine)}</small></div></div>
      <div class="panel-b" style="border-top:1px solid var(--line-2)"><ul class="chk">
        <li>${Math.abs(c.maxD.drift)>c.soglia?`<b class="bad">Fuori soglia:</b> ${esc(c.maxD.ticker)} pesa ${pct(c.maxD.peso)} contro ${c.maxD.target}%. Ribilancia con i prossimi versamenti.`:`<b class="pos">In linea:</b> tutti gli ETF sono entro ${c.soglia} punti dall'obiettivo. La pie di Trading 212 investe ogni versamento verso i pesi obiettivo.`}</li>
        <li>${glide}</li>
        <li>Ti avviso in <b>Da fare ora</b> 3 settimane prima della revisione, se un ETF supera la soglia o se i dati hanno più di 45 giorni. La revisione va anche su Google Calendar con il pulsante <b>Calendario</b> della Dashboard.</li>
      </ul></div></section>
    <section class="panel c12"><div class="panel-h"><h2>ETF in portafoglio</h2><div class="spacer"></div><span class="eyebrow">${c.T.length} ETF ad accumulazione · domicilio Irlanda</span></div><div class="tw"><table><thead><tr><th>ETF</th><th class="r">Quote</th><th class="r">Costo</th><th class="r">Valore</th><th class="r">Plus/minus</th><th class="r">Peso</th><th class="r">Obiettivo</th><th class="r">Scostamento</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td><b>Totale</b></td><td></td><td class="r num">${eur(c.costo)}</td><td class="r num"><b>${eur(c.tot)}</b></td><td class="r num ${c.pl>=0?"pos":"bad"}">${c.pl>=0?"+":"−"}${eur(Math.abs(c.pl))}</td><td class="r num">100%</td><td class="r num">${c.T.reduce((s,t)=>s+(+t.target||0),0)}%</td><td></td></tr></tfoot></table></div></section>
    <section class="panel c12"><div class="panel-h"><h2>Proiezione PAC fino al ${c.fine.slice(0,4)}</h2><div class="spacer"></div>${lg([["Versato","var(--gold-d)",0],...rates.map(([,n,col])=>[n,col,0])])}</div>
      <div class="panel-b chart">${svgLines(ys.map(String).map((y,i)=>i%2&&ys.length>12?"":y),series,{h:250,label:"Proiezione PAC"})}</div>
      <div class="sstrip"><div><span>Versato a fine piano</span><b class="num">${eur0(vers)}</b><small>${eur0(c.netDep)} già versati + ${c.n} rate</small></div>${pRows}</div>
      <p class="muted" style="font-size:12.5px;margin:0;padding:10px 16px 14px;border-top:1px solid var(--line-2)">Rendimenti annui netti dei costi, ipotetici e costanti: i mercati non vanno in linea retta. Valori nominali, non scontati per l'inflazione. "Netto 26%" applica l'aliquota piena al guadagno (la quota in titoli di Stato paga meno).</p></section>
    <section class="panel c7"><div class="panel-h"><h2>Versamenti mese per mese</h2><div class="spacer"></div>${lg([["Versato","var(--cost)",0]])}</div><div class="panel-b chart">${svgBars(ml,[{name:"Versato",vals:mm.map(([,v])=>Math.max(0,v)),color:"var(--cost)"}],{w:860,h:300,min:400,refs:[{v:c.pac,color:"var(--gold-d)",label:"PAC "+eur0(c.pac)}],label:"Versamenti mensili"})}</div></section>
    <section class="panel c5"><div class="panel-h"><h2>Costi e fisco</h2></div><div class="panel-b"><ul class="chk">
      <li><b>Commissioni di deposito: ${eur(a.commDeposito)}</b>. Dal 2026 la ricarica con carta costa lo 0,7% (${eur(c.pac*0.007)} al mese, ${eur0(c.pac*0.007*12)} l'anno). Il bonifico SEPA è gratuito: conviene un bonifico programmato il 1° del mese.</li>
      <li><b>Cambio valuta: ${eur(a.commCambio)}</b>. Lo 0,15% su EIMI e RBOT, comprati sulla quotazione in dollari. Se esiste la stessa classe quotata in euro su Xetra o Borsa Italiana, il costo sparisce.</li>
      <li><b>Plusvalenze realizzate ${(a.realizzate||[])[0]?(a.realizzate[0].data.slice(0,4)):""}: ${eur(real)}</b> (ribilanciamento del ${dmy(((a.realizzate||[])[0]||{}).data)}). Trading 212 non è sostituto d'imposta: vanno nel 730/Redditi ${cy+1}, quadro RM, circa <b>${eur0(taxR)}</b> di imposta (26%, 12,5% sulla quota in titoli di Stato).</li>
      <li><b>IVAFE e quadro RW</b>: conto estero, 2‰ sul valore al 31/12, circa <b>${eur0(ivafe)}</b> per il ${cy}. Si versa con l'F24 di giugno insieme al saldo.</li>
    </ul></div></section>
  </div>`}
const LOGOS={"satispay": "data:image/png;base64,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", "unicredit": "data:image/png;base64,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", "t212": "data:image/png;base64,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", "revolut": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0yMCAtOCAxMjAgMTE2Ij48cmVjdCB4PSItMjAiIHk9Ii04IiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjExNiIgZmlsbD0iI2ZmZiIvPjxnIHRyYW5zZm9ybT0ibWF0cml4KDAuMDE2NCwwLDAsLTAuMDE2MzE2LC0xOS4zODUxNTUsMTA3LjEwODI5MykiPjxwYXRoIGQ9Ik0xMjAzLDY1NjJMMTE4Miw2NTU5TDExODIsNjA2OUMxMTgyLDU3MTAgMTE4NSw1NTgwIDExOTQsNTU3OUMxMjAwLDU1NzkgMTg1OCw1NTc4IDI2NTUsNTU3N0MzODI3LDU1NzUgNDExNSw1NTcyIDQxNTUsNTU2MUM0MzUxLDU1MDkgNDQ4NCw1NDMyIDQ2MDEsNTMwMUM0NzU1LDUxMzAgNDgyMiw0OTE3IDQ3OTUsNDY4MEM0NzkxLDQ2NDQgNDc4Niw0NjEyIDQ3ODMsNDYwN0M0NzgxLDQ2MDMgNDc3Niw0NTg3IDQ3NzQsNDU3MkM0NzcxLDQ1NTcgNDc1Niw0NTE1IDQ3NDEsNDQ3OEM0NjYxLDQyODkgNDUwMCw0MTMwIDQzMDgsNDA1M0M0MTY5LDM5OTYgNDE3NCwzOTk3IDM1MTUsMzk5NUMyODcxLDM5OTMgMjg2NiwzOTkzIDI4NTUsMzk0N0MyODUyLDM5MzUgMjg1MSwzNzIwIDI4NTIsMzQ3MEwyODU1LDMwMTVMMjk0MiwyODk1QzMwNDksMjc0OSAzMDIxLDI3ODcgMzI0NiwyNDc1QzMzNDksMjMzMiAzNDQ1LDIxOTkgMzQ1OSwyMTgwQzM0NzMsMjE2MSAzNDk0LDIxMzIgMzUwNiwyMTE1QzM1MzEsMjA3OCAzOTQ0LDE1MDUgMzk3MCwxNDcwQzM5ODAsMTQ1NiA0MTQ0LDEyMjkgNDMzNSw5NjVDNDUyNSw3MDEgNDY4OCw0NzQgNDY5OCw0NjFMNDcxNiw0MzZMNTM5Miw0MzZDNjA2NSw0MzUgNjA2OCw0MzUgNjA1OCw0NTVDNjA1Miw0NjYgNjA0NCw0NzcgNjA0MSw0ODBDNjAzNyw0ODMgNTk3Niw1NjYgNTkwNSw2NjVDNTc3Miw4NTEgNTU1MCwxMTYwIDU1MjQsMTE5NUM1NTE2LDEyMDYgNTQzNywxMzE2IDUzNDgsMTQ0MEM1MTQwLDE3MjkgNDg1NSwyMTI1IDQ4MjEsMjE3MEM0ODA3LDIxODkgNDc3NSwyMjM0IDQ3NTEsMjI2OUM0NzI3LDIzMDQgNDcwMiwyMzQwIDQ2OTQsMjM0OUM0Njg2LDIzNTggNDY2NSwyMzg2IDQ2NDgsMjQxMkM0NjMwLDI0MzcgNDU2NywyNTI1IDQ1MDgsMjYwN0M0MjcxLDI5MzUgNDIyOSwyOTk0IDQyMjcsMzAwM0M0MjI1LDMwMTQgNDIzMiwzMDE1IDQzMjMsMzAyNEM0NjM3LDMwNTMgNDk4NiwzMjAxIDUyNTEsMzQxOUM1NTM1LDM2NTMgNTc1OCw0MDAzIDU4NDYsNDM1NUM1ODUwLDQzNzIgNTg1NCw0MzkwIDU4NTYsNDM5NUM1ODYyLDQ0MTkgNTg4MSw0NTE5IDU4ODgsNDU2NUM1ODk3LDQ2MzAgNTg5Nyw0OTE2IDU4ODgsNTAwMEM1ODUzLDUzMTUgNTcxNCw1NjQzIDU1MDYsNTkwMEM1NDM4LDU5ODMgNTMwNyw2MTE2IDUyNTEsNjE1OEM1MjMxLDYxNzMgNTIwOSw2MTkxIDUyMDEsNjE5OEM1MTcxLDYyMjYgNTAzNCw2MzE0IDQ5NTIsNjM1N0M0NzMyLDY0NzIgNDQ5OSw2NTM5IDQyNjUsNjU1NkM0MTc3LDY1NjMgMTI0Niw2NTY4IDEyMDMsNjU2MloiIGZpbGw9IiMxMTEiLz48cGF0aCBkPSJNMTE4Miw1MDUwTDExODIsNDQwTDEyMDQsNDM5QzEyMTUsNDM5IDE0NzAsNDM4IDE3NjksNDM4QzIxMzYsNDM3IDIzMTQsNDQxIDIzMTksNDQ4QzIzMjIsNDUzIDIzMjUsMTQ5MCAyMzI0LDI3NTJMMjMyNCw1MDQ1TDE3NTMsNTA0OEwxMTgyLDUwNTBaIiBmaWxsPSIjMTExIi8+PC9nPjwvc3ZnPg=="};
const logoImg=(k,alt)=>LOGOS[k]?`<img class="lgo" src="${LOGOS[k]}" alt="${esc(alt||k)}">`:`<span class="bkb">${esc((alt||k).slice(0,2))}</span>`;
function rispFV(P,pmt,ann,m){const i=Math.pow(1+ann/100,1/12)-1;return P*Math.pow(1+i,m)+pmt*(i?(Math.pow(1+i,m)-1)/i:m)}
function rispTodos(T){(S.risparmi||[]).forEach(c=>{if(c.aggiornato&&daysBetween(c.aggiornato,todayISO())>60)T({lvl:"do",ic:"↧",title:`Aggiorna ${esc(c.nome)}`,sub:`Saldo fermo al ${dmy(c.aggiornato)}.`,act:`<button class="btn small" data-go-v="risp" type="button">Risparmi</button>`})})}
function vRisp(FX){const head=intro("La liquidità messa da parte: salvadanai e conti remunerati, separati dagli investimenti di lungo periodo. Il fondo emergenza è misurato in mesi di spese ricorrenti (dalla scheda Spese). Per aggiornare un conto usa Aggiorna, oppure carica in chat estratti o screenshot.");
  const R=rispCalc();if(!R)return head+`<section class="panel empty">Nessun conto di risparmio registrato.</section>`;
  const today=todayISO(),cfgE=cfg().emergenzaMesi||6,target=R.avg*cfgE;
  const inv=invCalc((S.investimenti||[]).find(x=>x.id==="trading212"));const pat=R.tot+(inv?inv.tot:0);
  const plan=ctPlan(FX);
  const fv=m=>R.L.reduce((s,c)=>s+rispFV(+c.saldo||0,+((c.versamento||{}).importo)||0,c.netto-(+c.bollo||0),m),0);
  const toTarget=(()=>{if(R.tot>=target)return 0;for(let m=1;m<=600;m++)if(fv(m)>=target)return m;return null})();
  const K={tot:VZ.stack(R.L.map((c,i)=>({v:+c.saldo||0,c:IPAL[i%IPAL.length]})),Math.max(1,R.tot),[],R.L.map(c=>c.nome+": "+eur(c.saldo)).join("\n"))+`<div class="vzl">${R.L.slice(0,2).map(c=>`<span>${esc(c.nome)}</span>`).join("")}</div>`,
    gain:(()=>{const n12=fv(12)-R.tot-R.mens*12;return VZ.bars2([{v:R.gain,c:"var(--green-soft)"},{v:n12,c:"#9FD3B2"}],`Interessi maturati finora: ${eur(R.gain)}\nInteressi attesi nei prossimi 12 mesi: ${eur(n12)}`)+`<div class="vzl"><span>finora ${eur0(R.gain)}</span><span>prossimi 12 mesi ${eur0(n12)}</span></div>`})(),
    rend:VZ.bars2([{v:R.lordo,c:"#8497B0"},{v:Math.max(0,R.reale),c:"var(--green-soft)"}],`Rendimento lordo: ${R.lordo.toFixed(2).replace(".",",")}%\nNetto costi: ${R.netto.toFixed(2).replace(".",",")}%\nNetto bollo e tasse: ${R.reale.toFixed(2).replace(".",",")}%`)+`<div class="vzl"><span>lordo ${R.lordo.toFixed(2).replace(".",",")}%</span><span>in tasca ${R.reale.toFixed(2).replace(".",",")}%</span></div>`,
    em:VZ.stack([{v:Math.min(R.mesi,cfgE),c:R.mesi>=3?"var(--green-soft)":"var(--amber-soft)"}],cfgE,[{v:3,c:"var(--gold-d)",dash:1}],`Coperti: ${R.mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi\nObiettivo: ${cfgE} mesi (${eur0(target)})\nSpesa ricorrente: ${eur0(R.avg)}/mese`)+`<div class="vzl"><span>0</span><span>3 mesi</span><span>${cfgE}</span></div>`};
  const f2=v=>(+v||0).toFixed(2).replace(".",",")+"%";
  const conti=R.L.map((c,i)=>`<div class="acrow">${logoImg(c.logo,c.nome)}<div class="acn"><b>${esc(c.nome)} · ${esc(c.prodotto||"")}</b><span>${f2(c.tassoLordo)} lordo${c.fondo?" · "+esc(c.fondo):""}</span><span>${(c.versamento||{}).importo?`${eur0(c.versamento.importo)} al mese${c.versamento.giorno?" il "+c.versamento.giorno:""}${c.versamento.nota?" + "+esc(c.versamento.nota):""}`:""} · dati al ${dmy(c.aggiornato)}</span></div><div class="acv"><b class="num">${eur(c.saldo)}</b><span class="pos">+${eur(c.guadagno||0)}</span><span>${f2(c.reale)} in tasca</span></div><button class="btn small ghost" data-risp="${esc(c.id)}" type="button">${ico("pen",14)} Aggiorna</button></div>`).join("")
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
    ${ctPanelR(plan)}
    <section class="panel c12"><div class="panel-h"><h2>Proiezione dei risparmi</h2><div class="spacer"></div><span class="eyebrow">versamenti attuali · rendimento netto costi e bollo · al lordo del 26%</span></div>
      <div class="sstrip">${[12,36,60].map(m=>`<div><span>Tra ${m<24?m+" mesi":m/12+" anni"}</span><b class="num">${eur0(fv(m))}</b><small>${eur0(R.tot+R.mens*m)} versati · +${eur0(fv(m)-R.tot-R.mens*m)}</small></div>`).join("")}<div><span>Obiettivo emergenza</span><b class="num">${eur0(target)}</b><small>${toTarget===0?"raggiunto":"tra "+mm(toTarget)}</small></div></div></section>
    ${notes?`<section class="panel c12"><div class="panel-h"><h2>Costi e fisco</h2></div><div class="panel-b"><ul class="chk">${notes}</ul></div></section>`:""}
  </div>`}
function ctPanelR(P){if(!P||!P.ct.linked)return "";const c=P.ct.linked,ok=P.min>=0;const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;
  const rows=P.pre.map(r=>`<div><span class="muted num">${dmy(r.data)}</span><span class="muted">${esc(r.descrizione)} · dal conto corrente</span><span class="muted num">−${eur0(r.importo)}</span><span></span></div>`).join("")+P.pts.map(p=>`<div><span class="muted num">${dmy(p.d)}</span><span>${esc(p.desc)}</span><b class="num">−${eur0(p.imp)}</b><b class="num ${p.bal<0?"bad":"pos"}">${eur0(p.bal)}</b></div>`).join("");
  return `<section class="panel c12"><div class="panel-h">${logoImg(c.logo,c.nome)}<h2 style="margin-left:10px">Accantonamento tasse</h2><span class="muted" style="margin-left:8px;font-size:12.5px">${esc(c.nome)} · ${esc(c.prodotto||"")} · ${(+c.tassoLordo||0).toFixed(2).replace(".",",")}% lordo</span><div class="spacer"></div><button class="btn small ghost" data-risp="${esc(c.id)}" type="button">${ico("pen",14)} Aggiorna</button></div>
   <div class="sstrip"><div><span>Saldo</span><b class="num">${eur(P.ct.saldo)}</b><small>al ${dmy(P.ct.data)}</small></div><div><span>Versamento</span><b class="num">${eur0(P.ct.mens)}</b><small>al mese</small></div><div><span>F24 da coprire</span><b class="num neg">${eur0(P.tot)}</b><small>${P.f.length} scadenze${P.ct.dal?" dal "+dmy(P.ct.dal):""}, comprese le stime</small></div><div><span>Per coprirli tutti</span><b class="num ${nd!=null&&nd>P.ct.mens?"neg":"pos"}">${nd==null?"—":eur0(nd)+" / mese"}</b><small>${nd!=null&&nd>P.ct.mens?"più di quanto versi ora":"il versamento attuale basta"}</small></div></div>
   <div class="grid" style="gap:0"><div class="c7 panel-b"><div class="eyebrow" style="margin-bottom:8px">Saldo del conto dopo ogni F24, con ${eur0(P.ct.mens)} al mese</div><div class="ctl">${rows}</div></div>
   <div class="c5 panel-b" style="border-left:1px solid var(--line-2)"><ul class="chk">
     <li>${ok?`<b class="pos">Coperto:</b> con questo ritmo il conto non va mai in rosso.`:`<b class="bad">Scoperto dal ${dmy(P.first.d)}:</b> il saldo scende fino a ${eur0(P.min)} il ${dmy(P.minD)}. Quegli F24 vanno pagati dal conto corrente o servono versamenti più alti.`}</li>
     ${P.pre.length?`<li>Gli F24 fino al ${dmy(addDays(P.ct.dal,-1))} (${eur0(P.pre.reduce((a,r)=>a+r.importo,0))}) arrivano prima che il conto si riempia: li paghi dal conto corrente.</li>`:""}
     <li>Giugno è il mese pesante: saldo dell'anno prima più primo acconto, di imposta e INPS insieme. Gli importi del 2027 sono stime dell'app e si aggiornano con fatture e contratti.</li>
     <li>Questo conto non entra nel fondo emergenza né nel patrimonio: sono soldi già dovuti allo Stato.</li></ul></div></div></section>`}
function personalAnal(FX){const R=rispCalc(),inv=invCalc((S.investimenti||[]).find(x=>x.id==="trading212")),st=speseStats();if(!R&&!inv&&!st)return "";
  const {inTot,outTot}=cash12(FX);const netM=(inTot-outTot)/12;const rt=R?R.tot:0,it=inv?inv.tot:0,pat=rt+it;const pac=inv?inv.pac:0,rm=R?R.mens:0,sp=st?st.avgRec:0;
  const f2=v=>pct(v,0);
  // 1. entrate vs uscite mese per mese
  let p1="";if(st){const ml=st.L.map(m=>MESI[+m.mese.slice(5)-1]+" "+m.mese.slice(2,4));
    p1=`<section class="panel c7"><div class="panel-h"><h2>Dove vanno i soldi ogni mese</h2><div class="spacer"></div>${lg([["Spese ricorrenti","var(--amber-soft)"],["Lavori casa","#F2D58F"],["Investito","var(--cost)"]])}</div><div class="panel-b chart">${svgBars(ml,[{name:"Spese ricorrenti",vals:st.rec,color:"var(--amber-soft)"},{name:"Lavori casa",vals:st.stra,color:"#F2D58F"},{name:"Investito",vals:st.L.map(m=>+m.investito||0),color:"var(--cost)"}],{stacked:1,h:250,refs:[{v:netM,color:"var(--green-soft)",label:"entrate nette medie "+eur0(netM)}],label:"Uscite mensili"})}</div></section>`}
  // 2. composizione patrimonio
  const comp=[];if(R)R.L.forEach(c=>comp.push({ticker:c.nome,nome:c.prodotto||"",valore:+c.saldo||0}));
  if(inv){const az=inv.T.filter(t=>!/obblig/i.test(t.classe||"")).reduce((a,t)=>a+t.valore,0),ob=inv.T.filter(t=>/obblig/i.test(t.classe||"")).reduce((a,t)=>a+t.valore,0);comp.push({ticker:"ETF azionari",nome:"Trading 212",valore:az},{ticker:"ETF obbligazionari",nome:"Trading 212",valore:ob})}
  comp.forEach(x=>x.peso=x.valore/Math.max(1,pat));
  const PC=["var(--sky)","#9DC3E6","var(--cost)","#8497B0","var(--green-soft)"];
  let acc=0;const Rr=74,C=2*Math.PI*Rr;const seg=comp.map((x,i)=>{const s=`<circle cx="100" cy="100" r="${Rr}" fill="none" stroke="${PC[i%PC.length]}" stroke-width="26" stroke-dasharray="${Math.max(0,x.peso*C-1.5).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc*C).toFixed(2)}" transform="rotate(-90 100 100)" data-tip="${esc(x.ticker+" · "+x.nome+"\n"+eur(x.valore)+" · "+pct(x.peso))}"></circle>`;acc+=x.peso;return s}).join("");
  const p2=`<section class="panel c5"><div class="panel-h"><h2>Composizione del patrimonio</h2></div><div class="panel-b"><div class="alloc"><svg class="donut" viewBox="0 0 200 200" role="img" aria-label="Composizione del patrimonio">${seg}<text x="100" y="94" text-anchor="middle" font-size="11" fill="var(--muted)">Patrimonio</text><text x="100" y="114" text-anchor="middle" font-size="19" font-weight="700" fill="var(--navy)">${eur0(pat)}</text></svg><div class="alist">${comp.map((x,i)=>`<div class="alrow"><i style="background:${PC[i%PC.length]}"></i><div class="an"><b>${esc(x.ticker)}</b> <span class="muted">${esc(x.nome)}</span></div><div class="ap num">${pct(x.peso)}</div><div class="at num muted">${eur0(x.valore)}</div></div>`).join("")}</div></div></div></section>`;
  // 3. indicatori
  const tr=netM>0?(pac+rm)/netM:0,se=netM>0?sp/netM:0,mp=sp?pat/sp:0,cy=new Date().getFullYear(),op=(FX[cy]||{}).oneriPct||0;
  const ind=`<section class="panel c12"><div class="panel-h"><h2>Indicatori di salute finanziaria</h2><div class="spacer"></div><span class="eyebrow">entrate nette = incassi previsti 12 mesi − F24, ${eur0(netM)} / mese</span></div>
   <div class="sstrip"><div><span>Tasso di risparmio</span><b class="num ${tr>=.2?"pos":tr<.1?"neg":""}">${f2(tr)}</b><small>PAC e risparmi su entrate nette · buono oltre 20%</small></div><div><span>Spese su entrate</span><b class="num ${se>.8?"neg":""}">${f2(se)}</b><small>${eur0(sp)} di ${eur0(netM)} al mese</small></div><div><span>Patrimonio in mesi di spese</span><b class="num">${mp.toLocaleString("it-IT",{maximumFractionDigits:1})}</b><small>di cui liquidi ${(R?R.mesi:0).toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</small></div><div><span>Peso del fisco ${cy}</span><b class="num">${f2(op)}</b><small>INPS + imposta sui ricavi</small></div></div></section>`;
  // 4. proiezione patrimonio 10 anni
  let p4="";{const Y=10,ys=[];for(let k=0;k<=Y;k++)ys.push(String(cy+k));const inS=ys.map((_,k)=>inv?invProj(inv,.05)(Math.min(k*12,inv.n))*(k*12>inv.n?Math.pow(1.05,(k*12-inv.n)/12):1):0);
    const rS=ys.map((_,k)=>R?R.L.reduce((s,c)=>s+rispFV(+c.saldo||0,+((c.versamento||{}).importo)||0,c.netto-(+c.bollo||0),k*12),0):0);
    const vS=ys.map((_,k)=>(inv?inv.netDep+inv.pac*Math.min(k*12,inv.n):0)+rt+rm*k*12);
    p4=`<section class="panel c12"><div class="panel-h"><h2>Patrimonio tra 10 anni, con i versamenti attuali</h2><div class="spacer"></div>${lg([["Totale","var(--green-soft)"],["Investimenti al 5%","var(--cost)"],["Risparmi","var(--sky)"],["Versato","var(--gold-d)"]])}</div><div class="panel-b chart">${svgLines(ys,[{name:"Totale",vals:ys.map((_,k)=>inS[k]+rS[k]),color:"var(--green-soft)",area:1},{name:"Investimenti al 5%",vals:inS,color:"var(--cost)"},{name:"Risparmi",vals:rS,color:"var(--sky)"},{name:"Versato",vals:vS,color:"var(--gold-d)",dash:"5 4",w:2}],{h:250,label:"Proiezione patrimonio"})}
     <p class="muted" style="font-size:12.5px;margin:6px 0 0">Ipotesi illustrativa: PAC ${eur0(pac)} al mese al 5% annuo, risparmi ${eur0(rm)} al mese ai tassi attuali al netto di costi e bollo. Valori nominali, al lordo delle tasse sui guadagni. Il conto tasse è escluso.</p></div></section>`}
  return `<div class="eyebrow" style="margin:22px 0 8px">Finanze personali</div><div class="grid">${p1}${p2}${ind}${p4}</div>`}
function vEntrate(FX){const head=intro("Le tue entrate per data di incasso: quello che è entrato negli ultimi 12 mesi e quello che entra dal mese in corso ai prossimi 12 (incassi già arrivati questo mese + fatture aperte + fatture previste dai contratti). La tabella in basso mette insieme entrate, F24, spese, PAC e risparmi mese per mese: è il tuo flusso di cassa personale.");
  const F=flow12(FX);const today=todayISO();
  const past=[];{const d=new Date();for(let i=12;i>=1;i--){const x=new Date(d.getFullYear(),d.getMonth()-i,1);past.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}}
  const cur=today.slice(0,7);const pv=[...past,cur].map(m=>S.invoices.filter(v=>v.incasso&&v.incasso.slice(0,7)===m).reduce((a,v)=>a+tot(v).documento,0));
  const pastTot=pv.slice(0,12).reduce((a,b)=>a+b,0);const ml=m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4);
  const fixed=F.sp+F.pac+F.rm;const netM=(F.tin-F.tf24)/12;const firmQ=F.tin?F.tfirm/F.tin:0;
  const cl=id=>(clientById(id)||{nome:id}).nome;
  const K={past:VZ.cols(pv.slice(0,12),[],"Incassato per mese\n"+past.map((m,i)=>ml(m)+": "+eur0(pv[i])).join("\n"),()=>"var(--cost)"),
    fut:VZ.cols(F.rows.map(r=>r.in),[],"Entrate previste\n"+F.rows.map(r=>ml(r.m)+": "+eur0(r.in)+(r.ipo?` (di cui ipotesi ${eur0(r.ipo)})`:"")).join("\n"),i=>F.rows[i].ipo>F.rows[i].firm?"#C9D6EA":"var(--slate)"),
    net:VZ.stack([{v:F.tf24/12,c:"var(--tax)"},{v:fixed,c:"var(--amber-soft)"},{v:Math.max(0,netM-fixed),c:"var(--green-soft)"}],Math.max(1,F.tin/12),[],`Entrate medie: ${eur0(F.tin/12)}\nF24: ${eur0(F.tf24/12)}\nSpese, PAC e risparmi: ${eur0(fixed)}\nMargine: ${eur0(netM-fixed)}`)+`<div class="vzl"><span>F24</span><span>uscite fisse</span><span>margine</span></div>`,
    firm:VZ.stack([{v:F.tfirm,c:"var(--slate)"},{v:F.tipo,c:"#C9D6EA"}],Math.max(1,F.tin),[],`Da contratti firmati e fatture aperte: ${eur0(F.tfirm)}\nDa rinnovi ipotizzati: ${eur0(F.tipo)}`)+`<div class="vzl"><span>firmato ${eur0(F.tfirm)}</span><span>ipotesi ${eur0(F.tipo)}</span></div>`};
  // 24-month chart
  const cats=[...past,...F.rows.map(r=>r.m)].map(m=>m.endsWith("-01")?"Gen "+m.slice(2,4):MESI[+m.slice(5)-1]);
  const chart=svgBars(cats,[{name:"Incassato",color:"var(--cost)",vals:[...pv.slice(0,12),...F.rows.map(r=>r.done)]},{name:"Previsto (firmato)",color:"#6F8FBF",vals:[...past.map(()=>0),...F.rows.map(r=>r.firm-r.done)]},{name:"Previsto (ipotesi)",color:"#8497B0",vals:[...past.map(()=>0),...F.rows.map(r=>r.ipo)],dashed:cats.map(()=>true)}],{stacked:1,w:1000,h:300,refs:[{v:fixed,color:"var(--gold-d)",label:"spese + PAC + risparmi "+eur0(fixed)}],label:"Entrate 24 mesi"});
  // per cliente 12 mesi
  const byC={};F.rows.forEach(r=>Object.entries(r.src).forEach(([k,v])=>byC[k]=(byC[k]||0)+v));const cr=Object.entries(byC).sort((a,b)=>b[1]-a[1]);
  const cRows=cr.map(([k,v],i)=>`<div class="alrow"><i style="background:${["var(--slate)","#8497B0","#ADB9CA","#C9D6EA"][i%4]}"></i><div class="an"><b>${esc(cl(k))}</b></div><div class="ap num">${eur0(v)}</div><div class="at num muted">${pct(v/Math.max(1,F.tin),0)} delle entrate · ${eur0(v/12)} al mese</div></div>`).join("")||`<div class="muted">Nessuna entrata prevista.</div>`;
  // tabella flusso
  const neg=v=>v<0?"bad":"pos";
  const tRows=F.rows.map(r=>`<tr><td class="num">${ml(r.m)}</td><td class="r num">${eur0(r.in)}${r.done?`<div class="muted" style="font-size:11px">incassati ${eur0(r.done)}</div>`:""}${r.ipo?`<div class="muted" style="font-size:11px">ipotesi ${eur0(r.ipo)}</div>`:""}</td><td class="r num">${r.f24?"−"+eur0(r.f24):"—"}</td><td class="r num">−${eur0(r.sp)}</td><td class="r num">−${eur0(r.pac+r.rm)}</td><td class="r num ${neg(r.saldo)}"><b>${r.saldo<0?"−":"+"}${eur0(Math.abs(r.saldo))}</b></td><td class="r num ${neg(r.cum)}">${eur0(r.cum)}</td></tr>`).join("");
  const minC=Math.min(...F.rows.map(r=>r.cum)),minR=F.rows.find(r=>r.cum===minC);
  return head+`<div class="kpis">
    <div class="kpi"><div class="l">Incassato ultimi 12 mesi</div><div class="v">${eur0(pastTot)}</div>${K.past}<div class="s">${eur0(pastTot/12)} al mese in media</div></div>
    <div class="kpi"><div class="l">Questo mese + prossimi 11</div><div class="v">${eur0(F.tin)}</div>${K.fut}<div class="s">${eur0(F.tin/12)} al mese in media</div></div>
    <div class="kpi green"><div class="l">Netto dopo F24</div><div class="v">${eur0(netM)}<small style="font-size:14px;font-weight:600"> / mese</small></div>${K.net}<div class="s">uscite fisse ${eur0(fixed)} al mese</div></div>
    <div class="kpi ${firmQ<.5?"alert":""}"><div class="l">Entrate già firmate</div><div class="v">${pct(firmQ,0)}</div>${K.firm}<div class="s">il resto dipende dai rinnovi</div></div>
  </div>
  <div class="grid">
    <section class="panel c12"><div class="panel-h"><h2>Entrate mese per mese, 24 mesi</h2><div class="spacer"></div>${lg([["Incassato","var(--cost)"],["Previsto firmato","#6F8FBF"],["Previsto ipotesi","#8497B0",1]])}</div><div class="panel-b chart">${chart}<div class="chart-note">Per data di incasso. La linea arancione è quanto esce ogni mese per spese ricorrenti, PAC e risparmi: i mesi sotto la linea si reggono sulla cassa accumulata.</div></div></section>
    <section class="panel c8"><div class="panel-h"><h2>Flusso di cassa prossimi 12 mesi</h2><div class="spacer"></div><span class="eyebrow">entrate − F24 − spese − PAC e risparmi</span></div><div class="tw"><table><thead><tr><th>Mese</th><th class="r">Entrate</th><th class="r">F24</th><th class="r">Spese</th><th class="r">PAC e risp.</th><th class="r">Saldo mese</th><th class="r">Cumulato</th></tr></thead><tbody>${tRows}</tbody><tfoot><tr><td><b>Totale</b></td><td class="r num"><b>${eur0(F.tin)}</b></td><td class="r num">−${eur0(F.tf24)}</td><td class="r num">−${eur0(F.sp*12)}</td><td class="r num">−${eur0((F.pac+F.rm)*12)}</td><td class="r num ${neg(F.tsal)}"><b>${F.tsal<0?"−":"+"}${eur0(Math.abs(F.tsal))}</b></td><td></td></tr></tfoot></table></div></section>
    <section class="panel c4"><div class="panel-h"><h2>Da chi arrivano</h2><div class="spacer"></div><span class="eyebrow">12 mesi</span></div><div class="panel-b"><div class="alist">${cRows}</div>
      <ul class="chk" style="margin-top:14px"><li>${minC<0?`<b class="bad">Cassa sotto zero</b> a ${ml(minR.m)} (${eur0(minC)}): serve la liquidità accumulata sul conto corrente.`:`<b class="pos">Cassa sempre positiva</b> nei prossimi 12 mesi: il punto più basso è ${eur0(minC)} a ${ml(minR.m)}.`}</li>
      <li>${pct(1-firmQ,0)} delle entrate future viene da rinnovi non ancora firmati: se un contratto salta, la tabella cambia di conseguenza.</li>
      <li>Le spese sono la media dei mesi caricati, senza lavori di casa.</li></ul></div></section>
  </div>`}
function personalPanel(FX){const R=rispCalc(),inv=invCalc((S.investimenti||[]).find(x=>x.id==="trading212")),st=speseStats(),P=ctPlan(FX);
  if(!R&&!inv&&!st)return "";const cy=new Date().getFullYear(),f=FX[cy]||{};
  const rt=R?R.tot:0,it=inv?inv.tot:0,pat=rt+it;
  const {inTot,outTot}=cash12(FX);const netM=(inTot-outTot)/12,sp=st?st.avgRec:0,pac=inv?inv.pac:0,rm=R?R.mens:0,marg=netM-sp-pac-rm;
  const mesi=R?R.mesi:0,emT=(cfg().emergenzaMesi||6);
  const t=[];
  t.push(`<div class="kpi go" data-go-v="invest"><div class="l">Patrimonio</div><div class="v">${eur0(pat)}</div>${VZ.stack([{v:rt,c:"var(--sky)"},{v:it,c:"var(--cost)"}],Math.max(1,pat),[],`Risparmi: ${eur0(rt)}\nInvestimenti: ${eur0(it)}${inv?`\nPlus/minus latente: ${eur0(inv.pl)}`:""}`)}<div class="vzl"><span>risparmi ${eur0(rt)}</span><span>investimenti ${eur0(it)}</span></div><div class="s">esclusi conti correnti e conto tasse</div></div>`);
  t.push(`<div class="kpi go ${marg<0?"alert":""}" data-go-v="spese"><div class="l">Margine mensile</div><div class="v">${marg<0?"−":""}${eur0(Math.abs(marg))}</div>${VZ.stack([{v:sp,c:"var(--amber-soft)"},{v:pac+rm,c:"var(--cost)"},{v:Math.max(0,marg),c:"var(--green-soft)"}],Math.max(1,netM,sp+pac+rm),[],`Entrate nette medie 12 mesi: ${eur0(netM)} / mese\nSpese ricorrenti: ${eur0(sp)}\nPAC e risparmi: ${eur0(pac+rm)}\nMargine: ${eur0(marg)}`)}<div class="vzl"><span>spese</span><span>PAC e risparmi</span><span>margine</span></div><div class="s">entrate nette ${eur0(netM)} − spese − PAC e risparmi</div></div>`);
  t.push(`<div class="kpi go ${mesi<3?"alert":""}" data-go-v="risp"><div class="l">Fondo emergenza</div><div class="v">${mesi.toLocaleString("it-IT",{maximumFractionDigits:1})} mesi</div>${VZ.stack([{v:Math.min(mesi,emT),c:mesi>=3?"var(--green-soft)":"var(--amber-soft)"}],emT,[{v:3,c:"var(--gold-d)",dash:1}],`Risparmi: ${eur0(rt)}\nCoprono ${mesi.toFixed(1).replace(".",",")} mesi di spese\nObiettivo ${emT} mesi: ${eur0(sp*emT)}`)}<div class="vzl"><span>0</span><span>3</span><span>${emT} mesi</span></div><div class="s">${eur0(rt)} su ${eur0(sp*emT)} di obiettivo</div></div>`);
  if(P){const nd=P.need===Infinity?null:Math.ceil(Math.max(0,P.need)/50)*50;const ok=!P.first;
    t.push(`<div class="kpi go ${ok?"":"alert"}" data-go-v="risp"><div class="l">Accantonamento tasse</div><div class="v">${eur0(P.ct.mens)}<small style="font-size:14px;font-weight:600"> / mese</small></div>${VZ.bars2([{v:P.ct.mens,c:"var(--cost)"},{v:nd||0,c:ok?"var(--green-soft)":"var(--tax)"}],`Versi: ${eur0(P.ct.mens)} al mese\nServono: ${nd?eur0(nd):"—"} al mese\nSaldo: ${eur0(P.ct.saldo)}\nF24 da coprire: ${eur0(P.tot)}`)}<div class="vzl"><span>versi ${eur0(P.ct.mens)}</span><span>servono ${nd?eur0(nd):"—"}</span></div><div class="s">${ok?"F24 coperti":`scoperto dal ${dmy(P.first.d)}`}</div></div>`)}
  else{const inc=pac+rm;t.push(`<div class="kpi go" data-go-v="invest"><div class="l">Messo da parte al mese</div><div class="v">${eur0(inc)}</div><div class="s">PAC ${eur0(pac)} + risparmi ${eur0(rm)}</div></div>`)}
  return `<section style="margin-top:18px"><div class="eyebrow" style="margin-bottom:8px">Finanze personali · oggi${st?` · spese fino a ${MESI[+st.L[st.L.length-1].mese.slice(5)-1].toLowerCase()} ${st.L[st.L.length-1].mese.slice(0,4)}`:""}</div><div class="kpis">${t.join("")}</div></section>`}
const VZ={
 ring:(p,col,tip)=>{const r=19,c=2*Math.PI*r,v=Math.max(0,Math.min(1,p));return `<svg class="vzr" viewBox="0 0 46 46" data-tip="${esc(tip||"")}"><circle cx="23" cy="23" r="${r}" fill="none" stroke="var(--line-2)" stroke-width="6"/><circle cx="23" cy="23" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(v*c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 23 23)"/></svg>`},
 stack:(segs,max,marks=[],tip)=>{let x=0,out="";const W=200,sc=v=>v/max*W;segs.forEach(g=>{const w=sc(g.v);if(w>0.5)out+=`<rect x="${x.toFixed(1)}" y="10" width="${Math.max(0,w-1).toFixed(1)}" height="14" rx="3" fill="${g.c}"></rect>`;x+=w});
   marks.forEach(m=>{const mx=Math.min(W,sc(m.v));out+=`<line x1="${mx}" x2="${mx}" y1="4" y2="30" stroke="${m.c}" stroke-width="1.6" stroke-dasharray="${m.dash?"2 2":"0"}"/>`});
   return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${out}</svg>`},
 cols:(vals,hi,tip,colorFn)=>{const n=vals.length;if(!n||!vals.some(v=>v))return"";const mx=Math.max(1,...vals.map(v=>Math.abs(v||0)));const bw=200/n;let out="";
   vals.forEach((v,i)=>{const h=Math.max(1.5,(Math.abs(v||0)/mx)*30);out+=`<rect x="${(i*bw+bw*.18).toFixed(1)}" y="${(32-h).toFixed(1)}" width="${(bw*.64).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${colorFn?colorFn(i):(hi.includes(i)?"var(--slate)":"var(--band)")}"></rect>`});
   return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${out}</svg>`},
 bars2:(rows,tip)=>{const mx=Math.max(1,...rows.map(r=>r.v));return `<svg class="vz" viewBox="0 0 200 34" preserveAspectRatio="none" data-tip="${esc(tip||"")}">${rows.slice(0,2).map((r,i)=>`<rect x="0" y="${3+i*16}" width="${Math.max(2,r.v/mx*200).toFixed(1)}" height="11" rx="3" fill="${r.c}"></rect>`).join("")}</svg>`}
};
function tileViz(t,ctx){const {fA,fN,FX,s,sel,nowY,cliRows,totSel,fast,tr,ggPrev,inM,outM,m12,inTot,outTot}=ctx;const l=t.l;const ys=years().filter(y=>FX[y]&&FX[y].ric>0);
  const yl=ys.map(y=>y+": "+eur0(FX[y].ric));
  if(/già firmati/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;t.ring=VZ.ring(q,"var(--gold-d)",t.s);
    t.viz=VZ.stack([{v:q,c:"var(--slate)"},{v:1-q,c:"#E3E8EF"}],1,[],t.s);t.vzl=`<div class="vzl"><span>firmato</span><span>da rinnovare</span></div>`}
  else if(/^Previsione chiusura|^Ricavi previsti|^Ricavi \d/.test(l)&&fA){const max=Math.max(s.s85,fA.ric)*1.02;
    t.viz=VZ.stack([{v:fA.inc,c:"var(--slate)"},{v:fA.att,c:"#8497B0"},{v:fA.contr+fA.stima,c:"#C9D6EA"}],max,[{v:s.allerta,c:"var(--gold-d)",dash:1},{v:s.s85,c:"var(--tax)"}],`Incassato: ${eur0(fA.inc)}\nFatture aperte: ${eur0(fA.att)}\nDa contratti: ${eur0(fA.contr+fA.stima)}\nAllerta: ${eur0(s.allerta)}\nSoglia: ${eur0(s.s85)}`);
    t.vzl=`<div class="vzl"><span>0</span><span>allerta ${eur0(s.allerta)}</span><span>${eur0(s.s85)}</span></div>`}
  else if(/^Netto \d/.test(l))t.viz=VZ.cols(ys.map(y=>FX[y].netto),[ys.indexOf(sel)],"Netto per anno\n"+ys.map(y=>y+": "+eur0(FX[y].netto)).join("\n"),i=>ys[i]===sel?"var(--green-soft)":ys[i]>nowY?"#CFE9D8":"#9FD3B2");
  else if(/^Ricavi vs/.test(l))t.viz=VZ.cols(ys.map(y=>FX[y].ric),[ys.indexOf(sel),ys.indexOf(sel-1)],"Ricavi per anno\n"+yl.join("\n"),i=>ys[i]===sel?"var(--slate)":ys[i]===sel-1?"#8497B0":"var(--band)");
  else if(/^Oneri sui ricavi/.test(l)){const tp=`Oneri ${sel}: ${pct(fA.oneriPct)}${fN&&fN.ric>0?`\nOneri ${sel+1}: ${pct(fN.oneriPct)}`:""}`;t.ring=VZ.ring(fA.oneriPct/0.3,"var(--gold-d)",tp);
    if(fN&&fN.ric>0){t.viz=VZ.bars2([{v:fA.oneriPct,c:"#8497B0"},{v:fN.oneriPct,c:"var(--amber-soft)"}],tp);t.vzl=`<div class="vzl"><span>${sel}: ${pct(fA.oneriPct,0)}</span><span>${sel+1}: ${pct(fN.oneriPct,0)}</span></div>`}}
  else if(/^F24 di giugno/.test(l)){if(sel===nowY&&outM){const hi=m12.map((m,i)=>m.endsWith("-06")?i:-1).filter(i=>i>=0);t.viz=VZ.cols(outM,hi,"F24 nei prossimi 12 mesi\n"+m12.map((m,i)=>outM[i]?MESI[+m.slice(5)-1]+" "+m.slice(2,4)+": "+eur0(outM[i]):null).filter(Boolean).join("\n"),i=>hi.includes(i)?"var(--cost)":"#ADB9CA")}
    else t.viz=VZ.cols(ys.map(y=>FX[y].giugno),[ys.indexOf(sel)],"F24 di giugno dell'anno dopo\n"+ys.map(y=>(y+1)+": "+eur0(FX[y].giugno)).join("\n"))}
  else if(/^Cassa libera/.test(l)){const st=speseStats();const sp=st?st.avgRec*12:0;const net=Math.max(0,inTot-outTot-sp);
    t.viz=VZ.stack([{v:net,c:"var(--green-soft)"},{v:sp,c:"var(--amber-soft)"},{v:outTot,c:"#8497B0"}],Math.max(1,inTot),[],`Entrate previste: ${eur0(inTot)}\nLibero: ${eur0(net)}\nSpese ricorrenti: ${eur0(sp)}\nF24: ${eur0(outTot)}`);
    t.vzl=`<div class="vzl"><span>libero</span><span>spese</span><span>F24</span></div>`}
  else if(/^Peso di/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;const cr=cliRows.filter(r=>r.ricSel>0);const tp=cr.map(r=>r.c.nome+": "+pct(r.ricSel/totSel,0)).join("\n");t.ring=VZ.ring(q,q>.6?"var(--gold-d)":"var(--slate)",tp);
    t.viz=VZ.stack(cr.map((r,i)=>({v:r.ricSel/totSel,c:["var(--slate)","#8497B0","#ADB9CA","#C9D6EA"][i%4]})),1,[],tp);t.vzl=`<div class="vzl">${cr.slice(0,2).map(r=>`<span>${esc(r.c.nome.split(" ")[0])} ${pct(r.ricSel/totSel,0)}</span>`).join("")}</div>`}
  else if(/^Giorni medi/.test(l)&&fast&&fast.length>1){const a=fast[0],b=fast[fast.length-1];t.viz=VZ.bars2([{v:a.avg,c:"var(--green-soft)"},{v:b.avg,c:"var(--amber-soft)"}],`${a.c.nome}: ${Math.round(a.avg)} gg\n${b.c.nome}: ${Math.round(b.avg)} gg`)}
  else if(/^Netto per giorno/.test(l)){t.viz=VZ.stack([{v:tr.gg||0,c:"var(--sky)"},{v:ggPrev||0,c:"#9DC3E6"}],Math.max(1,(tr.gg||0)+(ggPrev||0)),[],`Giorni fatturati: ${tr.gg||0}\nGiorni previsti: ${ggPrev||0}`);t.vzl=`<div class="vzl"><span>fatturati ${tr.gg||0}</span><span>previsti ${ggPrev||0}</span></div>`}
  else if(/^Da accantonare/.test(l)){const q=parseFloat(String(t.v).replace(",","."))/100;t.ring=VZ.ring(q/0.35,"var(--slate)",t.s)}
  else if(/^Ricavo medio mensile/.test(l)){t.viz=VZ.cols(ys.map(y=>FX[y].ric/12),[ys.indexOf(sel)],"Ricavo medio mensile\n"+ys.map(y=>y+": "+eur0(FX[y].ric/12)).join("\n"))}
  return t}
function simDefaults(){const nowY=new Date().getFullYear(),Y=nowY+1;const rows={};
  S.contratti.filter(c=>c.ipotesi).forEach(c=>{const q=S.missioni.find(x=>x.tipo==="quota"&&x.cliente===c.cliente&&+x.anno===Y);
    rows[c.id]={mese:c.attivo===false?0:Math.round((+c.importo||0)/(+c.ogni||1)),tariffa:+c.tariffa||0,gg:q?+q.giorni||0:0}});
  return {Y,rows}}
function simPanel(){
  if(!S.sim)S.sim=simDefaults();const sim=S.sim;const ids=Object.keys(sim.rows);
  if(!ids.length)return "";
  const inp=(id,k,v,lab)=>`<input class="in num" data-sim="${id}:${k}" inputmode="decimal" value="${v}" aria-label="${lab}">`;
  const rows=ids.map(id=>{const c=S.contratti.find(x=>x.id===id)||{};const r=sim.rows[id];
    return `<tr><td class="cli">${esc(c2n(c.cliente))}${c.cliente==="yousud"?`<div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap"><button class="btn small ghost" data-simp="${id}:2000:0:0" type="button">Opz. A</button><button class="btn small ghost" data-simp="${id}:0:0:0" type="button">Opz. B</button></div>`:""}</td>
      <td>${inp(id,"mese",r.mese,"Compenso al mese")}</td><td>${inp(id,"tariffa",r.tariffa,"Indennità al giorno")}</td><td>${inp(id,"gg",r.gg,"Giorni di missione all'anno")}</td></tr>`}).join("");
  return `<section class="panel c12"><div class="panel-h"><h2>${ico("calc",18)} Simulatore rinnovi ${sim.Y}</h2><div class="spacer"></div><button class="btn small ghost" id="simReset" type="button">Ripristina</button><button class="btn small dark" id="simSave" type="button">Usa come ipotesi</button></div>
   <div class="grid" style="gap:0">
    <div class="c6 panel-b" style="border-right:1px solid var(--line-2)"><p class="muted" style="margin:0 0 10px;font-size:13px">Cambia le condizioni dei rinnovi: i risultati si aggiornano subito. Vale dal rinnovo in poi (${sim.Y} e ${sim.Y+1}). Niente viene salvato finché non premi "Usa come ipotesi".</p>
     <div class="tw"><table class="simt"><thead><tr><th>Cliente</th><th>€ / mese</th><th>€ / giorno trasferta</th><th>Giorni missione / anno</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="c6 panel-b"><div class="tw" id="simOut"></div></div>
   </div></section>`}
const PAL=["var(--slate)","var(--green-soft)","var(--amber-soft)","#8497B0","#ADB9CA","var(--tax)","var(--sky)","#9DC3E6"];
function axis(top,step,L,W,R,y){let g="";for(let t=0;t<=top+.1;t+=step){g+=`<line x1="${L}" x2="${W-R}" y1="${y(t)}" y2="${y(t)}" stroke="var(--line-2)"/><text x="${L-8}" y="${y(t)+4}" text-anchor="end" font-size="11" fill="var(--muted)">${t>=1000?(t/1000).toLocaleString("it-IT")+"k":Math.round(t)}</text>`}return g}
function svgBars(cats,series,opt={}){
  const W=opt.w||720,H=opt.h||260,L=56,R=10,T=16,B=30,n=cats.length,k=series.length;
  const tot=i=>opt.stacked?series.reduce((a,s)=>a+(s.vals[i]||0),0):Math.max(...series.map(s=>s.vals[i]||0));
  const max=Math.max(opt.min||1000,...cats.map((_,i)=>tot(i)),...(opt.refs||[]).map(r=>r.v));
  const step=niceStep(max/4),top=Math.ceil(max/step)*step,sx=(W-L-R)/n,y=v=>T+(H-T-B)*(1-v/top),hh=v=>(H-T-B)*v/top;
  let out=axis(top,step,L,W,R,y);
  cats.forEach((c,i)=>{const gw=sx*.7,x0=L+sx*i+(sx-gw)/2;let acc=0;
    series.forEach((s,j)=>{const v=s.vals[i]||0;if(v<=0)return;const st=s.dashed&&s.dashed[i];
      const tip=`${esc(c)} · ${esc(s.name)}: ${eur(v)}`;
      if(opt.stacked){out+=`<rect x="${x0}" y="${y(acc+v)}" width="${gw}" height="${hh(v)}" fill="${st?"var(--band)":s.color}" ${st?`stroke="${s.color}" stroke-dasharray="3 2"`:""}></rect>`;acc+=v}
      else{const bw=gw/k;out+=`<rect x="${x0+bw*j+1}" y="${y(v)}" width="${bw-2}" height="${hh(v)}" fill="${st?"var(--band)":s.color}" ${st?`stroke="${s.color}" stroke-dasharray="3 2"`:""} rx="2"></rect>`;
        if(opt.labels)out+=`<text x="${x0+bw*j+bw/2}" y="${y(v)-4}" text-anchor="middle" font-size="10" fill="var(--muted)">${v>=1000?(v/1000).toLocaleString("it-IT",{maximumFractionDigits:1})+"k":Math.round(v)}</text>`}});
    {const tl=[c];let sum=0;series.forEach(s=>{const v=s.vals[i]||0;if(v>0){tl.push(s.name+": "+eur0(v));sum+=v}});if(opt.stacked&&tl.length>2)tl.push("Totale: "+eur0(sum));if(tl.length===1)tl.push("—");
     out+=`<rect class="hov" x="${L+sx*i}" y="${T}" width="${sx}" height="${H-T-B}" data-tip="${esc(tl.join("\n"))}"></rect>`}
    out+=`<text x="${L+sx*i+sx/2}" y="${H-9}" text-anchor="middle" font-size="11.5" fill="var(--muted)">${esc(c)}</text>`});
  (opt.refs||[]).forEach(r=>{out+=`<line x1="${L}" x2="${W-R}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.color}" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W-R}" y="${y(r.v)-5}" text-anchor="end" font-size="11" fill="${r.color}">${esc(r.label)}</text>`});
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label||"grafico")}">${out}</svg>`;
}
function svgLines(cats,series,opt={}){
  const W=720,H=opt.h||260,L=56,R=12,T=16,B=30,n=cats.length;
  const max=Math.max(1000,...series.flatMap(s=>s.vals.filter(v=>v!=null)),...(opt.refs||[]).map(r=>r.v));
  const step=niceStep(max/4),top=Math.ceil(max/step)*step,sx=(W-L-R)/(n-1||1),y=v=>T+(H-T-B)*(1-v/top),x=i=>L+sx*i;
  let out=axis(top,step,L,W,R,y);
  (opt.refs||[]).forEach(r=>{out+=`<line x1="${L}" x2="${W-R}" y1="${y(r.v)}" y2="${y(r.v)}" stroke="${r.color}" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${L+6}" y="${y(r.v)-5}" font-size="11" fill="${r.color}">${esc(r.label)}</text>`});
  series.forEach(s=>{const pts=s.vals.map((v,i)=>v==null?null:[x(i),y(v)]);let d="";pts.forEach((p,i)=>{if(!p)return;d+=(d&&pts[i-1]?"L":"M")+p[0].toFixed(1)+" "+p[1].toFixed(1)});
    if(s.area){const last=pts.map((p,i)=>p?i:-1).filter(i=>i>=0);if(last.length)out+=`<path d="${d}L${x(last[last.length-1])} ${y(0)}L${x(last[0])} ${y(0)}Z" fill="${s.color}" opacity=".12"/>`}
    out+=`<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.w||2.4}" ${s.dash?`stroke-dasharray="${s.dash}"`:""} stroke-linejoin="round"/>`;
    const li=s.vals.map((v,i)=>v!=null?i:-1).filter(i=>i>=0).pop();
    if(li!=null&&li>=0)out+=`<circle cx="${x(li)}" cy="${y(s.vals[li])}" r="4" fill="${s.color}"></circle>`;});
  cats.forEach((c,i)=>{const tl=[c];series.forEach(s=>{if(s.vals[i]!=null)tl.push(s.name+": "+eur0(s.vals[i]))});const w=sx||(W-L-R);out+=`<rect class="hov" x="${Math.max(L,x(i)-w/2)}" y="${T}" width="${w}" height="${H-T-B}" data-tip="${esc(tl.join("\n"))}"></rect>`});
  cats.forEach((c,i)=>{out+=`<text x="${x(i)}" y="${H-9}" text-anchor="middle" font-size="11.5" fill="var(--muted)">${esc(c)}</text>`});
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
  const annual=svgBars(cats,[{name:"Ricavi",color:"var(--slate)",vals:ys.map(y=>FX[y].ric),dashed:ys.map(y=>FX[y].stima>0)},{name:"Oneri",color:"var(--tax)",vals:ys.map(y=>FX[y].oneri)},{name:"Netto",color:"var(--green-soft)",vals:ys.map(y=>FX[y].netto),dashed:ys.map(y=>FX[y].stima>0)}],{labels:true,refs:[{v:s.s85,label:"soglia "+eur0(s.s85),color:"var(--tax)"}],label:"Ricavi, oneri e netto per anno"});
  const aRows=ys.map((y,i)=>{const f=FX[y],p=i?FX[ys[i-1]]:null;const g=p&&p.ric?f.ric/p.ric-1:null;
    return `<tr><td class="num"><b>${y}</b>${f.stima>0?' <span class="pill est">stima</span>':""}</td><td class="r num muted">${eur0((FMIN[y]||{}).ric||0)}</td><td class="r num">${eur0(f.ric)}</td><td class="r num">${g==null?"—":(g>=0?"+":"")+pct(g)}</td><td class="r num neg">${eur0(f.oneri)}</td><td class="r num">${pct(f.oneriPct)}</td><td class="r num pos"><b>${eur0(f.netto)}</b></td><td class="r num pos">${eur0(f.netto/12)}</td><td class="c num">${by[y].n}</td></tr>`}).join("");
  // 2. cumulative vs threshold, selected year vs previous
  const cum=y=>{const m=Array(12).fill(0);S.invoices.forEach(v=>{if(fy(v)!==y)return;m[+effDate(v).slice(5,7)-1]+=tot(v).imponibile});let a=0;return m.map(v=>a+=v)};
  const cSel=cum(sel), cPrev=cum(sel-1);
  const cumSeries=[{name:String(sel),color:"var(--slate)",vals:cSel,area:true,w:2.8}];
  if(cPrev[11]>0)cumSeries.push({name:String(sel-1),color:"#8497B0",vals:cPrev,dash:"5 4",w:2});
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
  const compChart=svgBars(cats,[{name:"Compenso",color:"var(--slate)",vals:ys.map(y=>by[y].comp)},{name:"Indennità trasferta",color:"var(--sky)",vals:ys.map(y=>by[y].ind)},{name:"Rimborsi (non tassati)",color:"var(--green-soft)",vals:ys.map(y=>by[y].rimb)}],{stacked:true,label:"Composizione del fatturato"});
  // 5. F24 calendar (next 24 months + this year)
  const fr=f24Rows(FX);const start=new Date(nowY,0,1);const months=[];for(let i=0;i<30;i++){const d=new Date(start.getFullYear(),start.getMonth()+i,1);months.push(d.getFullYear()+"-"+pad(d.getMonth()+1))}
  const usedM=months.filter(m=>fr.some(r=>r.data.slice(0,7)===m));
  const f24Chart=usedM.length?svgBars(usedM.map(m=>MESI[+m.slice(5)-1]+" "+m.slice(2,4)),[
     {name:"Versato",color:"var(--green-soft)",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&r.versato).reduce((a,r)=>a+r.importo,0))},
     {name:"Da versare",color:"var(--tax)",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&!r.versato&&!r.stima).reduce((a,r)=>a+r.importo,0))},
     {name:"Stima",color:"#8497B0",vals:usedM.map(m=>fr.filter(r=>r.data.slice(0,7)===m&&r.stima).reduce((a,r)=>a+r.importo,0)),dashed:usedM.map(()=>true)}],{stacked:true,label:"Calendario F24"}):`<div class="empty">Nessuna scadenza.</div>`;
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
    return `<div style="margin:8px 0 14px"><div style="display:flex;justify-content:space-between;font-family:var(--f-ui);font-weight:600;font-size:13px;margin-bottom:4px"><span>${lab}</span><span class="muted">${eur0(f.ric)} di ricavi</span></div><div class="hbar">${seg(x.net,"var(--green-soft)","Netto")}${seg(x.inps,"#8497B0","INPS")}${seg(x.imp,"var(--tax)","Imposta")}</div></div>`};
  const hundred=hb(String(sel),fA)+hb(String(sel+1)+(fN&&fN.contr>0?" (previsione)":""),fN)+(()=>{const F=flow12(FX);if(!F.tin)return"";const q=v=>v/F.tin;const seg=(w,c,t)=>`<i style="width:${Math.max(0,w*100)}%;background:${c}" title="${t}">${w>=.07?Math.round(w*100)+" €":""}</i>`;const mg=Math.max(0,F.tsal);
    return `<div style="margin:8px 0 14px"><div style="display:flex;justify-content:space-between;font-family:var(--f-ui);font-weight:600;font-size:13px;margin-bottom:4px"><span>Prossimi 12 mesi, entrate reali</span><span class="muted">${eur0(F.tin)} di entrate</span></div><div class="hbar">${seg(q(F.tf24),"var(--tax)","F24")}${seg(q(F.sp*12),"var(--amber-soft)","Spese")}${seg(q(F.pac*12),"var(--cost)","PAC")}${seg(q(F.rm*12),"var(--sky)","Risparmi")}${seg(q(mg),"var(--green-soft)","Margine")}</div></div>`})();
  // 9. cash next 12 months: expected receipts vs F24
  const m12=[];{const d=new Date();for(let i=0;i<12;i++){const x=new Date(d.getFullYear(),d.getMonth()+i,1);m12.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}}
  const inM=m12.map(m=>S.invoices.filter(v=>invInM(v,m)).reduce((a,v)=>a+tot(v).documento,0)+PRa.filter(x=>x.incasso.slice(0,7)===m).reduce((a,x)=>a+x.imponibile,0));
  const outM=m12.map(m=>fr.filter(r=>f24InM(r,m)).reduce((a,r)=>a+r.importo,0));
  let cumC=0;const cumM=m12.map((m,i)=>cumC+=inM[i]-outM[i]);
  const FL=flow12(FX);const cashChart=svgBars(m12.map(m=>MESI[+m.slice(5)-1]),[{name:"Entrate previste",color:"var(--slate)",vals:inM},{name:"F24",color:"var(--tax)",vals:outM},{name:"Spese, PAC e risparmi",color:"var(--amber-soft)",vals:m12.map(()=>FL.sp+FL.pac+FL.rm)}],{label:"Cassa prossimi 12 mesi"});
  const inTot=inM.reduce((a,b)=>a+b,0),outTot=outM.reduce((a,b)=>a+b,0),peakF=Math.max(...outM),peakI=outM.indexOf(peakF);
  // extra tiles: free cash after F24 and next-year revenue already secured by signed contracts
  {const extra=[];
   if(sel===nowY){const st=speseStats();const net=inTot-outTot-(st?st.avgRec*12:0);
     extra.push({v:eur0(net),l:st?"Cassa libera netta 12 mesi":"Cassa libera nei prossimi 12 mesi",s:st?`entrate ${eur0(inTot)} − F24 ${eur0(outTot)} − spese ricorrenti ${eur0(st.avgRec*12)} (media ${st.n} mesi; esclusi lavori casa)`:`entrate previste ${eur0(inTot)} meno F24 ${eur0(outTot)}; esclude le spese personali`,tone:net>=0?"pos":"bad"})}
   const fN2=FX[sel+1];
   if(sel>=nowY&&fN2&&fN2.ric>0){const firm=PRa.filter(x=>x.anno===sel+1&&!((S.contratti.find(c=>c.id===x.contratto)||{}).ipotesi)).reduce((a,x)=>a+x.comp,0)+S.invoices.filter(v=>fy(v)===sel+1).reduce((a,v)=>a+tot(v).imponibile,0);
     const q=firm/fN2.ric;extra.push({v:pct(q,0),l:`Ricavi ${sel+1} già firmati`,s:`${eur0(firm)} da contratti firmati su ${eur0(fN2.ric)} previsti: il resto dipende dai rinnovi`,tone:q<.5?"amb":"pos"})}
   let idx=ins.findIndex(t=>/^Peso|^Giorni medi|^Netto per giorno/.test(t.l));if(idx<0)idx=ins.length;ins.splice(idx,0,...extra);
   if(fA&&fA.ric>0){ins.push({v:pct(fA.oneriPct*(1+P(sel).margine),0),l:`Da accantonare ${sel}`,s:`di ogni incasso, per coprire INPS e imposta con margine del ${pct(P(sel).margine,0)}`,tone:""});ins.push({v:eur0(fA.ric/12),l:`Ricavo medio mensile ${sel}`,s:`lordo, prima di INPS e imposta`,tone:""});
     if(by[sel]&&by[sel].n)ins.push({v:String(by[sel].n),l:`Fatture ${sel}`,s:`importo medio ${eur0(by[sel].comp/by[sel].n+by[sel].ind/by[sel].n)}`,tone:""})}}
  const nT=ins.length, kT=nT>=10?10:nT>=8?8:nT>=6?6:nT>1?nT-(nT%2):nT;ins.length=kT;const colsT=kT>=4?kT/2:kT;
  {const ctx={fA,fN,FX,s,sel,nowY,cliRows,totSel,fast,tr,ggPrev,inM,outM,m12,inTot,outTot};ins.forEach(t=>tileViz(t,ctx))}
  // 10. heatmap months x years (cash basis, incl. contracts)
  const hy=years().filter(y=>S.invoices.some(v=>fy(v)===y)||PRa.some(x=>x.anno===y));
  const hv={},hp={};S.invoices.forEach(v=>{const d=effDate(v);if(!d)return;const k=d.slice(0,7);hv[k]=(hv[k]||0)+tot(v).imponibile});
  PRa.forEach(x=>{const k=x.incasso.slice(0,7);hv[k]=(hv[k]||0)+x.imponibile;hp[k]=1});
  const hmax=Math.max(1,...Object.values(hv));
  const heat=`<table class="heat"><thead><tr><th></th>${MESI.map(m=>`<th>${m}</th>`).join("")}<th>Tot.</th></tr></thead><tbody>${hy.map(y=>{let t=0;return `<tr><td class="y">${y}</td>${MESI.map((_,i)=>{const k=y+"-"+pad(i+1),v=hv[k]||0;t+=v;const a=v/hmax;return `<td style="background:${v?`color-mix(in srgb,var(--slate) ${Math.round(12+a*78)}%,var(--surface))`:"var(--surface-2)"};color:${a>.45?"#fff":"var(--fg)"};${hp[k]?"outline:1px dashed var(--slate-2);outline-offset:-2px;":""}" data-tip="${MESI[i]} ${y}\n${eur0(v)}${hp[k]?"\ninclude previsioni da contratto":""}">${v?(v/1000).toLocaleString("it-IT",{maximumFractionDigits:1})+"k":""}</td>`}).join("")}<td class="num" style="font-weight:700">${(t/1000).toLocaleString("it-IT",{maximumFractionDigits:1})}k</td></tr>`}).join("")}</tbody></table>`;
  return `
  <section class="panel"><div class="panel-h"><h2>In sintesi</h2><div class="spacer"></div><span class="eyebrow">anno selezionato ${sel}</span></div><div class="itiles" style="--cols:${colsT}">${ins.map(t=>`<div class="itile">${t.ring||""}<div class="iv ${t.tone}" ${t.ring?'style="padding-right:52px"':""}>${t.v}</div><div class="il" ${t.ring?'style="padding-right:52px"':""}>${t.l}</div>${t.viz||""}${t.vzl||""}<div class="is">${t.s}</div></div>`).join("")||`<div class="empty">Servono più dati per le osservazioni.</div>`}</div></section>
  <div class="grid">
   ${simPanel()}
   <section class="panel c7"><div class="panel-h"><h2>Andamento pluriennale</h2><div class="spacer"></div>${lg([["Ricavi","var(--slate)"],["Oneri","var(--tax)"],["Netto","var(--green-soft)"],["stima","var(--slate)",1]])}</div><div class="panel-b chart">${annual}<div class="chart-note">Anni con riquadro tratteggiato = includono ricavi stimati non ancora fatturati.</div></div></section>
   <section class="panel c5"><div class="panel-h"><h2>Confronto annuale</h2></div><div class="tw"><table><thead><tr><th>Anno</th><th class="r">Minimo</th><th class="r">Ricavi</th><th class="r">Var.</th><th class="r">Oneri</th><th class="r">%</th><th class="r">Netto</th><th class="r">/mese</th><th class="c">Fatt.</th></tr></thead><tbody>${aRows}</tbody></table></div></section>
   <section class="panel c7"><div class="panel-h"><h2>Ricavi cumulati ${sel}</h2><div class="spacer"></div>${lg(cumSeries.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${cumChart}<div class="chart-note">Include le fatture aperte alla data di incasso attesa.</div></div></section>
   <section class="panel c5"><div class="panel-h"><h2>Ritmo ${sel}</h2></div><div class="panel-b"><div class="mini">
      <div><span>Incassato a oggi</span><b>${eur0(incSel)}</b></div>
      <div><span>Fatture aperte</span><b>${eur0((FX[sel]||{}).att||0)}</b></div>
      <div><span>Da contratti (non ancora fatturato)</span><b>${eur0((FX[sel]||{}).contr||0)}</b></div>
      <div><span>Previsione a fine anno</span><b>${eur0((FX[sel]||{}).ric||0)}</b></div>
      <div><span>Margine sulla soglia</span><b>${eur0(s.s85-((FX[sel]||{}).ric||0))}</b></div>
      <div><span>Oneri stimati ${sel}</span><b class="neg">${eur0((FX[sel]||{}).oneri||0)}</b></div>
      <div><span>Netto medio / mese</span><b class="pos">${eur0(((FX[sel]||{}).netto||0)/12)}</b></div>
      <div><span>F24 nei prossimi 12 mesi</span><b class="neg">${eur0(f24next12)}</b></div>
   </div></div></section>
   <section class="panel c7"><div class="panel-h"><h2>Cassa nei prossimi 12 mesi</h2><div class="spacer"></div>${lg([["Entrate previste","var(--slate)"],["F24","var(--tax)"],["Spese, PAC e risparmi","var(--amber-soft)"]])}</div><div class="panel-b chart">${cashChart}<div class="chart-note">Entrate = fatture aperte + previste dai contratti. Spese = media mensile dagli estratti conto, senza lavori di casa. Saldo dei 12 mesi: <b class="${FL.tsal<0?"bad":"pos"}">${FL.tsal<0?"−":"+"}${eur0(Math.abs(FL.tsal))}</b>. Dettaglio mese per mese nella scheda Entrate.</div></div></section>
   <section class="panel c5"><div class="panel-h"><h2>Dove vanno 100 €</h2></div><div class="panel-b">${hundred||`<div class="empty">Nessun dato.</div>`}${lg([["Netto / margine","var(--green-soft)"],["INPS","#8497B0"],["Imposta / F24","var(--tax)"],["Spese","var(--amber-soft)"],["PAC","var(--cost)"],["Risparmi","var(--sky)"]])}
     <div class="mini" style="margin-top:14px">
      <div><span>Entrate previste 12 mesi</span><b class="num">${eur0(inTot)}</b></div>
      <div><span>F24 da versare 12 mesi</span><b class="num neg">${eur0(outTot)}</b></div>
      <div><span>Disponibile dopo F24</span><b class="num pos">${eur0(inTot-outTot)}</b></div>
      <div><span>Mese più pesante</span><b class="num">${peakF>0?MESI[+m12[peakI].slice(5)-1]+" "+m12[peakI].slice(0,4)+" · "+eur0(peakF):"—"}</b></div>
     </div></div></section>
   <section class="panel c12"><div class="panel-h"><h2>Incassi mese per mese</h2><div class="spacer"></div><span class="eyebrow">per data di incasso · bordo tratteggiato = include previsioni da contratto</span></div><div class="panel-b" style="overflow-x:auto">${heat}</div></section>
   <section class="panel c7"><div class="panel-h"><h2>Ricavi per cliente</h2><div class="spacer"></div>${lg(cSer.map(x=>[x.name,x.color]))}</div><div class="panel-b chart">${cliChart}</div></section>
   <section class="panel c5"><div class="panel-h"><h2>Composizione del fatturato</h2></div><div class="panel-b chart">${compChart}${lg([["Compenso","var(--slate)"],["Indennità","var(--sky)"],["Rimborsi","var(--green-soft)"]])}</div></section>
   <section class="panel c12"><div class="panel-h"><h2>Clienti a confronto</h2></div><div class="tw"><table><thead><tr><th>Cliente</th><th class="r">Ricavi totali</th><th class="r">Netto stimato</th><th class="r">Quota ${sel}</th><th class="c">Fatture</th><th class="r">Gg incasso medi</th><th class="r">min–max</th><th class="r">Gg trasferta</th><th class="r">Da incassare</th></tr></thead><tbody>
     ${cliRows.map(r=>`<tr><td class="cli">${esc(r.c.nome)}</td><td class="r num">${eur0(r.ric)}</td><td class="r num pos">${eur0(r.net)}</td><td class="r num ${r.ricSel/totSel>.6?"neg":""}">${pct(r.ricSel/totSel,0)}</td><td class="c num">${r.n}</td><td class="r num">${r.avg==null?"—":Math.round(r.avg)}</td><td class="r num muted">${r.min==null?"":r.min+"–"+r.max}</td><td class="r num">${r.gg||"—"}</td><td class="r num">${r.open?eur0(r.open):"—"}</td></tr>`).join("")}
   </tbody></table></div></section>
   <section class="panel c8"><div class="panel-h"><h2>Calendario F24</h2><div class="spacer"></div>${lg([["Versato","var(--green-soft)"],["Da versare","var(--tax)"],["Stima","#8497B0",1]])}</div><div class="panel-b chart">${f24Chart}</div></section>
   <section class="panel c4"><div class="panel-h"><h2>Trasferte ${sel}</h2></div><div class="panel-b"><div class="mini">
      <div><span>Giorni fatturati</span><b>${tr.gg||0}</b></div>
      <div><span>Indennità lorda</span><b>${eur0(tr.ind||0)}</b></div>
      <div><span>Indennità netta stimata</span><b class="pos">${eur0(indNet)}</b></div>
      <div><span>Netto per giorno</span><b>${tr.gg?eur(indNet/tr.gg):"—"}</b></div>
   </div><p class="note" style="margin:12px 0 0">L'indennità è tassata come compenso. Le spese documentate riaddebitate voce per voce (voli, trasporti, alloggio fuori sede) restano fuori dal reddito e dalla soglia.</p></div></section>
  </div>${personalAnal(FX)}`;
}
function contoTassePanel(rows){
  const ct=ctInfo()||{};const today=todayISO();
  const due=(days)=>rows.filter(r=>!r.versato&&r.data>=today&&r.data<=addDays(today,days)).reduce((a,r)=>a+r.importo,0);
  const d6=due(183),d12=due(365);const saldo=+ct.saldo||0;const cov=d12?saldo/d12:1;
  const FX=fisco();const y=new Date().getFullYear();
  const accYTD=S.invoices.filter(v=>v.incasso&&v.incasso.startsWith(String(y))&&(!ct.data||v.incasso>ct.data)).reduce((a,v)=>a+oneriInv(v,FX).accantona,0);
  return `<div class="panel-b" style="border-top:1px solid var(--line-2)">
   <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">${ico("piggy",18)}<b style="font-family:var(--f-ui);font-size:16px">Conto tasse</b><span class="muted" style="font-size:12.5px">quanto hai messo da parte contro quanto dovrai versare</span></div>
   <div class="mini m3">
    <div><span>Saldo accantonato${ct.data?" al "+dmy(ct.data):""}</span><b class="num">${eur0(saldo)}</b></div>
    <div><span>F24 nei prossimi 6 mesi</span><b class="num neg">${eur0(d6)}</b></div>
    <div><span>F24 nei prossimi 12 mesi</span><b class="num neg">${eur0(d12)}</b></div>
    <div><span>Copertura 12 mesi</span><b class="num ${cov>=1?"pos":"bad"}">${pct(Math.min(cov,9.99),0)}</b></div>
    <div><span>${saldo>=d12?"Margine":"Mancano"}</span><b class="num ${saldo>=d12?"pos":"bad"}">${eur0(Math.abs(saldo-d12))}</b></div>
    <div><span>Da aggiungere per incassi recenti</span><b class="num">${eur0(accYTD)}</b></div>
   </div>
   ${ct.linked?`<p class="muted" style="margin:12px 0 0;font-size:12.5px">${logoImg(ct.linked.logo,ct.linked.nome).replace('class="lgo"','class="lgo s"')}Saldo preso dal conto ${esc(ct.linked.nome)} "${esc(ct.linked.prodotto)}": si aggiorna nella scheda <b>Risparmi</b>.</p>`:`<div class="inline-pop" style="margin-top:12px"><label for="ct-saldo" class="muted">Saldo attuale €</label><input id="ct-saldo" inputmode="decimal" class="num" style="width:120px" value="${ct.saldo??""}"><button class="btn small dark" id="ctSave" type="button">Aggiorna saldo</button><span class="muted" style="font-size:12px">Aggiornalo quando sposti soldi sul conto delle tasse o paghi un F24.</span></div>`}
  </div>`;
}
function vTasse(FX){
  const rowsAll=f24Rows(FX);const lim12=addDays(todayISO(),365);const rows=S.f24all?rowsAll:rowsAll.filter(r=>r.data<=lim12);const hidden=rowsAll.length-rows.length; const today=todayISO(); const cy=new Date().getFullYear();
  const open=rows.filter(r=>!r.versato&&r.data>=today);
  const resid=open.filter(r=>r.data.slice(0,4)===String(cy)).reduce((a,r)=>a+r.importo,0);
  const nx=open[0], d12=open.filter(r=>r.data<=addDays(today,365)).reduce((a,r)=>a+r.importo,0);
  const vers=rows.filter(r=>r.versato&&r.data.startsWith(String(cy))).reduce((a,r)=>a+r.importo,0);
  const ci=nx?cdInfo(nx.data):null;
  const KT={};{const lab=r=>dmy(r.data).slice(0,5)+" · "+(r.bollo?"bollo":r.descrizione.split(" – ")[0].split(" (")[0])+": "+eur0(r.importo);
   const nx6=open.filter(r=>r.data<=addDays(today,120)).slice(0,6);if(nx6.length)KT.nx=VZ.cols(nx6.map(r=>r.importo),[0],"Prossimi versamenti\n"+nx6.map(lab).join("\n"),i=>i===0?"var(--cost)":"#ADB9CA")+`<div class="vzl"><span>${dmy(nx6[0].data).slice(0,5)}</span><span>${dmy(nx6[nx6.length-1].data).slice(0,5)}</span></div>`;
   const yr=open.filter(r=>r.data.slice(0,4)===String(cy));const PC=["var(--cost)","#8497B0","#ADB9CA","#C9D6EA","#E3E8EF"];
   if(yr.length)KT.yr=VZ.stack(yr.map((r,i)=>({v:r.importo,c:PC[i%PC.length]})),Math.max(1,resid),[],yr.map(lab).join("\n"))+`<div class="vzl"><span>${dmy(yr[0].data).slice(0,5)}</span><span>${dmy(yr[yr.length-1].data).slice(0,5)}</span></div>`;
   const m12=[];{const d=new Date();for(let i=0;i<12;i++){const x=new Date(d.getFullYear(),d.getMonth()+i,1);m12.push(x.getFullYear()+"-"+pad(x.getMonth()+1))}}
   const vv=m12.map(m=>open.filter(r=>r.data.slice(0,7)===m).reduce((a,r)=>a+r.importo,0));
   KT.d12=VZ.cols(vv,[],"F24 nei prossimi 12 mesi\n"+m12.map((m,i)=>vv[i]?MESI[+m.slice(5)-1]+" "+m.slice(2,4)+": "+eur0(vv[i]):null).filter(Boolean).join("\n"),i=>vv[i]===Math.max(...vv)?"var(--cost)":"#ADB9CA");
   const mm=Array.from({length:12},(_,i)=>rows.filter(r=>r.versato&&r.data.startsWith(cy+"-"+pad(i+1))).reduce((a,r)=>a+r.importo,0));
   KT.vers=VZ.cols(mm,[],"Versato nel "+cy+"\n"+mm.map((v,i)=>v?MESI[i]+": "+eur0(v):null).filter(Boolean).join("\n"),()=>"var(--green-soft)")}
  return `${intro("Tutti i versamenti con F24: imposta sostitutiva, contributi INPS e bollo delle fatture elettroniche. Le scadenze compaiono anche in Scadenze, in Dashboard e nel tuo Google Calendar.")}
  <div class="kpis">
    <div class="kpi"><div class="l">Prossimo versamento</div><div class="v">${nx?eur0(nx.importo):"—"}</div>${KT.nx||""}<div class="s">${nx?dmy(nx.data)+` · <span class="cdp ${ci.c}">${ci.t}</span>`:"nessuno"}</div></div>
    <div class="kpi"><div class="l">Da versare entro il 31/12</div><div class="v">${eur0(resid)}</div>${KT.yr||""}<div class="s">${open.filter(r=>r.data.slice(0,4)===String(cy)).length} versamenti</div></div>
    <div class="kpi"><div class="l">Prossimi 12 mesi</div><div class="v">${eur0(d12)}</div>${KT.d12||""}<div class="s">incluse le stime</div></div>
    <div class="kpi green"><div class="l">Versato nel ${cy}</div><div class="v">${eur0(vers)}</div>${KT.vers||""}<div class="s">registrato nell'app</div></div>
  </div>
  <section class="panel"><div class="panel-h"><h2>${ico("euro",18)} Versamenti F24</h2><div class="spacer"></div><button class="btn small" id="addF24" type="button">+ Aggiungi versamento</button></div>
  <details class="help panel-b"><summary>${ico("info",14)} Come funziona</summary><p>Le righe "stima" sono calcolate dal Calcolo fiscale e spariscono quando aggiungi il versamento reale dello stesso mese. Il bollo delle fatture elettroniche (€2 a fattura) lo precompila l'Agenzia nel portale Fatture e Corrispettivi: verifica con ${esc((cfg().commercialista||{}).nome||"la commercialista")} se lo versa già lei o con addebito diretto.</p></details>
  ${contoTassePanel(rows)}
  <div class="tw"><table class="stack"><thead><tr><th>Data</th><th>Mancano</th><th>Descrizione</th><th>Tributi</th><th class="r">Importo</th><th class="c">Stato</th><th></th></tr></thead><tbody>
  ${rows.map(r=>{const late=!r.versato&&r.data<today, soon=!r.versato&&!late&&daysBetween(today,r.data)<=30;
    return `<tr class="u-${cdInfo(r.data,r.versato).c}"><td class="num">${dmy(r.data)}</td><td>${cdPill(r.data,r.versato)}</td><td>${esc(r.descrizione)}</td><td class="muted">${esc(r.tributi||"")}</td><td class="r num"><b class="neg">${eur(r.importo)}</b></td>
    <td class="c">${r.stima?`<span class="pill est">stima</span>`:r.versato?`<span class="pill ok">Versato</span>`:late?`<span class="pill late">Scaduto</span>`:soon?`<span class="pill late">Entro 30 gg</span>`:`<span class="pill open">Da versare</span>`}</td>
    <td class="r">${r.stima?"":`<button class="btn small ${r.versato?"ghost":""}" data-f24pay="${r.id}">${r.versato?"Annulla":"Segna versato"}</button> <button class="btn small ghost" data-f24edit="${r.id}" aria-label="Modifica">Modifica</button>`}</td></tr>`}).join("")||`<tr><td colspan="7" class="empty">Nessuna scadenza.</td></tr>`}
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
  const c=cfg(), ys=years();
  return `<div class="grid">
  <section class="panel c6"><div class="panel-h"><h2>Clienti</h2><div class="spacer"></div><button class="btn small" id="addCli" type="button">+ Cliente</button></div>
   <div class="tw"><table><thead><tr><th>Cliente</th><th class="r">Compenso/mese</th><th class="r">€/gg trasf.</th><th class="r">Gg pagam.</th><th></th></tr></thead><tbody>
   ${S.clients.map(k=>`<tr><td class="cli">${esc(k.nome)}</td><td class="r num">${k.compenso?eur(k.compenso):"—"}</td><td class="r num">${k.tariffa?eur(k.tariffa):"—"}</td><td class="r num">${k.gg??"—"}</td><td class="r"><button class="btn small ghost" data-cli="${k.id}">Modifica</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">Nessun cliente.</td></tr>`}
   </tbody></table></div></section>
  <section class="panel c6"><div class="panel-h"><h2>Parametri fiscali per anno</h2></div>
   <div class="tw"><table><thead><tr><th>Anno</th><th class="r">Coeff.</th><th class="r">INPS</th><th class="r">Imposta</th><th class="r">Margine</th></tr></thead><tbody>
   ${ys.map(y=>{const p=c.params[y];return `<tr><td class="num"><b>${y}</b></td>${["coef","inps","imp","margine"].map(k=>`<td class="r"><input class="cell-in in num" style="width:84px;text-align:right" data-par="${y}:${k}" value="${(p[k]*100).toLocaleString("it-IT",{maximumFractionDigits:2})}" inputmode="decimal" aria-label="${k} ${y} in %"></td>`).join("")}</tr>`}).join("")}
   </tbody></table></div>
   <div class="panel-b note">Valori in %. Coefficiente 67% (ATECO 94.99.40). Imposta 5% fino al 2026, 15% dal 2027. Aggiorna l'aliquota INPS a gennaio.</div></section>
  <section class="panel c12"><div class="panel-h"><h2>Dati in intestazione proforma</h2><div class="spacer"></div><button class="btn small dark" id="saveForn" type="button">Salva</button></div>
   <div class="panel-b"><div class="fields">
    <div class="f"><label for="fo-nome">Nome</label><input id="fo-nome" value="${esc(c.fornitore.nome)}"></div>
    <div class="f"><label for="fo-piva">P.IVA</label><input id="fo-piva" value="${esc(c.fornitore.piva)}"></div>
    <div class="f"><label for="fo-cf">Codice fiscale</label><input id="fo-cf" value="${esc(c.fornitore.cf)}"></div>
    <div class="f"><label for="fo-tel">Telefono</label><input id="fo-tel" value="${esc(c.fornitore.tel)}"></div>
    <div class="f s6"><label for="fo-ind">Indirizzo</label><textarea id="fo-ind" rows="2">${esc(c.fornitore.indirizzo)}</textarea></div>
    <div class="f"><label for="fo-email">E-mail</label><input id="fo-email" value="${esc(c.fornitore.email)}"></div>
    <div class="f"><label for="pg-banca">Banca</label><input id="pg-banca" value="${esc(c.pagamento.banca)}"></div>
    <div class="f s4"><label for="pg-iban">IBAN</label><input id="pg-iban" value="${esc(c.pagamento.iban)}"></div>
    <div class="f s2"><label for="pg-bic">BIC/SWIFT</label><input id="pg-bic" value="${esc(c.pagamento.bic)}"></div>
    <div class="f s2"><label for="cm-nome">Commercialista</label><input id="cm-nome" value="${esc((c.commercialista||{}).nome||"")}"></div>
    <div class="f s4"><label for="cm-mail">E-mail commercialista</label><input id="cm-mail" type="email" value="${esc((c.commercialista||{}).email||"")}"></div>
    <div class="f s2"><label for="em-dic">Giorno di emissione a dicembre</label><input id="em-dic" class="in num" inputmode="numeric" value="${(c.emissione||{}).dicembre||""}"><span class="help">Vale per tutti i clienti. Vuoto = regola del contratto. Weekend e festivi anticipano al giorno lavorativo prima.</span></div>
   </div></div></section>
  ${historyPanel()}
  <section class="panel c12"><div class="panel-h"><h2>Backup ed esportazione</h2></div><div class="panel-b" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <button class="btn dark" id="exportV3b" type="button">Scarica Excel v3 aggiornato</button><button class="btn" id="exportX2" type="button">Esporta solo dati (tabella semplice)</button><button class="btn" id="exportJ" type="button">Scarica backup completo</button><button class="btn primary" id="exportCairn" type="button">Esporta per Cairn (con PDF)</button>
    <span class="muted" style="font-size:13px">"Excel v3 aggiornato" è il tuo file completo (dashboard, formule, grafici) riempito con tutte le fatture, gli incassi, gli F24 e i parametri di oggi: sostituisci la versione precedente.</span></div></section>
  </div>`;
}
function calItems(FX){
  const today=todayISO(),lim=addDays(today,150),items=[];const cn=id=>(clientById(id)||{nome:id}).nome;
  reminders().filter(r=>!r.fatto&&r.data>=today&&r.data<=lim).forEach(r=>items.push({key:"pm-"+r.id,date:r.data,summary:"⏰ "+r.titolo,desc:r.dettaglio||"",rem:[900,Math.min(40320,Math.max(1440,(+r.preavviso||7)*1440))]}));
  projections().filter(x=>x.data>=today&&x.data<=lim).forEach(x=>items.push({key:"em-"+x.contratto+"-"+x.months[0],date:x.data,summary:`🧾 Emettere fattura ${cn(x.cliente)} – ${x.label}`,desc:`Compenso ${eur(x.comp)}${x.ind?` + indennità ${x.gg} gg ${eur(x.ind)}`:""}. Dall'app: Da fare ora → Crea fattura, poi Email a ${(cfg().commercialista||{}).nome||"commercialista"}.`,rem:[900]}));
  f24Rows(FX).filter(r=>!r.versato&&r.data>=today&&r.data<=addDays(today,250)).forEach(r=>items.push({key:"f24-"+r.id,date:r.data,summary:`💶 F24 ${eur0(r.importo)} – ${r.descrizione}`,desc:`Tributi: ${r.tributi||""}${r.stima?" · importo stimato":""}`,rem:[900,10080]}));
  {const c=invCalc((S.investimenti||[]).find(x=>x.id==="trading212"));if(c&&c.rev>=today)items.push({key:"inv-rev-"+c.rev,date:c.rev,summary:INV_REV_SUM,desc:INV_REV_DESC,rem:[900,10080]})}
  return items.map(i=>({...i,hash:[i.date,i.summary,i.desc].join("|")}));
}
return { vHome, vInv, vPrev, vContr, vMis, vF24, vTasse, vFisco, compliancePanel, redditiPanel, vEntrate, vSpese, vInvest, vRisp, vAnal, vSet };
}
