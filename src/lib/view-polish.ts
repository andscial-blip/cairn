import { applyGlossary } from "./glossary";
/**
 * Presentation-only polish applied after a section is drawn. It never reads or changes data.
 * - Chart text: SVG charts are drawn in their own coordinate space and then scaled to the panel, so the same
 *   11px label could appear as 5px on a phone or 16px on a wide screen. Labels are resized to 11–13px on screen
 *   and labels that would overlap on the same row are hidden (the full value stays in the tooltip).
 * - Wide tables: when a table scrolls sideways, its first column stays visible and an edge shadow shows there is more.
 * - Long notes (.rem-d): clamped to two lines; tap to expand.
 * - Settings: an index of the panels at the top of the page.
 */
const MIN_PX = 11, MAX_PX = 13, MIN_CHART_H = 170;

export function polishCharts(root: ParentNode) {
  root.querySelectorAll<SVGSVGElement>("svg[viewBox]").forEach((svg) => {
    if (svg.classList.contains("vz") || svg.classList.contains("vzr") || svg.closest(".ic, button, .kpi .vz")) return;
    const vb = svg.viewBox.baseVal;
    if (!vb || !vb.width) return;
    // Wide charts on a phone become too flat to read: give them a minimum height and let them scroll sideways.
    const host = svg.parentElement;
    if (host && svg.closest(".chart") && !svg.closest(".hero-chart") && vb.width / vb.height > 2) {
      const minW = Math.ceil(MIN_CHART_H * vb.width / vb.height);
      const narrow = host.clientWidth > 0 && host.clientWidth < minW && window.innerWidth <= 760;
      svg.style.minWidth = narrow ? minW + "px" : "";
      host.classList.toggle("chart-scroll", narrow);
      if (narrow) { host.tabIndex = 0; host.setAttribute("role", "region"); host.setAttribute("aria-label", (svg.getAttribute("aria-label") || host.closest(".panel")?.querySelector("h2")?.textContent?.trim() || "Grafico") + ", scorri di lato"); }
      else if (host.getAttribute("role") === "region" && host.classList.contains("chart")) { host.removeAttribute("tabindex"); host.removeAttribute("role"); host.removeAttribute("aria-label"); }
    }
    const w = svg.getBoundingClientRect().width;
    if (!w) return;
    const scale = w / vb.width;
    const texts = [...svg.querySelectorAll<SVGTextElement>("text")];
    if (!texts.length) return;
    for (const t of texts) {
      const base = Number(t.dataset.fs || t.getAttribute("font-size") || parseFloat(getComputedStyle(t).fontSize) || 11);
      t.dataset.fs = String(base);
      const onScreen = Math.min(MAX_PX, Math.max(MIN_PX, base * scale));
      t.style.fontSize = (onScreen / scale).toFixed(2) + "px";
      t.style.visibility = "";
    }
    // De-clutter: hide any label that would overlap a label already shown (the full value stays in the tooltip).
    const boxes: { t: SVGTextElement; b: DOMRect }[] = [];
    for (const t of texts) { try { const b = t.getBBox() as DOMRect; if (b.width) boxes.push({ t, b }); } catch { /* not rendered */ } }
    boxes.sort((a, c) => (a.b.y - c.b.y) || (a.b.x - c.b.x));
    const kept: DOMRect[] = []; const pad = 3 / scale;
    for (const { t, b } of boxes) {
      const hit = kept.some((k) => b.x < k.x + k.width + pad && b.x + b.width + pad > k.x && b.y < k.y + k.height && b.y + b.height > k.y);
      if (hit) t.style.visibility = "hidden"; else kept.push(b);
    }
    // Value labels over bars (.vl): hidden when they run into another bar (grouped bars on a narrow chart).
    const vls = boxes.filter(({ t }) => t.classList.contains("vl") && t.style.visibility !== "hidden");
    if (vls.length) {
      const bars: DOMRect[] = [];
      svg.querySelectorAll<SVGRectElement>("rect:not(.hov)").forEach((r) => { try { const b = r.getBBox() as DOMRect; if (b.width && b.height) bars.push(b); } catch { /* not rendered */ } });
      for (const { t, b } of vls)
        if (bars.some((k) => b.x < k.x + k.width && b.x + b.width > k.x && b.y < k.y + k.height && b.y + b.height > k.y)) t.style.visibility = "hidden";
    }
  });
}

export function polishTables(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".segs").forEach((g) => {
    const upd = () => g.classList.toggle("ovf", g.scrollWidth > g.clientWidth + 2 && g.scrollLeft + g.clientWidth < g.scrollWidth - 4);
    if (!g.dataset.edge) { g.dataset.edge = "1"; g.addEventListener("scroll", upd, { passive: true }); }
    upd();
  });
  root.querySelectorAll<HTMLElement>(".tw").forEach((t) => {
    const wide = t.scrollWidth > t.clientWidth + 2;
    t.classList.toggle("xs", wide);
    if (wide && !t.dataset.edge) {
      t.dataset.edge = "1";
      const upd = () => { t.classList.toggle("at-start", t.scrollLeft < 4); t.classList.toggle("at-end", t.scrollLeft + t.clientWidth >= t.scrollWidth - 4); };
      t.addEventListener("scroll", upd, { passive: true }); upd();
    }
  });
}

const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Settings: five tabs instead of one long page. A #hash naming a panel (e.g. #calendario) opens its tab. */
const SET_GROUPS: [string, RegExp][] = [
  ["Clienti e parametri", /^Clienti|Parametri/], ["Profilo", /intestazione|proforma/i], ["Sicurezza", /Sicurezza/],
  ["Collegamenti", /Calendario|Gmail/], ["Dati e backup", /Backup|Modello Excel|Dati e sincronizzazione|Cronologia/],
];
let setTab = 0;
export function settingsIndex(root: HTMLElement) {
  const scope = document.getElementById("main") ?? root;
  const panels = [...scope.querySelectorAll<HTMLElement>(":scope .panel")].filter((p) => p.querySelector(":scope > .panel-h h2, :scope > summary h2"));
  if (panels.length < 4) return;
  const groupOf = (p: HTMLElement) => { const t = p.querySelector("h2")!.textContent!.trim(); const i = SET_GROUPS.findIndex(([, re]) => re.test(t)); return i < 0 ? SET_GROUPS.length - 1 : i; };
  panels.forEach((p) => { if (!p.id) p.id = slug(p.querySelector("h2")!.textContent!.trim()); });
  const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); const p = h && panels.find((x) => x.id === h); return p ? groupOf(p) : -1; };
  const hi = fromHash(); if (hi >= 0) setTab = hi;
  let bar = root.querySelector<HTMLElement>(".settabs");
  const show = () => {
    panels.forEach((p) => { p.hidden = groupOf(p) !== setTab; });
    bar?.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", String(i === setTab)));
  };
  if (!bar) {
    bar = document.createElement("div"); bar.className = "segs settabs"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Sezioni delle impostazioni");
    SET_GROUPS.forEach(([label], i) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.textContent = label;
      b.addEventListener("click", () => { setTab = i; history.replaceState(null, "", location.pathname); show(); window.scrollTo({ top: 0 }); }); bar!.appendChild(b); });
    root.prepend(bar);
  }
  if (!(window as unknown as { __setHash?: boolean }).__setHash) {
    (window as unknown as { __setHash?: boolean }).__setHash = true;
    window.addEventListener("hashchange", () => { const r = document.getElementById("app"); if (r && location.pathname.startsWith("/impostazioni")) settingsIndex(r); });
  }
  show();
}

/**
 * Chart legends go under the chart, left-aligned, when the panel is half-width (charts side by side then start at
 * the same height), when the panel is narrow, or when the legend would wrap in the header.
 */
export function legendsUnderCharts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".panel").forEach((p) => {
    const lgd = p.querySelector<HTMLElement>(":scope > .panel-h > .legend"); const chartBody = p.querySelector<HTMLElement>(":scope > .panel-b.chart");
    const body = chartBody ?? p.querySelector<HTMLElement>(":scope > .panel-b");
    if (!lgd || !body) return;
    const half = !!chartBody && p.matches(".grid > .panel:is(.c4,.c5,.c6,.c7,.c8)");
    const h2 = p.querySelector<HTMLElement>(":scope > .panel-h h2");
    const wraps = lgd.getBoundingClientRect().height > 30 || (!!h2 && Math.abs(lgd.getBoundingClientRect().top - h2.getBoundingClientRect().top) > 12);
    if (!half && p.clientWidth >= 640 && !wraps) return;
    const svg = body.querySelector(":scope > svg, :scope > .chart-scroll, :scope > div > svg");
    lgd.classList.add("under");
    if (!chartBody) { lgd.classList.add("ltop"); body.prepend(lgd); }
    else if (svg && svg.parentElement === body) svg.after(lgd); else body.appendChild(lgd);
  });
}

/** KPI tiles in one row: labels take the same height, so the values line up when one label wraps to two lines. */
export function alignKpis(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".kpis").forEach((g) => {
    const ls = [...g.querySelectorAll<HTMLElement>(":scope > .kpi > .l")];
    ls.forEach((l) => { l.style.minHeight = ""; });
    const rows = new Map<number, HTMLElement[]>();
    for (const l of ls) { const top = Math.round((l.parentElement as HTMLElement).offsetTop); rows.set(top, [...(rows.get(top) ?? []), l]); }
    for (const r of rows.values()) {
      if (r.length < 2) continue;
      const h = Math.max(...r.map((l) => l.getBoundingClientRect().height));
      if (r.some((l) => l.getBoundingClientRect().height < h - 1)) r.forEach((l) => { l.style.minHeight = h + "px"; });
    }
  });
}

/**
 * Phone: secondary panels marked data-mfold start closed (title only, tap to open), so long pages stay short.
 * Open/closed is remembered by title for the session, so a redraw keeps what the person opened.
 */
const mfOpen = new Set<string>();
export function mobileFolds(root: ParentNode) {
  const phone = window.innerWidth <= 760;
  root.querySelectorAll<HTMLElement>(".panel[data-mfold]").forEach((p) => {
    const h = p.querySelector<HTMLElement>(":scope > .panel-h"); const key = h?.querySelector("h2")?.textContent?.trim() ?? "";
    if (!h || !key) return;
    p.classList.toggle("mf", phone);
    if (!phone) { p.classList.remove("closed"); h.removeAttribute("role"); h.removeAttribute("tabindex"); h.removeAttribute("aria-expanded"); return; }
    const set = (open: boolean) => { p.classList.toggle("closed", !open); h.setAttribute("aria-expanded", String(open)); if (open) mfOpen.add(key); else mfOpen.delete(key); };
    h.setAttribute("role", "button"); h.tabIndex = 0; set(mfOpen.has(key));
    if (!h.dataset.mf) {
      h.dataset.mf = "1";
      const toggle = (e: Event) => { if ((e.target as Element).closest("button, a, input, select")) return; if (!p.classList.contains("mf")) return; set(p.classList.contains("closed")); if (!p.classList.contains("closed")) polishCharts(p); };
      h.addEventListener("click", toggle);
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } });
    }
  });
}

/** Dashboard on a wide screen: show more to-do items while the list is shorter than the left column. */
export function fitTodo(root: ParentNode) {
  const side = root.querySelector<HTMLElement>(".h-side"), left = root.querySelector<HTMLElement>(".h-left");
  const more = [...root.querySelectorAll<HTMLElement>(".tlist li.t-more")];
  if (!side || !left || !more.length) return;
  more.forEach((li) => li.classList.remove("t-fit"));
  if (window.innerWidth >= 1100) {
    for (const li of more) {
      li.classList.add("t-fit");
      if (side.getBoundingClientRect().height > left.getBoundingClientRect().height + 4) { li.classList.remove("t-fit"); break; }
    }
  }
  const rest = more.filter((li) => !li.classList.contains("t-fit")).length;
  const n = root.querySelector<HTMLElement>(".h-todo .tm-n"); const box = n?.closest<HTMLElement>(".more");
  if (n) n.textContent = String(rest);
  if (box) box.hidden = rest === 0;
}

/** Charts and other elements with a tip become keyboard stops: one per chart, the arrows walk its values. */
export function chartKeys(root: HTMLElement) {
  root.querySelectorAll<SVGSVGElement>("svg").forEach((svg) => {
    if (svg.dataset.kbd || svg.closest("button, a, [data-kbd]") || !(svg.matches("[data-tip]") || svg.querySelector("[data-tip]"))) return;
    svg.dataset.kbd = "1"; svg.setAttribute("tabindex", "0"); svg.setAttribute("focusable", "true");
    const n = svg.matches("[data-tip]") ? 1 : svg.querySelectorAll("[data-tip]").length;
    if (n > 1) svg.setAttribute("aria-description", "Usa le frecce per leggere i valori, uno alla volta.");
  });
  root.querySelectorAll<HTMLElement>("[data-tip]:not(svg):not(svg *):not(.gl)").forEach((el) => { if (!el.closest("button, a, [data-kbd]") && !el.hasAttribute("tabindex")) el.tabIndex = 0; });
}

export function polish(root: HTMLElement, view: string, year = new Date().getFullYear()) {
  mobileFolds(root);
  legendsUnderCharts(root);
  alignKpis(root);
  yearColumns(root, year);
  polishTables(root);
  polishCharts(root);
  chartKeys(root);
  applyGlossary(root);
  if (view === "set") settingsIndex(root);
  if (view === "home") { homeCustomize(root); fitTodo(root); }
}

let bound = false;
/** Re-measure charts and tables when the window changes size; expand clamped notes on tap. */
export function bindPolish(getRoot: () => HTMLElement | null) {
  if (bound || typeof window === "undefined") return; bound = true;
  let raf = 0;
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = getRoot(); if (r) { mobileFolds(r); fitTodo(r); yearColumns(r, new Date().getFullYear()); alignKpis(r); polishTables(r); polishCharts(r); } }); });
  document.addEventListener("click", (e) => { const d = (e.target as Element).closest?.(".rem-d"); if (d) d.classList.toggle("open"); });
  document.addEventListener("toggle", (e) => { const r = getRoot(); if (r && (e.target as Element).closest?.(".fold")) polishCharts(r); }, true);
}

/**
 * Invoice form on phones: a save bar fixed at the bottom with the running total, and description fields that grow
 * with their text. Watches the sheet container; the form itself is unchanged.
 */
export function bindSheetPolish() {
  if (typeof window === "undefined") return;
  const root = document.getElementById("sheetRoot"); if (!root || root.dataset.polish) return; root.dataset.polish = "1";
  const grow = (t: HTMLTextAreaElement) => { t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight + 2, 240) + "px"; };
  const enhance = () => {
    const sheet = root.querySelector<HTMLElement>(".sheet"); const save = root.querySelector<HTMLButtonElement>("#fmSave");
    root.querySelectorAll<HTMLTextAreaElement>("textarea.cell-in").forEach((t) => { if (!t.dataset.grow) { t.dataset.grow = "1"; t.addEventListener("input", () => grow(t)); } grow(t); });
    if (!sheet || !save || sheet.querySelector(".sheet-foot")) return;
    const foot = document.createElement("div"); foot.className = "sheet-foot";
    foot.innerHTML = `<span class="sf-t"><small>Totale documento</small><b class="num" id="sfTot">—</b></span>`;
    const b = document.createElement("button"); b.type = "button"; b.className = "btn primary"; b.textContent = save.textContent || "Salva";
    b.addEventListener("click", () => save.click()); foot.appendChild(b); sheet.appendChild(foot);
    const box = root.querySelector<HTMLElement>("#sumBox");
    const upd = () => { const row = [...(box?.querySelectorAll(".sum-row") ?? [])].find((r) => /Totale documento/.test(r.textContent || "")); const v = row?.querySelector(".num")?.textContent; const t = foot.querySelector("#sfTot"); if (t && v) t.textContent = v; };
    if (box) new MutationObserver(upd).observe(box, { childList: true, subtree: true, characterData: true }); upd();
  };
  new MutationObserver(enhance).observe(root, { childList: true, subtree: true });
}

/** Phones: tables with one column per year (Calcolo fiscale annuale) show one year at a time, chosen with chips. */
export function yearColumns(root: ParentNode, year: number) {
  const narrow = typeof window !== "undefined" && window.innerWidth <= 760;
  root.querySelectorAll<HTMLTableElement>("table").forEach((t) => {
    const heads = [...(t.tHead?.rows[0]?.cells ?? [])];
    const yi = heads.map((h, i) => (/^\d{4}$/.test(h.textContent?.trim() || "") ? i : -1)).filter((i) => i > 0);
    if (yi.length < 3) return;
    const wrap = t.closest<HTMLElement>(".tw"); if (!wrap) return;
    let bar = wrap.previousElementSibling as HTMLElement | null;
    if (!narrow) { if (bar?.classList.contains("ycols")) bar.remove(); t.classList.remove("one-year"); [...t.rows].forEach((r) => [...r.cells].forEach((c) => (c.style.display = ""))); return; }
    const want = String(year); const keyOf = (i: number) => heads[i]!.textContent!.trim();
    let sel = Number(t.dataset.ycol) || (yi.find((i) => keyOf(i) === want) ?? yi[0]!);
    const show = () => {
      t.dataset.ycol = String(sel); t.classList.add("one-year");
      [...t.rows].forEach((r) => { if (r.cells.length !== heads.length) return; [...r.cells].forEach((c, i) => { c.style.display = i === 0 || i === sel || !yi.includes(i) ? "" : "none"; }); });
      bar?.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.i) === sel)));
    };
    if (!bar?.classList.contains("ycols")) {
      bar = document.createElement("div"); bar.className = "segs ycols"; bar.setAttribute("role", "tablist"); bar.setAttribute("aria-label", "Anno da mostrare");
      for (const i of yi) { const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.dataset.i = String(i); b.textContent = keyOf(i); b.addEventListener("click", () => { sel = i; show(); }); bar.appendChild(b); }
      wrap.before(bar);
    }
    show();
  });
}

/**
 * Dashboard: show, hide and reorder the cards. Saved on this device, so phone and computer can differ.
 * Order: arrows in "Personalizza" (keyboard and touch) or "Sposta i riquadri", which lets you drag the cards.
 * On a computer "Da fare" stays in the right column; its place in the order counts on tablet and phone.
 */
const HOME_KEY = "cairn-home-cards", ORDER_KEY = "cairn-home-order";
const CARDS: [string, string][] = [["anno", "Il tuo anno"], ["todo", "Da fare"], ["entr", "Entrate e uscite"], ["spese", "Spese"], ["tasse", "Tasse"], ["patr", "Patrimonio"]];
const HIDE_LABEL: Record<string, string> = { todo: "Da fare", entr: "Entrate e uscite", spese: "Spese", tasse: "Tasse", patr: "Patrimonio" };
function homePrefs(): Record<string, boolean> { try { return JSON.parse(localStorage.getItem(HOME_KEY) || "{}"); } catch { return {}; } }
function homeOrder(): string[] {
  let o: string[] = []; try { o = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]"); } catch { /* none */ }
  const keys = CARDS.map(([k]) => k); o = o.filter((k) => keys.includes(k)); keys.forEach((k, i) => { if (!o.includes(k)) o.splice(Math.min(i, o.length), 0, k); });
  return o;
}
const save = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
let homeMoving = false;
export function homeCustomize(root: HTMLElement) {
  const home = root.querySelector<HTMLElement>(".home.v2"); if (!home) return;
  const left = home.querySelector<HTMLElement>(".h-left"); if (!left) return;
  const prefs = homePrefs(); let order = homeOrder();
  const card = (k: string) => home.querySelector<HTMLElement>(`[data-card="${k}"]`);
  const apply = () => {
    for (const [k, l] of Object.entries(HIDE_LABEL)) { const el = card(k); if (el) el.hidden = prefs[l] === false; }
    order.forEach((k, i) => { const el = card(k); if (!el) return; el.style.setProperty("--o", String(i)); if (k !== "todo") left.appendChild(el); });
    // A half-width card left alone before a full-width one (or at the end) takes the whole row: no holes in the grid.
    const mark = (list: HTMLElement[], full: (el: HTMLElement) => boolean, cls: string) => {
      list.forEach((el) => el.classList.remove(cls)); let open: HTMLElement | null = null;
      for (const el of list) { if (full(el)) { if (open) open.classList.add(cls); open = null; } else open = open ? null : el; }
      if (open) open.classList.add(cls);
    };
    const vis = order.map(card).filter((el): el is HTMLElement => !!el && !el.hidden);
    const full = (el: HTMLElement) => el.dataset.card === "anno";
    mark(vis.filter((el) => el.dataset.card !== "todo"), full, "wide");
    mark(vis, (el) => full(el) || el.dataset.card === "todo", "wide2");
    fitTodo(root);
  };
  apply();
  if (homeMoving) startMove();
  const hero = home.querySelector(".hero-h"); if (!hero || hero.querySelector(".hcust")) return;
  const wrap = document.createElement("div"); wrap.className = "hcust"; hero.closest("[data-card]")?.classList.add("hcust-host");
  wrap.addEventListener("click", (e) => e.stopPropagation()); // the button sits in a card that opens its section
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "btn small ghost"; btn.textContent = "Personalizza"; btn.setAttribute("aria-expanded", "false");
  const pop = document.createElement("div"); pop.className = "hcust-pop"; pop.hidden = true; pop.setAttribute("role", "group"); pop.setAttribute("aria-label", "Riquadri della dashboard");
  const draw = () => {
    pop.innerHTML = `<b>Riquadri</b>` + order.map((k, i) => { const l = CARDS.find(([c]) => c === k)![1], hid = HIDE_LABEL[k];
      return `<div class="hc-row">${hid ? `<label><input type="checkbox" data-hide="${k}" ${prefs[hid] === false ? "" : "checked"}> ${l}</label>` : `<span style="padding-left:24px">${l}</span>`}<button type="button" class="hc-mv" data-mv="${k}" data-d="-1" aria-label="Sposta ${l} prima" ${i === 0 ? "disabled" : ""}>↑</button><button type="button" class="hc-mv" data-mv="${k}" data-d="1" aria-label="Sposta ${l} dopo" ${i === order.length - 1 ? "disabled" : ""}>↓</button></div>`; }).join("")
      + `<div class="hc-sep"></div><button type="button" class="btn small" data-move-start>Trascina i riquadri</button><button type="button" class="btn small ghost" data-reset>Ripristina l'ordine</button><small>Salvato su questo dispositivo. Su computer "Da fare" resta a destra.</small>`;
    pop.querySelectorAll<HTMLInputElement>("input[data-hide]").forEach((inp) => inp.addEventListener("change", () => { prefs[HIDE_LABEL[inp.dataset.hide!]!] = inp.checked; save(HOME_KEY, prefs); apply(); }));
    pop.querySelectorAll<HTMLButtonElement>("[data-mv]").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.mv!, i = order.indexOf(k), j = i + Number(b.dataset.d); if (j < 0 || j >= order.length) return;
      order.splice(i, 1); order.splice(j, 0, k); save(ORDER_KEY, order); apply(); draw();
      pop.querySelector<HTMLButtonElement>(`[data-mv="${k}"][data-d="${b.dataset.d}"]:not(:disabled)`)?.focus();
    }));
    pop.querySelector("[data-move-start]")!.addEventListener("click", () => { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); homeMoving = true; startMove(); });
    pop.querySelector("[data-reset]")!.addEventListener("click", () => { try { localStorage.removeItem(ORDER_KEY); } catch { /* */ } order = homeOrder(); apply(); draw(); });
  };
  draw();
  btn.addEventListener("click", () => { pop.hidden = !pop.hidden; btn.setAttribute("aria-expanded", String(!pop.hidden)); });
  // (a click on an arrow redraws the list, so its button is no longer in the page: that is not a click outside)
  document.addEventListener("click", (e) => { const t = e.target as Node; if (t.isConnected && !wrap.contains(t)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  wrap.append(btn, pop); hero.appendChild(wrap);

  function startMove() {
    if (home!.classList.contains("moving")) return;
    home!.classList.add("moving");
    const bar = document.createElement("div"); bar.className = "hmove-bar"; bar.style.order = "-1"; bar.setAttribute("role", "status");
    bar.innerHTML = `<span>Trascina i riquadri nella posizione che preferisci.</span><button type="button" class="btn small">Fatto</button>`;
    home!.prepend(bar);
    let drag: HTMLElement | null = null, passed: HTMLElement | null = null;
    const block = (e: Event) => { if ((e.target as Element).closest?.("[data-card]") && !(e.target as Element).closest(".hmove-bar")) { e.preventDefault(); e.stopPropagation(); } };
    const down = (e: PointerEvent) => {
      const el = (e.target as Element).closest<HTMLElement>("[data-card]"); if (!el || !home!.contains(el)) return;
      if (el.dataset.card === "todo" && window.innerWidth >= 1100) return;
      drag = el; el.classList.add("drag"); e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!drag) return; e.preventDefault();
      const over = document.elementsFromPoint(e.clientX, e.clientY).map((x) => x.closest<HTMLElement>("[data-card]")).find((x) => x && x !== drag && home!.contains(x));
      // After a swap the card just passed lands under the pointer: wait until the pointer leaves it, or they would swap back.
      if (over !== passed) passed = null;
      if (over && over !== passed && !(over.dataset.card === "todo" && window.innerWidth >= 1100)) {
        const k = drag.dataset.card!, t = over.dataset.card!, i = order.indexOf(k), j = order.indexOf(t);
        order.splice(i, 1); order.splice(j, 0, k); apply(); passed = over;
      }
      if (e.clientY < 60) window.scrollBy(0, -12); else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
    };
    const up = () => { if (!drag) return; drag.classList.remove("drag"); drag = null; save(ORDER_KEY, order); draw(); };
    const stop = () => {
      home!.classList.remove("moving"); bar.remove(); homeMoving = false;
      home!.removeEventListener("pointerdown", down); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); home!.removeEventListener("click", block, true);
    };
    home!.addEventListener("pointerdown", down); window.addEventListener("pointermove", move, { passive: false }); window.addEventListener("pointerup", up);
    home!.addEventListener("click", block, true);
    bar.querySelector("button")!.addEventListener("click", stop);
  }
}
