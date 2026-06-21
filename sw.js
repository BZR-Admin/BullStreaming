// Bull Streaming - Service Worker
const CACHE = "bull-streaming-v1";

// Archivos a cachear para uso offline básico
const ASSETS = [
  "/",
  "/index.html",
  "/ventas.html",
  "/compras.html",
  "/cuentas.html",
  "/registros.html",
  "/clientes_proveedores.html",
  "/style.css",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Solo cacheamos GET
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
