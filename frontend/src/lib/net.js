/**
 * Network resilience shared by the public and admin API clients, for slow
 * connections and for a backend that restarts or sleeps (Render's free plan:
 * a deploy or a replaced instance is 30-120 s; waking from sleep up to a minute):
 *  - Every write carries an Idempotency-Key header, generated once and kept on
 *    retries. The server stores the first response for that key and replays it
 *    to a retry, so a retried write never happens twice (backend resilience.py).
 *  - GET/HEAD requests, and writes on clients created with { retryWrites: true }
 *    (the admin), retry with backoff for about 90 seconds on a network error,
 *    timeout or gateway error (502/503/504): long enough to ride out a restart.
 *    A write the server is still processing (409 "in_progress") is retried too.
 *    They also wait for the browser to come back online.
 *  - Requests running longer than SLOW_MS, and requests waiting to retry, are
 *    counted, so the UI says the server is reconnecting rather than freezing or
 *    showing "Network Error" (see useSlowNetwork).
 */
import { useEffect, useState } from "react";

const SLOW_MS = 4000;
// About 90 s in all: a Render restart or deploy finishes inside this window.
const BACKOFF_MS = [1500, 3000, 5000, 8000, 12000, 15000, 15000, 15000, 15000];
const IDEMPOTENT = new Set(["get", "head", "options"]);

export const isRetryable = (err) => !err.response || err.code === "ECONNABORTED" || [502, 503, 504].includes(err.response?.status)
  || (err.response?.status === 409 && err.response?.data?.code === "in_progress");

const newKey = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID()
  : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForOnline = (maxMs = 60000) => {
  if (typeof navigator === "undefined" || navigator.onLine !== false) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener("online", done); clearTimeout(t); resolve(); };
    const t = setTimeout(done, maxMs);
    window.addEventListener("online", done);
  });
};

// --- Slow-request tracking ----------------------------------------------------
let slow = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(slow));

const startTimer = (config) => {
  stopTimer(config);
  config.__slowTimer = setTimeout(() => { config.__slow = true; slow += 1; emit(); }, SLOW_MS);
};
function stopTimer(config) {
  if (!config) return;
  clearTimeout(config.__slowTimer);
  if (config.__slow) { config.__slow = false; slow = Math.max(0, slow - 1); emit(); }
}

/** Number of requests currently taking longer than a few seconds. */
export const useSlowNetwork = () => {
  const [n, setN] = useState(slow);
  useEffect(() => {
    listeners.add(setN);
    return () => listeners.delete(setN);
  }, []);
  return n;
};

/** True on data-saver or 2G/3G-class connections (Network Information API, where supported). */
export const slowConnection = () => {
  const c = typeof navigator !== "undefined" ? navigator.connection : null;
  return !!c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || ""));
};

/** Add retries, idempotency keys and slow-request tracking to an axios instance. */
export const makeResilient = (instance, { retries = BACKOFF_MS.length, retryWrites = false } = {}) => {
  instance.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();
    if (!IDEMPOTENT.has(method)) {
      // One key per action, kept across retries (axios reuses this config object when it retries).
      config.__idemKey = config.__idemKey || newKey();
      config.headers = config.headers || {};
      config.headers["Idempotency-Key"] = config.__idemKey;
    }
    startTimer(config);
    return config;
  });
  instance.interceptors.response.use(
    (res) => { stopTimer(res.config); return res; },
    async (err) => {
      const config = err.config;
      stopTimer(config);
      const method = (config?.method || "get").toLowerCase();
      const attempt = config?.__attempt || 0;
      const canRetry = IDEMPOTENT.has(method) || (retryWrites && config?.__idemKey);
      if (!config || config.noRetry || !canRetry || !isRetryable(err) || attempt >= retries || err.code === "ERR_CANCELED") {
        throw err;
      }
      config.__attempt = attempt + 1;
      // While waiting to retry, count as "slow" so the reconnecting notice stays up.
      slow += 1; emit();
      try {
        await waitForOnline();
        await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] + Math.random() * 400);
      } finally {
        slow = Math.max(0, slow - 1); emit();
      }
      return instance.request(config);
    },
  );
  return instance;
};
