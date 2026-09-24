// Visitor intent capture.
//
// Records which products a visitor shows interest in (pages, reading time,
// scroll depth, resources, chat topics, CTA clicks, searches) and sends it
// to the backend in small batches with navigator.sendBeacon, which never
// blocks the page. The backend owns the scoring (see solix-backend
// scoring.py); the browser only reports what happened and on which topic.
//
// Nothing is tracked until the visitor accepts analytics cookies, and
// browsers sending Global Privacy Control / Do Not Track are never tracked.
import { API } from "@/lib/api";

const CONSENT_KEY = "solix-consent"; // "all" | "essential"
const VID_KEY = "solix_vid";
const SESSION_KEY = "solix_session"; // { id, last } in sessionStorage
const TOUCH_KEY = "solix_touch"; // first-touch context for this session
const SESSION_IDLE_MS = 30 * 60 * 1000;
const FLUSH_MS = 8000;

const store = {
  get(area, key) {
    try {
      return window[area].getItem(key);
    } catch {
      return null;
    }
  },
  set(area, key, value) {
    try {
      window[area].setItem(key, value);
    } catch {
      /* storage blocked: tracking simply doesn't persist */
    }
  },
};

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

export const privacySignal = () => typeof navigator !== "undefined" && (navigator.globalPrivacyControl === true || navigator.doNotTrack === "1");
export const getConsent = () => store.get("localStorage", CONSENT_KEY);
export const trackingAllowed = () => !privacySignal() && getConsent() === "all";

export const setConsent = (value) => {
  store.set("localStorage", CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("solix:consent", { detail: value }));
  if (value === "all") track("page_view", { path: currentPath(), topics: pageTopics() });
};

/** Anonymous visitor id, only once analytics are accepted. */
export const visitorId = () => {
  if (!trackingAllowed()) return null;
  let id = store.get("localStorage", VID_KEY);
  if (!id) {
    id = uuid();
    store.set("localStorage", VID_KEY, id);
  }
  return id;
};

const sessionId = () => {
  const now = Date.now();
  let s = null;
  try {
    s = JSON.parse(store.get("sessionStorage", SESSION_KEY) || "null");
  } catch {
    s = null;
  }
  if (!s || now - s.last > SESSION_IDLE_MS) s = { id: uuid(), last: now };
  s.last = now;
  store.set("sessionStorage", SESSION_KEY, JSON.stringify(s));
  return s.id;
};

// Where the visitor came from. Read from the landing URL as soon as the app
// loads (the visitor may navigate away before consenting); only persisted for
// the session once analytics are allowed.
const landingTouch = (() => {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const ctx = { referrer: document.referrer || null, landing: window.location.pathname.replace(/^\/Website/, "") || "/" };
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => params.get(k) && (ctx[k] = params.get(k).slice(0, 120)));
  return ctx;
})();

const context = () => {
  let ctx = null;
  try {
    ctx = JSON.parse(store.get("sessionStorage", TOUCH_KEY) || "null");
  } catch {
    ctx = null;
  }
  if (!ctx) {
    ctx = landingTouch;
    store.set("sessionStorage", TOUCH_KEY, JSON.stringify(ctx));
  }
  return { ...ctx, lang: document.documentElement.lang || "en" };
};

const BASENAME = "/Website";
export const currentPath = () => window.location.pathname.replace(new RegExp(`^${BASENAME}`), "") || "/";

// --- Topics -----------------------------------------------------------------

/** Products a site path is about (the backend applies the same mapping). */
export const topicsForPath = (path) => {
  const m = /^\/products\/([a-z0-9-]+)\/?$/.exec(path);
  if (m) return [m[1]];
  if (path.startsWith("/services-support")) return ["services"];
  if (path === "/platform") return ["enterprise-edition", "common-data-platform"];
  if (path === "/signup" || path === "/signin") return ["enterprise-content-services"];
  return [];
};

// Pages whose topics aren't in the URL (e.g. a resource) register them here.
let registered = { path: null, topics: [] };
export const setPageTopics = (topics, path = currentPath()) => {
  registered = { path, topics: (topics || []).filter(Boolean).slice(0, 5) };
};
export const pageTopics = (path = currentPath()) => (registered.path === path && registered.topics.length ? registered.topics : topicsForPath(path));

// --- Queue ------------------------------------------------------------------

let queue = [];
let timer = null;

const send = (payload, beacon) => {
  const body = JSON.stringify(payload);
  const url = `${API}/track`;
  // text/plain keeps this a "simple" request: no CORS preflight, and beacons allow it.
  if (beacon && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain" }))) return;
  fetch(url, { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: true, mode: "cors" }).catch(() => {});
};

export const flush = (beacon = true) => {
  if (!queue.length) return;
  const vid = visitorId();
  if (!vid) {
    queue = [];
    return;
  }
  const events = queue.splice(0, 50);
  send({ visitor_id: vid, session_id: sessionId(), context: context(), events }, beacon);
  if (queue.length) flush(beacon);
};

/** Record one behaviour signal. No-op without analytics consent. */
// Drop exact repeats within a few seconds (e.g. a component re-mounting).
const recent = new Map();

export function track(type, { path = currentPath(), topics, meta } = {}) {
  if (!trackingAllowed()) return;
  const key = `${type}|${path}|${(topics || []).join(",")}|${meta?.q || meta?.cta || ""}`;
  const now = Date.now();
  if (now - (recent.get(key) || 0) < 3000) return;
  recent.set(key, now);
  if (recent.size > 200) recent.clear();
  queue.push({ type, path, topics: topics ?? pageTopics(path), meta: meta || undefined, ts: Date.now() });
  if (!timer) timer = setTimeout(() => { timer = null; flush(true); }, FLUSH_MS);
  if (queue.length >= 20) flush(true);
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush(true));
  window.addEventListener("pagehide", () => flush(true));
}

/** Fields to add to any form submission so the backend can link it to browsing. */
export const leadContext = () => {
  // Send any queued behaviour first so it's on record when the form lands.
  flush(false);
  const vid = visitorId();
  const topics = pageTopics();
  return { ...(vid ? { visitor_id: vid } : {}), ...(topics.length ? { topics } : {}) };
};
