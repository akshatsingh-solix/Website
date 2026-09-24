/* Solix site service worker: a small, conservative caching layer.
 *
 * - Pages (navigations): network first, so a new deploy is picked up
 *   immediately; the cached app shell is used only when offline.
 * - Built JS/CSS (/static/, content-hashed): cache first, kept forever.
 * - Images and fonts: stale-while-revalidate.
 * - Published content (content-snapshot.json, GET /api/content, /api/files):
 *   stale-while-revalidate, so repeat visits render instantly and refresh
 *   in the background.
 * - Everything else (forms, tracking, admin, chat) goes straight to the
 *   network and is never cached.
 */
const VERSION = "v1";
const STATIC_CACHE = `solix-static-${VERSION}`;
const RUNTIME_CACHE = `solix-runtime-${VERSION}`;
const SCOPE = new URL(self.registration.scope).pathname; // e.g. /Website/
const SHELL = `${SCOPE}index.html`;
const RUNTIME_LIMIT = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.add(SHELL)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("solix-") && ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const trim = async (name, max) => {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
};

const cacheFirst = async (req) => {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
};

const staleWhileRevalidate = async (event, req) => {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(req);
  const refresh = fetch(req)
    .then((res) => {
      if (res.ok && (res.type === "basic" || res.type === "cors")) {
        cache.put(req, res.clone()).then(() => trim(RUNTIME_CACHE, RUNTIME_LIMIT));
      }
      return res;
    })
    .catch(() => hit);
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  return refresh;
};

const networkFirstPage = async (req) => {
  try {
    const res = await fetch(req);
    if (res.ok) caches.open(STATIC_CACHE).then((c) => c.put(SHELL, res.clone()));
    return res;
  } catch {
    const shell = await caches.match(SHELL);
    return shell || Response.error();
  }
};

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate" && url.origin === self.location.origin) {
    if (url.pathname.startsWith(`${SCOPE}admin`)) return;
    event.respondWith(networkFirstPage(req));
    return;
  }
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith(`${SCOPE}static/`)) return event.respondWith(cacheFirst(req));
    if (url.pathname.startsWith(`${SCOPE}images/`) || url.pathname.endsWith("content-snapshot.json") || /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/.test(url.pathname)) {
      return event.respondWith(staleWhileRevalidate(event, req));
    }
    return;
  }
  // Public, cacheable API reads only (never forms, tracking, chat or admin).
  if (/\/api\/(content(\/[^/]+)?|files\/.+)$/.test(url.pathname) && !url.searchParams.has("t")) {
    event.respondWith(staleWhileRevalidate(event, req));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(event, req));
  }
});
