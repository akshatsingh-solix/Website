// Illustrative data in the exact shape of a live Semrush snapshot, so every
// view of the SEO dashboard can be explored before Semrush is connected. It
// is always labelled "Sample" in the UI and never mixed with live numbers.

const rng = (seed) => {
  let a = [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0, 1779033703);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const GEO_SCALE = { us: 1, uk: 0.32, ca: 0.18, de: 0.2, fr: 0.12, in: 0.45, au: 0.14, sg: 0.07, ae: 0.05 };

// [keyword, US monthly volume, url path, intent, answer features on the SERP]
const UNIVERSE = [
  ["solix", 2400, "/", 2, [1, 6]],
  ["solix technologies", 1300, "/company/about-us/", 2, [1, 6]],
  ["data archiving", 3600, "/kb/data-archiving/", 1, [52, 11, 21]],
  ["what is data archiving", 1900, "/kb/data-archiving/", 1, [52, 11, 21]],
  ["application retirement", 1600, "/products/enterprise-archiving/application-retirement/", 0, [52, 21]],
  ["legacy application decommissioning", 880, "/solutions/application-retirement/", 0, [21]],
  ["sap data archiving", 1300, "/products/sap-archiving/", 0, [52, 21]],
  ["sap archiving", 1000, "/products/sap-archiving/", 0, [21]],
  ["s/4hana migration data volume", 590, "/blog/archive-first-s4hana-migration/", 1, [52, 21]],
  ["oracle ebs archiving", 480, "/products/oracle-oebs-archiving/", 0, [21]],
  ["database archiving", 1900, "/products/database-archiving/", 0, [52, 11, 21]],
  ["email archiving", 6600, "/products/email-archiving/", 0, [21, 3]],
  ["email archiving solutions", 1600, "/products/email-archiving/", 3, [21]],
  ["file archiving", 1300, "/products/file-archiving/", 0, [21]],
  ["mainframe archiving", 390, "/products/mainframe-archiving/", 0, [21]],
  ["information lifecycle management", 2900, "/kb/information-lifecycle-management/", 1, [52, 11, 21]],
  ["data retention policy", 5400, "/kb/data-retention-policy/", 1, [52, 11, 21, 22]],
  ["records retention schedule", 2400, "/kb/records-retention-schedule/", 1, [52, 11, 21]],
  ["enterprise archiving", 720, "/products/enterprise-archiving/", 0, [21]],
  ["data archiving software", 1000, "/products/enterprise-archiving/", 3, [21]],
  ["cold data storage", 1300, "/blog/cold-data-storage-costs/", 1, [52, 21]],
  ["data governance", 22200, "/kb/data-governance/", 1, [52, 11, 21, 1]],
  ["data governance framework", 8100, "/kb/data-governance-framework/", 1, [52, 11, 21]],
  ["data governance tools", 4400, "/products/enterprise-data-governance/", 3, [21]],
  ["ai governance", 9900, "/products/ai-governance/", 1, [52, 11, 21]],
  ["ai governance framework", 3600, "/resources/whitepapers/ai-governance-framework/", 1, [52, 21]],
  ["eu ai act compliance", 2900, "/blog/eu-ai-act-compliance-checklist/", 1, [52, 21, 4]],
  ["data masking", 6600, "/kb/data-masking/", 1, [52, 11, 21]],
  ["test data management", 3600, "/products/test-data-management/", 0, [52, 21]],
  ["pii discovery", 880, "/products/consumer-data-privacy/", 0, [21]],
  ["dsar automation", 590, "/products/consumer-data-privacy/", 3, [21]],
  ["gdpr data retention", 1300, "/kb/gdpr-data-retention/", 1, [52, 11, 21]],
  ["dpdp act compliance", 1600, "/blog/dpdp-act-compliance-guide/", 1, [52, 21, 4]],
  ["enterprise ai", 6600, "/products/enterprise-ai/", 1, [52, 21]],
  ["enterprise ai platform", 1900, "/products/enterprise-ai/", 0, [21]],
  ["ai ready data", 1600, "/blog/ai-ready-data/", 1, [52, 21]],
  ["rag enterprise data", 720, "/blog/rag-on-enterprise-data/", 1, [52, 21]],
  ["knowledge graph for ai", 1000, "/products/application-knowledge-graph/", 1, [52, 21]],
  ["agentic ai data governance", 590, "/blog/governing-ai-agents/", 1, [52, 21]],
  ["text to sql", 2400, "/products/data-ask/", 1, [52, 11, 21, 9]],
  ["common data platform", 1300, "/platform/common-data-platform/", 1, [21]],
  ["data lakehouse", 8100, "/kb/data-lakehouse/", 1, [52, 11, 21, 9]],
  ["enterprise data lake", 1900, "/products/enterprise-data-lake/", 0, [21]],
  ["data fabric vs data mesh", 1600, "/kb/data-fabric-vs-data-mesh/", 1, [52, 11, 21]],
  ["unstructured data management", 1300, "/solutions/unstructured-data/", 0, [52, 21]],
  ["ediscovery software", 3600, "/products/ediscovery/", 3, [21]],
  ["legal hold", 2400, "/kb/legal-hold/", 1, [52, 11, 21]],
  ["enterprise content management", 6600, "/products/enterprise-content-services/", 1, [52, 21, 1]],
  ["records management", 4400, "/kb/records-management/", 1, [52, 11, 21]],
  ["application retirement case study", 210, "/resources/case-studies/global-bank-application-retirement/", 0, []],
  ["sap archiving whitepaper", 170, "/resources/whitepapers/sap-archiving-guide/", 1, []],
  ["solix empower", 480, "/events/solix-empower/", 2, [6]],
  ["solix cloud", 390, "/platform/solixcloud/", 2, [6]],
  ["data archiving best practices", 880, "/resources/ebooks/data-archiving-best-practices/", 1, [52, 21]],
  ["application decommissioning checklist", 320, "/resources/datasheets/decommissioning-checklist/", 1, [21]],
  ["gartner data archiving", 260, "/newsroom/solix-recognized-gartner/", 1, [4]],
  ["structured data archiving and application retirement", 210, "/resources/reports/sda-market-guide/", 0, []],
  ["data archiving webinar", 90, "/resources/webinars/archive-first-s4hana/", 1, [9]],
];

const INDUSTRY_TREND = {
  "data archiving": 4, "application retirement": 9, "legacy application decommissioning": 14, "sap data archiving": 22, "database archiving": -3,
  "email archiving": -6, "data governance": 7, "ai governance": 48, "data privacy compliance": 11, "records retention": 2, "enterprise ai": 31,
  "data lakehouse": 12, "unstructured data management": 26, "ediscovery": -2, "data masking": 5,
};

const COMP_BASE = {
  "informatica.com": [310000, 58], "commvault.com": [120000, 55], "opentext.com": [260000, 62], "veritas.com": [95000, 57], "archive360.com": [14000, 38],
  "delphix.com": [22000, 42], "bigid.com": [38000, 45], "smarsh.com": [41000, 46], "globalrelay.com": [30000, 44], "platform3solutions.com": [6500, 29],
  "cohesity.com": [88000, 52], "rubrik.com": [105000, 53], "infobelt.com": [3200, 24], "avepoint.com": [52000, 49], "mimecast.com": [140000, 58],
  "onetrust.com": [150000, 60], "ironmountain.com": [210000, 61], "securiti.ai": [36000, 44], "newgensoft.com": [28000, 43], "ser.de": [9000, 36],
  "d-velop.de": [24000, 41], "easy-software.com": [11000, 35], "dataglobal.com": [4000, 28], "fabasoft.com": [15000, 40], "kgs-software.com": [2500, 25],
};

const months = (n) => {
  const d = new Date();
  d.setUTCDate(15);
  return Array.from({ length: n }, (_, i) => {
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - (n - 1 - i), 15));
    return m.toISOString().slice(0, 10);
  });
};

const series = (r, base, drift, noise = 0.06) => {
  let v = base * (1 - drift);
  return months(12).map((date) => {
    v *= 1 + drift / 11 + (r() - 0.5) * noise;
    return { date, v };
  });
};

export function sampleSnapshot(geo = "us", cfg = {}) {
  const r = rng(`solix-${geo}`);
  const scale = GEO_SCALE[geo] ?? 0.1;
  const domain = cfg.domain || "solix.com";
  const vol = (v) => Math.max(10, Math.round((v * scale * (0.7 + r() * 0.6)) / 10) * 10);

  const keywords = UNIVERSE.map(([keyword, v, path, intent, feats]) => {
    const brand = keyword.includes("solix");
    const position = brand ? 1 + Math.floor(r() * 2) : Math.max(1, Math.round(1 + r() ** 1.6 * 38));
    const drift = Math.round((r() - 0.45) * 8);
    const prev = r() < 0.12 ? null : Math.max(1, position + drift);
    const volume = vol(v);
    const owned = feats.filter((f) => position <= 5 && r() < (f === 52 ? 0.35 : 0.45));
    const t = INDUSTRY_TREND[keyword] ?? (r() - 0.4) * 30;
    return {
      keyword, position, prev_position: prev, volume, cpc: +(brand ? 1 + r() * 2 : 4 + r() * 28).toFixed(2), url: `https://www.${domain}${path}`,
      traffic_pct: 0, traffic: Math.round(volume * [0, 0.28, 0.16, 0.11, 0.08, 0.065, 0.05, 0.04, 0.032, 0.027, 0.023][Math.min(position, 10)] * (position > 10 ? 0.3 : 1) + (position > 10 ? volume * 0.004 : 0)),
      competition: +(r()).toFixed(2), kd: Math.round(brand ? 10 + r() * 20 : 25 + r() * 60),
      trend: months(12).map((_, i) => +(Math.max(0.1, Math.min(1, 0.6 + (t / 100) * (i / 11) + (r() - 0.5) * 0.15))).toFixed(2)),
      serp: [...feats, ...(r() < 0.5 ? [6] : []), 26], owned, intent: [intent],
    };
  });
  const total = keywords.reduce((s, k) => s + k.traffic, 0);
  keywords.forEach((k) => { k.traffic_pct = +((100 * k.traffic) / total).toFixed(2); });
  keywords.sort((a, b) => b.traffic - a.traffic);

  const byUrl = {};
  for (const k of keywords) (byUrl[k.url] ||= { url: k.url, keywords: 0, traffic: 0 }), byUrl[k.url].keywords += 1 + Math.floor(r() * 40), byUrl[k.url].traffic += k.traffic;
  const pages = Object.values(byUrl).map((p) => ({ ...p, traffic: Math.round(p.traffic * 1.6), traffic_pct: 0 })).sort((a, b) => b.traffic - a.traffic);
  const ptotal = pages.reduce((s, p) => s + p.traffic, 0);
  pages.forEach((p) => { p.traffic_pct = +((100 * p.traffic) / ptotal).toFixed(2); });

  const organic = Math.round(ptotal * 3.1);
  const history = series(r, organic, 0.14).map(({ date, v }, i, a) => ({ date, traffic: i === a.length - 1 ? organic : Math.round(v), keywords: Math.round((v / organic) * 5200 * scale + 400), traffic_cost: Math.round(v * 7.4) }));

  const comps = ((cfg.competitors || {})[geo] || Object.keys(COMP_BASE).slice(0, 12)).filter((d) => d !== domain);
  const competitors = comps.map((d) => {
    const [base, auth] = COMP_BASE[d] || [8000 + r() * 30000, 30 + r() * 25];
    const traffic = Math.round(base * scale * (0.6 + r() * 0.8));
    const drift = (r() - 0.35) * 0.5;
    return {
      domain: d, name: (cfg.brand_names || {})[d] || d.split(".")[0].replace(/^\w/, (c) => c.toUpperCase()),
      traffic, keywords: Math.round(traffic / (3 + r() * 4)), traffic_cost: Math.round(traffic * (4 + r() * 9)), paid_keywords: Math.round(r() * 900 * scale), paid_traffic: Math.round(r() * traffic * 0.2),
      authority: Math.round(auth), backlinks: Math.round(auth ** 3 * (10 + r() * 20)), ref_domains: Math.round(auth ** 2 * (1 + r() * 2)),
      relevance: +(0.1 + r() * 0.5).toFixed(2), common_keywords: Math.round(40 + r() * 600 * scale),
      history: series(r, traffic, drift).map(({ date, v }, i, a) => ({ date, traffic: i === a.length - 1 ? traffic : Math.round(v), keywords: Math.round(v / 5) })),
    };
  });
  competitors.sort((a, b) => b.common_keywords - a.common_keywords);

  const mine = Object.fromEntries(keywords.map((k) => [k.keyword, k.position]));
  const gapWords = [
    ["data archiving solutions", 1300, 48], ["application retirement software", 590, 41], ["sap ilm", 1600, 44], ["archive sap data before s/4hana migration", 170, 22],
    ["ai data governance", 2400, 52], ["ai model governance", 1300, 47], ["data classification tools", 2900, 55], ["sensitive data discovery", 1900, 46],
    ["data retention software", 880, 39], ["records management software", 3600, 58], ["email archiving for compliance", 720, 42], ["immutable storage", 2400, 51],
    ["data sovereignty", 4400, 57], ["data residency requirements", 1000, 38], ["legacy data migration", 1600, 40], ["test data management tools", 1300, 49],
    ["synthetic test data", 1900, 45], ["mainframe data migration", 880, 36], ["oracle ebs retirement", 210, 21], ["archive365 alternative", 90, 14],
    ...UNIVERSE.slice(2, 22).map(([k, v]) => [k, v, 40]),
  ];
  const gap = gapWords.map(([keyword, v, kd]) => {
    const positions = {};
    competitors.slice(0, 3).forEach((c) => { if (r() < 0.75) positions[c.domain] = 1 + Math.floor(r() * 18); });
    if (mine[keyword]) positions[domain] = mine[keyword];
    return { keyword, volume: vol(v), kd, cpc: +(4 + r() * 20).toFixed(2), intent: [r() < 0.5 ? 1 : 0], positions };
  }).filter((g) => Object.keys(g.positions).some((d) => d !== domain));

  competitors.slice(0, 3).forEach((c) => {
    c.top_keywords = gap.filter((g) => g.positions[c.domain]).slice(0, 12).map((g) => ({ keyword: g.keyword, position: g.positions[c.domain], volume: g.volume, url: `https://www.${c.domain}/`, traffic: Math.round(g.volume * 0.05) }));
  });

  const industry_keywords = (cfg.industry_keywords || Object.keys(INDUSTRY_TREND)).map((keyword) => {
    const t = INDUSTRY_TREND[keyword] ?? (r() - 0.4) * 30;
    return { keyword, volume: vol(UNIVERSE.find((u) => u[0] === keyword)?.[1] || 1500 + r() * 8000), cpc: +(3 + r() * 25).toFixed(2), kd: Math.round(30 + r() * 50), intent: [1],
      trend: months(12).map((_, i) => +(Math.max(0.1, Math.min(1, 0.55 + (t / 100) * (i / 11) + (r() - 0.5) * 0.12))).toFixed(2)) };
  });

  return {
    geo, domain, source: "sample", fetched_at: new Date().toISOString(),
    overview: { rank: Math.round(90000 / scale), keywords: history[history.length - 1].keywords, traffic: organic, traffic_cost: Math.round(organic * 7.4), paid_keywords: Math.round(120 * scale), paid_traffic: Math.round(900 * scale), authority: 41, backlinks: 182000, ref_domains: 4300 },
    history, keywords, pages, competitors, discovered_competitors: [], gap, industry_keywords, warnings: [],
  };
}

export function sampleAiRun(cfg = {}) {
  const r = rng("ai-run");
  const prompts = cfg.ai_prompts || [];
  const comps = [...new Set(Object.values(cfg.competitors || {}).flat())].slice(0, 10);
  const name = (d) => (cfg.brand_names || {})[d] || d.split(".")[0];
  const brandDomain = cfg.domain || "solix.com";
  const results = prompts.map((prompt) => {
    const pool = [brandDomain, ...comps].filter(() => r() < 0.45).sort(() => r() - 0.5).slice(0, 5);
    return {
      prompt, answer: "", sources: [], cited: [],
      mentions: pool.map((d, i) => ({ domain: d, brand: name(d), count: 1, rank: i + 1 })),
      cited_domains: Object.fromEntries(pool.filter(() => r() < 0.6).map((d) => [d, 1 + Math.floor(r() * 2)])),
    };
  });
  const sov = [brandDomain, ...comps].map((d) => {
    const hits = results.flatMap((x) => x.mentions.filter((m) => m.domain === d));
    return { domain: d, brand: name(d), prompts_mentioned: hits.length, share: Math.round((100 * hits.length) / Math.max(results.length, 1)), avg_rank: hits.length ? +(hits.reduce((s, h) => s + h.rank, 0) / hits.length).toFixed(1) : null, citations: results.reduce((s, x) => s + (x.cited_domains[d] || 0), 0) };
  }).filter((s) => s.prompts_mentioned || s.domain === brandDomain).sort((a, b) => b.prompts_mentioned - a.prompts_mentioned);
  const hist = months(6).map((date, i) => ({ ran_at: date, share: Math.max(0, (sov.find((s) => s.domain === brandDomain)?.share || 0) - (5 - i) * 4 + Math.round((r() - 0.5) * 6)) }));
  return { ran_at: new Date().toISOString(), model: "sample", brand_domain: brandDomain, results, share_of_voice: sov, history: hist, source: "sample" };
}
