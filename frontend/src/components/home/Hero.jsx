import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, Check, Database, Play, ShieldCheck, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { SignalField } from "@/components/motion/signal/SignalField";
import { SplitWords } from "@/components/motion/KineticText";
import { ScrambleText } from "@/components/motion/Scramble";
import { useIntroDone } from "@/components/motion/Intro";
import { useDarkSurface } from "@/components/layout/navTone";

const WORD_KEYS = ["activates", "governs", "preserves", "unlocks"];
const ease = [0.22, 1, 0.36, 1];

// The field gathers from noise into data streams on arrival (0 -> 1), then
// the scroll carries it through the platform story: streams (1), one
// governed core (2), activated - the Solix bolt (3).
const FORMATIONS = ["cloud", "flow", "sphere", "bolt"];
const RIGHT = { x: 0.4, y: 0.02, scale: 1, mx: 0, my: 0.34 };
const PLACE_FOR = (name) => (name === "bolt" ? { ...RIGHT, scale: 0.92 } : name === "sphere" ? { ...RIGHT, scale: 1.02 } : RIGHT);

// Beats of the pinned hero, as fractions of its scroll.
const BEATS = [
  { key: "signal", label: "Signal", range: [0, 0.3] },
  { key: "govern", label: "Govern", range: [0.34, 0.64] },
  { key: "activate", label: "Activate", range: [0.68, 1] },
];

// Floating product-UI cards: the platform story in miniature (archive ->
// govern -> answer), each drifting at its own depth under the pointer.
const ArchiveCard = ({ t }) => (
  <div className="w-[240px] rounded-2xl border border-line/15 bg-background/70 p-4 shadow-lift backdrop-blur-xl">
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-teal">
        <Database className="h-3.5 w-3.5" strokeWidth={1.75} /> {t("hero.archiveJob")}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> {t("hero.streaming")}
      </span>
    </div>
    <p className="mt-3 text-sm font-medium text-foreground">{t("hero.archiveRoute")}</p>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line/10">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-teal to-primary"
        initial={{ width: "8%" }}
        animate={{ width: ["8%", "92%"] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 0.8 }}
      />
    </div>
    <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
      <span>2.4 TB</span>
      <span className="inline-flex items-center gap-1 text-foreground"><Check className="h-3 w-3 text-teal" /> {t("hero.policyChecked")}</span>
    </div>
  </div>
);

const AnswerCard = ({ t }) => (
  <div className="w-[270px] rounded-2xl border border-line/15 bg-background/70 p-4 shadow-lift backdrop-blur-xl">
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" strokeWidth={1.75} /></span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-ink">{t("hero.aiAnswer")}</span>
    </div>
    <p className="mt-3 text-sm leading-snug text-foreground">{t("hero.answerSample")}</p>
    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t("hero.answerSources")}</p>
  </div>
);

const CostChip = ({ t }) => (
  <div className="flex items-center gap-3 rounded-full border border-line/15 bg-background/70 py-2 pl-2 pr-4 shadow-lift backdrop-blur-xl">
    <span className="grid h-8 w-8 place-items-center rounded-full bg-teal/15 text-teal"><TrendingDown className="h-4 w-4" strokeWidth={1.75} /></span>
    <span className="leading-tight">
      <span className="block font-display text-lg font-semibold text-foreground">-80%</span>
      <span className="block max-w-[190px] font-mono text-[9.5px] uppercase leading-snug tracking-[0.14em] text-muted-foreground">{t("hero.infraCost")} {t("hero.vsStatusQuo")}</span>
    </span>
  </div>
);

/** A card that floats at `depth` under the pointer (parallax), and fades with the first beat. */
const Floater = ({ children, depth, mx, my, className, delay, fade }) => {
  const x = useTransform(mx, (v) => v * depth * 38);
  const y = useTransform(my, (v) => v * depth * 26);
  return (
    <motion.div style={{ x, y, opacity: fade }} className={cn("absolute hidden lg:block", className)}>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1, ease, delay }}>
        <div className="animate-float" style={{ animationDelay: `${-depth * 3}s` }}>{children}</div>
      </motion.div>
    </motion.div>
  );
};

/** A beat's copy block: in and out with the scroll. */
const BeatCopy = ({ progress, range, children, className, testId }) => {
  const [a, b] = range;
  const fadeIn = a === 0 ? [0, 0] : [a - 0.04, a + 0.02];
  const fadeOut = b === 1 ? [1, 1] : [b - 0.04, b + 0.02];
  const opacity = useTransform(progress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [a === 0 ? 1 : 0, 1, 1, b === 1 ? 1 : 0]);
  const y = useTransform(progress, [fadeIn[0], fadeIn[1], fadeOut[0], fadeOut[1]], [a === 0 ? 0 : 60, 0, 0, b === 1 ? 0 : -60]);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? "auto" : "none"));
  return (
    <motion.div style={{ opacity, y, pointerEvents }} className={cn("absolute inset-0 flex items-center", className)} data-testid={testId}>
      <div className="container">{children}</div>
    </motion.div>
  );
};

export const Hero = () => {
  const { t } = useTranslation();
  const tx = useTx();
  const ready = useIntroDone();
  const sectionRef = useRef(null);
  useDarkSurface(sectionRef);

  const [i, setI] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setI((n) => (n + 1) % WORD_KEYS.length), 2600);
    return () => clearInterval(interval);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.0005 });
  const formation = useTransform(scrollYProgress, [0, 0.12, 0.34, 0.5, 0.68, 1], [1, 1, 2, 2, 3, 3]);
  const cardsFade = useTransform(progress, [0, 0.2, 0.3], [1, 1, 0]);
  const cueFade = useTransform(progress, [0, 0.06], [1, 0]);
  const [beat, setBeat] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setBeat(v < 0.32 ? 0 : v < 0.66 ? 1 : 2));

  // Pointer position, -0.5..0.5, for the floating cards.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 50, damping: 16 });
  const smy = useSpring(my, { stiffness: 50, damping: 16 });
  const onPointerMove = (e) => {
    if (e.pointerType !== "mouse") return;
    mx.set(e.clientX / window.innerWidth - 0.5);
    my.set(e.clientY / window.innerHeight - 0.5);
  };

  return (
    <section ref={sectionRef} className="dark relative h-[260vh] bg-background text-foreground" data-testid="home-hero" onPointerMove={onPointerMove}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Depth: a faint grid stage, brand glows, the live field, then scrims for legibility. */}
        <div className="absolute inset-0 grid-lines grid-fade opacity-80" />
        <div className="absolute right-[-10%] top-1/2 h-[90vmin] w-[90vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.22),transparent)]" />
        <div className="absolute left-[-15%] top-[-20%] h-[70vmin] w-[70vmin] rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.14),transparent)]" />
        <div className="absolute inset-0">
          <SignalField formations={FORMATIONS} progress={formation} placeFor={PLACE_FOR} place={RIGHT} />
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background/85 via-background/40 to-transparent lg:w-[62%]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-0 grain" />

        <Floater depth={0.6} mx={smx} my={smy} fade={cardsFade} delay={0.9} className="right-[6%] top-[18%] xl:right-[9%]"><ArchiveCard t={t} /></Floater>
        <Floater depth={1} mx={smx} my={smy} fade={cardsFade} delay={1.1} className="bottom-[14%] right-[4%] xl:right-[7%]"><AnswerCard t={t} /></Floater>
        <Floater depth={0.35} mx={smx} my={smy} fade={cardsFade} delay={1.3} className="bottom-[34%] right-[30%]"><CostChip t={t} /></Floater>

        <div className="relative h-full">
          {/* Beat 1: the promise. */}
          <BeatCopy progress={progress} range={BEATS[0].range} className="pt-16 lg:pt-10">
            <div className="max-w-2xl lg:max-w-[46rem]">
              <motion.p initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease }} className="eyebrow mb-7 inline-flex items-center gap-3 rounded-full border border-line/15 bg-line/[0.04] py-1.5 pl-1.5 pr-4 backdrop-blur">
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] tracking-[0.14em] text-primary-foreground">AI</span>
                <ScrambleText text={t("hero.eyebrow")} trigger={ready ? "mount" : "never"} duration={900} delay={200} />
              </motion.p>
              <h1 className="text-balance font-display text-[clamp(2.9rem,1.8rem+4.6vw,6.4rem)] font-medium leading-[0.95] tracking-[-0.04em] text-foreground">
                <SplitWords text={`${t("hero.headlineStart")} ${t("hero.headlineAccent")}`} play={ready} delay={0.15} stagger={0.07} accentFrom={t("hero.headlineStart").split(/\s+/).length} />
              </h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, ease, delay: 0.7 }} className="mt-8 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Solix{" "}
                <span className="relative inline-grid h-[1.625em] overflow-hidden align-top font-medium text-teal">
                  {/* Invisible copies of every word reserve exactly the longest one's width in the current language. */}
                  {WORD_KEYS.map((k) => (
                    <span key={k} aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">{t(`hero.words.${k}`)}</span>
                  ))}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={WORD_KEYS[i]}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.4, ease }}
                      className="absolute left-0 top-0 whitespace-nowrap leading-[1.625]"
                      data-testid="hero-rotating-word"
                    >
                      {t(`hero.words.${WORD_KEYS[i]}`)}
                    </motion.span>
                  </AnimatePresence>
                </span>{" "}
                {t("hero.body")}
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={ready ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease, delay: 0.85 }} className="mt-10 flex flex-wrap items-center gap-3">
                <Magnetic strength={0.3}>
                  <Button asChild size="lg" data-testid="hero-demo-button">
                    <Link to="/contact">{t("hero.requestDemo")} <ArrowRight /></Link>
                  </Button>
                </Magnetic>
                <Magnetic strength={0.3}>
                  <Button asChild size="lg" variant="outline" className="bg-background/30 backdrop-blur" data-testid="hero-explore-button">
                    <Link to="/products/enterprise-edition"><Play className="fill-current" /> {t("hero.exploreEnterpriseEdition")}</Link>
                  </Button>
                </Magnetic>
              </motion.div>
              <motion.dl initial={{ opacity: 0 }} animate={ready ? { opacity: 1 } : {}} transition={{ duration: 0.8, delay: 1.05 }} className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-line/10 pt-6 sm:grid-cols-4">
                <div className="col-span-2 flex items-center gap-2 text-xs font-medium text-foreground sm:col-span-1">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-teal" strokeWidth={1.75} /> <span className="leading-tight">{t("hero.trustBadge")}</span>
                </div>
                {["connectors", "scale", "since"].map((k) => (
                  <div key={k} className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground sm:border-l sm:border-line/10 sm:pl-4">{t(`hero.${k}`)}</div>
                ))}
              </motion.dl>
            </div>
          </BeatCopy>

          {/* Beat 2: many systems, one governed core. */}
          <BeatCopy progress={progress} range={BEATS[1].range} testId="hero-beat-govern">
            <div className="max-w-xl">
              <p className="mb-6 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]"><span className="text-primary-ink">02</span><span className="h-px w-10 bg-gradient-to-r from-primary/70 to-teal/60" /><span className="text-muted-foreground">{tx("Govern")}</span></p>
              <h2 className="text-balance font-display text-[clamp(2.4rem,1.6rem+3.4vw,5rem)] font-medium leading-[0.98] tracking-[-0.035em]">{tx("Hundreds of systems.")} <span className="text-gradient-accent">{tx("One governed core.")}</span></h2>
              <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{tx("150+ connectors bring live, inactive and retired data into the Common Data Platform, where classification, masking and retention are applied once and travel with every record.")}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {["SAP ERP", "Oracle EBS", "Salesforce", "Mainframe", "Email & Files", "Retired Apps"].map((s) => (
                  <span key={s} className="rounded-full border border-line/15 bg-line/[0.04] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur">{tx(s)}</span>
                ))}
              </div>
            </div>
          </BeatCopy>

          {/* Beat 3: activated. */}
          <BeatCopy progress={progress} range={BEATS[2].range} testId="hero-beat-activate">
            <div className="max-w-xl">
              <p className="mb-6 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]"><span className="text-primary-ink">03</span><span className="h-px w-10 bg-gradient-to-r from-primary/70 to-teal/60" /><span className="text-muted-foreground">{tx("Activate")}</span></p>
              <h2 className="text-balance font-display text-[clamp(2.4rem,1.6rem+3.4vw,5rem)] font-medium leading-[0.98] tracking-[-0.035em]">{tx("Governed once.")} <span className="text-gradient-accent">{tx("Activated everywhere.")}</span></h2>
              <p className="mt-7 max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">{tx("The same trusted data feeds AI agents, analytics, compliance search and decades of preservation. No shadow copies, no dead ends.")}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" data-testid="hero-activate-demo">
                  <Link to="/contact?type=demo">{tx("See it on your data")} <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-background/30 backdrop-blur">
                  <Link to="/platform">{tx("How the platform works")}</Link>
                </Button>
              </div>
            </div>
          </BeatCopy>
        </div>

        {/* Beat rail: where you are in the story. */}
        <div className="absolute bottom-8 right-5 hidden flex-col gap-3 sm:flex lg:bottom-auto lg:right-8 lg:top-1/2 lg:-translate-y-1/2" aria-hidden="true">
          {BEATS.map((b, idx) => (
            <div key={b.key} className="flex items-center justify-end gap-3">
              <span className={cn("font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-500", beat === idx ? "text-foreground" : "text-muted-foreground/50")}>{String(idx + 1).padStart(2, "0")} {tx(b.label)}</span>
              <span className={cn("h-px transition-[width,background-color] duration-500", beat === idx ? "w-10 bg-primary" : "w-4 bg-line/25")} />
            </div>
          ))}
        </div>

        <motion.div style={{ opacity: cueFade }} className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex" aria-hidden="true">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{tx("Scroll")}</span>
          <span className="relative h-12 w-px overflow-hidden bg-line/15">
            <span className="absolute inset-x-0 top-0 h-1/2 animate-[scan-sweep_1.8s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-gradient-to-b from-transparent via-primary to-transparent" />
          </span>
        </motion.div>
      </div>
    </section>
  );
};
