#!/usr/bin/env node
/**
 * Content i18n catalog tool.
 *
 *   node scripts/i18n-extract.js            # rebuild src/i18n/locales/source.json, report coverage
 *   node scripts/i18n-extract.js --lint     # also list JSX text/attributes not yet wrapped in tx()
 *   node scripts/i18n-extract.js --missing es > todo.tsv   # untranslated strings for one language
 *
 * Collects every English string the site renders through the `content`
 * namespace (see src/i18n/tx.jsx and localize.js):
 *   - tx("...") / translateText("...") calls
 *   - text props of SectionHeading / ChapterMark / PageHero / CTABand
 *   - data consts: every top-level array/object const in src/data/*, and in
 *     components any const passed to useLocalized(NAME) or marked with an
 *     `i18n` comment
 * Keys are the same cyrb53 hash the runtime uses (src/i18n/hash.js).
 */
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const SRC = path.join(__dirname, "..", "src");
const LOCALES = path.join(SRC, "i18n", "locales");
const LANGS = ["es", "fr", "de"];
const EXCLUDE = [/components[\\/]ui[\\/]/, /components[\\/]admin[\\/]/, /pages[\\/]admin[\\/]/, /i18n[\\/](?!extraStrings)/, /setupTests|reportWebVitals/];
// Must match SKIP_KEYS in src/i18n/localize.js.
const SKIP_KEYS = new Set(["id", "slug", "to", "href", "file", "image", "icon", "accent", "span", "type", "key", "tone", "fill", "hex", "email", "phone", "year", "products", "category", "group", "meta", "readTime", "featured", "gated", "suffix", "pct", "color"]);
// Components that tx() these text props themselves, so callers pass English.
const PROP_COMPONENTS = new Set(["SectionHeading", "ChapterMark", "PageHero", "CTABand", "Field", "LeadForm"]);
const PROP_NAMES = new Set(["eyebrow", "title", "description", "label", "submitLabel", "successTitle", "successDesc"]);
const LINT_ATTRS = new Set(["placeholder", "aria-label", "title", "alt"]);
const LINTING = process.argv.includes("--lint");

// Same algorithm as src/i18n/hash.js (cyrb53) - keep in sync.
function hashKey(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const walkFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walkFiles(p);
    return /\.(jsx?|tsx?)$/.test(d.name) ? [p] : [];
  });

const hasLetters = (s) => /[A-Za-z]{2,}/.test(s);
// Brand marks, contact details and CSS values read the same in every language.
const UNTRANSLATABLE = /^(SOLIX|Solix|TM|AI|Google|Microsoft|[\d.,]+\s?[KMGTP]B|1\.888\.GO\.SOLIX.*|\S+@\S+\.\w+|rgb\(.*)$/;
const strings = new Map(); // text -> first location
const lint = [];
const add = (text, where) => {
  if (typeof text !== "string") return;
  const t = text;
  if (!t.trim() || !hasLetters(t)) return;
  if (/^(\/|https?:|mailto:|tel:|#)/.test(t)) return;
  if (!strings.has(t)) strings.set(t, where);
};

const literalOf = (node) => {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0].value.cooked;
  return null;
};

// Collect display strings from an array/object literal, honouring SKIP_KEYS.
function collectLiteral(node, where) {
  if (!node) return;
  if (node.type === "StringLiteral" || node.type === "TemplateLiteral") return add(literalOf(node), where);
  if (node.type === "ArrayExpression") return node.elements.forEach((el) => collectLiteral(el, where));
  if (node.type === "ObjectExpression") {
    for (const prop of node.properties) {
      if (prop.type !== "ObjectProperty") continue;
      const key = prop.key.type === "Identifier" ? prop.key.name : literalOf(prop.key);
      if (SKIP_KEYS.has(key)) continue;
      collectLiteral(prop.value, where);
    }
  }
}

for (const file of walkFiles(SRC)) {
  const rel = path.relative(SRC, file);
  if (EXCLUDE.some((rx) => rx.test(rel))) continue;
  const code = fs.readFileSync(file, "utf8");
  const lines = code.split("\n");
  // A `no-i18n` comment on the same line opts that line out of the lint (e.g. sample names in placeholders).
  const optedOut = (node) => /no-i18n/.test(lines[node.loc.start.line - 1] || "") || UNTRANSLATABLE.test(String(node.value ?? "").replace(/\s+/g, " ").trim());
  let ast;
  try {
    ast = parser.parse(code, { sourceType: "module", plugins: ["jsx"] });
  } catch (e) {
    console.error(`parse error in ${rel}: ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  const isData = rel.startsWith("data" + path.sep);
  const localizedNames = new Set([...code.matchAll(/useLocalized\((\w+)\)/g)].map((m) => m[1]));

  traverse(ast, {
    VariableDeclarator(p) {
      const owner = p.parentPath.parent.type; // VariableDeclaration -> Program | ExportNamedDeclaration
      if (owner !== "Program" && owner !== "ExportNamedDeclaration") return;
      const name = p.node.id.name;
      const init = p.node.init;
      if (!init || (init.type !== "ArrayExpression" && init.type !== "ObjectExpression" && init.type !== "StringLiteral")) return;
      const comments = (p.parentPath.node.leadingComments || []).concat(p.parentPath.parent.leadingComments || []).map((c) => c.value).join(" ");
      const marked = /\bi18n\b/.test(comments.replace(/no-i18n/g, ""));
      if (isData || localizedNames.has(name) || marked) collectLiteral(init, `${rel}:${name}`);
      else if (LINTING && !/\bno-i18n\b/.test(comments)) {
        const found = [];
        const probe = (n) => {
          if (!n) return;
          if (n.type === "StringLiteral" && hasLetters(n.value) && / /.test(n.value)) found.push(n.value);
          else if (n.type === "ArrayExpression") n.elements.forEach(probe);
          else if (n.type === "ObjectExpression") n.properties.forEach((pr) => pr.type === "ObjectProperty" && !SKIP_KEYS.has(pr.key.name) && probe(pr.value));
        };
        probe(init);
        if (found.length) lint.push(`${rel}:${p.node.loc.start.line}  const ${name} has copy but isn't localized (useLocalized(${name}) or an i18n comment): "${found[0].slice(0, 60)}"`);
      }
    },
    StringLiteral(p) {
      if (!LINTING || !hasLetters(p.node.value) || optedOut(p.node)) return;
      // Copy inside JSX expressions, e.g. {cond ? "Read" : "Get access"}, or toast/confirm messages.
      const inTx = p.findParent((a) => a.isCallExpression() && ["tx", "translateText", "t"].includes(a.node.callee.name));
      if (inTx) return;
      // Text props of components that translate their own props are already in the catalog.
      const ownProp = p.findParent((a) => a.isJSXAttribute() && PROP_COMPONENTS.has(a.parentPath.node.name?.name) && (PROP_NAMES.has(a.node.name.name) || ["crumbs", "primary", "secondary"].includes(a.node.name.name)));
      if (ownProp) return;
      const inJsxExpr = p.parentPath.isJSXExpressionContainer() || (p.findParent((a) => a.isJSXExpressionContainer()) && p.findParent((a) => a.isConditionalExpression() || a.isLogicalExpression()) && !p.findParent((a) => a.isJSXAttribute() && ["className", "to", "href", "src", "data-testid", "id", "key", "type", "variant", "size", "role", "style"].includes(a.node.name.name)));
      const inToast = p.findParent((a) => a.isCallExpression() && a.node.callee.type === "MemberExpression" && a.node.callee.object.name === "toast");
      if ((inJsxExpr || inToast) && / /.test(p.node.value.trim()) === true || (inToast && hasLetters(p.node.value))) lint.push(`${rel}:${p.node.loc.start.line}  expr "${p.node.value.slice(0, 80)}"`);
    },
    CallExpression(p) {
      const callee = p.node.callee;
      const fn = callee.type === "Identifier" ? callee.name : null;
      if (fn === "tx" || fn === "translateText") {
        const s = literalOf(p.node.arguments[0]);
        if (s !== null) add(s, `${rel}:${p.node.loc.start.line}`);
      }
    },
    JSXOpeningElement(p) {
      const tag = p.node.name.name;
      for (const attr of p.node.attributes) {
        if (attr.type !== "JSXAttribute") continue;
        const an = attr.name.name;
        const val = attr.value;
        if (PROP_COMPONENTS.has(tag) && (PROP_NAMES.has(an) || an === "crumbs" || an === "primary" || an === "secondary")) {
          if (val?.type === "StringLiteral") add(val.value, `${rel}:${attr.loc.start.line}`);
          else if (val?.type === "JSXExpressionContainer") {
            const ex = val.expression;
            if (ex.type === "StringLiteral" || ex.type === "TemplateLiteral") add(literalOf(ex), `${rel}:${attr.loc.start.line}`);
            else if (ex.type === "ObjectExpression" || ex.type === "ArrayExpression") collectLiteral(ex, `${rel}:${attr.loc.start.line}`);
            else if (ex.type === "ConditionalExpression") [ex.consequent, ex.alternate].forEach((n) => add(literalOf(n), `${rel}:${attr.loc.start.line}`));
          }
        } else if (process.argv.includes("--lint") && LINT_ATTRS.has(an) && val?.type === "StringLiteral" && hasLetters(val.value) && !optedOut(val)) {
          lint.push(`${rel}:${attr.loc.start.line}  ${an}="${val.value}"`);
        }
      }
    },
    JSXText(p) {
      if (!process.argv.includes("--lint")) return;
      const t = p.node.value.replace(/\s+/g, " ").trim();
      if (hasLetters(t) && !UNTRANSLATABLE.test(t) && !optedOut(p.node)) lint.push(`${rel}:${p.node.loc.start.line}  "${t}"`);
    },
  });
}

const source = {};
for (const text of [...strings.keys()].sort()) source[hashKey(text)] = text;
fs.writeFileSync(path.join(LOCALES, "source.json"), JSON.stringify(source, null, 1) + "\n");

const missingFor = (lang) => {
  const file = path.join(LOCALES, lang, "content.json");
  const have = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return Object.keys(source).filter((k) => !(k in have));
};

const mi = process.argv.indexOf("--missing");
if (mi !== -1) {
  // Untranslated strings in source order (grouped by file), so each batch
  // a translator sees keeps its context.
  const lang = process.argv[mi + 1];
  const missing = new Set(missingFor(lang));
  for (const [text, where] of strings) {
    const k = hashKey(text);
    if (missing.has(k)) process.stdout.write(`${k}\t${where.split(":")[0]}\t${text.replace(/\n/g, "\\n")}\n`);
  }
} else {
  console.log(`catalog: ${Object.keys(source).length} strings`);
  for (const lang of LANGS) console.log(`  ${lang}: ${Object.keys(source).length - missingFor(lang).length} translated, ${missingFor(lang).length} missing`);
  if (lint.length) {
    console.log(`\nunwrapped copy (${lint.length}):`);
    lint.forEach((l) => console.log("  " + l));
  }
}
