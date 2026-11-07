/**
 * Cairn brand mark — single source for logo, app icons, splash and favicon.
 * Concept "Vetta 4.3 — Sfaccettata": one summit in light and shadow, marked by a cairn (ometto) of three stones.
 */
export const BRAND = { tagline: "Know where you stand", night: "#2E3D52", teal: "#7FCDBB", lilac: "#A99DEB", sun: "#F4C04E",
  tealOnLight: "#5FB8A3", sunOnLight: "#E9AE2C" } as const;

const stones = (x: number, y: number, c: string, gap: string) => ([[x, y, 8, 3.4], [x + 1.1, y - 5.9, 5.8, 2.9], [x - 0.5, y - 10.8, 3.8, 2.4]] as const)
  .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" stroke="${gap}" stroke-width="1.7" paint-order="stroke"/>`).join("");

/** Inner markup on a 100×100 grid. `light` = palette for light backgrounds. */
export function markSvg(opts: { light?: boolean; bg?: string } = {}): string {
  const c1 = opts.light ? BRAND.tealOnLight : BRAND.teal, c2 = opts.light ? BRAND.night : BRAND.lilac, acc = opts.light ? BRAND.sunOnLight : BRAND.sun;
  const gap = opts.bg ?? (opts.light ? "#FFFFFF" : BRAND.night);
  return `<path d="M13 81 L50 36 L56 81 Z" fill="${c1}" stroke="${c1}" stroke-width="2.5" stroke-linejoin="round"/>`
    + `<path d="M50 36 L87 81 L56 81 Z" fill="${c2}" stroke="${c2}" stroke-width="2.5" stroke-linejoin="round"/>` + stones(50, 32, acc, gap);
}
/** App icon: mark on the night tile (full-bleed square; platforms apply their own mask). */
export function iconSvg(radius = 0): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${radius}" fill="${BRAND.night}"/>${markSvg()}</svg>`;
}
