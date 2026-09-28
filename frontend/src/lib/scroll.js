/**
 * Programmatic window scrolling for in-page jumps (chapter rail, era tabs,
 * back to top, hash links).
 *
 * Wheel, touchpad and touch scrolling are left entirely to the browser: it
 * scrolls on the compositor thread, 1:1 with the fingers and with no added
 * easing, which is what keeps the page locked to the touchpad. Nothing here
 * intercepts or re-times user scrolling.
 */
export const scrollWindowTo = (target, { offset = 0, immediate = false } = {}) => {
  const behavior = immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
  if (typeof target === "number") {
    window.scrollTo({ top: target + offset, left: 0, behavior });
    return;
  }
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, left: 0, behavior });
};
