/**
 * Network resilience shared by the public and admin API clients, for slow
 * connections and for a backend that sleeps when idle (it can take up to a
 * minute to wake):
 *  - GET/HEAD requests retry twice, with backoff, on a network error,
 *    timeout or gateway error (502/503/504). They also wait for the browser
 *    to come back online. Writes are never retried automatically.
 *  - Requests running longer than SLOW_MS are counted, so the UI can say
 *    the server is waking up rather than looking frozen (see useSlowNetwork).
 */
import { useEffect, useState } from "react";

const SLOW_MS = 4000;
const BACKOFF_MS = [1500, 4000];
const IDEMPOTENT = new Set(["get", "head", "options"]);

export const isRetryable = (err) => !err.response || err.code === "ECONNABORTED" || [502, 503, 504].includes(err.response?.status);

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

/** Add retries and slow-request tracking to an axios instance. */
export const makeResilient = (instance, { retries = BACKOFF_MS.length } = {}) => {
  instance.interceptors.request.use((config) => {
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
      if (!config || config.noRetry || !IDEMPOTENT.has(method) || !isRetryable(err) || attempt >= retries || err.code === "ERR_CANCELED") {
        throw err;
      }
      config.__attempt = attempt + 1;
      await waitForOnline();
      await sleep(BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] + Math.random() * 400);
      return instance.request(config);
    },
  );
  return instance;
};
