"use client";
/**
 * Chart tooltip. Mouse: follows the pointer. Touch: a tap shows the values of the column or bar tapped, above the
 * finger (not under it), and highlights it; a second tap on the same item, a tap elsewhere or a scroll closes it.
 * (A tap also fires an emulated mousemove: reacting to it opened and then the click closed the tip at once.)
 */
import { useEffect } from "react";
export function Tooltip() {
  useEffect(() => {
    const tip = document.createElement("div"); tip.id = "ctip"; tip.setAttribute("role", "status"); document.body.appendChild(tip);
    let cur: Element | null = null, lastPointer = "mouse";
    const place = (x: number, y: number, touch: boolean) => {
      const r = tip.getBoundingClientRect();
      let lx: number, ly: number;
      if (touch) { lx = x - r.width / 2; ly = y - r.height - 28; if (ly < 8) ly = y + 28; }
      else { lx = x + 14; ly = y + 14; if (lx + r.width > innerWidth - 8) lx = x - r.width - 14; if (ly + r.height > innerHeight - 8) ly = y - r.height - 14; }
      tip.style.left = Math.min(Math.max(8, lx), innerWidth - r.width - 8) + "px";
      tip.style.top = Math.min(Math.max(8, ly), innerHeight - r.height - 8) + "px";
    };
    const show = (el: Element, x: number, y: number, touch: boolean) => {
      if (cur !== el) { cur?.classList.remove("tip-on"); cur = el; if (touch) el.classList.add("tip-on"); }
      tip.textContent = el.getAttribute("data-tip"); tip.style.display = "block"; place(x, y, touch);
    };
    const hide = () => { cur?.classList.remove("tip-on"); cur = null; tip.style.display = "none"; };
    const pd = (e: PointerEvent) => { lastPointer = e.pointerType || "mouse"; };
    const pm = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element).closest?.("[data-tip]"); if (el) show(el, e.clientX, e.clientY, false); else if (cur) hide();
    };
    const ck = (e: MouseEvent) => {
      const el = (e.target as Element).closest?.("[data-tip]");
      const touch = lastPointer !== "mouse" || matchMedia("(hover: none)").matches;
      if (!el) { if (cur) hide(); return; }
      if (touch) { if (cur === el) hide(); else show(el, e.clientX, e.clientY, true); }
    };
    document.addEventListener("pointerdown", pd, { passive: true }); document.addEventListener("pointermove", pm, { passive: true }); document.addEventListener("click", ck);
    // Any scroll (the page or a chart scrolled sideways on the phone) closes it: the values would point elsewhere.
    document.addEventListener("scroll", hide, { passive: true, capture: true }); window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("pointerdown", pd); document.removeEventListener("pointermove", pm); document.removeEventListener("click", ck);
      document.removeEventListener("scroll", hide, { capture: true }); window.removeEventListener("resize", hide); tip.remove();
    };
  }, []);
  return null;
}
