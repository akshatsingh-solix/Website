import { motion, useScroll, useSpring } from "framer-motion";

/** Hairline reading gauge across the top of the viewport, Solix Red into Solix Blue. */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary via-primary to-teal"
      style={{ scaleX }}
      data-testid="scroll-progress"
    />
  );
};
