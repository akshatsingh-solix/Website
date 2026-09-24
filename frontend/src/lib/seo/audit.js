// On-page audit for a CMS item, scored three ways:
//   SEO  - can search engines understand and rank it?
//   AEO  - can answer engines lift a direct answer (snippets, People also ask)?
//   GEO  - will generative engines (ChatGPT, Gemini, AI Overviews) trust and cite it?
// Runs in the browser on every edit, so writers see the effect as they type.

const MIN_WORDS = { blog: 900, whitepaper: 1200, ebook: 1200, casestudy: 600, datasheet: 300, brief: 400, news: 300, leadership: 600 };
const QUESTION = /^(what|how|why|when|which|who|where|can|should|is|are|does|do)\b|\?\s*$/i;

const words = (s) => (s || "").replace(/[#>*_`[\]()!-]/g, " ").split(/\s+/).filter(Boolean);
const has = (text, kw) => !!kw && (text || "").toLowerCase().includes(kw.toLowerCase());

export function parseBody(md = "") {
  const lines = md.split("\n");
  const headings = lines.filter((l) => /^#{2,4}\s/.test(l)).map((l) => l.replace(/^#+\s*/, "").trim());
  const links = [...md.matchAll(/(!?)\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].filter((m) => !m[1]).map((m) => ({ text: m[2], href: m[3] }));
  const images = [...md.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map((m) => ({ alt: m[1].trim(), src: m[2] }));
  const paras = md.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p && !/^(#|!\[|[-*]\s|\d+\.\s|>|\|)/.test(p));
  const lists = lines.filter((l) => /^\s*([-*]|\d+\.)\s/.test(l)).length;
  const tables = lines.filter((l) => /^\|.*\|/.test(l)).length;
  const stats = (md.match(/\b\d[\d,.]*\s?(%|percent|x\b|million|billion|TB|PB|hours|days)/gi) || []).length;
  return { headings, links, images, paras, lists, tables, stats, wordCount: words(md).length };
}

const check = (id, ok, label, fix, weight = 1, partial = null) => ({ id, ok: !!ok, partial, label, fix, weight });

export function auditContent(form, { keyword = "", brand = "Solix", updatedAt } = {}) {
  const title = form.seo_title || form.title || "";
  const desc = form.seo_description || form.summary || "";
  const b = parseBody(form.body);
  const first = b.paras[0] || "";
  const firstWords = words(first).length;
  const internal = b.links.filter((l) => l.href.startsWith("/") || /solix\.com/i.test(l.href));
  const external = b.links.filter((l) => /^https?:\/\//.test(l.href) && !/solix\.com/i.test(l.href));
  const minWords = MIN_WORDS[form.type] || 500;
  const qHeads = b.headings.filter((h) => QUESTION.test(h));
  const ageDays = updatedAt ? (Date.now() - new Date(updatedAt).getTime()) / 86400000 : 0;

  const seo = [
    check("kw", keyword, "Focus keyword chosen", "Pick the one search phrase this page should win.", 2),
    check("title-len", title.length >= 30 && title.length <= 60, `SEO title is 30–60 characters (${title.length})`, "Keep the title between 30 and 60 characters so it isn't cut off."),
    check("title-kw", has(title, keyword), "Keyword in the SEO title", "Put the focus keyword near the start of the title.", 2),
    check("desc-len", desc.length >= 70 && desc.length <= 155, `Meta description is 70–155 characters (${desc.length})`, "Write a 70–155 character description that sells the click."),
    check("desc-kw", has(desc, keyword), "Keyword in the meta description", "Use the keyword naturally in the description."),
    check("slug", has((form.slug || "").replace(/-/g, " "), keyword) || (!keyword && form.slug), "Keyword in the URL", "Use a short URL built from the keyword."),
    check("slug-len", (form.slug || "").split("-").length <= 7, "URL is short (7 words or fewer)", "Trim filler words from the URL."),
    check("intro-kw", has(first, keyword), "Keyword in the opening paragraph", "Mention the keyword in the first paragraph."),
    check("length", b.wordCount >= minWords, `At least ${minWords} words for this type (${b.wordCount})`, `Pages that rank for competitive terms usually cover the topic in ${minWords}+ words.`, 1, b.wordCount / minWords),
    check("h2", b.headings.length >= 2, `Structured with subheadings (${b.headings.length})`, "Break the body into sections with ## headings."),
    check("h2-kw", b.headings.some((h) => has(h, keyword)), "Keyword or a variant in a subheading", "Use the keyword in at least one subheading."),
    check("internal", internal.length >= 2, `Links to 2+ related Solix pages (${internal.length})`, "Link to the matching product page and one related resource.", 2),
    check("alt", b.images.every((i) => i.alt), "Every image has alt text", "Describe each image in its alt text."),
    check("cover", form.cover_image, "Has a cover image for social cards", "Upload a cover image so shares show a preview."),
  ];

  const aeo = [
    check("answer-first", firstWords > 0 && firstWords <= 60 && (has(first, keyword) || !keyword), `Opens with a direct answer in 60 words or fewer (${firstWords})`, "Start with a 40–60 word answer to the main question. Answer engines lift this for featured snippets.", 2),
    check("definition", /\b(is|are|means|refers to)\b/i.test(first), "Opening defines the topic ('X is…')", "Open with a plain definition: '<Topic> is…'."),
    check("q-heads", qHeads.length >= 2, `Question-style subheadings (${qHeads.length})`, "Phrase 2 or more subheadings as the questions buyers ask ('How does…?').", 2),
    check("faq", b.headings.some((h) => /faq|frequently asked/i.test(h)), "Has an FAQ section", "Add an FAQ with 3–5 short Q&As; it feeds People also ask and FAQ rich results."),
    check("lists", b.lists >= 3 || b.tables >= 2, "Uses lists or tables for steps and comparisons", "Put steps, criteria or comparisons in a list or table; engines extract these directly."),
    check("summary", (form.summary || "").length >= 50, "Has a summary / TL;DR", "Write a 1–2 sentence summary; it is the page's answer card."),
  ];

  const geo = [
    check("author", form.author && form.author_role, "Named author with a role (expertise signal)", "Add the author and their role so AI engines can attribute expertise.", 2),
    check("stats", b.stats >= 2, `Specific facts and numbers (${b.stats})`, "Add concrete figures (savings %, TB archived, days to retire). Generative engines prefer quotable facts.", 2),
    check("sources", external.length >= 1, `Cites outside sources (${external.length})`, "Cite at least one analyst, regulation or standard with a link."),
    check("brand", has(form.body, brand), `Mentions ${brand} by name in the body`, `Name ${brand} and the product explicitly so AI answers can attribute the idea to you.`),
    check("entities", (form.products || []).length > 0, "Tagged to a product", "Tag the related product so the page links into the product graph."),
    check("fresh", !updatedAt || ageDays < 365, updatedAt ? `Updated in the last 12 months (${Math.round(ageDays)} days ago)` : "Fresh content", "Refresh facts and dates; AI engines favour recently updated sources."),
    check("quotable", b.paras.some((p) => words(p).length <= 35 && /\b(is|are|reduces|cuts|lets|helps)\b/i.test(p)), "Has short, quotable statements", "Include one or two crisp one-sentence claims an AI answer can quote."),
  ];

  const score = (list) => {
    const total = list.reduce((s, c) => s + c.weight, 0);
    const got = list.reduce((s, c) => s + c.weight * (c.ok ? 1 : Math.max(0, Math.min(1, c.partial || 0)) * 0.8), 0);
    return Math.round((100 * got) / total);
  };
  return {
    stats: b,
    groups: [
      { id: "seo", label: "SEO", sub: "Rank in search results", checks: seo, score: score(seo) },
      { id: "aeo", label: "AEO", sub: "Win answer boxes", checks: aeo, score: score(aeo) },
      { id: "geo", label: "GEO", sub: "Get cited by AI", checks: geo, score: score(geo) },
    ],
  };
}

/** Best guess at the focus keyword from the phrases this page already ranks for. */
export const suggestKeyword = (ranked = []) => ranked.slice().sort((a, b) => (b.volume || 0) - (a.volume || 0))[0]?.keyword || "";
