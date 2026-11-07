// Cairn service worker: lets the installed app open — and move between all sections — offline.
// - Every section page and the build files it needs are saved in advance ("precache"), and refreshed
//   on each online visit (the page sends "precache"), so offline navigation never hits an unsaved page.
// - Navigations: network first, saved page as fallback. Build files (hashed names): cache first.
// - Data is never cached here: offline data lives in IndexedDB; Supabase calls always go to the network.
const CACHE = "cairn-shell-v2";
const ROUTES = ["/", "/entrate", "/spese", "/risparmi", "/investimenti", "/analisi", "/fatture", "/da-emettere", "/scadenze", "/tasse",
  "/contratti", "/impostazioni", "/importa", "/sincronizzazione", "/login", "/benvenuto"];
const EXTRA = ["/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png"];

async function precache() {
  const c = await caches.open(CACHE);
  const assets = new Set(EXTRA);
  await Promise.all(ROUTES.map(async (r) => {
    try {
      const res = await fetch(r, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) return;
      const html = await res.clone().text();
      await c.put(r, res);
      for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1]);
    } catch { /* offline or transient: keep what we have */ }
  }));
  await Promise.all([...assets].map(async (u) => { if (!(await c.match(u))) { try { const res = await fetch(u); if (res.ok) await c.put(u, res); } catch { /* ignore */ } } }));
}

self.addEventListener("install", (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
let last = 0;
self.addEventListener("message", (e) => {
  if (e.data === "precache" && Date.now() - last > 60_000) { last = Date.now(); e.waitUntil(precache()); }
});
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(url.pathname, copy)); } return res; })
      .catch(() => caches.match(url.pathname).then((r) => r || caches.match("/"))));
    return;
  }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })));
  }
});
