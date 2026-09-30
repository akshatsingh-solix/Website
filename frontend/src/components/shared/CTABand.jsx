import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTx } from "@/i18n/tx";
import { Magnetic, Reveal } from "./Reveal";
import { Picture } from "@/components/shared/Picture";
import { LiquidMetalMark } from "@/components/materials/LiquidMetalMark";
import { graphicsTier } from "@/lib/liveCanvas";
import { SplitWords } from "@/components/motion/KineticText";
import { ScrambleText } from "@/components/motion/Scramble";

/**
 * The closing "act" of every page: a navy panel that opens up as it
 * arrives (growing to full size - a transform, so it costs no repaints),
 * with a light beam running around its border on hover, a pointer-following
 * glow, the render drifting in parallax and a kinetic headline. It leads straight into the (also navy) footer, so each
 * page ends on one confident dark chord.
 *
 * With the default visual, the closing mark is live: the ring, rays and data
 * floor are a still render (key-bolt-stage, scripts/art) and the Solix bolt
 * standing in the ring is liquid metal (LiquidMetalMark), flowing only while
 * the band holds the page's live-canvas slot. key-bolt, the rendered bolt,
 * is its still fallback.
 */
const DEFAULT_IMAGE = "/Website/images/key-bolt.jpg";

// The stage render is 16:9 with the ring centred at 70% / 46.5% and a radius
// of 0.43 of its height. The stage box covers its slot like object-fit:
// cover (centred, via container query units), so the bolt stays centred in
// the ring at any size.
const BoltStage = () => {
  const [live] = useState(() => graphicsTier() !== "static");
  if (!live) return <Picture src={DEFAULT_IMAGE} sizes="(min-width: 1024px) 60vw, 100vw" className="h-full w-full object-cover" />;
  return (
    <div className="absolute inset-0 overflow-hidden [container-type:size]">
      <div className="absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2">
        <Picture src="/Website/images/key-bolt-stage.jpg" sizes="(min-width: 1024px) 60vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
        <LiquidMetalMark className="absolute left-[52.6%] top-[15.5%] h-[62%] w-[34.9%]" />
      </div>
    </div>
  );
};

export const CTABand = ({
  eyebrow = "Ready when you are",
  title = "See your data activated in a live demo.",
  description = "Bring one system you wish you could switch off, one dataset your AI team can't touch, or one audit you dread. We'll show you the path.",
  primary = { label: "Request a demo", to: "/contact" },
  secondary = { label: "Talk to an expert", to: "/contact?type=contact" },
  image = DEFAULT_IMAGE,
}) => {
  const tx = useTx();
  const ref = useRef(null);
  const glowRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const grow = useTransform(scrollYProgress, [0, 0.32], [0.92, 1]);

  const onMove = (e) => {
    const el = glowRef.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--gy", `${e.clientY - r.top}px`);
  };

  return (
    <section ref={ref} className="relative bg-background pb-20 pt-4 sm:pb-24" data-testid="cta-band">
      <div className="container">
        <motion.div style={{ scale: grow }}>
          <div
            ref={glowRef}
            onPointerMove={onMove}
            className="beam-border dark group relative isolate overflow-hidden rounded-[32px] bg-background text-foreground shadow-[0_60px_120px_-60px_rgba(13,25,45,0.7)]"
            style={{ "--gx": "30%", "--gy": "40%" }}
          >
            <motion.div style={{ y: imgY }} className="absolute inset-y-[-10%] right-0 -z-10 w-full lg:w-[60%]">
              {image === DEFAULT_IMAGE ? (
                <div className="absolute inset-0 opacity-60 sm:opacity-100"><BoltStage /></div>
              ) : (
                <Picture src={image} sizes="(min-width: 1024px) 60vw, 100vw" className="h-full w-full object-cover opacity-60 sm:opacity-100" />
              )}
            </motion.div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/90 to-background/20 lg:via-background/80 lg:to-transparent" />
            <div className="absolute inset-0 -z-10 grid-lines opacity-60" />
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: "radial-gradient(520px circle at var(--gx) var(--gy), rgba(238,36,36,0.22), rgba(0,136,207,0.12) 40%, transparent 65%)" }}
            />
            <div className="absolute -left-24 -top-24 -z-10 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.35),transparent)]" />
            <div className="grid gap-10 px-6 py-14 sm:px-12 sm:py-16 lg:grid-cols-12 lg:px-16 lg:py-24">
              <div className="lg:col-span-7">
                <ScrambleText as="p" text={tx(eyebrow)} className="eyebrow mb-5 block" />
                <h2 className="text-balance font-display text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-5xl lg:text-6xl">
                  <SplitWords text={tx(title)} />
                </h2>
                <Reveal delay={0.2}>
                  <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">{tx(description)}</p>
                </Reveal>
                <Reveal delay={0.3} className="mt-10 flex flex-wrap gap-3">
                  <Magnetic strength={0.3}>
                    <Button asChild size="lg" data-testid="cta-band-primary">
                      <Link to={primary.to}>{tx(primary.label)} <ArrowRight /></Link>
                    </Button>
                  </Magnetic>
                  {secondary && (
                    <Magnetic strength={0.3}>
                      <Button asChild size="lg" variant="glass" data-testid="cta-band-secondary">
                        <Link to={secondary.to}>{tx(secondary.label)}</Link>
                      </Button>
                    </Magnetic>
                  )}
                </Reveal>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
