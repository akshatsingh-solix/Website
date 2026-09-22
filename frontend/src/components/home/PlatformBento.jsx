import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/site";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";

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

export const ProductCard = ({ product, className, large = false }) => {
  const Icon = product.icon;
  return (
    <Link
      to={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-card p-7 card-hover",
        className
      )}
    >
      {large && (
        <>
          <img src={product.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/85 to-card/20" />
        </>
      )}
      <div className={cn("relative flex items-start justify-between", large && "mt-auto pt-40")}>
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-ink-950/80", product.accent === "teal" ? "text-teal" : "text-primary")}>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{product.category}</span>
      </div>
      <h3 className={cn("relative mt-6 font-display font-medium tracking-tight", large ? "text-3xl sm:text-4xl" : "text-xl")}>{product.name}</h3>
      <p className={cn("relative mt-2 text-muted-foreground", large ? "max-w-md text-base" : "text-sm")}>{product.tagline}</p>
      <span className="relative mt-6 inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors group-hover:text-primary">
        Learn more <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
};

export const PlatformBento = () => (
  <Section id="platform">
    <div className="container">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow="One platform, every product"
          title="Built on the Common Data Platform. Delivered as outcomes."
          description="Every Solix product runs on one governed foundation, so archiving, retirement, privacy and AI share the same catalog, policies and Preservation Zone."
        />
        <Link to="/products" className="link-underline shrink-0 text-sm text-slate-300 hover:text-foreground" data-testid="platform-view-all">
          View all products →
        </Link>
      </div>
      <Stagger className="mt-14 grid gap-4 lg:grid-cols-12">
        {FEATURED_SLUGS.map((slug, i) => {
          const p = PRODUCTS.find((prod) => prod.slug === slug);
          if (!p) return null;
          return (
            <Item key={p.slug} className={cn(spans[i], "flex")}>
              <ProductCard product={p} large={i === 0} className="w-full" />
            </Item>
          );
        })}
      </Stagger>
    </div>
  </Section>
);
