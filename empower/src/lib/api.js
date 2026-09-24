// Talks to the shared Solix backend (same API as the corporate site).
import { EVENT } from "@/data/event";

const BASE = (import.meta.env.VITE_API_URL || "https://solix-backend-mf5w.onrender.com").replace(/\/$/, "");
export const API = `${BASE}/api`;

async function request(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    signal,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(". ") : data.detail;
    const err = new Error(detail || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

const slug = EVENT.slug;
export const getEvent = (signal) => request(`/events/${slug}`, { signal });
export const getQuote = (ticket_id, promo_code) => request(`/events/${slug}/quote`, { method: "POST", body: { ticket_id, promo_code: promo_code || null } });
export const register = (body) => request(`/events/${slug}/registrations`, { method: "POST", body });
export const lookup = (code, email) => request(`/events/${slug}/registrations/${encodeURIComponent(code)}/lookup`, { method: "POST", body: { email } });
export const reportPayment = (code, email, provider, reference) =>
  request(`/events/${slug}/registrations/${encodeURIComponent(code)}/payment`, { method: "POST", body: { email, provider, reference } });
export const subscribe = (email) =>
  request(`/submissions`, { method: "POST", body: { type: "newsletter", email, source_page: `empower:${window.location.pathname}`, ...linkage() } });

// The corporate site and this site share an origin on GitHub Pages, so the
// visitor's consent choice and anonymous id carry over. We only link a
// registration to browsing history when the visitor accepted analytics.
export function linkage() {
  try {
    if (localStorage.getItem("solix-consent") !== "all") return {};
    const vid = localStorage.getItem("solix_vid");
    return vid ? { visitor_id: vid } : {};
  } catch {
    return {};
  }
}

const UTM_KEY = "empower_utm";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
// Landing UTM is captured once per session so it survives navigation to /register.
export function captureUtm() {
  try {
    const p = new URLSearchParams(window.location.search);
    const found = Object.fromEntries(UTM_FIELDS.filter((k) => p.get(k)).map((k) => [k, p.get(k).slice(0, 120)]));
    if (Object.keys(found).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(found));
    if (!sessionStorage.getItem("empower_ref") && document.referrer) sessionStorage.setItem("empower_ref", document.referrer.slice(0, 120));
  } catch { /* storage unavailable */ }
}
export function utm() {
  try {
    const u = JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
    const ref = sessionStorage.getItem("empower_ref");
    return ref && !u.referrer ? { ...u, referrer: ref } : u;
  } catch {
    return {};
  }
}
