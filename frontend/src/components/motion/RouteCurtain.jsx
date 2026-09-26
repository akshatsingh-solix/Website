import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SOURCE } from "@/data/site";
import { useTx } from "@/i18n/tx";
import { SolixMark } from "@/components/shared/Logo";
import { ScrambleText } from "./Scramble";

/**
 * Page-to-page transition: a navy curtain rises over the leaving page,
 * names the destination, and lifts off the arriving one. The layout swaps
 * routes (and ScrollToTop resets the scroll) at the moment the curtain fully
 * covers the screen, announced with ROUTE_SWAP_EVENT.
 */
export const ROUTE_SWAP_EVENT = "solix:route-swap";
/** Seconds until the curtain fully covers the viewport. The leaving page exits over exactly this long. */
export const CURTAIN_COVER = 0.42;
const TOTAL = 1.08;
const EASE = [0.76, 0, 0.24, 1];

export const curtainEnabled = () =>
  typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// i18n: destination names, translated at render.
const SECTION_LABELS = {
  "": "Home",
  platform: "Platform",
  products: "Products",
  solutions: "Solutions",
  "services-support": "Services & Support",
  industries: "Industries",
  resources: "Resources",
  company: "Company",
  careers: "Careers",
  partners: "Partners",
  newsroom: "Newsroom",
  contact: "Contact",
  account: "My trial",
};

// English source labels; translated at render.
const labelFor = (pathname) => {
  const [section, slug] = pathname.replace(/^\/+/, "").split("/");
  if (section === "products" && slug) return SOURCE.PRODUCTS.find((p) => p.slug === slug)?.name || "Products";
  if (section === "industries" && slug) return SOURCE.INDUSTRIES.find((i) => i.slug === slug)?.name || "Industries";
  return SECTION_LABELS[section ?? ""] || "Solix";
};

const CurtainRun = ({ label, onDone }) => {
  const tx = useTx();
  return (
    <motion.div
      className="dark pointer-events-auto fixed inset-0 z-[80] flex items-center justify-center bg-background text-foreground"
      initial={{ y: "100%" }}
      animate={{ y: ["100%", "0%", "0%", "-100%"] }}
      transition={{ duration: TOTAL, times: [0, CURTAIN_COVER / TOTAL, 0.52, 1], ease: [EASE, "linear", EASE] }}
      onAnimationComplete={onDone}
      aria-hidden="true"
      data-testid="route-curtain"
    >
      {/* Leading and trailing edges carry the brand pair, red into blue. */}
      <span className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-primary to-teal" />
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-teal via-primary to-primary" />
      <div className="absolute inset-0 grid-lines opacity-60" />
      <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.22),transparent)]" />
      <motion.div
        className="relative flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: [0, 1, 1, 0], y: [24, 0, 0, -30] }}
        transition={{ duration: TOTAL, times: [0.18, 0.4, 0.55, 0.78] }}
      >
        <SolixMark className="h-12 w-12 animate-[spin_2.4s_cubic-bezier(0.65,0,0.35,1)_infinite]" />
        <p className="font-display text-3xl font-medium tracking-tight sm:text-5xl">{tx(label)}</p>
        <ScrambleText text="SOLIX · SIGNAL" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground" duration={520} />
      </motion.div>
    </motion.div>
  );
};

export const RouteCurtain = () => {
  const { pathname } = useLocation();
  const [run, setRun] = useState(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!curtainEnabled()) return;
    setRun({ id: `${pathname}-${Date.now()}`, label: labelFor(pathname) });
  }, [pathname]);

  return <AnimatePresence>{run && <CurtainRun key={run.id} label={run.label} onDone={() => setRun(null)} />}</AnimatePresence>;
};
