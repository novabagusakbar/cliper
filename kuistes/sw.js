// Service worker Tes Gratis HadirFlow. Lingkup: /kuistes/ saja.
const CACHE = "kuistes-b9b19fb2f7";
const INTI = ["/kuistes/", "/kuistes/ikon-192.png", "/kuistes/manifest.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(INTI)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.indexOf("kuistes-") === 0 && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.indexOf("/kuistes/") !== 0) return;
  // Jaringan dulu (supaya selalu versi terbaru), cadangan dari cache saat sinyal hilang
  e.respondWith(fetch(e.request).then((r) => { if (r.ok) { const salin = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, salin)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/kuistes/"))));
});
