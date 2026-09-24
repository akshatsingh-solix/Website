// Markdown from the CMS -> the block format ArticleBody renders.
// Supported: ## / ### headings, paragraphs, - or 1. lists, > quotes
// (a last line starting with "—" or "--" becomes the citation), ![alt](url)
// images, ``` code, and callouts:
//   :::callout Title
//   Text
//   :::
// Figures and steps (one item per line, "value | label" / "title | text"):
//   :::stats            :::steps
//   60-80% | inactive   Assess | Profile growth
//   :::                 :::
// Inline **bold**, *italic*, `code` and [links](url) are rendered by
// ArticleBody without ever injecting HTML.
import { translateText } from "@/i18n/tx";

export function markdownToBlocks(md) {
  const lines = (md || "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  const endPara = () => {
    if (para.length) blocks.push({ type: "p", text: para.join(" ").trim(), md: true });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      endPara();
      continue;
    }
    let m;
    if ((m = /^(#{2,3})\s+(.*)$/.exec(t))) {
      endPara();
      blocks.push({ type: m[1].length === 2 ? "h2" : "h3", text: m[2].replace(/[*_`]/g, "") });
    } else if (/^#\s+/.test(t)) {
      endPara();
      blocks.push({ type: "h2", text: t.replace(/^#\s+/, "").replace(/[*_`]/g, "") });
    } else if (/^```/.test(t)) {
      endPara();
      const code = [];
      for (i += 1; i < lines.length && !/^```/.test(lines[i].trim()); i++) code.push(lines[i]);
      blocks.push({ type: "code", text: code.join("\n") });
    } else if ((m = /^:::(stats|steps)\s*$/.exec(t))) {
      endPara();
      const items = [];
      for (i += 1; i < lines.length && lines[i].trim() !== ":::"; i++) {
        const [a, ...rest] = lines[i].trim().split("|");
        if (!a.trim()) continue;
        const b = rest.join("|").trim();
        items.push(m[1] === "stats" ? { value: a.trim(), label: b } : { title: a.trim(), desc: b });
      }
      if (items.length) blocks.push({ type: m[1], items });
    } else if ((m = /^:::callout\s*(.*)$/.exec(t))) {
      endPara();
      const body = [];
      for (i += 1; i < lines.length && lines[i].trim() !== ":::"; i++) body.push(lines[i].trim());
      blocks.push({ type: "callout", title: m[1] || "Note", text: body.join(" ").trim(), md: true });
    } else if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t))) {
      endPara();
      blocks.push({ type: "img", alt: m[1], src: m[2] });
    } else if (/^>\s?/.test(t)) {
      endPara();
      const q = [];
      for (; i < lines.length && /^>\s?/.test(lines[i].trim()); i++) q.push(lines[i].trim().replace(/^>\s?/, ""));
      i -= 1;
      let cite = null;
      if (q.length > 1 && /^(—|--)\s*/.test(q[q.length - 1])) cite = q.pop().replace(/^(—|--)\s*/, "");
      blocks.push({ type: "quote", text: q.join(" ").replace(/^["“]|["”]$/g, ""), cite, md: true });
    } else if (/^([-*+]|\d+[.)])\s+/.test(t)) {
      endPara();
      const items = [];
      for (; i < lines.length && /^([-*+]|\d+[.)])\s+/.test(lines[i].trim()); i++) items.push(lines[i].trim().replace(/^([-*+]|\d+[.)])\s+/, ""));
      i -= 1;
      blocks.push({ type: "ul", items, md: true });
    } else if (/^(-{3,}|\*{3,})$/.test(t)) {
      endPara();
    } else {
      para.push(t);
    }
  }
  endPara();
  return blocks;
}

/** Split inline markdown into typed tokens for safe rendering. */
export function inlineTokens(text) {
  const out = [];
  const rx = /(\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m;
  while ((m = rx.exec(text))) {
    if (m.index > last) out.push({ t: "text", v: text.slice(last, m.index) });
    if (m[2]) out.push({ t: "b", v: m[2] });
    else if (m[3] || m[4]) out.push({ t: "i", v: m[3] || m[4] });
    else if (m[5]) out.push({ t: "code", v: m[5] });
    else if (m[6]) out.push({ t: "a", v: m[6], href: m[7] });
    last = rx.lastIndex;
  }
  if (last < text.length) out.push({ t: "text", v: text.slice(last) });
  return out;
}

export const safeHref = (href) => (/^(https?:|mailto:|\/|#)/i.test(href) ? href : null);

/** The site's block format -> CMS Markdown (lossless for every block type ArticleBody renders). */
export function blocksToMarkdown(blocks) {
  return (blocks || [])
    .map((b) => {
      switch (b.type) {
        case "h2": return `## ${b.text}`;
        case "h3": return `### ${b.text}`;
        case "p": return b.text;
        case "ul": return (b.items || []).map((x) => `- ${x}`).join("\n");
        case "quote": return `> ${b.text}${b.cite ? `\n> — ${b.cite}` : ""}`;
        case "callout": return `:::callout ${b.title || "Note"}\n${b.text}\n:::`;
        case "stats": return `:::stats\n${(b.items || []).map((x) => `${x.value} | ${x.label}`).join("\n")}\n:::`;
        case "steps": return `:::steps\n${(b.items || []).map((x) => `${x.title} | ${x.desc}`).join("\n")}\n:::`;
        case "img": return `![${b.alt || ""}](${b.src})`;
        case "code": return `\`\`\`\n${b.text}\n\`\`\``;
        default: return b.text || "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Run CMS block text through the site's translations. Translations are keyed
 * by the English text, so content taken over from the built-in site keeps
 * its Spanish, French and German versions until an editor changes the words.
 */
export function localizeBlocks(blocks, lng) {
  if (!lng || lng === "en") return blocks;
  const t = (x) => (typeof x === "string" ? translateText(x, undefined, lng) : x);
  return blocks.map((b) => ({
    ...b,
    text: t(b.text),
    title: t(b.title),
    cite: t(b.cite),
    alt: t(b.alt),
    items: Array.isArray(b.items) ? b.items.map((x) => (typeof x === "string" ? t(x) : { ...x, label: t(x.label), title: t(x.title), desc: t(x.desc) })) : b.items,
  }));
}
