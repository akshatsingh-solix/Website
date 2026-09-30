import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Clock3, Gauge, Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { INDUSTRIES, PRODUCTS } from "@/data/site";
import { industryContext } from "@/data/industryContext";
import { midSentence, useTx } from "@/i18n/tx";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { DataTerrain } from "@/components/materials/DataTerrain";
import { LiquidGlass } from "@/components/materials/LiquidGlass";
import { terrainSignature } from "@/components/materials/terrainSignatures";

// Keeps the copy readable over the live terrain without a backdrop blur.
const Veil = () => (
  <>
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/5" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background to-transparent" />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background to-transparent" />
  </>
);

const Label = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    <Icon className="h-3.5 w-3.5 text-teal" strokeWidth={1.75} /> {children}
  </p>
);

const Regulations = ({ items }) => (
  <ul className="mt-3 flex flex-wrap gap-1.5">
    {items.map((r) => (
      <li key={r} className="rounded-full border border-line/15 bg-line/5 px-2.5 py-1 font-mono text-[11px] tracking-wide text-foreground">{r}</li>
    ))}
  </ul>
);

/** The industry's context as three liquid-glass panels: regulations, retention, where programs start. */
const ContextPanels = ({ slug, className }) => {
  const tx = useTx();
  const ctx = industryContext(slug);
  if (!ctx) return null;
  const products = ctx.products.map((s) => PRODUCTS.find((p) => p.slug === s)).filter(Boolean);
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <LiquidGlass tone="dark" className="rounded-2xl p-5">
        <Label icon={Scale}>{tx("Records answer to")}</Label>
        <Regulations items={ctx.regulations} />
      </LiquidGlass>
      <LiquidGlass tone="dark" className="rounded-2xl p-5">
        <Label icon={Clock3}>{tx("Retention horizon")}</Label>
        <p className="mt-3 font-display text-lg leading-snug tracking-tight text-foreground">{ctx.horizon}</p>
      </LiquidGlass>
      <LiquidGlass tone="dark" className="rounded-2xl p-5 sm:col-span-2">
        <Label icon={ArrowRight}>{tx("Programs usually start with")}</Label>
        <ul className="mt-3 flex flex-wrap gap-2">
          {products.map((p) => (
            <li key={p.slug}>
              <Link to={`/products/${p.slug}`} className="group inline-flex items-center gap-1.5 rounded-full border border-line/15 bg-line/5 px-3 py-1.5 text-sm text-foreground transition-colors duration-200 hover:border-primary/60 hover:text-primary-ink" data-testid={`signature-product-${p.slug}`}>
                {p.name} <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </LiquidGlass>
    </div>
  );
};

/**
 * Industry page: the industry's data signature. A live data terrain
 * (@shadergradient/react) moves at the industry's pace - fast, dense
 * ripples where records arrive as high-frequency events, slow swells where
 * they must live for decades - under the rules its records answer to.
 */
export const IndustrySignature = ({ industry }) => {
  const tx = useTx();
  const { i18n } = useTranslation();
  const ctx = industryContext(industry.slug);
  if (!ctx) return null;
  return (
    <Section className="dark overflow-hidden bg-background text-foreground" id="signature">
      <DataTerrain signature={terrainSignature(industry.slug)} className="absolute inset-0" />
      <Veil />
      <div className="container relative grid gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-6">
          <SectionHeading
            eyebrow="Data signature"
            title={tx("The shape of {{name}} data.", { name: midSentence(industry.name, i18n.language) })}
            description="The surface moves at this industry's pace: how fast its records arrive, and how long they have to live. That pace decides what governance has to carry."
          />
          <Reveal delay={0.2} className="mt-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-line/15 bg-line/5"><Gauge className="h-5 w-5 text-primary-ink" strokeWidth={1.5} /></span>
            <p className="font-display text-2xl font-medium tracking-tight text-foreground">{ctx.character}</p>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="lg:col-span-6">
          <ContextPanels slug={industry.slug} />
          <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted-foreground">
            {tx("Indicative. Your binding retention schedule is set by your counsel and regulators.")}
          </p>
        </Reveal>
      </div>
    </Section>
  );
};

/**
 * Industries overview: every industry's signature on one live terrain.
 * Pointing at (or focusing) an industry reshapes the surface to its pace
 * and shows the rules its records answer to.
 */
export const IndustrySignatures = () => {
  const tx = useTx();
  const [active, setActive] = useState(INDUSTRIES[0].slug);
  const current = INDUSTRIES.find((i) => i.slug === active) || INDUSTRIES[0];
  const ctx = industryContext(current.slug);
  return (
    <Section className="dark overflow-hidden bg-background text-foreground" id="signatures">
      <DataTerrain signature={terrainSignature(active)} className="absolute inset-0" />
      <Veil />
      <div className="container relative">
        <SectionHeading
          eyebrow="Industry signatures"
          title="Every industry leaves a different data signature."
          description="Point at an industry to see the pace its records arrive at, how long they have to live and the rules they answer to. One platform governs all of them."
        />
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-start">
          <div role="tablist" aria-label={tx("Industries")} className="flex flex-wrap gap-2 lg:col-span-5" data-testid="signature-tabs">
            {INDUSTRIES.map((ind) => {
              const on = ind.slug === active;
              return (
                <button
                  key={ind.slug}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="signature-panel"
                  onMouseEnter={() => setActive(ind.slug)}
                  onFocus={() => setActive(ind.slug)}
                  onClick={() => setActive(ind.slug)}
                  data-testid={`signature-tab-${ind.slug}`}
                  className={cn(
                    "liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "liquid-glass-red bg-primary text-primary-foreground" : "liquid-glass-dark text-muted-foreground hover:text-foreground",
                  )}
                >
                  <ind.icon className="h-4 w-4" strokeWidth={1.5} /> {ind.name}
                </button>
              );
            })}
          </div>
          <div id="signature-panel" role="tabpanel" aria-live="polite" className="lg:col-span-7" data-testid="signature-panel">
            <LiquidGlass tone="dark" className="rounded-3xl p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{current.name}</p>
                  <p className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">{ctx?.character}</p>
                </div>
                <Link to={`/industries/${current.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink transition-colors hover:text-foreground" data-testid="signature-explore">
                  {tx("Explore {{name}}", { name: current.name })} <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <Label icon={Scale}>{tx("Records answer to")}</Label>
                  {ctx && <Regulations items={ctx.regulations} />}
                </div>
                <div>
                  <Label icon={Clock3}>{tx("Retention horizon")}</Label>
                  <p className="mt-3 text-base leading-snug text-foreground">{ctx?.horizon}</p>
                </div>
              </div>
              <p className="mt-6 border-t border-line/10 pt-5 text-sm leading-relaxed text-muted-foreground">{current.headline}</p>
            </LiquidGlass>
          </div>
        </div>
      </div>
    </Section>
  );
};
