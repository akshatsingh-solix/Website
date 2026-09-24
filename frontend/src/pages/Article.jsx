import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Calendar, Check, Clock, Download, Link2, Linkedin, Loader2, Lock, PlayCircle, Twitter } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { useTx } from "@/i18n/tx";
import { fileHref, useCmsArticle, useCmsResources } from "@/lib/content";
import { markdownToBlocks } from "@/lib/markdown";
import { setPageTopics, track } from "@/lib/intent";
import { api } from "@/lib/api";

const UNLOCK_KEY = "solix_unlocked";
const readUnlocked = () => JSON.parse(sessionStorage.getItem(UNLOCK_KEY) || "[]");

const Share = ({ title }) => {
  const tx = useTx();
  const url = window.location.href;
  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    toast.success(tx("Link copied"));
  };
  const cls = "grid h-9 w-9 place-items-center rounded-full border border-line/10 text-muted-foreground transition-[color,border-color] hover:border-line/40 hover:text-foreground";
  return (
    <div className="flex gap-2" data-testid="article-share">
      <a className={cls} aria-label={tx("Share on LinkedIn")} target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}><Linkedin className="h-4 w-4" /></a>
      <a className={cls} aria-label={tx("Share on X")} target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}><Twitter className="h-4 w-4" /></a>
      <button className={cls} aria-label={tx("Copy link")} onClick={copy} data-testid="article-copy-link"><Link2 className="h-4 w-4" /></button>
    </div>
  );
};

// Built-in article (data/articles.js) or a published CMS item, in one shape.
function useResource(slug) {
  const staticR = RESOURCES.find((x) => x.slug === slug);
  const staticArticle = ARTICLES[slug];
  const { items: cms } = useCmsResources();
  const cmsListed = cms.some((c) => c.slug === slug);
  const isStatic = !!(staticR && staticArticle) && !cmsListed;
  const { resource: cmsR, loading, missing } = useCmsArticle(isStatic ? null : slug);
  const blocks = useMemo(() => (isStatic ? staticArticle.body : cmsR ? markdownToBlocks(cmsR.body) : []), [isStatic, staticArticle, cmsR]);
  if (isStatic) return { r: staticR, summary: staticArticle.summary, blocks, related: [...cms, ...RESOURCES] };
  return { r: cmsR, summary: cmsR?.desc, blocks, loading, missing, related: [...cms, ...RESOURCES.filter((x) => !cms.some((c) => c.slug === x.slug))] };
}

export default function Article() {
  const { slug } = useParams();
  const tx = useTx();
  const { i18n } = useTranslation();
  const { r, summary, blocks: allBlocks, loading, missing, related: pool } = useResource(slug);
  const [unlocked, setUnlocked] = useState(() => readUnlocked().includes(slug));
  const [download, setDownload] = useState(null);

  // Intent: this page is about the resource's products.
  const topicsKey = (r?.products || []).join(",");
  useEffect(() => {
    if (!r) return;
    setPageTopics(r.products || []);
    track("resource_view", { topics: r.products || [], meta: { title: r.title } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, topicsKey, !!r]);

  useEffect(() => {
    if (!r?.cms) return;
    const prev = document.title;
    document.title = `${r.seoTitle || r.title} | Solix`;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content");
    if (meta && (r.seoDescription || r.desc)) meta.setAttribute("content", r.seoDescription || r.desc);
    return () => {
      document.title = prev;
      if (meta && prevDesc != null) meta.setAttribute("content", prevDesc);
    };
  }, [r]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center" data-testid="article-loading">
        <Loader2 className="h-6 w-6 animate-spin text-primary-ink" />
      </div>
    );
  }
  if (!r || missing) return <Navigate to="/404" replace />;

  const article = { body: allBlocks, summary };
  const gated = r.gated && !unlocked;
  const blocks = gated ? article.body.slice(0, 3) : article.body;
  const others = pool.filter((x) => x.slug !== slug);
  const related = others.filter((x) => x.type === r.type || x.tag === r.tag || (r.products || []).some((p) => (x.products || []).includes(p))).slice(0, 3);
  const fallback = others.filter((x) => !related.includes(x)).slice(0, 3 - related.length);
  const fileUrl = r.file?.url ? fileHref(r.file.url) : download;

  const unlock = async (submission) => {
    sessionStorage.setItem(UNLOCK_KEY, JSON.stringify([...readUnlocked(), slug]));
    setUnlocked(true);
    if (r.cms && r.file?.gated && submission?.id) {
      try {
        const { data } = await api.post(`/content/${slug}/unlock`, { submission_id: submission.id });
        setDownload(fileHref(data.url));
      } catch {
        toast.error(tx("Something went wrong. Please try again."));
      }
    }
  };

  return (
    <article data-testid={`article-${slug}`}>
      <PageHero
        eyebrow={r.tag ? `${typeLabel(r.type)} · ${r.tag}` : typeLabel(r.type)}
        crumbs={[{ label: "Resources", to: "/resources" }, { label: typeLabel(r.type), to: `/resources?type=${r.type}` }, { label: r.title }]}
        title={r.title}
        description={article.summary}
        compact
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-line/10 bg-card/80 p-5 text-sm backdrop-blur lg:min-w-[260px]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-teal/20 font-display text-sm font-semibold">{(r.author || "Solix").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <div>
              <p className="font-medium" data-testid="article-author">{r.author}</p>
              <p className="text-xs text-muted-foreground">{r.authorRole}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {r.date}</span>
            {r.readTime && <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {r.readTime}</span>}
            {r.gated && <span className="inline-flex items-center gap-1.5 text-primary-ink">{unlocked ? <Check className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />} {unlocked ? tx("Unlocked") : tx("Gated")}</span>}
          </div>
          {r.registerUrl && (
            <Button asChild data-intent="empower_register" data-testid="article-register">
              <a href={r.registerUrl}>{tx("Register free")} <ArrowRight /></a>
            </Button>
          )}
          <Share title={r.title} />
        </div>
      </PageHero>

      <Section className="py-16 sm:py-20">
        <div className="container grid gap-12 lg:grid-cols-12">
          <aside className="order-2 lg:order-1 lg:col-span-3">
            <div className="lg:sticky lg:top-28 space-y-10">
              <ArticleTOC blocks={article.body} />
              <div className="rounded-2xl border border-line/10 bg-card p-5">
                <p className="eyebrow mb-2">{tx("Talk to an expert")}</p>
                <p className="text-sm text-muted-foreground">{tx("See how this applies to your systems and data volumes.")}</p>
                <Button asChild size="sm" className="mt-4" data-testid="article-sidebar-demo">
                  <Link to="/contact">{tx("Request a demo")} <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          </aside>

          <div className="order-1 lg:order-2 lg:col-span-8 lg:col-start-5">
            {r.cover && <img src={fileHref(r.cover)} alt="" className="mb-10 aspect-[16/9] w-full rounded-2xl border border-line/10 object-cover" loading="eager" decoding="async" data-testid="article-cover" />}
            {(r.video || (r.file && !gated)) && (
              <div className="mb-10 flex flex-wrap gap-3" data-testid="article-assets">
                {r.video && (
                  <Button asChild variant="outline"><a href={r.video} target="_blank" rel="noreferrer"><PlayCircle /> {tx("Watch the recording")}</a></Button>
                )}
                {r.file && !gated && (fileUrl ? (
                  <Button asChild onClick={() => track("resource_download", { topics: r.products || [], meta: { title: r.title } })}>
                    <a href={fileUrl} target="_blank" rel="noreferrer" data-testid="article-download"><Download /> {tx("Download {{name}}", { name: r.file.name })}</a>
                  </Button>
                ) : (
                  <Button disabled><Loader2 className="animate-spin" /> {tx("Preparing your download…")}</Button>
                ))}
              </div>
            )}
            <ArticleBody blocks={blocks} />
            {r.file && !gated && fileUrl && (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal/30 bg-teal/5 p-5" data-testid="article-download-end">
                <p className="font-display font-medium text-foreground">{r.title}</p>
                <Button asChild onClick={() => track("resource_download", { topics: r.products || [], meta: { title: r.title } })}>
                  <a href={fileUrl} target="_blank" rel="noreferrer"><Download /> {tx("Download {{name}}", { name: r.file.name })}</a>
                </Button>
              </div>
            )}
            {gated && (
              <Reveal className="relative mt-4">
                <div className="pointer-events-none absolute -top-40 inset-x-0 h-40 bg-gradient-to-t from-background to-transparent" />
                <div className="rounded-3xl border border-primary/30 bg-card p-6 glow-ember sm:p-8" data-testid="article-gate">
                  <p className="eyebrow mb-2 flex items-center gap-2"><Lock className="h-3.5 w-3.5" /> {tx("Continue reading")}</p>
                  <h3 className="font-display text-2xl font-medium tracking-tight">{tx("Unlock the full {{type}}.", { type: i18n.language === "de" ? typeLabel(r.type) : typeLabel(r.type).toLowerCase() })}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{tx("Tell us a little about yourself. We'll unlock the complete content instantly and send a copy to your inbox.")}</p>
                  <div className="mt-6">
                    <LeadForm type="download" extra={{ resource: r.title, topics: r.products?.length ? r.products : undefined }} submitLabel="Unlock full content" successTitle="Unlocked." successDesc="The full content is now visible below and a copy is on its way to your inbox." showInterest={false} showMessage={false} compact onSuccess={unlock} />
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </Section>

      <Section bordered className="bg-muted">
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
