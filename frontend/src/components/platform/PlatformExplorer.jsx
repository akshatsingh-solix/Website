import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Layers, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTx } from "@/i18n/tx";
import { INDUSTRIES, PRODUCTS } from "@/data/site";
import { PLATFORM_LAYERS, layerOfProduct } from "@/data/platformLayers";
import { industryContext } from "@/data/industryContext";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal } from "@/components/shared/Reveal";
import { LiquidGlass } from "@/components/materials/LiquidGlass";
import { terrainSignature } from "@/components/materials/terrainSignatures";
import { useLiveCanvas } from "@/hooks/use-live-canvas";
import { LAYER_COLORS } from "./colors";

const PlatformScene = lazy(() => import("./PlatformScene"));

// The 3D stage: mounts near the viewport, runs while it holds the page's
// live-canvas slot, a still frame for reduced motion, and on the static
// tier a flat isometric stack in the brand colours (the list beside it
// carries all the content either way).
const Stage = ({ layers, selected, hovered, lit, onHover, onSelect, speed }) => {
  const ref = useRef(null);
  const { tier, near, running } = useLiveCanvas(ref);
  const [ready, setReady] = useState(false);
  return (
    <div ref={ref} className="relative aspect-[4/3] w-full" data-testid="platform-explorer-stage">
      <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.22),rgba(238,36,36,0.08)_55%,transparent)]" />
      {(!near || !ready) && (
        <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <div className="flex w-[58%] flex-col gap-3">
            {layers.map((l) => (
              <div key={l.key} className="h-5 -skew-x-[28deg] rounded-md border border-white/15 opacity-80" style={{ background: LAYER_COLORS[l.tone] }} />
            ))}
          </div>
        </div>
      )}
      {near && (
        <Suspense fallback={null}>
          <PlatformScene
            layers={layers}
            selected={selected}
            hovered={hovered}
            lit={lit}
            onHover={onHover}
            onSelect={onSelect}
            speed={speed}
            running={running}
            still={tier === "still"}
            onReady={() => setReady(true)}
          />
        </Suspense>
      )}
      {/* HUD corners, as on the site's framed visuals. */}
      <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-6 w-6 border-l border-t border-line/40" />
      <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-6 w-6 border-r border-t border-line/40" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-6 w-6 border-b border-l border-line/40" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 border-b border-r border-line/40" />
    </div>
  );
};

// i18n: default heading copy, translated by SectionHeading.
const COPY = {
  eyebrow: "Platform explorer",
  title: "Four layers. One trust perimeter.",
  description: "Each layer inherits the governance of the one beneath it. Select a layer to see what runs on it, or choose an industry to see where its programs start.",
};

/**
 * The platform explorer: the four layers of the Solix platform in 3D
 * (React Three Fiber), with every product on the layer that does its work.
 *
 *   <PlatformExplorer />                          // Platform page: industry lens chips
 *   <PlatformExplorer industry="healthcare" />    // industry page: lens fixed
 *   <PlatformExplorer focusProduct="ediscovery" /> // product page: its layer selected
 *
 * The industry lens lights the layers where that industry's programs
 * usually start (data/industryContext.js) and sets the data flow to the
 * industry's pace (its terrain signature).
 */
export const PlatformExplorer = ({ industry: fixedIndustry, focusProduct, eyebrow = COPY.eyebrow, title = COPY.title, description = COPY.description, id = "explorer" }) => {
  const tx = useTx();
  const layers = PLATFORM_LAYERS;
  const [lens, setLens] = useState(fixedIndustry || null);
  const ctx = lens ? industryContext(lens) : null;
  const lensIndustry = lens ? INDUSTRIES.find((i) => i.slug === lens) : null;

  const lit = useMemo(() => new Set(ctx ? layers.filter((l) => l.products.some((p) => ctx.products.includes(p))).map((l) => l.key) : []), [ctx, layers]);
  const productLayer = focusProduct ? layerOfProduct(focusProduct) : null;
  const [selected, setSelected] = useState(productLayer || (ctx && layers.find((l) => lit.has(l.key))?.key) || "activate");
  const [hovered, setHovered] = useState(null);
  const layer = layers.find((l) => l.key === selected) || layers[0];
  const products = layer.products.map((s) => PRODUCTS.find((p) => p.slug === s)).filter(Boolean);
  const speed = lens ? terrainSignature(lens).uSpeed : 0.2;

  const chooseLens = (slug) => {
    setLens(slug);
    const c = slug ? industryContext(slug) : null;
    const first = c && layers.find((l) => l.products.some((p) => c.products.includes(p)));
    if (first) setSelected(first.key);
  };

  return (
    <Section className="dark overflow-hidden bg-background text-foreground" id={id}>
      <div className="absolute inset-0 grid-lines grid-fade opacity-60" />
      <div className="absolute -right-40 top-10 h-[640px] w-[640px] rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.16),transparent)]" />
      <div className="container relative">
        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        {!fixedIndustry && !focusProduct && (
          <Reveal delay={0.1} className="mt-8 flex flex-wrap items-center gap-2" data-testid="explorer-lens">
            <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{tx("Industry lens")}</span>
            {[null, ...INDUSTRIES.map((i) => i.slug)].map((slug) => {
              const on = lens === slug;
              const ind = slug && INDUSTRIES.find((i) => i.slug === slug);
              return (
                <button
                  key={slug || "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => chooseLens(slug)}
                  data-testid={`explorer-lens-${slug || "all"}`}
                  className={cn(
                    "liquid-glass rounded-full px-3 py-1.5 text-xs transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "liquid-glass-red bg-primary text-primary-foreground" : "liquid-glass-dark text-muted-foreground hover:text-foreground",
                  )}
                >
                  {ind ? ind.name : tx("All industries")}
                </button>
              );
            })}
          </Reveal>
        )}

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Stage layers={layers} selected={selected} hovered={hovered} lit={lit} onHover={setHovered} onSelect={setSelected} speed={speed} />
            <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5" /> {tx("Point at a layer, or use the list")}
            </p>
          </Reveal>

          <div className="lg:col-span-5">
            <ol className="space-y-2" aria-label={tx("Platform layers")} data-testid="explorer-layers">
              {layers.map((l) => {
                const on = l.key === selected;
                const starts = lit.has(l.key);
                return (
                  <li key={l.key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSelected(l.key)}
                      onMouseEnter={() => setHovered(l.key)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(l.key)}
                      onBlur={() => setHovered(null)}
                      data-testid={`explorer-layer-${l.key}`}
                      className={cn(
                        "liquid-glass flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-[border-color,transform] duration-200 hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        on ? "liquid-glass-dark border-line/40" : "liquid-glass-dark border-line/10",
                      )}
                    >
                      <span className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-white/20" style={{ background: LAYER_COLORS[l.tone] }} />
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">{l.label}</span>
                      {starts && lensIndustry && (
                        <span className="ml-1 whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary-ink" title={tx("Where {{name}} programs usually start", { name: lensIndustry.name })}>{tx("Starts here")}</span>
                      )}
                      <span className="ml-auto whitespace-nowrap font-mono text-[10px] text-muted-foreground">{tx("{{count}} products", { count: l.products.length })}</span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <LiquidGlass tone="dark" className="mt-4 rounded-3xl p-6" aria-live="polite" data-testid="explorer-detail">
              <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-teal" /> {layer.label}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground">{layer.summary}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {products.map((p) => {
                  const here = p.slug === focusProduct;
                  const starts = ctx?.products.includes(p.slug);
                  return (
                    <li key={p.slug}>
                      <Link
                        to={`/products/${p.slug}`}
                        aria-current={here ? "page" : undefined}
                        data-testid={`explorer-product-${p.slug}`}
                        className={cn(
                          "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors duration-200",
                          here ? "border-primary bg-primary text-primary-foreground" : starts ? "border-primary/60 bg-primary/10 text-foreground hover:bg-primary/20" : "border-line/15 bg-line/5 text-muted-foreground hover:border-line/40 hover:text-foreground",
                        )}
                      >
                        {p.name}
                        {here ? <span className="font-mono text-[9px] uppercase tracking-[0.16em] opacity-80">· {tx("You are here")}</span> : <ArrowUpRight className="h-3 w-3 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </LiquidGlass>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default PlatformExplorer;
