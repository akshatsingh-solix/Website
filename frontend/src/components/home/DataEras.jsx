import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { Activity, Archive, ArrowRight, Database, PowerOff, Sparkles, Vault } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { Picture } from "@/components/shared/Picture";
import { useMediaQuery } from "@/hooks/use-media-query";

const ERAS = [
  { icon: Database, era: "Active", title: "Live systems", desc: "ERP, CRM, SaaS and files in daily use.", to: "/products/common-data-platform", tone: "blue" },
  { icon: Activity, era: "Inactive", title: "Closed history", desc: "Closed years, completed orders, dormant records.", to: "/products/enterprise-archiving", tone: "blue" },
  { icon: Archive, era: "Archived", title: "Tiered & searchable", desc: "Moved out of production, one click away.", to: "/products/enterprise-archiving", tone: "ink" },
  { icon: PowerOff, era: "Retired", title: "Application switched off", desc: "Licenses cancelled, data and context preserved.", to: "/products/application-retirement", tone: "ink" },
  { icon: Vault, era: "Preserved", title: "Governed for decades", desc: "Retention, legal hold, defensible deletion.", to: "/solutions#data-preservation", tone: "red" },
  { icon: Sparkles, era: "Activated", title: "Fuel for AI", desc: "Every era becomes governed input for agents and analytics.", to: "/products/enterprise-ai", tone: "red" },
];

const TONE = {
  blue: "text-teal",
  ink: "text-foreground",
  red: "text-primary-ink",
};

const EraCard = ({ e, i, lit, className }) => {
  const tx = useTx();
  return (
    <Link
      to={e.to}
      className={cn(
        "spot group relative flex flex-col overflow-hidden rounded-3xl border bg-background p-7 transition-[border-color,box-shadow,transform] duration-500",
        lit ? "border-primary/30 shadow-lift" : "border-line/10 shadow-soft",
        className
      )}
      data-testid={`era-${ERAS[i].era.toLowerCase()}`}
    >
      <span className="text-outline pointer-events-none absolute -right-2 -top-6 font-display text-[9rem] font-semibold leading-none tracking-tighter" aria-hidden="true">
        0{i + 1}
      </span>
      <span className={cn("relative grid h-14 w-14 place-items-center rounded-2xl border transition-[background-color,border-color,color] duration-500", lit ? "border-primary bg-primary text-primary-foreground" : cn("border-line/10 bg-muted", TONE[e.tone]))}>
        {lit && <span className="absolute inset-0 animate-pulse-ring rounded-2xl border border-primary" />}
        <e.icon className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <p className="relative mt-10 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">0{i + 1} · {e.era}</p>
      <h3 className="relative mt-2 font-display text-2xl font-medium leading-snug tracking-tight text-foreground">{e.title}</h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
      <span className="relative mt-auto inline-flex items-center gap-1 pt-8 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">
        {tx("Learn more")} <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
};

/**
 * Chapter 02, the record's journey. On desktop the section pins and the
 * scroll drives a horizontal track through the six eras, with a "record"
 * travelling the rail above and each era lighting as it passes. On smaller
 * screens it is a vertical timeline whose line fills as you read.
 */
export const DataEras = () => {
  const tx = useTx();
  const eras = useLocalized(ERAS);
  const wide = useMediaQuery("(min-width: 1024px)");
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [distance, setDistance] = useState(0);
  const [lit, setLit] = useState(-1);

  useLayoutEffect(() => {
    if (!wide) return undefined;
    const measure = () => {
      const el = trackRef.current;
      if (el) setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [wide]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: wide ? ["start start", "end end"] : ["start 70%", "end 60%"] });
  const p = useSpring(scrollYProgress, { stiffness: 110, damping: 28, restDelta: 0.0005 });
  const x = useTransform(p, [0, 1], [0, -distance]);
  // Desktop: the intro panels fill the first ~28% of the track, then the eras
  // pass one by one; the rail marker reaches each era's tick as it lights.
  const start = wide ? 0.28 : 0;
  const span = wide ? 0.72 : 1;
  const rail = useTransform(p, [start, start + (span * (ERAS.length - 1)) / ERAS.length], [0, 1]);
  useMotionValueEvent(scrollYProgress, "change", (v) => setLit(v < start ? -1 : Math.min(ERAS.length - 1, Math.floor(((v - start) / span) * ERAS.length))));

  const intro = (
    <div className={cn("flex flex-col justify-center", wide && "w-[min(560px,40vw)] shrink-0 pr-6")}>
      <SectionHeading chapter="02" eyebrow="The lifecycle" title="One lifecycle. One platform. No dead ends." description="Most vendors serve one moment in a record's life. Solix follows the record from the day it is created to the day an AI agent asks about it, and every policy travels with it." />
      <Reveal delay={0.1} className="mt-8 grid grid-cols-3 divide-x divide-line/10 rounded-2xl border border-line/10 bg-background shadow-soft">
        {[["6", tx("data eras")], ["1", tx("policy layer")], ["0", tx("dead ends")]].map(([v, l]) => (
          <div key={l} className="px-4 py-4 sm:px-5">
            <p className="font-display text-3xl font-semibold tracking-tight text-foreground">{v}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{l}</p>
          </div>
        ))}
      </Reveal>
    </div>
  );

  const figure = (
    <figure className={cn("dark relative overflow-hidden rounded-3xl border border-line/10 bg-background shadow-[0_40px_90px_-45px_rgba(13,25,45,0.55)]", wide ? "h-[min(62vh,520px)] w-[min(640px,46vw)] shrink-0" : "mt-10")}>
      <Picture src="/Website/images/data-eras-ribbon.jpg" sizes="(min-width: 1024px) 46vw, 100vw" alt={tx("Data moving from tape archives through servers into an AI core")} className={cn("w-full object-cover", wide ? "h-full" : "aspect-[16/9]")} />
      <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-background/90 to-transparent px-5 pb-4 pt-12 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/85 sm:px-6">
        <span>{tx("Tape")}</span><span className="h-px flex-1 bg-gradient-to-r from-teal/70 to-transparent" />
        <span>{tx("Servers")}</span><span className="h-px flex-1 bg-gradient-to-r from-teal/70 to-primary/70" />
        <span>{tx("Cloud")}</span><span className="h-px flex-1 bg-gradient-to-r from-primary/70 to-primary" />
        <span className="text-primary-ink">{tx("AI")}</span>
      </figcaption>
    </figure>
  );

  if (!wide) {
    return (
      <section ref={sectionRef} className="relative overflow-hidden bg-muted py-16 sm:py-20" id="the-lifecycle">
        <div className="container">
          {intro}
          {figure}
          <div className="relative mt-12 pl-10" data-testid="data-eras-flow">
            <span className="absolute bottom-4 left-[15px] top-4 w-px bg-line/15" />
            <motion.span className="absolute left-[15px] top-4 w-px origin-top bg-gradient-to-b from-teal via-primary to-primary" style={{ scaleY: rail, bottom: 16 }} />
            <div className="grid gap-4 sm:grid-cols-2">
              {eras.map((e, i) => (
                <Reveal key={e.era} delay={0.04 * i} className="relative flex">
                  <span className={cn("absolute -left-10 top-8 grid h-[30px] w-[30px] place-items-center rounded-full border-2 bg-muted font-mono text-[9px] transition-colors duration-500 sm:hidden", i <= lit ? "border-primary text-primary-ink" : "border-line/20 text-muted-foreground")}>{i + 1}</span>
                  <EraCard e={e} i={i} lit={i === lit} className="w-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="relative bg-muted" id="the-lifecycle" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-lines opacity-60 [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
        {/* The rail: a record travels from Active to Activated. */}
        <div className="container relative mb-8" aria-hidden="true">
          <div className="relative h-8">
            <span className="absolute inset-x-0 top-1/2 h-px bg-line/15" />
            <motion.span className="absolute inset-x-0 top-1/2 h-[2px] origin-left bg-gradient-to-r from-teal via-primary to-primary" style={{ scaleX: rail }} />
            <div className="absolute inset-0 flex items-center justify-between">
              {eras.map((e, i) => (
                <span key={e.era} className={cn("flex items-center gap-2 bg-muted pr-3 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500", i <= lit ? "text-foreground" : "text-muted-foreground/60")}>
                  <span className={cn("h-2.5 w-2.5 rounded-full border-2 transition-colors duration-500", i <= lit ? "border-primary bg-primary" : "border-line/30 bg-muted")} />
                  {e.era}
                </span>
              ))}
            </div>
          </div>
        </div>
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex w-max items-stretch gap-6 pl-[max(2.5rem,calc((100vw-1320px)/2+2.5rem))] pr-[10vw] will-change-transform"
          data-testid="data-eras-flow"
        >
          {intro}
          {figure}
          {eras.map((e, i) => (
            <EraCard key={e.era} e={e} i={i} lit={i === lit} className="h-[min(62vh,520px)] w-[340px] shrink-0" />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
