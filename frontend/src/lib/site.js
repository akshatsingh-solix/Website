// Site-wide settings editors change in Admin > Website (announcement bar,
// SOLIXEmpower promo). Read from the API with a short cache; until it answers
// (or if it can't), the site uses its built-in defaults.
import { useEffect, useSyncExternalStore } from "react";
import { API, BACKEND_URL } from "@/lib/api";

const CACHE_KEY = "solix-site-v1";
const TTL = 5 * 60_000;

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
};

let state = read()?.data || null;
let fetchedAt = 0;
const listeners = new Set();

async function refresh() {
  if (!BACKEND_URL || Date.now() - fetchedAt < TTL) return;
  fetchedAt = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${API}/site`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return;
    state = await res.json();
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: state, at: Date.now() }));
    } catch {
      /* storage blocked */
    }
    listeners.forEach((l) => l());
  } catch {
    /* backend asleep: keep defaults */
  }
}

const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** `{ announcement, empower_promo }` or null while unknown (use built-in defaults). */
export function useSiteSettings() {
  const s = useSyncExternalStore(subscribe, () => state);
  useEffect(() => {
    refresh();
  }, []);
  return s;
}
