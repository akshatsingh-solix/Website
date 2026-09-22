import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Check, Clock, Link2, Linkedin, Lock, Twitter } from "lucide-react";
import { toast } from "sonner";
import { RESOURCES } from "@/data/site";
import { ARTICLES } from "@/data/articles";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { ArticleBody, ArticleTOC } from "@/components/shared/ArticleBody";
import { ResourceCard, typeLabel } from "@/components/home/InsightsPreview";
import { LeadForm } from "@/components/forms/LeadForm";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";

const UNLOCK_KEY = "solix_unlocked";
const readUnlocked = () => JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || "[]");

const Share = ({ title }) => {
  const url = window.location.href;
  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    toast.success("Link copied");
  };
  const cls = "grid h-9 w-9 place-items-center rounded-full border border-white/10 text-muted-foreground transition-[color,border-color] hover:border-white/40 hover:text-foreground";
  return (
    <div className="flex gap-2" data-testid="article-share">
      <a className={cls} aria-label="Share on LinkedIn" target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}><Linkedin className="h-4 w-4" /></a>
      <a className={cls} aria-label="Share on X" target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}><Twitter className="h-4 w-4" /></a>
      <button className={cls} aria-label="Copy link" onClick={copy} data-testid="article-copy-link"><Link2 className="h-4 w-4" /></button>
    </div>
  );
};

export default function Article() {
  const { slug } = useParams();
  const r = RESOURCES.find((x) => x.slug === slug);
  const article = ARTICLES[slug];
  const [unlocked, setUnlocked] = useState(() => readUnlocked().includes(slug));
  if (!r || !article) return <Navigate to="/404" replace />;

  const gated = r.gated && !unlocked;
  const blocks = gated ? article.body.slice(0, 3) : article.body;
  const related = RESOURCES.filter((x) => x.slug !== slug && (x.type === r.type || x.tag === r.tag)).slice(0, 3);
  const fallback = RESOURCES.filter((x) => x.slug !== slug && !related.includes(x)).slice(0, 3 - related.length);

  const unlock = () => {
    sessionStorage.setItem(UNLOCK_KEY, JSON.stringify([...readUnlocked(), slug]));
    setUnlocked(true);
  };

  return (
    <article data-testid={`article-${slug}`}>
      <PageHero
        eyebrow={`${typeLabel(r.type)} · ${r.tag}`}
        crumbs={[{ label: "Resources", to: "/resources" }, { label: typeLabel(r.type), to: `/resources?type=${r.type}` }, { label: r.title }]}
        title={r.title}
        description={article.summary}
        compact
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card/80 p-5 text-sm backdrop-blur lg:min-w-[260px]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-teal/20 font-display text-sm font-semibold">{r.author.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <div>
              <p className="font-medium" data-testid="article-author">{r.author}</p>
              <p className="text-xs text-muted-foreground">{r.authorRole}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {r.date}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime}</span>
            {r.gated && <span className="inline-flex items-center gap-1.5 text-primary">{unlocked ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {unlocked ? "Unlocked" : "Gated"}</span>}
          </div>
          <Share title={r.title} />
        </div>
      </PageHero>

      <Section className="py-16 sm:py-20">
        <div className="container grid gap-12 lg:grid-cols-12">
          <aside className="order-2 lg:order-1 lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-10">
              <ArticleTOC blocks={article.body} />
              <div className="rounded-2xl border border-white/10 bg-card p-5">
                <p className="eyebrow mb-2">Talk to an expert</p>
                <p className="text-sm text-muted-foreground">See how this applies to your systems and data volumes.</p>
                <Button asChild size="sm" className="mt-4" data-testid="article-sidebar-demo">
                  <Link to="/contact">Request a demo <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          </aside>

          <div className="order-1 lg:order-2 lg:col-span-8 lg:col-start-5">
            <ArticleBody blocks={blocks} />
            {gated && (
              <Reveal className="relative mt-4">
                <div className="pointer-events-none absolute -top-40 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />
                <div className="rounded-3xl border border-primary/30 bg-card p-6 glow-ember sm:p-8" data-testid="article-gate">
                  <p className="eyebrow mb-2 flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> Continue reading</p>
                  <h3 className="font-display text-2xl font-medium tracking-tight">Unlock the full {typeLabel(r.type).toLowerCase()}.</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Tell us a little about yourself. We'll unlock the complete content instantly and send a copy to your inbox.</p>
                  <div className="mt-6">
                    <LeadForm type="download" extra={{ resource: r.title }} submitLabel="Unlock full content" successTitle="Unlocked." successDesc="The full content is now visible below and a copy is on its way to your inbox." showInterest={false} showMessage={false} compact onSuccess={unlock} />
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Section>

      <Section bordered className="bg-ink-900/40">
        <div className="container">
          <SectionHeading eyebrow="Related reads" title="Keep going." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {[...related, ...fallback].map((x) => <Item key={x.id} className="flex"><ResourceCard r={x} /></Item>)}
          </Stagger>
        </div>
      </Section>

      <CTABand eyebrow="Put this into practice" title="Bring one system, one dataset or one audit. We'll show the path." />
    </article>
  );
}
