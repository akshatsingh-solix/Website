import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ConciergeWidget } from "@/components/chat/ConciergeWidget";
import { pageTransitionVariants } from "@/components/shared/Reveal";

export const Layout = () => {
  const location = useLocation();
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
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ConciergeWidget />
    </div>
  );
};
