import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Calendar, Copy, Download, Link2, Linkedin, Loader2, Mail, Twitter } from "lucide-react";
import { localizeBlocks, markdownToBlocks } from "@/lib/markdown";
import { usePressReleases } from "@/lib/press";
import { toast } from "sonner";
import { BOILERPLATE, PRESS_CONTACT } from "@/data/newsroom";
import { API } from "@/lib/api";
import { PageHero } from "@/components/shared/PageHero";
import { Section, SectionHeading } from "@/components/shared/Section";
import { Reveal, Stagger, Item } from "@/components/shared/Reveal";
import { ArticleBody } from "@/components/shared/ArticleBody";
import { CTABand } from "@/components/shared/CTABand";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useTx } from "@/i18n/tx";
import { Picture } from "@/components/shared/Picture";
import { pressArt } from "@/lib/art";

const fmt = (d, lng = "en") => new Date(d).toLocaleDateString(lng, { month: "long", day: "numeric", year: "numeric" });

export default function PressRelease() {
  const { id } = useParams();
  const tx = useTx();
  const { i18n } = useTranslation();
  const lng = i18n.language;
  const { releases, ready } = usePressReleases();
  const found = releases.find((p) => p.id === id);
  // CMS releases carry Markdown; built-in ones already have blocks.
  const pr = useMemo(() => (found?.cms ? { ...found, body: localizeBlocks(markdownToBlocks(found.markdown), lng) } : found), [found, lng]);
  const [busy, setBusy] = useState(false);
  if (!pr) {
    if (!ready) return <div className="grid min-h-[60vh] place-items-center" data-testid="press-loading"><Loader2 className="h-6 w-6 animate-spin text-primary-ink" /></div>;
    return <Navigate to="/404" replace />;
  }

  const others = releases.filter((p) => p.id !== id).slice(0, 3);
  const url = window.location.href;
  const copy = async (text, msg) => { await navigator.clipboard?.writeText(text); toast.success(msg); };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/press/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pr.id, title: pr.title, date: fmt(pr.date, lng), category: tx(pr.category), summary: pr.summary, blocks: pr.body, boilerplate: tx(BOILERPLATE), contact: `${PRESS_CONTACT.name} · ${PRESS_CONTACT.email} · ${PRESS_CONTACT.phone}` }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement("a"), { href, download: `solix-press-${pr.id}.pdf` });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
      toast.success(tx("PDF downloaded"));
    } catch {
      toast.error(tx("Could not generate the PDF. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const iconCls = "grid h-9 w-9 place-items-center rounded-full border border-line/10 text-muted-foreground transition-[color,border-color] hover:border-line/40 hover:text-foreground";

  return (
    <article data-testid={`press-release-${pr.id}`}>
      <PageHero
        eyebrow={`${tx("Press release")} · ${tx(pr.category)}`}
        crumbs={[{ label: "Company", to: "/company" }, { label: "Newsroom", to: "/newsroom" }, { label: pr.category }]}
        title={pr.title}
        description={pr.summary}
        image={pr.image || pressArt(pr.category)}
        compact
      >
        <div className="inline-flex flex-wrap items-center gap-4 rounded-2xl border border-line/10 bg-card/80 p-4 text-sm shadow-soft backdrop-blur">
          <p className="inline-flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> {fmt(pr.date, lng)}</p>
          {pr.registerUrl && (
            <Button asChild data-intent="empower_register" data-testid="press-register"><a href={pr.registerUrl}>{tx("Register now")} <ArrowUpRight /></a></Button>
          )}
          <Button variant={pr.registerUrl ? "outline" : "default"} onClick={downloadPdf} disabled={busy} data-testid="press-download-pdf">{busy ? <Loader2 className="animate-spin" /> : <Download />} {tx("Download PDF")}</Button>
          <div className="flex gap-2" data-testid="press-share">
            <a className={iconCls} aria-label={tx("Share on LinkedIn")} target="_blank" rel="noreferrer" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}><Linkedin className="h-4 w-4" /></a>
            <a className={iconCls} aria-label={tx("Share on X")} target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(pr.title)}`}><Twitter className="h-4 w-4" /></a>
            <button className={iconCls} aria-label={tx("Copy link")} onClick={() => copy(url, tx("Link copied"))} data-testid="press-copy-link"><Link2 className="h-4 w-4" /></button>
          </div>
        </div>
      </PageHero>

      <Section className="py-16 sm:py-20">
        <div className="container grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal className="mb-8 overflow-hidden rounded-3xl border border-line/10">
              <Picture src={pr.image || pressArt(pr.category)} loading="eager" className="aspect-[21/9] w-full object-cover" data-testid="press-hero-image" />
            </Reveal>
            <ArticleBody blocks={pr.body} />
            <div className="mt-12 rounded-2xl border border-line/10 bg-card p-6" data-testid="press-boilerplate">
              <div className="flex items-center justify-between">
                <p className="eyebrow">{tx("About Solix Technologies")}</p>
                <Button variant="ghost" size="sm" onClick={() => copy(tx(BOILERPLATE), tx("Boilerplate copied"))} data-testid="press-copy-boilerplate"><Copy /> {tx("Copy")}</Button>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{tx(BOILERPLATE)}</p>
              <p className="mt-4 text-center font-mono text-xs text-muted-foreground">###</p>
            </div>
          </div>
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="rounded-2xl border border-line/10 bg-card p-5 text-sm" data-testid="press-contact-card">
                <p className="eyebrow mb-3">{tx("Media contact")}</p>
                <p className="font-medium">{PRESS_CONTACT.name}</p>
                <a href={`mailto:${PRESS_CONTACT.email}?subject=${encodeURIComponent("Re: " + pr.title)}`} className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-primary-ink"><Mail className="h-4 w-4" /> {PRESS_CONTACT.email}</a>
                <p className="mt-1.5 text-muted-foreground">{PRESS_CONTACT.phone}</p>
              </div>
              <Link to="/newsroom#media-kit" className="group flex items-center justify-between rounded-2xl border border-line/10 bg-card p-5 text-sm card-hover" data-testid="press-media-kit-link">
                <span><span className="block font-medium">{tx("Media kit")}</span><span className="text-xs text-muted-foreground">{tx("Logos, colors, guidelines")}</span></span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary-ink" />
              </Link>
              <Button asChild variant="outline" className="w-full" data-testid="press-back"><Link to="/newsroom"><ArrowLeft /> {tx("All announcements")}</Link></Button>
            </div>
          </aside>
        </div>
      </Section>

      <Section bordered className="bg-muted">
        <div className="container">
          <SectionHeading eyebrow="More announcements" title="Recent from Solix." />
          <Stagger className="mt-12 grid gap-4 md:grid-cols-3">
            {others.map((p) => (
              <Item key={p.id} className="flex">
                <Link to={`/newsroom/${p.id}`} className="group flex w-full flex-col rounded-2xl border border-line/10 bg-card p-6 card-hover" data-testid={`press-related-${p.id}`}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">{tx(p.category)} · {fmt(p.date, lng)}</span>
                  <h3 className="mt-4 font-display text-lg font-medium leading-snug transition-colors group-hover:text-primary-ink">{p.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{p.summary}</p>
                </Link>
              </Item>
            ))}
          </Stagger>
        </div>
      </Section>

      <CTABand eyebrow="Analysts & press" title="Need a briefing, a spokesperson or a customer reference?" primary={{ label: "Contact media relations", to: "/contact?type=contact" }} secondary={{ label: "About Solix", to: "/company" }} />
    </article>
  );
}
