import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { scrollWindowTo } from "@/components/motion/SmoothScroll";
import { ROUTE_SWAP_EVENT, curtainEnabled } from "@/components/motion/RouteCurtain";

const NAV_OFFSET = -96;

/**
 * Resets the scroll position on navigation. When the route curtain is
 * playing, the jump waits until the curtain covers the screen (the layout
 * fires ROUTE_SWAP_EVENT as the old page finishes leaving), so visitors never
 * see the old page snap to the top.
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const lastPath = useRef(pathname);

  useEffect(() => {
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;

    let timer;
    let tries = 0;
    const goToHash = () => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) scrollWindowTo(el, { offset: NAV_OFFSET });
      else if (tries++ < 20) timer = setTimeout(goToHash, 100);
    };
    const run = () => {
      if (hash) {
        // The target may render a moment later (lazy page, staggered sections).
        if (!document.getElementById(decodeURIComponent(hash.slice(1)))) scrollWindowTo(0, { immediate: true });
        timer = setTimeout(goToHash, 80);
      } else {
        scrollWindowTo(0, { immediate: true });
      }
    };

    if (pathChanged && curtainEnabled()) {
      const onSwap = () => { clearTimeout(fallback); run(); };
      const fallback = setTimeout(onSwap, 900);
      window.addEventListener(ROUTE_SWAP_EVENT, onSwap, { once: true });
      return () => {
        clearTimeout(fallback);
        clearTimeout(timer);
        window.removeEventListener(ROUTE_SWAP_EVENT, onSwap);
      };
    }
    run();
    return () => clearTimeout(timer);
  }, [pathname, hash]);

  return null;
};
