import { useRef } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export const Reveal = ({ children, delay = 0, y = 28, className, once = true, blur = false, ...rest }) => (
  <motion.div
    initial={{ opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once, margin: "-60px" }}
    transition={{ duration: 0.7, ease, delay }}
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

export const Stagger = ({ children, className, stagger = 0.08, ...rest }) => (
  <motion.div
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, margin: "-60px" }}
    variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

export const Item = ({ children, className, y = 24 }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Cursor-pull hover: the child eases toward the pointer within a bounded radius, then springs back. */
export const Magnetic = ({ children, strength = 0.35, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 14, mass: 0.4 });

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: sx, y: sy }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/** Scroll-linked vertical drift, for depth between foreground content and background imagery/blobs. */
export const Parallax = ({ children, className, range = 60 }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const translate = useTransform(scrollYProgress, [0, 1], [-range, range]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: translate }}>{children}</motion.div>
    </div>
  );
};

/** Slow-drifting dual-tone gradient field — replaces a flat single blur-circle with layered ambient depth. */
export const AuroraField = ({ className }) => <div className={`aurora-field ${className || ""}`} aria-hidden="true" />;

/** Route-change transition: brief blur+fade+rise on the outgoing/incoming page. */
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease } },
  exit: { opacity: 0, y: -10, filter: "blur(6px)", transition: { duration: 0.32, ease } },
};
