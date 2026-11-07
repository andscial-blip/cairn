/**
 * Cairn brand — single source for logo, app icons, splash and favicon.
 * Mark "Strati": three stacked layers — a yellow summit, an aqua layer, a night-blue base. Each layer is a stone of the
 * cairn; together they form the mountain and an arrow going up. Flat colours, parallel edges (slope 0.74), soft corners.
 */
export const BRAND = {
  tagline: "Know where you stand",
  light: { summit: "#F2B93B", layer: "#4FB09C", base: "#2E3D52" },   // on white / light backgrounds
  dark: { summit: "#F4C04E", layer: "#7FCDBB", base: "#C9D6EA" },    // on night-blue backgrounds
  night: "#2E3D52",
} as const;

const S = 0.74;
const pts = (a: number[][]) => a.map(([x, y]) => `${x!.toFixed(2)},${y!.toFixed(2)}`).join(" ");
const poly = (p: number[][], c: string) => `<polygon points="${pts(p)}" fill="${c}" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>`;
const tri = (ay: number, hw: number, c: string) => poly([[50 - hw, ay + hw * S], [50, ay], [50 + hw, ay + hw * S]], c);
const band = (ay: number, hw: number, t: number, c: string) =>
  poly([[50 - hw, ay + hw * S], [50, ay], [50 + hw, ay + hw * S], [50 + hw, ay + hw * S + t], [50, ay + t], [50 - hw, ay + hw * S + t]], c);
const base = (ay: number, hw: number, by: number, c: string) => poly([[50 - hw, ay + hw * S], [50, ay], [50 + hw, ay + hw * S], [50 + hw, by], [50 - hw, by]], c);

/** The mark on a 100×100 grid. `dark` = palette for night-blue backgrounds; `mono` = single colour. */
export function markSvg(opts: { dark?: boolean; mono?: string } = {}): string {
  const p = opts.mono ? { summit: opts.mono, layer: opts.mono, base: opts.mono } : opts.dark ? BRAND.dark : BRAND.light;
  return tri(15, 12, p.summit) + band(29, 25, 8.5, p.layer) + base(44, 36, 80, p.base);
}
/** Scales the mark about its own centre (x 50, y 47.5) and puts that centre in the middle of the tile. */
export const scaled = (inner: string, k: number) => `<g transform="translate(50 50) scale(${k}) translate(-50 -47.5)">${inner}</g>`;
/** How much of the tile the mark fills. Raised in Nov 2026: at 0.8 it looked small on home screens and in the dock. */
export const ICON_SCALE = { tile: 1.06, maskable: 0.8, favicon: 1.18 } as const;
/** App icon (iOS/macOS full-bleed square: the OS applies its own corner mask). White tile, true colours. */
export function iconSvg(radius = 0): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${radius}" fill="#FFFFFF"/>${scaled(markSvg(), ICON_SCALE.tile)}</svg>`;
}
/** Android/PWA maskable: mark inside the central 80% safe circle. */
export function maskableIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#FFFFFF"/>${scaled(markSvg(), ICON_SCALE.maskable)}</svg>`;
}
export const markSmallSvg = (opts: { dark?: boolean; mono?: string } = {}) => markSvg(opts);
