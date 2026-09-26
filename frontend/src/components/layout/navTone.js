import { useEffect, useState } from "react";

/**
 * Lets dark (navy) hero sections tell the fixed navbar to switch to its
 * light-on-dark treatment while it sits over them. A hero registers its
 * element with useDarkSurface(ref); the navbar asks useOverDarkSurface().
 */
const surfaces = new Set();
const subs = new Set();
const notify = () => subs.forEach((fn) => fn());

export const useDarkSurface = (ref) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    surfaces.add(el);
    notify();
    return () => {
      surfaces.delete(el);
      notify();
    };
  }, [ref]);
};

/** True while the band at `probe` px from the top of the viewport is over a registered dark surface. */
export const useOverDarkSurface = (probe = 40) => {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      let d = false;
      surfaces.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) d = true;
      });
      setDark(d);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    subs.add(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      subs.delete(schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [probe]);
  return dark;
};
