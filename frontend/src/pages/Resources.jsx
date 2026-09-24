import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/intent";
import { useCmsResources } from "@/lib/content";
import { detectTopics } from "@/lib/localConcierge";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES, RESOURCE_TYPES } from "@/data/site";
import { PageHero } from "@/components/shared/PageHero";
import { Section } from "@/components/shared/Section";
import { Stagger, Item } from "@/components/shared/Reveal";
import { ResourceCard } from "@/components/home/InsightsPreview";
import { CTABand } from "@/components/shared/CTABand";
import { Input } from "@/components/ui/input";
import { useTx } from "@/i18n/tx";
import { useTranslation } from "react-i18next";

export default function Resources() {
  const tx = useTx();
  const { i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "all";
  const [q, setQ] = useState("");
  // Record what people search for (and which products it maps to) once they pause typing.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) return;
    const t = setTimeout(() => track("search", { topics: detectTopics(term), meta: { q: term.slice(0, 80) } }), 1200);
    return () => clearTimeout(t);
  }, [q]);

  const { items: cms, withdrawn } = useCmsResources();
  // Published CMS items first (newest), then the built-in library; a CMS item replaces a built-in one
  // with the same slug, and built-ins editors withdrew in the CMS are hidden.
  const all = useMemo(() => {
    const cmsSlugs = new Set(cms.map((c) => c.slug));
    return [...cms, ...RESOURCES.filter((r) => !cmsSlugs.has(r.slug) && !withdrawn.has(r.slug))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cms, withdrawn, i18n.language]);
  const list = useMemo(
    () => all.filter((r) => (type === "all" || r.type === type) && (q === "" || `${r.title} ${r.desc} ${r.tag}`.toLowerCase().includes(q.toLowerCase()))),
    [all, type, q]
  );

  return (
    <div data-testid="resources-page">
      <PageHero
        eyebrow="Resources"
        crumbs={[{ label: "Resources" }]}
        title="Insights for people who run enterprise data."
        description="White papers, webinars, case studies and field notes from two decades of archiving, retirement, privacy and AI programs."
        compact
      />

      <Section className="pt-10 sm:pt-12">
        <div className="container">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="tablist" data-testid="resource-filters">
              {RESOURCE_TYPES.map((t) => (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={type === t.key}
                  onClick={() => setParams(t.key === "all" ? {} : { type: t.key })}
                  data-testid={`resource-filter-${t.key}`}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-[background-color,border-color,color] duration-200",
                    type === t.key ? "border-primary bg-primary text-white" : "border-line/15 text-muted-foreground hover:border-line/40 hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative lg:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("Search resources")} className="h-11 rounded-full border-line/15 bg-background pl-11 focus-visible:ring-primary" data-testid="resource-search-input" aria-label={tx("Search resources")} />
            </div>
          </div>

          {list.length === 0 ? (
            <p className="mt-16 text-center text-muted-foreground" data-testid="resources-empty">{tx("No resources match your search yet.")}</p>
          ) : (
            <Stagger key={`${type}-${q}`} className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {list.map((r) => <Item key={r.id} className="flex"><ResourceCard r={r} /></Item>)}
            </Stagger>
          )}
        </div>
      </Section>

      <CTABand eyebrow="Prefer a conversation?" title="Skip the reading list. Talk to an architect." />
    </div>
  );
}
