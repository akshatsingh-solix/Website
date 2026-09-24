import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ConciergeWidget } from "@/components/chat/ConciergeWidget";
import { pageTransitionVariants } from "@/components/shared/Reveal";
import { ConsentBanner } from "@/components/shared/ConsentBanner";
import { EmpowerPromo } from "@/components/shared/EmpowerPromo";
import { useIntentTracking } from "@/lib/useIntentTracking";

export const Layout = () => {
  const location = useLocation();
  useIntentTracking();
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <ScrollToTop />
      <Navbar />
      <main>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ConciergeWidget />
      <ConsentBanner />
      <EmpowerPromo />
    </div>
  );
};
