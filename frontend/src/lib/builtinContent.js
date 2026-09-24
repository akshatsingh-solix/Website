// The website's built-in (original) content - resources, their article bodies
// and press releases - in the CMS import format, so editors can take it over
// in Admin > Content. English source text; translations keep working because
// they are keyed by that text.
import { SOURCE as SITE } from "@/data/site";
import { SOURCE as ARTICLES } from "@/data/articles";
import { SOURCE as NEWS } from "@/data/newsroom";
import { blocksToMarkdown } from "@/lib/markdown";

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// "May 2026" / "2026-06-02" -> "2026-05-01" / "2026-06-02"
const isoDate = (d) => {
  if (!d) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/.exec(d.trim());
  return m && MONTHS[m[1].toLowerCase()] ? `${m[2]}-${String(MONTHS[m[1].toLowerCase()]).padStart(2, "0")}-01` : null;
};

export function builtinContent() {
  const resources = SITE.RESOURCES.map((r) => {
    const article = ARTICLES.ARTICLES[r.slug];
    return {
      title: r.title, type: r.type, slug: r.slug, summary: (r.desc || "").slice(0, 600),
      body: article ? blocksToMarkdown(article.body) : "", tag: r.tag || null, products: r.products || [],
      author: r.author || null, author_role: r.authorRole || null, gated: !!r.gated,
      event_date: r.type === "event" ? r.date : null, date: isoDate(r.date),
    };
  });
  const press = NEWS.PRESS_RELEASES.map((p) => ({
    title: p.title, type: "news", slug: p.id, summary: (p.summary || "").slice(0, 600), body: blocksToMarkdown(p.body),
    tag: p.category || null, cover_image: p.image || null, date: isoDate(p.date),
  }));
  return { resources, press, all: [...resources, ...press] };
}
