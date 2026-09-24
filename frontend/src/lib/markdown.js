// Markdown from the CMS -> the block format ArticleBody renders.
// Supported: ## / ### headings, paragraphs, - or 1. lists, > quotes
// (a last line starting with "—" or "--" becomes the citation), ![alt](url)
// images, ``` code, and callouts:
//   :::callout Title
//   Text
//   :::
// Inline **bold**, *italic*, `code` and [links](url) are rendered by
// ArticleBody without ever injecting HTML.

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
