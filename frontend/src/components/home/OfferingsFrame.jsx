import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Boxes, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOLUTIONS } from "@/data/site";
import { useTx } from "@/i18n/tx";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { useMediaQuery } from "@/hooks/use-media-query";
import { OutcomePanels, SolutionCard } from "./SolutionsGrid";
import { ProductBento } from "./PlatformBento";

// i18n: labels translated at render.
const VIEWS = [
  { key: "outcomes", icon: Target, label: "By outcome" },
  { key: "products", icon: Boxes, label: "By product" },
];

/**
 * Chapter 03 in one frame: what you get, seen two ways. Buyers who start
 * from a number see the six outcome programmes; buyers who start from a
 * product see the flagship catalogue. One toggle, one frame, the same
 * governed platform underneath.
 */
export const OfferingsFrame = () => {
  const tx = useTx();
  const wide = useMediaQuery("(min-width: 1024px)");
  const [view, setView] = useState("outcomes");
  const outcomes = SOLUTIONS.slice(0, 6);

  return (
    <Section className="bg-muted" id="the-outcomes">
      <span id="the-products" className="absolute -top-24" aria-hidden="true" />
      <div className="container">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            chapter="03"
            eyebrow="What you get"
            title="Start with the outcome. We'll bring the platform."
            description="Six programs with a measurable target, built from products that share one catalog, one policy engine and one Preservation Zone."
          />
          <Reveal delay={0.1} className="flex shrink-0 flex-col items-start gap-4 lg:items-end">
            <div className="inline-flex rounded-full border border-line/10 bg-background p-1 shadow-soft" role="tablist" aria-label={tx("View")} data-testid="offerings-toggle">
              {VIEWS.map((v) => {
                const on = view === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setView(v.key)}
                    data-testid={`offerings-view-${v.key}`}
                    className={cn("relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors", on ? "text-white" : "text-muted-foreground hover:text-foreground")}
                  >
                    {on && <motion.span layoutId="offerings-pill" className="absolute inset-0 rounded-full bg-foreground" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                    <v.icon className="relative h-4 w-4" />
                    <span className="relative">{tx(v.label)}</span>
                  </button>
                );
              })}
            </div>
            <Link to={view === "products" ? "/products" : "/solutions"} className="inline-flex items-center gap-1 text-sm font-medium text-foreground link-underline" data-testid="platform-view-all">
              {view === "products" ? tx("View all products") : tx("All solutions")} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12"
          >
            {view === "products" ? (
              <ProductBento />
            ) : wide ? (
              <OutcomePanels items={outcomes} />
            ) : (
              <Stagger className="grid gap-4 md:grid-cols-2">
                {outcomes.map((s) => (
                  <Item key={s.id} className="flex"><SolutionCard s={s} /></Item>
                ))}
              </Stagger>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Section>
  );
};
