import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Inertial wheel scrolling (Lenis) for the public site. Lenis drives the
 * real window scroll position, so position: sticky, framer-motion's
 * useScroll and anchor links keep working unchanged.
 *
 * Left off for touch screens (the OS already has momentum scrolling) and for
 * visitors who prefer reduced motion. It pauses while a Radix dialog, sheet
 * or select holds the scroll lock, so the page behind a modal stays still,
 * and scrollable panels (chat, menus, dialogs) keep their own native scroll.
 */
let instance = null;

/** The running Lenis instance, or null when smoothing is off. */
export const getLenis = () => instance;

/** Scroll the window, through Lenis when it is running so its own target stays in sync. */
export const scrollWindowTo = (target, { offset = 0, immediate = false } = {}) => {
  if (instance) {
    instance.scrollTo(target, { offset, immediate, force: true });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, left: 0, behavior: immediate ? "instant" : "smooth" });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, left: 0, behavior: immediate ? "instant" : "smooth" });
};

const NESTED = "[role='dialog'],[role='listbox'],[role='menu'],[data-radix-scroll-area-viewport],[data-lenis-prevent],textarea";

export const SmoothScroll = () => {
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (coarse || reduce) return undefined;

    const lenis = new Lenis({
      lerp: 0.095,
      wheelMultiplier: 0.95,
      autoRaf: true,
      allowNestedScroll: true,
      stopInertiaOnNavigate: true,
      prevent: (node) => Boolean(node?.matches?.(NESTED)),
    });
    instance = lenis;

    // react-remove-scroll (Radix Dialog / Sheet / Select) marks the body while it locks scrolling.
    const body = document.body;
    const sync = () => (body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start());
    const observer = new MutationObserver(sync);
    observer.observe(body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    sync();

    return () => {
      observer.disconnect();
      lenis.destroy();
      instance = null;
    };
  }, []);
  return null;
};
