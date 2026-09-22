import { ArrowRight, Quote, Lightbulb } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";

export const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Block = ({ b }) => {
  switch (b.type) {
    case "h2":
      return <h2 id={slugify(b.text)} className="scroll-mt-28 pt-6 font-display text-2xl font-medium tracking-tight sm:text-3xl">{b.text}</h2>;
    case "p":
      return <p className="text-base leading-[1.8] text-muted-foreground md:text-lg">{b.text}</p>;
    case "ul":
      return (
        <ul className="space-y-3">
          {b.items.map((it) => (
            <li key={it} className="flex gap-3 text-base leading-relaxed text-muted-foreground md:text-lg">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {it}
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="relative rounded-2xl border border-white/10 bg-card p-8">
          <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/30" strokeWidth={1} />
          <p className="font-display text-xl font-light leading-snug text-slate-100 sm:text-2xl">“{b.text}”</p>
          {b.cite && <cite className="mt-4 block font-mono text-[11px] not-italic uppercase tracking-[0.18em] text-muted-foreground">{b.cite}</cite>}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="flex gap-4 rounded-2xl border border-teal/25 bg-teal/5 p-6">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
          <div>
            <p className="font-display font-medium text-teal">{b.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">{b.text}</p>
          </div>
        </aside>
      );
    case "stats":
      return (
        <div className="grid grid-cols-1 divide-y divide-white/10 rounded-2xl border border-white/10 bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {b.items.map((s) => (
            <div key={s.label} className="p-6">
              <p className="font-display text-4xl font-medium tracking-tighter text-primary">{s.value}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      );
    case "steps":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {b.items.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-white/10 bg-card p-5">
              <span className="font-mono text-xs text-primary">0{i + 1}</span>
              <p className="mt-2 font-display text-lg font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
};

export const ArticleBody = ({ blocks }) => (
  <div className="space-y-8" data-testid="article-body">
    {blocks.map((b, i) => (
      <Reveal key={i} y={16} delay={0.02}><Block b={b} /></Reveal>
    ))}
  </div>
);

export const ArticleTOC = ({ blocks }) => {
  const heads = blocks.filter((b) => b.type === "h2");
  if (!heads.length) return null;
  return (
    <nav aria-label="On this page" data-testid="article-toc">
      <p className="eyebrow mb-4">On this page</p>
      <ul className="space-y-2 border-l border-white/10">
        {heads.map((h) => (
          <li key={h.text}>
            <a href={`#${slugify(h.text)}`} className="group -ml-px flex items-center gap-2 border-l border-transparent pl-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground">
              <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /> {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
