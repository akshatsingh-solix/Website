import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { Activity, Archive, ArrowRight, Database, Plug, PowerOff, ShieldCheck, Sparkles, Vault } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { useLocalized } from "@/i18n/localize";
import { ChapterMark } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { Picture } from "@/components/shared/Picture";
import { SplitWords } from "@/components/motion/KineticText";
import { scrollWindowTo } from "@/components/motion/SmoothScroll";
import { useDarkSurface } from "@/components/layout/navTone";
import { useMediaQuery } from "@/hooks/use-media-query";

// Each era of a record's life, the platform move that handles it, and the
// layer of the stack (key-slabs render) that does the work.
const ERAS = [
  { icon: Database, era: "Active", title: "Live systems", desc: "ERP, CRM, SaaS and files in daily use. 150+ connectors read them in place, with full context intact.", to: "/products/common-data-platform", product: "Common Data Platform" },
  { icon: Activity, era: "Inactive", title: "Closed history", desc: "Closed years, completed orders, dormant records: still retained, slowing production and inflating every upgrade.", to: "/products/enterprise-archiving", product: "Enterprise Archiving" },
  { icon: Archive, era: "Archived", title: "Tiered & searchable", desc: "Moved out of production to low-cost tiers, and still one search away for the business and for audit.", to: "/products/enterprise-archiving", product: "Enterprise Archiving" },
  { icon: PowerOff, era: "Retired", title: "Application switched off", desc: "Licenses cancelled and servers decommissioned, with the data and its business context preserved.", to: "/products/application-retirement", product: "Application Retirement" },
  { icon: Vault, era: "Preserved", title: "Governed for decades", desc: "Retention, legal hold and defensible deletion are applied once, in the Preservation Zone, and travel with every record.", to: "/solutions#data-preservation", product: "Data Preservation" },
  { icon: Sparkles, era: "Activated", title: "Fuel for AI", desc: "Every era becomes governed input for agents, copilots and analytics, without a single shadow copy.", to: "/products/enterprise-ai", product: "Enterprise AI" },
];

// Lookup keys per era (kept out of ERAS so the localizer never touches them).
// no-i18n
const ERA_META = [
  { move: "sources", layer: "foundation" },
  { move: "core", layer: "optimize" },
  { move: "core", layer: "optimize" },
  { move: "core", layer: "optimize" },
  { move: "core", layer: "comply" },
  { move: "outcomes", layer: "activate" },
];

// i18n: labels translated at render.
const MOVES = [
  { key: "sources", icon: Plug, label: "Connect" },
  { key: "core", icon: ShieldCheck, label: "Govern" },
  { key: "outcomes", icon: Sparkles, label: "Activate" },
];

// Where each layer sits in the render (percent of the 4:3 frame): the left
// corner a label points at, and the band a highlight sweeps across.
// i18n: labels translated at render.
const LAYERS = {
  activate: { label: "Activate", y: 27, band: 30, tone: "red" },
  comply: { label: "Comply", y: 41, band: 44, tone: "blue" },
  optimize: { label: "Optimize & Modernize", y: 55, band: 57, tone: "blue" },
  foundation: { label: "Foundation", y: 67, band: 70, tone: "blue" },
};

const StackVisual = ({ layer }) => {
  const tx = useTx();
  const active = LAYERS[layer];
  return (
    <div className="beam-border relative overflow-hidden rounded-3xl border border-line/10 bg-background shadow-[0_60px_120px_-50px_rgba(0,0,0,0.85)]">
      <div className="relative aspect-[4/3]">
        <Picture src="/Website/images/key-slabs.jpg" sizes="(min-width: 1024px) 58vw, 100vw" alt={tx("Four governed platform layers stacked as glass, with data rising between them")} className="absolute inset-0 h-full w-full object-cover" />
        {/* Light sweeping the active layer. */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 h-[16%] mix-blend-screen"
          animate={{ top: `${active.band - 8}%` }}
          transition={{ type: "spring", stiffness: 70, damping: 18 }}
          style={{ background: `radial-gradient(60% 50% at 50% 50%, ${active.tone === "red" ? "rgba(238,36,36,0.55)" : "rgba(0,136,207,0.55)"}, transparent 70%)` }}
        />
        {Object.entries(LAYERS).map(([key, l]) => {
          const on = key === layer;
          return (
            <div key={key} className="absolute left-3 flex -translate-y-1/2 items-center gap-2 sm:left-4" style={{ top: `${l.y}%` }}>
              <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur transition-[background-color,border-color,color] duration-500", on ? (l.tone === "red" ? "border-primary bg-primary text-primary-foreground" : "border-teal bg-teal text-white") : "border-line/15 bg-background/50 text-muted-foreground")}>
                {tx(l.label)}
              </span>
              <span className={cn("h-px w-6 transition-colors duration-500 sm:w-10", on ? "bg-foreground/70" : "bg-line/20")} />
              <span className={cn("h-2 w-2 rounded-full transition-colors duration-500", on ? "bg-foreground" : "bg-line/30")}>
                {on && <span className="block h-2 w-2 animate-ping rounded-full bg-foreground/70" />}
              </span>
            </div>
          );
        })}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/90 to-transparent" />
        <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 text-center sm:inset-x-6 sm:bottom-6">
          {[["150+", tx("connectors")], ["1", tx("policy layer")], ["0", tx("shadow copies")]].map(([v, l]) => (
            <div key={l} className="rounded-xl border border-line/10 bg-background/55 px-2 py-2.5 backdrop-blur-md">
              <p className="font-display text-xl font-semibold sm:text-2xl">{v}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const EraDetail = ({ e, i }) => {
  const tx = useTx();
  const move = MOVES.find((m) => m.key === ERA_META[i].move);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={e.era}
        initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -16, filter: "blur(4px)" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <span className="text-outline pointer-events-none absolute -left-1 -top-14 select-none font-display text-[8rem] font-semibold leading-none tracking-tighter" aria-hidden="true">0{i + 1}</span>
        <div className="relative flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><e.icon className="h-6 w-6" strokeWidth={1.5} /></span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{tx("Era")} 0{i + 1} / 06</p>
            <p className="font-display text-xl font-medium">{e.era}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-line/5 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-foreground">
            <move.icon className="h-3.5 w-3.5 text-teal" /> {tx(move.label)}
          </span>
        </div>
        <h3 className="relative mt-6 font-display text-3xl font-medium tracking-tight sm:text-4xl">{e.title}</h3>
        <p className="relative mt-3 max-w-md text-base leading-relaxed text-foreground/75">{e.desc}</p>
        <Link to={e.to} className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground link-underline">
          {e.product} <ArrowRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Chapter 02 in one frame: the record's whole life and the platform that
 * carries it. On desktop the frame pins; scrolling walks the six eras while
 * the rendered layer stack lights the layer doing the work and the steps
 * above it show the move (connect, govern, activate). Tabs jump straight to
 * an era. Phones get the same content as a list.
 */
export const PlatformFrame = () => {
  const tx = useTx();
  const eras = useLocalized(ERAS);
  const wide = useMediaQuery("(min-width: 1024px)");
  const ref = useRef(null);
  useDarkSurface(ref);
  const [idx, setIdx] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 28 });
  useMotionValueEvent(scrollYProgress, "change", (v) => { if (wide) setIdx(Math.min(ERAS.length - 1, Math.max(0, Math.floor(v * ERAS.length)))); });
  const e = eras[idx];

  const goTo = (i) => {
    const el = ref.current;
    if (!el || !wide) { setIdx(i); return; }
    const top = el.getBoundingClientRect().top + window.scrollY;
    const span = el.offsetHeight - window.innerHeight;
    scrollWindowTo(top + span * ((i + 0.5) / ERAS.length));
  };

  const heading = (
    <div>
      <ChapterMark n="02" label="The platform" />
      <h2 className="text-balance font-display text-[clamp(1.85rem,1.35rem+1.8vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em]">
        <SplitWords text={tx("One lifecycle. One governed platform. No dead ends.")} />
      </h2>
    </div>
  );

  const steps = (
    <div className="flex flex-wrap items-center gap-2" role="list">
      {MOVES.map((m, i) => {
        const on = m.key === ERA_META[idx].move;
        return (
          <span key={m.key} role="listitem" data-testid={`platform-step-${m.key}`} aria-current={on || undefined} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] transition-[background-color,border-color,color] duration-500", on ? "border-primary/60 bg-primary/15 text-foreground" : "border-line/10 text-muted-foreground")}>
            <m.icon className={cn("h-3.5 w-3.5", on ? "text-primary-ink" : "")} /> 0{i + 1} {tx(m.label)}
          </span>
        );
      })}
    </div>
  );

  const tabs = (
    <div className="grid grid-cols-6 gap-1.5" data-testid="data-eras-flow" role="tablist" aria-label={tx("Data eras")}>
      {eras.map((x, i) => (
        <button
          key={x.era}
          type="button"
          role="tab"
          aria-selected={i === idx}
          onClick={() => goTo(i)}
          data-testid={`era-${ERAS[i].era.toLowerCase()}`}
          className="group text-left"
        >
          <span className="block h-[3px] overflow-hidden rounded-full bg-line/15">
            <span className={cn("block h-full rounded-full transition-[width,background-color] duration-500", i < idx ? "w-full bg-teal" : i === idx ? "w-full bg-primary" : "w-0 bg-line/30")} />
          </span>
          <span className={cn("mt-2 block truncate font-mono text-[10px] uppercase tracking-[0.14em] transition-colors", i === idx ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>{x.era}</span>
        </button>
      ))}
    </div>
  );

  if (!wide) {
    return (
      <section ref={ref} className="dark relative overflow-hidden bg-background py-20 text-foreground" id="the-platform" data-testid="platform-story">
        <div className="absolute inset-0 grid-lines grid-fade opacity-70" />
        <div className="container relative">
          {heading}
          <Reveal className="mt-8"><StackVisual layer={ERA_META[idx].layer} /></Reveal>
          <div className="mt-6">{steps}</div>
          <div className="mt-6">{tabs}</div>
          <div className="mt-10 min-h-[18rem]"><EraDetail e={e} i={idx} /></div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} className="dark relative bg-background text-foreground" style={{ height: `${100 + ERAS.length * 45}vh` }} id="the-platform" data-testid="platform-story">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="absolute inset-0 grid-lines grid-fade opacity-70" />
        <div className="absolute -left-40 top-1/4 h-[60vmin] w-[60vmin] rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.12),transparent)]" />
        <div className="absolute -right-40 bottom-0 h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.16),transparent)]" />
        <div className="container relative grid items-center gap-12 pt-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            {heading}
            <div className="mt-8">{steps}</div>
            <div className="mt-12 min-h-[19rem]"><EraDetail e={e} i={idx} /></div>
            <div className="mt-8">{tabs}</div>
          </div>
          <div className="lg:col-span-7">
            <StackVisual layer={ERA_META[idx].layer} />
            <div className="mt-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>{tx("Active")}</span>
              <span className="relative h-px flex-1 overflow-hidden bg-line/15">
                <motion.span className="absolute inset-0 origin-left bg-gradient-to-r from-teal via-primary to-primary" style={{ scaleX: bar }} />
              </span>
              <span>{tx("Activated")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
