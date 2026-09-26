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

export const Item = ({ children, className, y = 24, ...rest }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
    className={className}
    {...rest}
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

/** 3D cursor-tracked tilt, for cards that should feel physically present rather than flat. */
export const Tilt = ({ children, className, max = 8 }) => {
  const ref = useRef(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 300, damping: 25 });
  const sry = useSpring(ry, { stiffness: 300, damping: 25 });

  const onMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max * 2);
    rx.set(-py * max * 2);
  };
  const onMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 800 }}
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

/** Route-change transition, choreographed with RouteCurtain: the leaving
 * page sinks back as the curtain rises over it (CURTAIN_COVER seconds), and
 * the arriving page lifts into place as the curtain clears. */
// Opacity + transform only: a full-page `filter: blur()` forces the whole
// route to re-rasterise every frame of the transition.
export const pageTransitionVariants = {
  initial: { opacity: 0, y: 56 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.9, ease, delay: 0.14 } },
  exit: { opacity: 0.5, y: -64, scale: 0.985, transition: { duration: 0.42, ease: [0.76, 0, 0.24, 1] } },
};
