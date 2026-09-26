import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOURCE, TESTIMONIALS } from "@/data/site";
import { Section, ChapterMark } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { SplitWords } from "@/components/motion/KineticText";
import { useTx } from "@/i18n/tx";

const HOLD = 8000;

/** Countdown ring around the "next" control: it fills while a quote is on screen. */
const Ring = ({ run, k }) => (
  <svg viewBox="0 0 44 44" className="pointer-events-none absolute -inset-[3px] h-[calc(100%+6px)] w-[calc(100%+6px)] -rotate-90" aria-hidden="true">
    <circle cx="22" cy="22" r="20.5" fill="none" stroke="rgb(var(--line) / 0.12)" strokeWidth="1.5" />
    {run && (
      <motion.circle key={k} cx="22" cy="22" r="20.5" fill="none" stroke="#EE2424" strokeWidth="1.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: HOLD / 1000, ease: "linear" }} />
    )}
  </svg>
);

/**
 * Chapter 08: customer outcomes as one big voice at a time. Each quote
 * surfaces word by word; the next arrives on its own (the ring counts it
 * down), on the arrows, or with a swipe / drag of the card.
 */
export const Testimonials = () => {
  const tx = useTx();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const n = TESTIMONIALS.length;
  const go = (d) => { setDir(d); setI((x) => (x + d + n) % n); };

  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => go(1), HOLD);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, i]);

  const t = TESTIMONIALS[i];
  const initials = SOURCE.TESTIMONIALS[i].role.split(" ").filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).slice(0, 2).join("");

  return (
    <Section className="overflow-hidden bg-muted" id="proof">
      <div className="container">
        <Reveal className="grid gap-10 lg:grid-cols-12" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="lg:col-span-3">
            <ChapterMark n="08" label="Customer outcomes" />
            <p className="font-display text-2xl font-medium leading-tight tracking-tight text-foreground sm:text-3xl">{tx("In their words.")}</p>
            <p className="mt-10 font-mono text-[11px] tracking-[0.2em] text-muted-foreground">
              <span className="text-foreground">{String(i + 1).padStart(2, "0")}</span> / {String(n).padStart(2, "0")}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={() => go(-1)} aria-label={tx("Previous testimonial")} data-testid="testimonial-prev" className="grid h-11 w-11 place-items-center rounded-full border border-line/15 bg-background transition-colors hover:border-primary/40 hover:text-primary-ink">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => go(1)} aria-label={tx("Next testimonial")} data-testid="testimonial-next" className="relative grid h-11 w-11 place-items-center rounded-full bg-background transition-colors hover:text-primary-ink">
                <Ring run={!paused} k={i} />
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex gap-1.5">
              {TESTIMONIALS.map((_, idx) => (
                <button key={idx} onClick={() => { setDir(idx > i ? 1 : -1); setI(idx); }} aria-label={tx("Go to testimonial {{n}}", { n: idx + 1 })} className={cn("h-1 rounded-full transition-[width,background-color] duration-300", idx === i ? "w-8 bg-primary" : "w-3 bg-line/20")} />
              ))}
            </div>
          </div>
          <motion.div
            className="spot relative cursor-grab overflow-hidden rounded-3xl border border-line/10 bg-card p-7 shadow-soft active:cursor-grabbing sm:p-12 lg:col-span-9"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={(_, info) => { if (info.offset.x < -80) go(1); else if (info.offset.x > 80) go(-1); }}
          >
            <Quote className="absolute right-6 top-6 h-20 w-20 text-primary/10 sm:h-28 sm:w-28" strokeWidth={1} />
            <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-teal" />
            <AnimatePresence mode="wait" custom={dir}>
              <motion.blockquote
                key={i}
                custom={dir}
                initial={{ opacity: 0, x: dir * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -40 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                data-testid="testimonial-quote"
              >
                <p className="relative text-balance font-display text-2xl font-light leading-snug tracking-tight text-foreground sm:text-3xl lg:text-[2.35rem] lg:leading-[1.2]">
                  “<SplitWords text={t.quote} play stagger={0.018} />”
                </p>
                <footer className="mt-10 flex items-center gap-4">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-teal/20 font-mono text-xs font-semibold text-foreground">{initials}</span>
                  <div>
                    <p className="text-sm font-medium">{t.role}</p>
                    <p className="text-xs text-muted-foreground">{t.org}</p>
                  </div>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </motion.div>
        </Reveal>
      </div>
    </Section>
  );
};
