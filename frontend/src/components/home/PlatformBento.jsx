import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/site";
import { Stagger, Item, Tilt } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { Sigil } from "@/components/materials/Sigil";
import { LiquidGlass } from "@/components/materials/LiquidGlass";

// no-i18n
const spans = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-4", "lg:col-span-4", "lg:col-span-4", "lg:col-span-6", "lg:col-span-6"];

// Curated highlight reel for the homepage bento - the full 26-product catalog
// lives at /products, grouped by category. This grid's spans are hand-tuned
// for exactly 8 cards, so it always shows a fixed, deliberate set rather than
// mapping the whole PRODUCTS array (which broke the layout once the catalog
// grew past 8).
const FEATURED_SLUGS = [
  "enterprise-ai",
  "common-data-platform",
  "data-ask",
  "enterprise-archiving",
  "application-retirement",
  "ai-governance",
  "data-preservation",
  "enterprise-data-lake",
];

// Every card leads with the product's sigil: its icon as a liquid-metal
// glyph on the rendered stage, Solix Red or Solix Blue by the product's
// accent. `large` is the bento's hero card (the glyph flows live while the
// card holds the page's live-canvas slot); `horizontal` puts the sigil
// alongside the copy, for a category that has a single product.
export const ProductCard = ({ product, className, large = false, horizontal = false, live = false }) => {
  const tx = useTx();
  const tone = product.accent === "teal" ? "blue" : "red";
  return (
    <Tilt max={4} className={cn("flex", className)}>
      <Link
        to={`/products/${product.slug}`}
        data-testid={`product-card-${product.slug}`}
        className={cn("spot group relative flex w-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft card-hover", horizontal && "md:flex-row")}
      >
        {/* Brand hairline that draws in on hover. */}
        <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-teal to-primary transition-transform duration-500 group-hover:scale-x-100" />
        <Sigil
          icon={product.icon}
          tone={tone}
          live={live}
          float={large}
          glyphClassName={large ? "h-[46%]" : undefined}
          sizes={large || horizontal ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 34vw, (min-width: 768px) 50vw, 100vw"}
          className={cn("w-full shrink-0", large ? "aspect-[16/10] lg:aspect-auto lg:min-h-[320px] lg:flex-1" : horizontal ? "aspect-[16/9] md:aspect-auto md:min-h-[300px] md:w-1/2" : "aspect-[16/8]")}
        >
          <LiquidGlass tone="dark" className="absolute left-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/90 !shadow-none">
            {tx(product.category)}
          </LiquidGlass>
          {large && <span className="absolute bottom-4 left-5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground">{tx("Flagship")}</span>}
        </Sigil>
        <div className={cn("relative flex flex-1 flex-col p-6 sm:p-7", large && "flex-none", horizontal && "md:justify-center md:p-10")}>
          <h3 className={cn("font-display font-medium tracking-tight text-foreground", large || horizontal ? "text-2xl sm:text-3xl" : "text-xl")}>{product.name}</h3>
          <p className={cn("mt-2 leading-relaxed text-muted-foreground", large || horizontal ? "max-w-lg text-base" : "text-sm")}>{product.tagline}</p>
          <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink", horizontal && "md:mt-0")}>
            {tx("Learn more")} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Tilt>
  );
};

/** The curated eight, in the hand-tuned bento. */
export const ProductBento = ({ className }) => (
  <Stagger className={cn("grid gap-4 lg:grid-cols-12", className)}>
    {FEATURED_SLUGS.map((slug, i) => {
      const p = PRODUCTS.find((prod) => prod.slug === slug);
      if (!p) return null;
      return (
        <Item key={p.slug} className={cn(spans[i], "flex")}>
          <ProductCard product={p} large={i === 0} live={i === 0} className="w-full" />
        </Item>
      );
    })}
  </Stagger>
);
