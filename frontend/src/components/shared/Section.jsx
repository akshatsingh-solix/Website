import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { Reveal } from "./Reveal";
import { SplitWords } from "@/components/motion/KineticText";
import { ScrambleText } from "@/components/motion/Scramble";
import { useDarkSurface } from "@/components/layout/navTone";

const NO_SURFACE = { current: null };

/**
 * Storyboard chapter marker ("03 — The platform"). The homepage reads as a
 * numbered narrative - problem, lifecycle, platform, outcomes, proof - so
 * visitors always know where they are in the argument. The rule draws in
 * and the label decodes as it arrives.
 */
export const ChapterMark = ({ n, label, className }) => {
  const tx = useTx();
  return (
    <div className={cn("mb-5 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.22em]", className)}>
      <span className="text-primary-ink">{n}</span>
      <motion.span
        className="h-px w-10 origin-left bg-gradient-to-r from-primary/70 to-teal/60"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
      <ScrambleText text={tx(label)} className="text-muted-foreground" />
    </div>
  );
};

// Text props are translated here (tx), so callers pass English copy.
export const SectionHeading = ({ eyebrow, chapter, title, description, align = "left", className }) => {
  const tx = useTx();
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {chapter ? (
        <ChapterMark n={chapter} label={eyebrow} className={align === "center" ? "justify-center" : undefined} />
      ) : (
        eyebrow && <ScrambleText as="p" text={tx(eyebrow)} className="eyebrow mb-4 block" />
      )}
      <h2 className="text-balance font-display text-[clamp(1.85rem,1.35rem+1.8vw,3rem)] font-medium leading-[1.05] tracking-[-0.03em] text-foreground">
        <SplitWords text={tx(title)} stagger={0.045} />
      </h2>
      {description && (
        <Reveal delay={0.15} y={16}>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground lg:text-[1.05rem]">{tx(description)}</p>
        </Reveal>
      )}
    </div>
  );
};

// A section scoped `dark` (a navy "moment") also turns the navbar light-on-navy while under it.
export const Section = ({ children, className, id, bordered = false }) => {
  const ref = useRef(null);
  useDarkSurface(/\bdark\b/.test(className || "") ? ref : NO_SURFACE);
  return (
    <section ref={ref} id={id} className={cn("relative py-16 sm:py-20 lg:py-28", bordered && "border-t border-line/10", className)}>
      {children}
    </section>
  );
};
