import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { currentPath, flush, pageTopics, track, trackingAllowed } from "@/lib/intent";

const ENGAGED_SECONDS = 45;
const IDLE_MS = 30_000;
const TICK_MS = 5_000;

// Which call-to-action a link or button represents.
const ctaFor = (el) => {
  const explicit = el.closest("[data-intent]")?.getAttribute("data-intent");
  if (explicit) return explicit;
  const href = el.closest("a")?.getAttribute("href") || "";
  const path = href.replace(/^https?:\/\/[^/]+/, "").replace(/^\/Website/, "");
  if (/^\/contact(\/|\?|$)/.test(path)) return "contact";
  if (/^\/signup(\/|\?|$)/.test(path)) return "trial";
  return null;
};

/**
 * Page views, engaged reading time, scroll depth and CTA clicks for the
 * public site. Mounted once in the site layout; costs one passive scroll
 * listener and a 5-second timer.
 */
export function useIntentTracking() {
  const location = useLocation();
  const page = useRef({ path: null, active: 0, depth: 0, lastInput: Date.now() });

  // Close out the previous page and record the new one on every route change.
  useEffect(() => {
    const prev = page.current;
    if (prev.path && trackingAllowed()) {
      const topics = pageTopics(prev.path);
      if (prev.active >= ENGAGED_SECONDS && !prev.sentEngaged) track("engaged", { path: prev.path, topics, meta: { seconds: String(prev.active) } });
      if (prev.depth >= 0.75) track("deep_scroll", { path: prev.path, topics });
    }
    const path = currentPath();
    page.current = { path, active: 0, depth: 0, lastInput: Date.now() };
    // Let the page render (and register resource topics) before recording the view.
    const t = setTimeout(() => track("page_view", { path, topics: pageTopics(path), meta: { title: document.title.slice(0, 120) } }), 600);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    const onInput = () => { page.current.lastInput = Date.now(); };
    const onScroll = () => {
      onInput();
      const doc = document.documentElement;
      const depth = (window.scrollY + window.innerHeight) / Math.max(doc.scrollHeight, 1);
      if (depth > page.current.depth) page.current.depth = depth;
    };
    const onClick = (e) => {
      onInput();
      const el = e.target instanceof Element ? e.target : null;
      const cta = el && ctaFor(el);
      if (cta) track("cta_click", { meta: { cta } });
    };
    const tick = setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - page.current.lastInput < IDLE_MS) page.current.active += TICK_MS / 1000;
    }, TICK_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onInput, { passive: true });
    window.addEventListener("pointermove", onInput, { passive: true });
    document.addEventListener("click", onClick, { capture: true, passive: true });
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      const p = page.current;
      if (p.active >= ENGAGED_SECONDS && !p.sentEngaged) {
        p.sentEngaged = true;
        track("engaged", { path: p.path, topics: pageTopics(p.path), meta: { seconds: String(p.active) } });
        flush(true);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      clearInterval(tick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("pointermove", onInput);
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);
}
