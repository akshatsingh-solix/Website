import { LOGOS } from "@/data/site";

const Wordmark = ({ name }) => (
  <span className="mx-8 inline-flex shrink-0 items-center gap-3 font-display text-lg font-semibold tracking-tight text-slate-500 transition-colors duration-300 hover:text-slate-200 sm:text-xl">
    <span className="h-1.5 w-1.5 rounded-sm bg-current opacity-60" />
    {name}
  </span>
);

export const LogoMarquee = () => (
  <section className="border-y border-white/5 py-12" data-testid="logo-marquee">
    <div className="container mb-6">
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Trusted by data leaders in regulated industries</p>
    </div>
    <div className="mask-fade-x overflow-hidden">
      <div className="flex w-max animate-marquee will-change-transform hover:[animation-play-state:paused]">
        {[...LOGOS, ...LOGOS].map((l, i) => <Wordmark key={`${l}-${i}`} name={l} />)}
      </div>
    </div>
  </section>
);
