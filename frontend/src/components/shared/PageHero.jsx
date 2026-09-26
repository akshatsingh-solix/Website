import { useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { Reveal } from "./Reveal";
import { SignalField } from "@/components/motion/signal/SignalField";
import { SplitWords } from "@/components/motion/KineticText";
import { ScrambleText } from "@/components/motion/Scramble";
import { useDarkSurface } from "@/components/layout/navTone";

const ease = [0.22, 1, 0.36, 1];

// Every section of the site opens on its own shape in the live data field.
const FORMATION_BY_SECTION = {
  platform: "cube",
  products: "stack",
  solutions: "helix",
  "services-support": "ring",
  industries: "globe",
  resources: "grid",
  company: "bolt",
  careers: "cloud",
  partners: "ring",
  newsroom: "grid",
};

const sectionOf = (pathname) => pathname.replace(/^\/+/, "").split("/")[0];

/**
 * Inner-page hero: a navy stage with the live SignalField gathering into
 * the section's formation (a cube for the platform, stacked layers for
 * products, a globe for industries...), copy that decodes and rises in on
 * the left, and the page's render in a framed window on the right that
 * scans in and tilts toward the pointer. Scrolling away dissolves the field
 * back into noise while the copy drifts up and fades.
 *
 * With an `image`, the render is framed on the right and any `children`
 * (usually CTAs) sit under the copy. Without one, `children` take the right
 * column. `media` replaces the image with a live element in the same slot.
 */
export const PageHero = ({ eyebrow, title, description, crumbs = [], children, image, media, className, compact = false, formation }) => {
  const tx = useTx();
  const { pathname } = useLocation();
  const ref = useRef(null);
  useDarkSurface(ref);
  const shape = formation || FORMATION_BY_SECTION[sectionOf(pathname)] || "sphere";
  const framed = Boolean(image || media);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const field = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const frameY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  // The whole slab recedes a touch as the page moves on.
  const slabScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);

  // Pointer tilt for the framed visual.
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 18 });
  const sry = useSpring(ry, { stiffness: 120, damping: 18 });
  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 8);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  // Formations sit to the right of the copy on desktop, behind it (dimmed) on phones.
  // With a framed render, the shape is scaled up around the frame, so it reads as a halo of data.
  const place = framed ? { x: 0.5, y: -0.02, scale: 1.32, mx: 0.2, my: 0.3 } : { x: 0.46, y: -0.02, scale: 0.92, mx: 0.25, my: 0.28 };

  const copy = (
    <>
      {eyebrow && <ScrambleText as="p" text={tx(eyebrow)} trigger="mount" className="eyebrow mb-5 block" delay={150} />}
      <h1 className={cn("text-balance font-display font-medium tracking-[-0.035em] text-foreground", compact ? "text-[clamp(2rem,1.5rem+2.2vw,3.5rem)] leading-[1.04]" : "text-[clamp(2.4rem,1.6rem+3.2vw,4.6rem)] leading-[0.98]")}>
        <SplitWords text={tx(title)} play delay={0.25} stagger={0.05} />
      </h1>
      {description && (
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease, delay: 0.55 }} className="mt-7 max-w-2xl text-fluid-lead text-muted-foreground">
          {tx(description)}
        </motion.p>
      )}
    </>
  );

  return (
    <motion.section ref={ref} style={{ scale: slabScale, transformOrigin: "50% 0%" }} className={cn("dark relative isolate overflow-hidden rounded-b-[2rem] bg-background text-foreground sm:rounded-b-[3rem]", className)} data-testid="page-hero">
      <div className="absolute inset-0 -z-10 grid-lines grid-fade opacity-80" />
      <div className="absolute -z-10 right-[-8%] top-1/2 h-[80vmin] w-[80vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.2),transparent)]" />
      <div className="absolute -z-10 left-[-12%] top-[-25%] h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.13),transparent)]" />
      <div className="absolute inset-0 -z-10">
        <SignalField formations={["cloud", shape]} progress={field} place={place} density={0.7} />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-background/90 via-background/50 to-transparent lg:w-[65%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute inset-0 -z-10 grain" />

      <div className={cn("container relative", compact ? "pb-14 pt-32 sm:pb-16 sm:pt-36 md:pt-44" : "flex min-h-[74vh] flex-col justify-center pb-16 pt-32 sm:pb-20 sm:pt-36 md:pt-44 lg:min-h-[86vh]")}>
        {crumbs.length > 0 && (
          <Reveal className="mb-8 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground" y={10}>
            <Link to="/" className="transition-colors hover:text-foreground" data-testid="crumb-home">{tx("Home")}</Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-2">
                <ChevronRight className="h-3 w-3" />
                {c.to ? <Link to={c.to} className="transition-colors hover:text-foreground">{tx(c.label)}</Link> : <span className="line-clamp-1 max-w-[40ch] text-foreground">{tx(c.label)}</span>}
              </span>
            ))}
          </Reveal>
        )}

        {framed ? (
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-12">
            <motion.div style={{ y: copyY, opacity: copyOpacity }} className="lg:col-span-7">
              {copy}
              {children && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.7 }} className="mt-9">
                  {children}
                </motion.div>
              )}
            </motion.div>
            <motion.div style={{ y: frameY }} className="relative lg:col-span-5" onPointerMove={onMove} onPointerLeave={onLeave}>
              <motion.div
                initial={{ clipPath: "inset(100% 0% 0% 0% round 24px)", opacity: 0.4 }}
                animate={{ clipPath: "inset(0% 0% 0% 0% round 24px)", opacity: 1 }}
                transition={{ duration: 1.2, ease, delay: 0.35 }}
                style={{ rotateX: srx, rotateY: sry, transformPerspective: 1000 }}
                className="relative"
              >
                {media ? (
                  <div className="relative rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.2),0_50px_100px_-45px_rgba(0,0,0,0.85)]">{media}</div>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl border border-line/15 bg-background shadow-[0_2px_6px_rgba(0,0,0,0.2),0_50px_100px_-45px_rgba(0,0,0,0.85)]">
                    <motion.img src={image} alt="" style={{ y: imgY, scale: 1.12 }} className="aspect-[4/3] w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/80">{tx(eyebrow || "Solix")}</span>
                      <span className="flex gap-1.5" aria-hidden="true">
                        <span className="h-2 w-2 rounded-full bg-line/30" />
                        <span className="h-2 w-2 rounded-full bg-line/30" />
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      </span>
                    </div>
                  </div>
                )}
                {/* One scan pass across the window as it opens. */}
                <motion.span
                  aria-hidden="true"
                  className="scanline pointer-events-none absolute inset-x-0 top-0 h-1/3"
                  initial={{ y: "-100%", opacity: 1 }}
                  animate={{ y: "320%", opacity: 0 }}
                  transition={{ duration: 1.6, ease: "easeInOut", delay: 0.6 }}
                />
              </motion.div>
            </motion.div>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <motion.div style={{ y: copyY, opacity: copyOpacity }} className="lg:col-span-8">{copy}</motion.div>
            {children && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.6 }} className="lg:col-span-4 lg:justify-self-end">
                {children}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};
