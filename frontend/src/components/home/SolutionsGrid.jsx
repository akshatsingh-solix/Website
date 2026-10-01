import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/data/site";
import { useTx } from "@/i18n/tx";

export const SolutionCard = ({ s, detailed = false }) => {
  const tx = useTx();
  const Icon = s.icon;
  const related = PRODUCTS.filter((p) => s.products.includes(p.slug));
  return (
    <div id={detailed ? s.id : undefined} className={cn("spot group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line/10 bg-card p-6 shadow-soft card-hover sm:p-7", detailed && "scroll-mt-28")} data-testid={`solution-card-${s.id}`}>
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.14),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-start justify-between">
        <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-teal/10 text-teal transition-colors duration-300 group-hover:bg-teal group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="relative rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-ink">{s.metric}</span>
      </div>
      <h3 className="relative mt-6 font-display text-2xl font-medium tracking-tight text-foreground">{s.title}</h3>
      <p className="relative mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
      <div className="relative mt-6 flex flex-wrap gap-2">
        {related.map((p) => (
          <Link key={p.slug} to={`/products/${p.slug}`} className="rounded-full border border-line/10 bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-teal/40 hover:text-teal">
            {p.name}
          </Link>
        ))}
      </div>
      {!detailed && (
        <Link to={`/solutions#${s.id}`} className="relative mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary-ink">
          {tx("Explore solution")} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
};

/**
 * Outcome programmes on wide desktops: six panels in a row. The open panel
 * widens to tell its story (metric, programme, products); the others stand
 * as columns with the title upright and the headline metric under it, so
 * every programme reads at a glance - nothing set sideways. Hover, focus or
 * tap opens a panel. Below 1280px the card grid takes over (OfferingsFrame),
 * so a closed column is never too narrow for its title.
 */
export const OutcomePanels = ({ items, className }) => {
  const tx = useTx();
  const [open, setOpen] = useState(0);
  return (
    <div className={cn("flex h-[480px] gap-3", className)} data-testid="outcome-panels">
      {items.map((s, i) => {
        const on = i === open;
        const Icon = s.icon;
        const related = PRODUCTS.filter((p) => s.products.includes(p.slug));
        return (
          <motion.div
            key={s.id}
            layout
            onMouseEnter={() => setOpen(i)}
            onFocus={() => setOpen(i)}
            onClick={() => setOpen(i)}
            transition={{ layout: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            className={cn(
              "spot group relative min-w-0 cursor-pointer overflow-hidden rounded-3xl border transition-[background-color,border-color,box-shadow] duration-500",
              on ? "dark flex-[3] border-line/10 bg-background text-foreground shadow-lift" : "flex-1 border-line/10 bg-card shadow-soft hover:border-primary/30"
            )}
            data-testid={`solution-card-${s.id}`}
          >
            {on && (
              <>
                <div className="absolute inset-0 grid-lines opacity-60" />
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(238,36,36,0.3),transparent)]" />
                <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.28),transparent)]" />
              </>
            )}
            {/* Closed column: icon and number on top, the title upright with its metric at the foot.
                Hidden from assistive tech: the open panel below carries the same copy. */}
            <div aria-hidden="true" className={cn("absolute inset-0 flex flex-col justify-between px-4 py-5 transition-opacity duration-300", on ? "pointer-events-none opacity-0" : "opacity-100")}>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal/10 text-teal transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
                  <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">0{i + 1}</span>
                </div>
                <p className="mt-5 font-mono text-[10px] font-semibold uppercase leading-relaxed tracking-[0.16em] text-muted-foreground">{tx(s.group)}</p>
              </div>
              <div>
                <p className="hyphens-auto break-words font-display text-base font-medium leading-snug tracking-tight text-foreground">{s.title}</p>
                <p className="mt-2 text-[13px] font-medium leading-snug text-primary-ink">{s.metric}</p>
              </div>
            </div>
            {/* Open panel. */}
            <div className={cn("relative flex h-full w-full min-w-[400px] flex-col p-9 transition-opacity duration-500", on ? "opacity-100 delay-150" : "pointer-events-none opacity-0")}>
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground"><Icon className="h-6 w-6" strokeWidth={1.5} /></span>
                <span className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground">0{i + 1} / 0{items.length}</span>
              </div>
              <p className="mt-auto text-balance font-display text-[clamp(2.4rem,1rem+2.4vw,3.4rem)] font-medium leading-[1.04] tracking-[-0.03em] text-gradient-accent">{s.metric}</p>
              <h3 className="mt-5 font-display text-[1.75rem] font-medium leading-tight tracking-tight">{s.title}</h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-foreground/80">{s.desc}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {related.map((p) => (
                  <Link key={p.slug} to={`/products/${p.slug}`} onClick={(e) => e.stopPropagation()} className="rounded-full border border-line/20 bg-line/5 px-3 py-1 text-xs text-foreground/85 transition-colors hover:border-teal/50 hover:text-foreground">
                    {p.name}
                  </Link>
                ))}
              </div>
              <Link to={`/solutions#${s.id}`} className="mt-7 inline-flex items-center gap-1.5 self-start text-sm font-medium text-foreground link-underline" tabIndex={on ? 0 : -1}>
                {tx("Explore solution")} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
