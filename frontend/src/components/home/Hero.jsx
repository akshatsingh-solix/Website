import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ArrowRight, Bot, Check, Database, Play, ShieldCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic, AuroraField } from "@/components/shared/Reveal";

const WORD_KEYS = ["activates", "governs", "preserves", "unlocks"];
const ease = [0.22, 1, 0.36, 1];

// Floating product-UI cards that sit over the framed hero render: they tell
// the platform story in miniature (archive -> govern -> answer) instead of
// leaving the visual as a mute picture.
const ArchiveCard = ({ t }) => (
  <div className="w-[240px] rounded-2xl border border-line/10 bg-background/95 p-4 shadow-lift backdrop-blur-md">
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-teal">
        <Database className="h-3.5 w-3.5" strokeWidth={1.75} /> {t("hero.archiveJob")}
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" /> {t("hero.streaming")}
      </span>
    </div>
    <p className="mt-3 text-sm font-medium text-foreground">{t("hero.archiveRoute")}</p>
    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
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
  <div className="w-[270px] rounded-2xl border border-line/10 bg-background/95 p-4 shadow-lift backdrop-blur-md">
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-4 w-4" strokeWidth={1.75} /></span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-ink">{t("hero.aiAnswer")}</span>
    </div>
    <p className="mt-3 text-sm leading-snug text-foreground">{t("hero.answerSample")}</p>
    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t("hero.answerSources")}</p>
  </div>
);

const CostChip = ({ t }) => (
  <div className="flex items-center gap-3 rounded-full border border-line/10 bg-background/95 py-2 pl-2 pr-4 shadow-lift backdrop-blur-md">
    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-teal"><TrendingDown className="h-4 w-4" strokeWidth={1.75} /></span>
    <span className="leading-tight">
      <span className="block font-display text-lg font-semibold text-foreground">-80%</span>
      <span className="block max-w-[190px] font-mono text-[9.5px] uppercase leading-snug tracking-[0.14em] text-muted-foreground">{t("hero.infraCost")} {t("hero.vsStatusQuo")}</span>
    </span>
  </div>
);

const HeroVisual = () => {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 700], [0, 60]);

  return (
    <div className="relative mx-auto w-full max-w-[620px] pb-10 pt-6 sm:px-6 lg:px-0">
      {/* Soft brand halo behind the frame: red top-left, blue bottom-right. */}
      <div className="absolute -left-10 top-0 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.18),transparent)]" />
      <div className="absolute -right-6 bottom-0 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.2),transparent)]" />

      <div className="dark relative overflow-hidden rounded-[28px] border border-line/10 bg-background shadow-[0_2px_6px_rgba(13,25,45,0.08),0_60px_120px_-50px_rgba(13,25,45,0.6)]">
        <motion.img
          src="/Website/images/hero-architecture.jpg"
          alt={t("hero.imageAlt")}
          style={{ y: imgY, scale: 1.1 }}
          className="aspect-[5/4] w-full object-cover"
          fetchpriority="high"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/80">{t("hero.liveDataFabric")}</span>
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-line/30" />
            <span className="h-2 w-2 rounded-full bg-line/30" />
            <span className="h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.55 }}
        className="absolute left-0 top-[12%] hidden sm:block xl:-left-10"
      >
        <div className="animate-float"><ArchiveCard t={t} /></div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.75 }}
        className="absolute bottom-0 right-0 sm:right-2 lg:right-0 xl:-right-6"
      >
        <div className="animate-float [animation-delay:-3.5s]"><AnswerCard t={t} /></div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.95 }}
        className="absolute bottom-[18%] left-2 hidden md:block xl:-left-4"
      >
        <CostChip t={t} />
      </motion.div>
    </div>
  );
};

export const Hero = () => {
  const { t } = useTranslation();
  const [i, setI] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setI((n) => (n + 1) % WORD_KEYS.length), 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-background" data-testid="home-hero">
      <div className="absolute inset-0 grid-lines grid-fade" />
      <AuroraField />
      {/* Hairline horizon that ties the hero into the proof strip below. */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-line/15 to-transparent" />

      <div className="container relative grid items-center gap-12 pb-16 pt-28 sm:pt-32 md:pt-40 lg:min-h-[86vh] lg:grid-cols-12 lg:gap-8 lg:pb-20 lg:pt-44">
        <div className="lg:col-span-6">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="eyebrow mb-6 inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 py-1.5 pl-1.5 pr-4">
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] tracking-[0.14em] text-primary-foreground">AI</span> {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease, delay: 0.08 }}
            className="text-balance text-fluid-h1 font-medium text-foreground"
          >
            {t("hero.headlineStart")} <span className="text-gradient-accent">{t("hero.headlineAccent")}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.18 }} className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
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
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.3 }} className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.25}>
              <Button asChild size="lg" data-testid="hero-demo-button">
                <Link to="/contact">{t("hero.requestDemo")} <ArrowRight /></Link>
              </Button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Button asChild size="lg" variant="outline" data-testid="hero-explore-button">
                <Link to="/products/enterprise-edition"><Play className="fill-current" /> {t("hero.exploreEnterpriseEdition")}</Link>
              </Button>
            </Magnetic>
          </motion.div>
          <motion.dl initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-line/10 pt-6 sm:grid-cols-4">
            <div className="col-span-2 flex items-center gap-2 text-xs font-medium text-foreground sm:col-span-1">
              <ShieldCheck className="h-4 w-4 shrink-0 text-teal" strokeWidth={1.75} /> <span className="leading-tight">{t("hero.trustBadge")}</span>
            </div>
            {["connectors", "scale", "since"].map((k) => (
              <div key={k} className="font-mono text-[11px] font-medium tracking-wider text-muted-foreground sm:border-l sm:border-line/10 sm:pl-4">{t(`hero.${k}`)}</div>
            ))}
          </motion.dl>
        </div>

        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease, delay: 0.2 }} className="relative lg:col-span-6">
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
};
