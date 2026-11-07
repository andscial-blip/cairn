// Copies the browser builds of the export libraries into public/vendor, so they are served by Cairn itself
// (strict CSP 'self', available offline) instead of a third-party CDN. Same versions the original app used.
import { mkdirSync, copyFileSync } from "node:fs";
const FILES = {
  "jszip.min.js": "node_modules/jszip/dist/jszip.min.js",
  "xlsx.full.min.js": "node_modules/xlsx/dist/xlsx.full.min.js",
  "jspdf.umd.min.js": "node_modules/jspdf/dist/jspdf.umd.min.js",
  "jspdf.plugin.autotable.min.js": "node_modules/jspdf-autotable/dist/jspdf.plugin.autotable.min.js",
};
mkdirSync("public/vendor", { recursive: true });
for (const [name, src] of Object.entries(FILES)) copyFileSync(src, `public/vendor/${name}`);
console.log("vendor:", Object.keys(FILES).join(", "));
