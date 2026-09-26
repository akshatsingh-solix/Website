import { useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { cn } from "@/lib/utils";

const wrap = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

/**
 * A ribbon that drifts on its own and answers the scroll: scrolling speeds
 * it up (and flips its direction with the scroll direction), and the strip
 * leans into the motion. Hovering slows it to a crawl so items can be read.
 * `children` is rendered twice for a seamless loop.
 */
export const VelocityMarquee = ({ children, baseVelocity = -2.2, className, trackClassName, skew = true }) => {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  const skewX = useTransform(smooth, [-2500, 0, 2500], [7, 0, -7]);
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);
  const dir = useRef(1);
  const hover = useRef(false);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const f = factor.get();
    if (f < 0) dir.current = -1;
    else if (f > 0) dir.current = 1;
    let move = dir.current * baseVelocity * (delta / 1000);
    move += dir.current * move * f;
    if (hover.current) move *= 0.15;
    baseX.set(baseX.get() + move);
  });

  return (
    <div
      className={cn("overflow-hidden", className)}
      onMouseEnter={() => { hover.current = true; }}
      onMouseLeave={() => { hover.current = false; }}
    >
      <motion.div className={cn("flex w-max flex-nowrap will-change-transform", trackClassName)} style={{ x, skewX: skew && !reduce ? skewX : 0 }}>
        <div className="flex shrink-0 flex-nowrap">{children}</div>
        <div className="flex shrink-0 flex-nowrap" aria-hidden="true">{children}</div>
      </motion.div>
    </div>
  );
};
