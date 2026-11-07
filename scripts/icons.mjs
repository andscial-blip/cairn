// Generates every app icon from the single brand source (src/lib/brand.ts): run `node --experimental-strip-types scripts/icons.mjs`.
// iOS/macOS: full-bleed square (the OS applies its mask). Android/PWA: maskable with the mark inside the 80% safe circle.
// Desktop installs (Windows/Chrome) and favicons: rounded tile. Requires the local Playwright Chromium.
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const B = await import("../src/lib/brand.ts");
const tile = (inner, r = 22, bg = "#FFFFFF") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${r}" fill="${bg}"/>${inner}</svg>`;
const small = B.markSmallSvg ?? B.markSvg;
const OUT = "public/icons"; mkdirSync(OUT, { recursive: true });
const svgFiles = {
  "icon.svg": tile(`<g transform="translate(50 50) scale(.84) translate(-50 -50)">${small()}</g>`, 22),                                   // favicon / browser tab
  "mark.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${B.markSvg()}</svg>`,
};
for (const [f, s] of Object.entries(svgFiles)) writeFileSync(`${OUT}/${f}`, s);
const png = [
  ["apple-touch-icon.png", 180, B.iconSvg(0)],
  ["icon-192.png", 192, tile(`<g transform="translate(50 50) scale(.8) translate(-50 -50)">${B.markSvg()}</g>`, 22)],
  ["icon-512.png", 512, tile(`<g transform="translate(50 50) scale(.8) translate(-50 -50)">${B.markSvg()}</g>`, 22)],
  ["maskable-512.png", 512, B.maskableIconSvg ? B.maskableIconSvg() : B.iconSvg(0)],
  ["favicon-32.png", 32, tile(`<g transform="translate(50 50) scale(.9) translate(-50 -50)">${small()}</g>`, 22)],
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--headless=new"] });
const p = await b.newPage({ deviceScaleFactor: 1 });
let fav32;
for (const [f, size, svg] of png) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`);
  const buf = await p.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  writeFileSync(`${OUT}/${f}`, buf); if (f === "favicon-32.png") fav32 = buf;
}
await b.close();
// favicon.ico = ICO container with one 32×32 PNG
const hdr = Buffer.alloc(22); hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
hdr.writeUInt8(32, 6); hdr.writeUInt8(32, 7); hdr.writeUInt8(0, 8); hdr.writeUInt8(0, 9); hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12);
hdr.writeUInt32LE(fav32.length, 14); hdr.writeUInt32LE(22, 18);
writeFileSync("public/favicon.ico", Buffer.concat([hdr, fav32]));
console.log("icons:", [...Object.keys(svgFiles), ...png.map((x) => x[0]), "favicon.ico"].join(", "));
