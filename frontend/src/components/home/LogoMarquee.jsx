import { Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase } from "lucide-react";
import { LOGOS } from "@/data/site";
import { useTx } from "@/i18n/tx";

// LOGOS holds illustrative example-industry names, not real customers — no
// claim of an actual relationship is made or implied. Each gets a generic
// category icon (not a brand mark) so the strip reads as designed rather
// than a bare text list.
const ICONS = [Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase];

const Wordmark = ({ name, Icon }) => (
  <span className="mx-2.5 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-line/10 bg-background px-5 py-2.5 font-display text-base font-medium tracking-tight text-foreground/75 shadow-soft transition-colors duration-300 hover:border-primary/30 hover:text-foreground sm:text-[17px]">
    <Icon className="h-4 w-4 shrink-0 text-teal" strokeWidth={1.75} />
    {name}
  </span>
);

export const LogoMarquee = () => {
  const tx = useTx();
  return (
  <section className="relative bg-background py-10 sm:py-12" data-testid="logo-marquee">
    <div className="container mb-6">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {tx("Representative industries Solix serves")} <span className="opacity-70">· {tx("illustrative examples")}</span>
      </p>
    </div>
    <div className="mask-fade-x overflow-hidden">
      <div className="flex w-max animate-marquee py-2 will-change-transform hover:[animation-play-state:paused]">
        {[...LOGOS, ...LOGOS].map((l, i) => (
          <Wordmark key={`${l}-${i}`} name={l} Icon={ICONS[i % LOGOS.length % ICONS.length]} />
        ))}
      </div>
    </div>
  </section>
  );
};
