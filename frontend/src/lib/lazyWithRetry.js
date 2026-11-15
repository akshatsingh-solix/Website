import { lazy } from "react";

/**
 * Code-split pages that survive flaky networks and new deploys.
 *
 * Every deploy to GitHub Pages replaces the built files, so a tab opened
 * before it still asks for the old chunk names, which no longer exist. And
 * on a bad connection a chunk can simply fail to arrive. Either way the
 * import rejects, and React would otherwise drop the whole page.
 *
 *  - lazyWithRetry(): like React.lazy, but retries the import twice with a
 *    short backoff (and waits for the browser to come back online first).
 *  - isChunkError() / reloadForNewBuild(): the error boundary reloads the
 *    page once when a chunk is missing, which picks up the new build - the
 *    same thing a manual Ctrl+R does. A second failure within a minute shows
 *    the error panel instead, so it can never loop.
 */
const RELOAD_KEY = "solix:chunk-reload";
const RELOAD_WINDOW_MS = 60000;
const BACKOFF_MS = [700, 2000];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const waitForOnline = (maxMs = 30000) => {
  if (typeof navigator === "undefined" || navigator.onLine !== false) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener("online", done); clearTimeout(t); resolve(); };
    const t = setTimeout(done, maxMs);
    window.addEventListener("online", done);
  });
};

export const isChunkError = (err) => {
  if (!err) return false;
  if (err.name === "ChunkLoadError") return true;
  return /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(String(err.message || err));
};

/** Reloads the page to pick up the current build. False when it already tried in the last minute (or can't tell). */
export const reloadForNewBuild = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false; // storage blocked: never risk a reload loop
  }
  window.location.reload();
  return true;
};

export const retryImport = async (factory) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await factory();
    } catch (err) {
      if (attempt >= BACKOFF_MS.length) throw err;
      await waitForOnline();
      await sleep(BACKOFF_MS[attempt]);
    }
  }
};

export const lazyWithRetry = (factory) => lazy(() => retryImport(factory));
