import { Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase } from "lucide-react";
import { LOGOS } from "@/data/site";
import { useTx } from "@/i18n/tx";
import { VelocityMarquee } from "@/components/motion/VelocityMarquee";

// LOGOS holds illustrative example-industry names, not real customers — no
// claim of an actual relationship is made or implied. Each gets a generic
// category icon (not a brand mark) so the strip reads as designed rather
// than a bare text list.
const ICONS = [Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase];

const Wordmark = ({ name, Icon }) => (
  <span className="group mx-6 inline-flex shrink-0 items-center gap-4 font-display text-3xl font-medium tracking-[-0.03em] text-foreground/25 transition-colors duration-500 hover:text-foreground sm:mx-9 sm:text-5xl">
    <Icon className="h-6 w-6 shrink-0 text-teal/60 transition-[color,transform] duration-500 group-hover:rotate-[-10deg] group-hover:scale-110 group-hover:text-primary sm:h-8 sm:w-8" strokeWidth={1.5} />
    {name}
    <span className="ml-6 text-xl text-primary/50 sm:ml-9" aria-hidden="true">✦</span>
  </span>
);

/** Proof ribbon: oversized sector wordmarks that drift, and surge with the scroll. */
export const LogoMarquee = () => {
  const tx = useTx();
  return (
    <section className="relative overflow-hidden bg-background pb-10 pt-16 sm:pb-12 sm:pt-20" data-testid="logo-marquee">
      <div className="container mb-8">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {tx("Representative industries Solix serves")} <span className="opacity-70">· {tx("illustrative examples")}</span>
        </p>
      </div>
      <VelocityMarquee className="mask-fade-x py-3" baseVelocity={-1.6}>
        {LOGOS.map((l, i) => (
          <Wordmark key={`${l}-${i}`} name={l} Icon={ICONS[i % ICONS.length]} />
        ))}
      </VelocityMarquee>
    </section>
  );
};
