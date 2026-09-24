// SEO / AEO / GEO analytics helpers: classification, aggregation and scoring
// over a normalised snapshot (live from Semrush via the backend, or sample).
import { FAMILIES } from "@/data/families";

export const GEO_LABELS = { us: "United States", uk: "United Kingdom", ca: "Canada", de: "Germany", fr: "France", in: "India", au: "Australia", sg: "Singapore", ae: "UAE" };

// Semrush SERP feature codes. Answer features are the ones AEO targets.
// Semrush reports AI Overviews with their own code; confirm it against
// Semrush's current SERP-feature list if the "AI Overview" row stays empty.
export const SERP_FEATURES = {
  0: "Instant answer", 1: "Knowledge panel", 2: "Carousel", 3: "Local pack", 4: "Top stories", 5: "Image pack", 6: "Sitelinks",
  7: "Reviews", 9: "Video", 10: "Featured video", 11: "Featured snippet", 13: "Image", 20: "Video carousel", 21: "People also ask",
  22: "FAQ", 26: "Related searches", 52: "AI Overview",
};
export const ANSWER_FEATURES = [52, 11, 21, 22, 0, 1];
export const INTENTS = { 0: "Commercial", 1: "Informational", 2: "Navigational", 3: "Transactional" };

// --- Formatting ------------------------------------------------------------
export const fmtN = (v) => {
  if (v == null || Number.isNaN(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e4) return `${Math.round(v / 1e3)}K`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${Math.round(v)}`;
};
export const fmtMoney = (v) => (v == null ? "—" : `$${fmtN(v)}`);
export const fmtPct = (v, digits = 0) => (v == null || !Number.isFinite(v) ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`);
export const change = (now, before) => (before ? ((now - before) / before) * 100 : null);
export const pathOf = (url) => {
  try { return new URL(url.startsWith("http") ? url : `https://x${url}`).pathname; } catch { return url || ""; }
};

// --- Classification: which product line and which kind of asset a page is ----
const LINE_WORDS = {
  archiving: ["archiv", "retire", "retirement", "decommission", "sap", "oebs", "oracle-e-business", "mainframe", "preservation", "legacy", "ilm", "s4hana", "s-4hana"],
  ai: ["enterprise-ai", "-ai-", "/ai", "genai", "generative", "llm", "rag", "agent", "knowledge-graph", "data-sense", "data-ask", "machine-learning", "copilot"],
  governance: ["governance", "privacy", "gdpr", "ccpa", "dpdp", "masking", "pii", "dsar", "compliance", "test-data", "consent", "classification"],
  platform: ["common-data-platform", "cdp", "data-lake", "lakehouse", "enterprise-edition", "cloud", "platform", "data-fabric", "warehouse"],
  content: ["content-services", "ecm", "ediscovery", "e-discovery", "records", "document", "legal-hold"],
};
export const LINES = [...FAMILIES.map((f) => ({ id: f.id, name: f.name })), { id: "brand", name: "Brand & general" }];
export const LINE_NAME = Object.fromEntries(LINES.map((l) => [l.id, l.name]));

export const ASSET_TYPES = [
  ["kb", "Knowledge base", /\/(kb|glossary|what-is)\b/],
  ["blog", "Blog", /\/blog/],
  ["whitepaper", "White paper", /white-?paper/],
  ["datasheet", "Datasheet", /data-?sheet|solution-brief|\/brief/],
  ["casestudy", "Case study", /case-stud|customer-stor|success-stor/],
  ["webinar", "Webinar & video", /webinar|video|podcast/],
  ["ebook", "eBook & report", /ebook|e-book|report|guide/],
  ["news", "Newsroom", /press|news|media/],
  ["event", "Events", /event|empower/],
  ["product", "Product & solution page", /\/(products?|solutions?|platform|industries|use-cases?)\b/],
  ["company", "Brand & company", /\/(company|about|careers|partners|contact|leadership|customers)\b/],
];
export const ASSET_NAME = Object.fromEntries([...ASSET_TYPES.map(([id, name]) => [id, name]), ["home", "Home page"], ["other", "Other pages"]]);

export function classify(url, keyword = "") {
  const path = pathOf(url).toLowerCase();
  const asset = path === "/" || path === "" ? "home" : (ASSET_TYPES.find(([, , rx]) => rx.test(path)) || ["other"])[0];
  const text = `${path} ${keyword.toLowerCase().replace(/\s+/g, "-")}`;
  const product = FAMILIES.flatMap((f) => f.products.map((p) => [f.id, p])).find(([, p]) => text.includes(p));
  let line = product?.[0];
  if (!line) {
    let best = 0;
    for (const [id, words] of Object.entries(LINE_WORDS)) {
      const hits = words.filter((w) => text.includes(w)).length;
      if (hits > best) { best = hits; line = id; }
    }
  }
  return { asset, line: line || "brand", product: product?.[1] || null };
}

// --- Keyword maths -----------------------------------------------------------
// Typical organic click-through by position (industry average curve).
const CTR = [0, 0.28, 0.16, 0.11, 0.08, 0.065, 0.05, 0.04, 0.032, 0.027, 0.023];
export const ctr = (pos) => (!pos ? 0 : pos <= 10 ? CTR[Math.round(pos)] : pos <= 20 ? 0.01 : 0.002);

export const BUCKETS = [
  { key: "1-3", label: "Top 3", test: (p) => p <= 3 },
  { key: "4-10", label: "4–10", test: (p) => p > 3 && p <= 10 },
  { key: "11-20", label: "11–20", test: (p) => p > 10 && p <= 20 },
  { key: "21-50", label: "21–50", test: (p) => p > 20 && p <= 50 },
  { key: "51-100", label: "51–100", test: (p) => p > 50 },
];
export const positionBuckets = (kws) => BUCKETS.map((b) => ({ ...b, count: kws.filter((k) => k.position && b.test(k.position)).length }));

export const isBrand = (kw, brand = "solix") => kw.toLowerCase().includes(brand.toLowerCase());
export const trendChange = (t) => {
  if (!t || t.length < 6) return null;
  const a = t.slice(0, 3).reduce((s, v) => s + v, 0);
  const b = t.slice(-3).reduce((s, v) => s + v, 0);
  return a ? ((b - a) / a) * 100 : null;
};

export function movers(kws) {
  const moved = kws.filter((k) => k.prev_position && k.position && k.prev_position !== k.position).map((k) => ({ ...k, delta: k.prev_position - k.position }));
  const newly = kws.filter((k) => k.position && !k.prev_position);
  return {
    up: moved.filter((k) => k.delta > 0).sort((a, b) => b.delta * Math.log10(b.volume + 10) - a.delta * Math.log10(a.volume + 10)),
    down: moved.filter((k) => k.delta < 0).sort((a, b) => a.delta * Math.log10(a.volume + 10) - b.delta * Math.log10(b.volume + 10)),
    new: newly.sort((a, b) => b.volume - a.volume),
  };
}

/** Clicks a keyword would add if it moved into the top 3. */
export const upside = (k) => Math.max(0, Math.round(k.volume * (ctr(Math.min(3, k.position || 3)) - ctr(k.position))));
export const strikingDistance = (kws) => kws.filter((k) => k.position >= 4 && k.position <= 20).map((k) => ({ ...k, upside: upside(k) })).sort((a, b) => b.upside - a.upside);

export function cannibalised(kws) {
  const by = {};
  for (const k of kws) (by[k.keyword] ||= []).push(k);
  return Object.values(by).filter((l) => new Set(l.map((k) => k.url)).size > 1).map((l) => ({ keyword: l[0].keyword, volume: l[0].volume, urls: l.map((k) => ({ url: k.url, position: k.position })) }));
}

export function serpFeatures(kws) {
  const out = {};
  for (const k of kws) {
    for (const c of k.serp || []) (out[c] ||= { code: c, label: SERP_FEATURES[c] || `Feature ${c}`, available: 0, owned: 0, volume: 0 }).available++;
    for (const c of k.owned || []) {
      const f = (out[c] ||= { code: c, label: SERP_FEATURES[c] || `Feature ${c}`, available: 0, owned: 0, volume: 0 });
      f.owned++;
      f.volume += k.volume;
    }
  }
  return Object.values(out).sort((a, b) => b.available - a.available);
}

/** Share of answer-type SERP features (snippets, PAA, AI Overviews...) you hold where they appear. */
export function answerShare(kws) {
  let avail = 0, owned = 0;
  for (const k of kws) {
    const a = (k.serp || []).filter((c) => ANSWER_FEATURES.includes(c));
    avail += a.length;
    owned += (k.owned || []).filter((c) => a.includes(c)).length;
  }
  return { available: avail, owned, pct: avail ? (owned / avail) * 100 : 0 };
}

// --- Page / section aggregation -------------------------------------------------
export function sections(snapshot, by = "line") {
  const out = {};
  for (const p of pagesWithSignals(snapshot)) {
    const key = p[by];
    const s = (out[key] ||= { key, name: by === "line" ? LINE_NAME[key] : ASSET_NAME[key], traffic: 0, keywords: 0, pages: 0, top3: 0, value: 0, upside: 0, items: [] });
    s.traffic += p.traffic;
    s.keywords += p.keywords;
    s.pages++;
    s.top3 += p.kws.filter((k) => k.position <= 3).length;
    s.value += p.value;
    s.upside += p.upside;
    s.items.push(p);
  }
  return Object.values(out).sort((a, b) => b.traffic - a.traffic);
}

export function pagesWithSignals(snapshot) {
  const kwByUrl = {};
  for (const k of snapshot.keywords || []) (kwByUrl[k.url] ||= []).push(k);
  return (snapshot.pages || []).map((p) => {
    const kws = (kwByUrl[p.url] || []).sort((a, b) => b.traffic - a.traffic);
    const mv = kws.filter((k) => k.prev_position && k.position);
    const net = mv.reduce((s, k) => s + (k.prev_position - k.position), 0);
    const answers = answerShare(kws);
    return {
      ...p, ...classify(p.url, kws[0]?.keyword), kws, topKeyword: kws[0],
      avgPos: kws.length ? kws.reduce((s, k) => s + k.position, 0) / kws.length : null,
      netMovement: net, upside: kws.reduce((s, k) => s + (k.position >= 4 && k.position <= 20 ? upside(k) : 0), 0),
      answers, value: kws.reduce((v, k) => v + k.traffic * (k.cpc || 0), 0),
    };
  });
}

// --- Competition ------------------------------------------------------------------
export function market(snapshot) {
  const me = { domain: snapshot.domain, name: "You", self: true, ...snapshot.overview, history: snapshot.history };
  const all = [me, ...(snapshot.competitors || [])];
  const total = all.reduce((s, d) => s + (d.traffic || 0), 0) || 1;
  const rows = all.map((d) => {
    const h = d.history || [];
    const first = h[0]?.traffic, last = h[h.length - 1]?.traffic;
    return { ...d, share: (100 * (d.traffic || 0)) / total, growth: change(last, first), kwGrowth: change(h[h.length - 1]?.keywords, h[0]?.keywords) };
  }).sort((a, b) => b.traffic - a.traffic);
  rows.forEach((r, i) => { r.position = i + 1; });
  return rows;
}

/** Monthly share of organic traffic across you + competitors. */
export function shareHistory(snapshot) {
  const doms = [{ domain: snapshot.domain, history: snapshot.history }, ...(snapshot.competitors || [])];
  const dates = (snapshot.history || []).map((h) => h.date);
  return dates.map((date) => {
    const vals = doms.map((d) => d.history?.find((h) => h.date === date)?.traffic || 0);
    const total = vals.reduce((s, v) => s + v, 0) || 1;
    const leader = Math.max(...vals.slice(1));
    return { date, you: (100 * vals[0]) / total, leader: (100 * leader) / total, avg: (100 * (total - vals[0])) / total / Math.max(doms.length - 1, 1) };
  });
}

export function gapOpportunities(snapshot) {
  const me = snapshot.domain;
  return (snapshot.gap || [])
    .filter((g) => !g.positions[me] || g.positions[me] > 20)
    .map((g) => {
      const best = Math.min(...Object.entries(g.positions).filter(([d]) => d !== me).map(([, p]) => p));
      const ease = 1 - Math.min(g.kd ?? 50, 100) / 100;
      return { ...g, mine: g.positions[me] || null, best, rivals: Object.keys(g.positions).filter((d) => d !== me).length, score: Math.round(g.volume * (0.4 + ease) * (best <= 10 ? 1 : 0.6)) };
    })
    .sort((a, b) => b.score - a.score);
}

// --- Industry demand ----------------------------------------------------------------
export function industryDemand(snapshot) {
  const rows = (snapshot.industry_keywords || []).map((k) => ({ ...k, change: trendChange(k.trend) }));
  const withTrend = rows.filter((r) => r.change != null);
  const weighted = withTrend.reduce((s, r) => s + r.change * r.volume, 0) / (withTrend.reduce((s, r) => s + r.volume, 0) || 1);
  return { rows: rows.sort((a, b) => (b.change ?? -999) - (a.change ?? -999)), overall: withTrend.length ? weighted : null };
}

// --- Leadership: one visibility index per domain (0-100) ---------------------------
export function visibility(kws) {
  const potential = kws.reduce((s, k) => s + k.volume * ctr(1), 0);
  const actual = kws.reduce((s, k) => s + k.volume * ctr(k.position), 0);
  return potential ? (100 * actual) / potential : 0;
}
