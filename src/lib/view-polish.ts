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

/** Settings: chips that jump to each panel. */
export function settingsIndex(root: HTMLElement) {
  const scope = document.getElementById("main") ?? root;
  const heads = [...scope.querySelectorAll<HTMLElement>(".panel > .panel-h h2, .panel > summary h2")];
  if (heads.length < 4 || root.querySelector(".pindex")) return;
  const nav = document.createElement("nav"); nav.className = "pindex"; nav.setAttribute("aria-label", "Sezioni delle impostazioni");
  for (const h of heads) {
    const p = h.closest<HTMLElement>(".panel")!; const label = h.textContent!.trim();
    if (!p.id) p.id = slug(label);
    const a = document.createElement("a"); a.href = "#" + p.id; a.textContent = label;
    a.addEventListener("click", (e) => { e.preventDefault(); p.scrollIntoView({ behavior: "smooth", block: "start" }); history.replaceState(null, "", "#" + p.id); });
    nav.appendChild(a);
  }
  root.prepend(nav);
}

/** Half-width chart panels: the legend goes under the chart, so charts side by side start at the same height. */
export function legendsUnderCharts(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".grid > .panel:is(.c4,.c5,.c6,.c7,.c8)").forEach((p) => {
    const lgd = p.querySelector<HTMLElement>(":scope > .panel-h > .legend"); const body = p.querySelector<HTMLElement>(":scope > .panel-b.chart");
    if (!lgd || !body) return;
    const svg = body.querySelector(":scope > svg, :scope > .chart-scroll, :scope > div > svg");
    lgd.classList.add("under");
    if (svg && svg.parentElement === body) svg.after(lgd); else body.prepend(lgd), body.appendChild(lgd);
  });
}

export function polish(root: HTMLElement, view: string) {
  legendsUnderCharts(root);
  polishTables(root);
  polishCharts(root);
  if (view === "set") settingsIndex(root);
}

let bound = false;
/** Re-measure charts and tables when the window changes size; expand clamped notes on tap. */
export function bindPolish(getRoot: () => HTMLElement | null) {
  if (bound || typeof window === "undefined") return; bound = true;
  let raf = 0;
  window.addEventListener("resize", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const r = getRoot(); if (r) { polishTables(r); polishCharts(r); } }); });
  document.addEventListener("click", (e) => { const d = (e.target as Element).closest?.(".rem-d"); if (d) d.classList.toggle("open"); });
  document.addEventListener("toggle", (e) => { const r = getRoot(); if (r && (e.target as Element).closest?.(".fold")) polishCharts(r); }, true);
}
