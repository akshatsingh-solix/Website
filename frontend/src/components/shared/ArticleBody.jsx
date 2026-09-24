import { Link } from "react-router-dom";
import { ArrowRight, Quote, Lightbulb } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { useTx } from "@/i18n/tx";
import { inlineTokens, safeHref } from "@/lib/markdown";
import { fileHref } from "@/lib/content";

// Inline markdown from the CMS (bold, italic, code, links) as React nodes; never raw HTML.
const Inline = ({ text, md }) => {
  if (!md) return text;
  return inlineTokens(text).map((tok, i) => {
    if (tok.t === "b") return <strong key={i} className="font-semibold text-foreground">{tok.v}</strong>;
    if (tok.t === "i") return <em key={i}>{tok.v}</em>;
    if (tok.t === "code") return <code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground">{tok.v}</code>;
    if (tok.t === "a") {
      const href = safeHref(tok.href);
      if (!href) return tok.v;
      const cls = "font-medium text-teal underline underline-offset-2 hover:text-foreground";
      const internal = href.startsWith("/") && !href.startsWith("/api/");
      return internal ? <Link key={i} to={href} className={cls}>{tok.v}</Link> : <a key={i} href={fileHref(href)} target="_blank" rel="noreferrer" className={cls}>{tok.v}</a>;
    }
    return tok.v;
  });
};

export const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const Block = ({ b }) => {
  switch (b.type) {
    case "h2":
      return <h2 id={slugify(b.text)} className="scroll-mt-28 pt-6 font-display text-2xl font-medium tracking-tight sm:text-3xl">{b.text}</h2>;
    case "h3":
      return <h3 className="pt-2 font-display text-xl font-medium tracking-tight text-foreground">{b.text}</h3>;
    case "p":
      return <p className="text-base leading-[1.8] text-muted-foreground md:text-lg"><Inline text={b.text} md={b.md} /></p>;
    case "img":
      return safeHref(b.src) ? (
        <figure>
          <img src={fileHref(b.src)} alt={b.alt || ""} loading="lazy" decoding="async" className="w-full rounded-2xl border border-line/10" />
          {b.alt && <figcaption className="mt-2 text-center text-xs text-muted-foreground">{b.alt}</figcaption>}
        </figure>
      ) : null;
    case "code":
      return <pre className="overflow-x-auto rounded-2xl border border-line/10 bg-muted p-5 font-mono text-sm leading-relaxed text-foreground"><code>{b.text}</code></pre>;
    case "ul":
      return (
        <ul className="space-y-3">
          {b.items.map((it) => (
            <li key={it} className="flex gap-3 text-base leading-relaxed text-muted-foreground md:text-lg">
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> <span><Inline text={it} md={b.md} /></span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="relative rounded-2xl border border-line/10 bg-card p-8">
          <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/30" strokeWidth={1} />
          <p className="font-display text-xl font-light leading-snug text-foreground sm:text-2xl">“<Inline text={b.text} md={b.md} />”</p>
          {b.cite && <cite className="mt-4 block font-mono text-[11px] not-italic uppercase tracking-[0.18em] text-muted-foreground">{b.cite}</cite>}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="flex gap-4 rounded-2xl border border-teal/25 bg-teal/5 p-6">
          <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-teal" strokeWidth={1.5} />
          <div>
            <p className="font-display font-medium text-teal">{b.title}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base"><Inline text={b.text} md={b.md} /></p>
          </div>
        </aside>
      );
    case "stats":
      return (
        <div className="grid grid-cols-1 divide-y divide-line/10 rounded-2xl border border-line/10 bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {b.items.map((s) => (
            <div key={s.label} className="p-6">
              <p className="font-display text-4xl font-medium tracking-tighter text-primary-ink">{s.value}</p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      );
    case "steps":
      return (
        <ol className="grid gap-3 sm:grid-cols-2">
          {b.items.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line/10 bg-card p-5">
              <span className="font-mono text-xs text-primary-ink">0{i + 1}</span>
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
  const tx = useTx();
  const heads = blocks.filter((b) => b.type === "h2");
  if (!heads.length) return null;
  return (
    <nav aria-label={tx("On this page")} data-testid="article-toc">
      <p className="eyebrow mb-4">{tx("On this page")}</p>
      <ul className="space-y-2 border-l border-line/10">
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
