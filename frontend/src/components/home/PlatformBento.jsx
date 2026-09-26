import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item, Tilt } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { Picture } from "@/components/shared/Picture";

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

// `large` puts the product render on top (bento hero card); `horizontal`
// puts it alongside the copy, for a category that has a single product.
export const ProductCard = ({ product, className, large = false, horizontal = false, image }) => {
  const showImage = large || horizontal;
  const tx = useTx();
  const Icon = product.icon;
  const blue = product.accent === "teal";
  return (
    <Tilt max={4} className={cn("flex", className)}>
      <Link
        to={`/products/${product.slug}`}
        data-testid={`product-card-${product.slug}`}
        className={cn("spot group relative flex w-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card shadow-soft card-hover", horizontal && "md:flex-row")}
      >
        {/* Brand hairline that draws in on hover. */}
        <span className="absolute inset-x-0 top-0 z-10 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-teal to-primary transition-transform duration-500 group-hover:scale-x-100" />
        {showImage && (
          <div className={cn("dark relative min-h-[240px] flex-1 overflow-hidden bg-background", horizontal && "md:min-h-[300px] md:w-1/2 md:flex-none")}>
            <Picture src={image || product.image} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform [transition-duration:1200ms] ease-out group-hover:scale-110" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/70 to-transparent" />
            {large && <span className="absolute bottom-4 left-5 rounded-full border border-line/20 bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground backdrop-blur">{tx("Flagship")}</span>}
          </div>
        )}
        <div className={cn("relative flex flex-1 flex-col p-6 sm:p-7", large && "flex-none", horizontal && "md:justify-center md:p-10")}>
          <div className="flex items-start justify-between gap-4">
            <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-300", blue ? "bg-teal/10 text-teal group-hover:bg-teal group-hover:text-white" : "bg-primary/10 text-primary-ink group-hover:bg-primary group-hover:text-primary-foreground")}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="pt-1 text-right font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{tx(product.category)}</span>
          </div>
          <h3 className={cn("mt-5 font-display font-medium tracking-tight text-foreground", showImage ? "text-2xl sm:text-3xl" : "text-xl")}>{product.name}</h3>
          <p className={cn("mt-2 leading-relaxed text-muted-foreground", showImage ? "max-w-lg text-base" : "text-sm")}>{product.tagline}</p>
          <span className={cn("mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink", horizontal && "md:mt-0")}>
            {tx("Learn more")} <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </Tilt>
  );
};

export const PlatformBento = () => {
  const tx = useTx();
  return (
  <Section className="bg-background" id="the-products">
    <div className="container">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          chapter="04"
          eyebrow="The products"
          title="Built on the Common Data Platform. Delivered as outcomes."
          description="Every Solix product runs on one governed foundation, so archiving, retirement, privacy and AI share the same catalog, policies and Preservation Zone."
        />
        <Link to="/products" className="link-underline shrink-0 text-sm font-medium text-foreground" data-testid="platform-view-all">
          {tx("View all products")} →
        </Link>
      </div>
      <Stagger className="mt-12 grid gap-4 lg:grid-cols-12">
        {FEATURED_SLUGS.map((slug, i) => {
          const p = PRODUCTS.find((prod) => prod.slug === slug);
          if (!p) return null;
          return (
            <Item key={p.slug} className={cn(spans[i], "flex")}>
              <ProductCard product={p} large={i === 0} image={i === 0 ? "/Website/images/platform-cube.jpg" : undefined} className="w-full" />
            </Item>
          );
        })}
      </Stagger>
    </div>
  </Section>
  );
};
