#!/usr/bin/env node
/**
 * Builds Sol's knowledge base from the site's own content.
 *
 *   node scripts/sol-knowledge.js     # writes ../backend/sol_knowledge.json
 *
 * Reads the English data consts in src/data/* (products, solutions,
 * industries, resources + article bodies, newsroom, company, careers,
 * partners, services, platform) without running them, and writes one
 * retrieval chunk per page section, each with the site URL it came from.
 * The backend indexes these for the AI concierge, so Sol answers from what
 * the site says and links to the page that says it. Re-run after editing
 * site content; CI checks the file is current.
 */
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const DATA = path.join(__dirname, "..", "src", "data");
const OUT = path.join(__dirname, "..", "..", "backend", "sol_knowledge.json");

// Evaluates literal data only. Icons, imports and helper calls become
// undefined; `...OTHER_EN.map(...)` spreads are skipped.
function literal(node, scope) {
  if (!node) return undefined;
  switch (node.type) {
    case "StringLiteral":
    case "NumericLiteral":
    case "BooleanLiteral":
      return node.value;
    case "NullLiteral":
      return null;
    case "TemplateLiteral":
      return node.expressions.length ? undefined : node.quasis.map((q) => q.value.cooked).join("");
    case "ArrayExpression":
      return node.elements.filter((e) => e && e.type !== "SpreadElement").map((e) => literal(e, scope));
    case "ObjectExpression": {
      const out = {};
      for (const p of node.properties) {
        if (p.type !== "ObjectProperty") continue;
        const key = p.key.type === "Identifier" ? p.key.name : p.key.value;
        const v = literal(p.value, scope);
        if (v !== undefined) out[key] = v;
      }
      return out;
    }
    case "Identifier":
      return scope[node.name];
    default:
      return undefined;
  }
}

function readConsts(file) {
  const ast = parser.parse(fs.readFileSync(path.join(DATA, file), "utf8"), { sourceType: "module", plugins: ["jsx"] });
  const scope = {};
  for (let stmt of ast.program.body) {
    if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) stmt = stmt.declaration;
    if (stmt.type !== "VariableDeclaration") continue;
    for (const d of stmt.declarations) {
      if (d.id.type !== "Identifier") continue;
      const v = literal(d.init, scope);
      if (v !== undefined) scope[d.id.name] = v;
    }
  }
  return scope;
}

const site = readConsts("site.js");
const { ARTICLES_EN } = readConsts("articles.js");
const news = readConsts("newsroom.js");
const { FAMILIES } = readConsts("families.js");

const chunks = [];
const add = (id, kind, title, url, lines) => {
  const text = lines.flat(Infinity).filter((l) => typeof l === "string" && l.trim()).join("\n");
  if (text) chunks.push({ id, kind, title, url, text });
};
const pairs = (items, fmt = (i) => `- ${i.title}: ${i.desc}`) => (items || []).map(fmt);
const productName = Object.fromEntries((site.PRODUCTS_EN || []).map((p) => [p.slug, p.name]));
const names = (slugs) => (slugs || []).map((s) => productName[s] || s).join(", ");

for (const p of site.PRODUCTS_EN || []) {
  const url = `/products/${p.slug}`;
  add(`product:${p.slug}`, "product", p.name, url, [
    `${p.name} (${p.category}). ${p.tagline || ""}`,
    p.description,
    p.features && ["Key capabilities:", pairs(p.features)],
    p.steps && ["How it works:", pairs(p.steps)],
    p.outcomes && ["Typical outcomes:", p.outcomes.map((o) => `- ${o.value} ${o.label}`)],
  ]);
}

for (const f of FAMILIES || []) {
  add(`family:${f.id || f.slug || f.name}`, "product-family", f.name || f.title, "/products", [
    `Product family: ${f.name || f.title}. ${f.desc || f.tagline || ""}`,
    f.products && `Products in this family: ${names(f.products)}`,
  ]);
}

for (const s of site.SOLUTIONS_EN || []) {
  add(`solution:${s.id}`, "solution", s.title, `/solutions#${s.id}`, [
    `Solution: ${s.title} (${s.group}). ${s.desc}`,
    s.metric && `Result: ${s.metric}`,
    s.products && `Products used: ${names(s.products)}`,
  ]);
}

for (const i of site.INDUSTRIES_EN || []) {
  add(`industry:${i.slug}`, "industry", i.name, `/industries/${i.slug}`, [
    `Industry: ${i.name}. ${i.headline || ""}`,
    i.desc,
    i.challenges && ["Challenges:", i.challenges.map((c) => `- ${typeof c === "string" ? c : `${c.title}: ${c.desc}`}`)],
    i.useCases && ["Use cases:", i.useCases.map((c) => `- ${typeof c === "string" ? c : `${c.title}: ${c.desc}`}`)],
    i.regulations && `Regulations: ${[].concat(i.regulations).join(", ")}`,
    i.products && `Recommended products: ${names(i.products)}`,
  ]);
}

// Article bodies split at each h2, so a long guide becomes several focused chunks.
for (const r of site.RESOURCES_EN || []) {
  const url = `/resources/${r.slug}`;
  const header = `${r.title} (${r.type}${r.gated ? ", gated download" : ""}). ${r.desc}`;
  const article = (ARTICLES_EN || {})[r.slug];
  add(`resource:${r.slug}`, "resource", r.title, url, [header, article && article.summary, r.products?.length && `Related products: ${names(r.products)}`]);
  if (!article) continue;
  let section = { title: r.title, lines: [] };
  let n = 0;
  const flush = () => {
    if (section.lines.length) add(`resource:${r.slug}#${n++}`, "article", `${r.title}: ${section.title}`, url, [`From "${r.title}", section "${section.title}":`, section.lines]);
  };
  for (const b of article.body || []) {
    if (b.type === "h2") {
      flush();
      section = { title: b.text, lines: [] };
    } else if (b.type === "p" || b.type === "callout") section.lines.push(b.text || [b.title, b.desc].filter(Boolean).join(": "));
    else if (b.type === "quote") section.lines.push(`"${b.text}"${b.cite ? ` - ${b.cite}` : ""}`);
    else if (b.type === "ul") section.lines.push((b.items || []).map((x) => `- ${x}`));
    else if (b.type === "stats") section.lines.push((b.items || []).map((x) => `- ${x.value} ${x.label}`));
    else if (b.type === "steps") section.lines.push((b.items || []).map((x) => `- ${x.title}: ${x.desc}`));
  }
  flush();
}

for (const pr of news.PRESS_RELEASES_EN || []) {
  add(`press:${pr.id}`, "press", pr.title, `/newsroom/${pr.id}`, [
    `Press release (${pr.date || ""}): ${pr.title}`,
    pr.summary || pr.dek,
    (pr.body || []).map((b) => (typeof b === "string" ? b : b.text)),
  ]);
}
add("press:contact", "company", "Press and media contact", "/newsroom", [
  news.BOILERPLATE,
  news.PRESS_CONTACT_EN && `Media contact: ${news.PRESS_CONTACT_EN.name}, ${news.PRESS_CONTACT_EN.email}, ${news.PRESS_CONTACT_EN.phone}`,
  (news.COVERAGE_EN || []).map((c) => `- Coverage: ${c.outlet || ""} "${c.title || c.headline || ""}"`),
]);

add("company:overview", "company", "About Solix", "/company", [
  "Solix Technologies company history and values.",
  pairs(site.TIMELINE_EN, (t) => `- ${t.year}: ${t.title}. ${t.desc}`),
  "Values:",
  pairs(site.VALUES_EN),
  "Leadership:",
  pairs(site.LEADERSHIP_EN, (l) => `- ${l.name}, ${l.role}. ${l.bio}`),
]);
add("company:offices", "company", "Offices and contact", "/contact", [
  "Solix offices:",
  pairs(site.OFFICES_EN, (o) => `- ${o.city} (${o.label}): ${o.address}`),
  "Phone: 1.888.GO.SOLIX (1-888-467-6549). Sales and demos: /contact?type=demo. General enquiries: /contact.",
]);
add("careers:open-roles", "careers", "Open roles at Solix", "/careers", [
  "Open positions at Solix (apply on the careers page):",
  pairs(site.JOBS_EN, (j) => `- ${j.title} (${j.team}, ${j.location}, ${j.type}): ${j.desc}`),
  `Perks: ${(site.PERKS_EN || []).join(", ")}`,
]);
for (const t of site.PARTNER_TIERS_EN || []) {
  add(`partners:${t.id}`, "partners", t.title, "/partners", [`Partner program: ${t.title}. ${t.desc}`, t.partners && `Partners: ${t.partners.join(", ")}`]);
}
add("partners:benefits", "partners", "Partner program benefits", "/partners", ["Benefits of becoming a Solix partner:", pairs(site.PARTNER_BENEFITS_EN)]);
for (const s of site.PLATFORM_SECTIONS_EN || []) {
  add(`platform:${s.id}`, "platform", s.title, `/platform#${s.id}`, [`${s.title}. ${s.desc}`, (s.points || []).map((p) => `- ${p}`)]);
}
for (const s of site.SERVICES_EN || []) {
  add(`services:${s.id}`, "services", s.title, `/services-support#${s.id}`, [`${s.title}. ${s.desc}`, (s.points || []).map((p) => `- ${p}`)]);
}
add("testimonials", "proof", "What customers say", "/", [
  "Anonymized customer testimonials:",
  pairs(site.TESTIMONIALS_EN, (t) => `- "${t.quote}" - ${t.role}, ${t.org}`),
  pairs(site.STATS_EN, (s) => `- ${s.value}${s.suffix || ""} ${s.label}`),
]);

const out = JSON.stringify({ version: 1, chunks }, null, 1) + "\n";
if (process.argv.includes("--check")) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  if (current !== out) {
    console.error("sol-knowledge: backend/sol_knowledge.json is out of date. Run: node frontend/scripts/sol-knowledge.js");
    process.exit(1);
  }
  console.log(`sol-knowledge: up to date (${chunks.length} chunks)`);
} else {
  fs.writeFileSync(OUT, out);
  console.log(`sol-knowledge: wrote ${chunks.length} chunks to ${path.relative(process.cwd(), OUT)}`);
}
