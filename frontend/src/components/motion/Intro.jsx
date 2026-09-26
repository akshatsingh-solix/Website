import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { slowConnection } from "@/lib/net";
import { useTx } from "@/i18n/tx";

/**
 * First-visit ident (once per browser session): the Solix bolt draws itself
 * inside its ring while a counter runs to 100, the wordmark rises, then the
 * whole panel wipes upward to open the site. About 1.8s, click to skip.
 * Never shown for reduced motion, slow connections or automated browsers
 * (append ?intro=1 to force it).
 *
 * Hero entrances wait for it through useIntroDone(), so their animation
 * plays for the visitor rather than behind the panel.
 */
const KEY = "solix:intro-seen";
const HOLD_MS = 1500;

let active = false;
const subs = new Set();
const setActive = (v) => { active = v; subs.forEach((fn) => fn()); };
const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

const shouldPlay = () => {
  if (typeof window === "undefined") return false;
  const forced = /[?&]intro=1\b/.test(window.location.search);
  if (forced) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (navigator.webdriver || slowConnection()) return false;
  try {
    if (sessionStorage.getItem(KEY)) return false;
  } catch {
    return false;
  }
  return true;
};

// Decided once at module load so the very first render already knows.
active = shouldPlay();

/** True once the intro has finished (or when there is none). */
export const useIntroDone = () => !useSyncExternalStore(subscribe, () => active, () => false);

const LETTERS = ["S", "O", "L", "I", "X"];
const EASE = [0.76, 0, 0.24, 1];

export const Intro = () => {
  const tx = useTx();
  const [show, setShow] = useState(active);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!show) return undefined;
    try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / (HOLD_MS - 250));
      setCount(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const done = setTimeout(() => setShow(false), HOLD_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [show]);

  return (
    <AnimatePresence onExitComplete={() => setActive(false)}>
      {show && (
        <motion.div
          key="intro"
          className="dark fixed inset-0 z-[90] flex cursor-pointer items-center justify-center overflow-hidden bg-background text-foreground"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)", transition: { duration: 0.75, ease: EASE } }}
          onClick={() => setShow(false)}
          data-testid="intro"
          aria-hidden="true"
        >
          <div className="absolute inset-0 grid-lines grid-fade" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.25),rgba(0,136,207,0.08)_55%,transparent)]"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div className="relative flex flex-col items-center" exit={{ y: -60, opacity: 0, transition: { duration: 0.5, ease: EASE } }}>
            <svg viewBox="0 0 40 40" className="h-24 w-24 sm:h-28 sm:w-28">
              <motion.circle
                cx="20" cy="20" r="18.5" fill="none" stroke="#EE2424" strokeWidth="1.2"
                initial={{ pathLength: 0, rotate: -90 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                style={{ originX: "50%", originY: "50%" }}
              />
              <motion.circle
                cx="20" cy="20" r="20" fill="#EE2424"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                style={{ originX: "50%", originY: "50%" }}
              />
              <motion.path
                d="M23.5 3.5 10.5 22.5h8.2L15.2 37 30 17h-8.2L26 3.5Z"
                fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="0.6" strokeLinejoin="round"
                initial={{ pathLength: 0, fillOpacity: 0 }}
                animate={{ pathLength: 1, fillOpacity: 1 }}
                transition={{ pathLength: { duration: 0.8, delay: 0.15, ease: "easeInOut" }, fillOpacity: { delay: 0.9, duration: 0.3 } }}
              />
            </svg>
            <div className="mt-8 flex overflow-hidden font-display text-4xl font-semibold tracking-[0.3em] sm:text-5xl">
              {LETTERS.map((l, i) => (
                <motion.span key={l} initial={{ y: "110%" }} animate={{ y: "0%" }} transition={{ delay: 0.35 + i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
                  {l}
                </motion.span>
              ))}
            </div>
            <motion.p
              className="mt-4 font-mono text-[10px] uppercase tracking-[0.32em] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {tx("Empowering the Data-driven Enterprise")}
            </motion.p>
          </motion.div>
          <div className="absolute bottom-8 left-6 right-6 flex items-end justify-between font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground sm:bottom-10 sm:left-10 sm:right-10">
            <span>{tx("Signal")} / {String(count).padStart(3, "0")}</span>
            <span className="hidden sm:inline">{tx("Governed · Preserved · Activated")}</span>
          </div>
          <motion.span
            className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-primary to-teal"
            style={{ width: `${count}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
