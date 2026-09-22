import { Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase } from "lucide-react";
import { LOGOS } from "@/data/site";

// LOGOS holds illustrative example-industry names, not real customers — no
// claim of an actual relationship is made or implied. Each gets a generic
// category icon (not a brand mark) so the strip reads as designed rather
// than a bare text list.
const ICONS = [Landmark, HeartPulse, Zap, ShoppingBag, Umbrella, RadioTower, Factory, Cloud, FlaskConical, Briefcase];

const Wordmark = ({ name, Icon }) => (
  <span className="mx-6 inline-flex shrink-0 items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2.5 font-display text-base font-medium tracking-tight text-slate-500 transition-colors duration-300 hover:border-white/15 hover:text-slate-200 sm:text-lg">
    <Icon className="h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} />
    {name}
  </span>
);

export const LogoMarquee = () => (
  <section className="relative border-y border-white/5 py-14" data-testid="logo-marquee">
    <div className="container mb-7">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Representative industries Solix serves <span className="text-slate-600">— illustrative examples</span>
      </p>
    </div>
    <div className="mask-fade-x overflow-hidden">
      <div className="flex w-max animate-marquee will-change-transform hover:[animation-play-state:paused]">
        {[...LOGOS, ...LOGOS].map((l, i) => (
          <Wordmark key={`${l}-${i}`} name={l} Icon={ICONS[i % LOGOS.length % ICONS.length]} />
        ))}
      </div>
    </div>
  </section>
);
