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
    const lgd = p.querySelector<HTMLElement>(":scope > .panel-h > .legend"); const body = p.querySelector<HTMLElement>(":scope > .panel-b.chart");
    if (!lgd || !body) return;
    const half = p.matches(".grid > .panel:is(.c4,.c5,.c6,.c7,.c8)");
    const h2 = p.querySelector<HTMLElement>(":scope > .panel-h h2");
    const wraps = lgd.getBoundingClientRect().height > 30 || (!!h2 && Math.abs(lgd.getBoundingClientRect().top - h2.getBoundingClientRect().top) > 12);
    if (!half && p.clientWidth >= 640 && !wraps) return;
    const svg = body.querySelector(":scope > svg, :scope > .chart-scroll, :scope > div > svg");
    lgd.classList.add("under");
    if (svg && svg.parentElement === body) svg.after(lgd); else body.prepend(lgd), body.appendChild(lgd);
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

export function polish(root: HTMLElement, view: string, year = new Date().getFullYear()) {
  legendsUnderCharts(root);
  alignKpis(root);
  yearColumns(root, year);
  polishTables(root);
  polishCharts(root);
  if (view === "set") settingsIndex(root);
  if (view === "home") homeCustomize(root);
}

let bound = false;
/** Re-measure charts and tables when the window changes size; expand clamped notes on tap. */
export function bindPolish(getRoot: () => HTMLElement | null) {
  if (bound || typeof window === "undefined") return; bound = true;
  let raf = 0;
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = getRoot(); if (r) { yearColumns(r, new Date().getFullYear()); alignKpis(r); polishTables(r); polishCharts(r); } }); });
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

/** Panoramica: show or hide the cards (Da fare, Tasse, Patrimonio). Saved on this device, so phone and computer can differ. */
const HOME_KEY = "cairn-home-cards";
const HOME_CARDS: [string, string][] = [[".h-todo", "Da fare"], [".h-card[data-go-v='tasse']", "Tasse"], [".h-card[data-go-v='invest']", "Patrimonio"]];
function homePrefs(): Record<string, boolean> { try { return JSON.parse(localStorage.getItem(HOME_KEY) || "{}"); } catch { return {}; } }
export function homeCustomize(root: HTMLElement) {
  const home = root.querySelector<HTMLElement>(".home.v2"); if (!home) return;
  const prefs = homePrefs();
  const apply = () => { for (const [sel, label] of HOME_CARDS) { const el = home.querySelector<HTMLElement>(sel); if (el) el.hidden = prefs[label] === false; }
    const duo = home.querySelector<HTMLElement>(".h-duo"); if (duo) duo.hidden = [...duo.children].every((c) => (c as HTMLElement).hidden); };
  apply();
  const hero = home.querySelector(".hero-h"); if (!hero || hero.querySelector(".hcust")) return;
  const wrap = document.createElement("div"); wrap.className = "hcust";
  const btn = document.createElement("button"); btn.type = "button"; btn.className = "btn small ghost"; btn.textContent = "Personalizza"; btn.setAttribute("aria-expanded", "false");
  const pop = document.createElement("div"); pop.className = "hcust-pop"; pop.hidden = true; pop.setAttribute("role", "group"); pop.setAttribute("aria-label", "Schede della panoramica");
  pop.innerHTML = `<b>Schede visibili</b>` + HOME_CARDS.map(([, l], i) => `<label><input type="checkbox" id="hc-${i}" ${prefs[l] === false ? "" : "checked"}> ${l}</label>`).join("") + `<small>Salvato su questo dispositivo</small>`;
  pop.querySelectorAll<HTMLInputElement>("input").forEach((inp, i) => inp.addEventListener("change", () => { prefs[HOME_CARDS[i]![1]] = inp.checked; try { localStorage.setItem(HOME_KEY, JSON.stringify(prefs)); } catch { /* private mode */ } apply(); }));
  btn.addEventListener("click", () => { pop.hidden = !pop.hidden; btn.setAttribute("aria-expanded", String(!pop.hidden)); });
  document.addEventListener("click", (e) => { if (!wrap.contains(e.target as Node)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  wrap.append(btn, pop); hero.appendChild(wrap);
}
