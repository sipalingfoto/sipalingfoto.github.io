const CACHE = "sf-app-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./assets/js/codec.js",
  "./assets/icons/instagram.svg",
  "./assets/icons/facebook.svg",
  "./assets/icons/tiktok.svg",
  "./assets/icons/x.svg",
  "./assets/icons/threads.svg",
  "./assets/icons/whatsapp.svg",
  "./assets/icons/telegram.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (url.origin === location.origin) {
    // stale-while-revalidate: sajikan cache seketika, update di latar belakang,
    // supaya update aset (CSS/JS) otomatis tersebar tanpa menunggu bump versi.
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const network = fetch(e.request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(e.request, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })
    );
    return;
  }

  if (url.hostname === "api.github.com") {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then((hit) => hit || Response.error()))
    );
  }
});
