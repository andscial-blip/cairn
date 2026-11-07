"use client";
/** The original chart tooltip: follows the pointer on desktop, tap-to-toggle on touch. */
import { useEffect } from "react";
export function Tooltip() {
  useEffect(() => {
    const tip = document.createElement("div"); tip.id = "ctip"; document.body.appendChild(tip);
    let cur: Element | null = null;
    const show = (el: Element, x: number, y: number) => {
      cur = el; tip.textContent = el.getAttribute("data-tip"); tip.style.display = "block"; const r = tip.getBoundingClientRect();
      let lx = x + 14, ly = y + 14; if (lx + r.width > innerWidth - 8) lx = x - r.width - 14; if (ly + r.height > innerHeight - 8) ly = y - r.height - 14;
      tip.style.left = Math.max(8, lx) + "px"; tip.style.top = Math.max(8, ly) + "px";
    };
    const hide = () => { cur = null; tip.style.display = "none"; };
    const mm = (e: MouseEvent) => { const el = (e.target as Element).closest?.("[data-tip]"); if (el) show(el, e.clientX, e.clientY); else if (cur) hide(); };
    const ck = (e: MouseEvent) => { const el = (e.target as Element).closest?.("[data-tip]"); if (el && matchMedia("(hover: none)").matches) { if (cur === el) hide(); else show(el, e.clientX, e.clientY); } else if (!el && cur) hide(); };
    document.addEventListener("mousemove", mm); document.addEventListener("click", ck); window.addEventListener("scroll", hide, { passive: true });
    return () => { document.removeEventListener("mousemove", mm); document.removeEventListener("click", ck); window.removeEventListener("scroll", hide); tip.remove(); };
  }, []);
  return null;
}
