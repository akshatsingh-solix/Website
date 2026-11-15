import { Suspense, useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { MotionConfig, motion, useIsPresent } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { LazyConcierge } from "@/components/chat/LazyConcierge";
import { pageTransitionVariants } from "@/components/shared/Reveal";
import { ConsentBanner } from "@/components/shared/ConsentBanner";
import { EmpowerPromo } from "@/components/shared/EmpowerPromo";
import { useIntentTracking } from "@/lib/useIntentTracking";
import { RouteCurtain, ROUTE_SWAP_EVENT } from "@/components/motion/RouteCurtain";
import { SafePresence } from "@/components/motion/SafePresence";
import { RouteErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { Intro } from "@/components/motion/Intro";
import { usePointerSpotlight } from "@/components/motion/spotlight";
import { SearchHost } from "@/components/search/SearchHost";

// The live route element - until this page starts leaving. While it plays
// its exit under the curtain it must keep showing itself, not the route
// being navigated to (a plain <Outlet /> would re-render with the new one).
// While present it stays live, so a language switch still re-renders it.
const FrozenOutlet = () => {
  const outlet = useOutlet();
  const present = useIsPresent();
  const last = useRef(outlet);
  if (present) last.current = outlet;
  return last.current;
};

export const Layout = () => {
  const location = useLocation();
  useIntentTracking();
  usePointerSpotlight();
  return (
    // reducedMotion="user": for visitors who ask for less motion, framer
    // skips transform/layout animation sitewide and keeps simple fades.
    <MotionConfig reducedMotion="user">
    <div className="relative min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <ScrollProgress />
      <Navbar />
      <main>
        {/* SafePresence: if a page's exit ever stalls, the next page still shows (no half-faded screen). */}
        <SafePresence swapKey={location.pathname} mode="wait" initial={false} onExitComplete={() => window.dispatchEvent(new Event(ROUTE_SWAP_EVENT))}>
          <motion.div
            key={location.pathname}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <RouteErrorBoundary minHeight="min-h-[70vh]">
              <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
                <FrozenOutlet />
              </Suspense>
            </RouteErrorBoundary>
          </motion.div>
        </SafePresence>
      </main>
      <Footer />
      <RouteCurtain />
      <SearchHost />
      <Intro />
      <LazyConcierge />
      <ConsentBanner />
      <EmpowerPromo />
    </div>
    </MotionConfig>
  );
};
