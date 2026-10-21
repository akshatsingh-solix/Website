// Word lead briefs, built in the browser (ported from the original Leads Radar):
// branded header, chips, snapshot, the cited deep dive, people, first touch,
// every signal with competitor (red) and problem (gold) highlighting, and a
// page-numbered footer. Raw WordprocessingML zipped with JSZip.
import JSZip from "jszip";

const LOGO_PATH = "M239 3 L227 2 L220 0 L177 0 L143 7 L120 15 L118 17 L116 17 L95 28 L69 47 L47 69 L38 80 L28 95 L17 116 L17 118 L15 120 L11 131 L11 134 L7 143 L0 178 L0 220 L6 252 L17 282 L30 306 L49 331 L67 349 L82 361 L112 379 L114 379 L116 377 L123 362 L131 349 L132 345 L142 328 L142 326 L151 311 L152 307 L162 290 L162 288 L182 252 L183 248 L191 235 L194 227 L184 230 L182 232 L168 237 L166 239 L157 242 L120 259 L118 257 L272 17 L272 13 Z M288 20 L285 20 L252 81 L240 101 L240 103 L202 170 L202 173 L281 144 L283 144 L284 146 L256 187 L255 190 L241 209 L212 254 L198 273 L196 278 L174 309 L173 312 L166 321 L129 378 L126 381 L126 385 L147 392 L171 397 L214 398 L215 397 L233 396 L238 394 L247 393 L277 383 L292 376 L312 364 L331 349 L348 332 L364 312 L377 290 L377 288 L379 286 L379 284 L384 275 L393 248 L393 243 L398 223 L398 178 L397 177 L395 160 L389 136 L381 116 L379 114 L379 112 L377 110 L377 108 L359 79 L349 67 L331 49 L319 39 L301 27 Z";
const X = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STATUS = { new: "New", researching: "Researching", ready: "Ready for outreach", contacted: "Contacted", replied: "Replied", meeting_booked: "Meeting booked", opportunity: "Opportunity", won: "Won", lost: "Lost", not_a_fit: "Not a fit", excluded: "Excluded" };

async function logoPng(px) {
  try {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="${px}" height="${px}"><circle cx="199" cy="199" r="199" fill="#ffffff"/><path d="${LOGO_PATH}" fill="#e2001a" fill-rule="evenodd"/></svg>`;
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    const c = document.createElement("canvas");
    c.width = px;
    c.height = px;
    c.getContext("2d").drawImage(img, 0, 0, px, px);
    const blob = await new Promise((res) => c.toBlob(res, "image/png"));
    return blob ? await blob.arrayBuffer() : null;
  } catch (e) {
    return null;
  }
}

/** details: [{ account, signals, research }] as returned by GET /admin/radar/accounts/:id. */
export async function buildBrief(details, { terms, summaryTitle, subtitle, footer } = {}) {
  const rels = [];
  const png = await logoPng(512);
  const comps = new Set((terms?.competitors || []).map((t) => t.toLowerCase()));
  const HL = terms ? new RegExp(`(?<![\\w])(${terms.competitors.map(esc).concat(terms.problems).join("|")})(?![\\w])`, "gi") : null;
  const rid = (url) => { const id = "rId" + (rels.length + 10); rels.push({ id, url }); return id; };
  const run = (t, o = {}) => `<w:r><w:rPr>${o.b ? "<w:b/>" : ""}${o.i ? "<w:i/>" : ""}${o.color ? `<w:color w:val="${o.color}"/>` : ""}${o.size ? `<w:sz w:val="${o.size}"/>` : ""}</w:rPr><w:t xml:space="preserve">${X(t)}</w:t></w:r>`;
  const link = (url, t) => (safeUrl(url) ? `<w:hyperlink r:id="${rid(safeUrl(url))}"><w:r><w:rPr><w:color w:val="1C6FE0"/><w:u w:val="single"/></w:rPr><w:t xml:space="preserve">${X(t || url)}</w:t></w:r></w:hyperlink>` : run(t || ""));
  const hlRuns = (text, o = {}) => {
    const str = String(text || "");
    if (!HL) return run(str, o);
    let out = "", last = 0, m;
    HL.lastIndex = 0;
    while ((m = HL.exec(str))) {
      if (m.index > last) out += run(str.slice(last, m.index), o);
      const comp = comps.has(m[0].toLowerCase());
      out += `<w:r><w:rPr><w:b/><w:color w:val="${comp ? "C8102E" : "7A5A00"}"/>${o.size ? `<w:sz w:val="${o.size}"/>` : ""}<w:shd w:val="clear" w:color="auto" w:fill="${comp ? "FFD9DC" : "FFF1B8"}"/></w:rPr><w:t xml:space="preserve">${X(m[0])}</w:t></w:r>`;
      last = m.index + m[0].length;
      if (!m[0].length) HL.lastIndex++;
    }
    if (last < str.length) out += run(str.slice(last), o);
    return out;
  };
  const chip = (t, fill, color) => `<w:r><w:rPr><w:b/><w:color w:val="${color || "FFFFFF"}"/><w:sz w:val="18"/><w:shd w:val="clear" w:color="auto" w:fill="${fill}"/></w:rPr><w:t xml:space="preserve">  ${X(t)}  </w:t></w:r><w:r><w:t xml:space="preserve">  </w:t></w:r>`;
  const logoPicture = (emu) => `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${emu}" cy="${emu}"/><wp:docPr id="2" name="Solix logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${emu}" cy="${emu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  const para = (runs, o = {}) => `<w:p><w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ""}<w:spacing w:after="${o.after ?? 120}" w:line="276" w:lineRule="auto"/>${o.bullet ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : ""}</w:pPr>${runs}</w:p>`;
  const h1 = (t) => `<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="2" w:color="D41F2A"/></w:pBdr><w:spacing w:before="320" w:after="120"/></w:pPr>${run(String(t).toUpperCase(), { b: true, size: 22, color: "C8102E" })}</w:p>`;
  const h2 = (t) => para(run(t, { b: true, size: 24, color: "10212C" }), { style: "Heading2", after: 80 });
  const cell = (inner, w, fill) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>` : ""}</w:tcPr>${inner}</w:tc>`;
  const table = (widths, rows) => `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, b) => a + b, 0)}" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9DEE3"/><w:left w:val="single" w:sz="4" w:color="D9DEE3"/><w:bottom w:val="single" w:sz="4" w:color="D9DEE3"/><w:right w:val="single" w:sz="4" w:color="D9DEE3"/><w:insideH w:val="single" w:sz="4" w:color="D9DEE3"/><w:insideV w:val="single" w:sz="4" w:color="D9DEE3"/></w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${rows.map((r, i) => `<w:tr>${i === 0 ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${r.map((c, j) => cell(para(i === 0 ? run(c, { b: true, size: 19, color: "FFFFFF" }) : c, { after: 0 }), widths[j], i === 0 ? "10212C" : i % 2 === 0 ? "F7F9FA" : null)).join("")}</w:tr>`).join("")}</w:tbl>${para("", { after: 120 })}`;
  const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;
  const bandCell = (inner, w) => `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/><w:vAlign w:val="center"/><w:tcMar><w:top w:w="160" w:type="dxa"/><w:left w:w="200" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="200" w:type="dxa"/></w:tcMar></w:tcPr>${inner}</w:tc>`;

  const a0 = details[0]?.account || {};
  const parts = [];
  const prepared = `Prepared ${new Date().toISOString().slice(0, 10)}${a0.owner_name ? ` for ${a0.owner_name}, ${a0.territory || ""}` : ""}. Internal use only.`;
  parts.push(`<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="single" w:sz="36" w:space="0" w:color="D41F2A"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="1400"/><w:gridCol w:w="7960"/></w:tblGrid><w:tr>${bandCell(para(png ? logoPicture(685800) : run("SOLIX", { b: true, size: 36, color: "E2001A" }), { after: 0 }), 1400)}${bandCell(para(run("SOLIX LEADS RADAR", { b: true, size: 20, color: "C8102E" }), { after: 20 }) + para(run("Lead brief", { b: true, size: 40, color: "10212C" }), { after: 20 }) + para(run(prepared, { color: "5F6271", size: 18 }), { after: 0 }), 7960)}</w:tr></w:tbl>`);
  parts.push(para("", { after: 120 }));
  if (summaryTitle) {
    parts.push(para(run(summaryTitle, { b: true, size: 52, color: "10212C" }), { after: 60 }));
    if (subtitle) parts.push(para(run(subtitle, { color: "5F6271", size: 22 }), { after: 160 }));
    parts.push(h1("Accounts in this brief"));
    parts.push(table([2900, 1100, 2600, 1100, 1660], [["Company", "Strength", "Signals", "Latest", "Deep dive"]].concat(details.map(({ account: a, research }) => {
      const r = (research || []).find((x) => x.status === "approved");
      return [run(a.name, { b: true, size: 20 }), run(a.strength, { size: 20 }), run((a.signal_types || []).join(", ") + ` (${a.signal_count || 0})`, { size: 20 }), run(String(a.latest_signal_at || "").slice(0, 10), { size: 20 }), run(r ? `${r.score}/10 ${r.verdict || ""}` : "Not yet", { size: 20 })];
    }))));
  }
  details.forEach(({ account: a, signals = [], research = [] }, idx) => {
    const rr = research.find((x) => x.status === "approved") || research.find((x) => x.status === "draft");
    if (summaryTitle || idx > 0) parts.push(pageBreak);
    parts.push(para(run(a.name, { b: true, size: 52, color: "10212C" }), { after: 60 }));
    const fill = { Strong: "D41F2A", Medium: "C77A00", Weak: "7A8894" }[a.strength] || "B9C3CC";
    let chips = chip(`${a.strength} lead`, fill);
    if (rr) chips += chip(`Deep dive ${rr.score} of 10, ${rr.verdict || ""}`, rr.score >= 6 ? "1F8A4C" : rr.score >= 4 ? "C77A00" : "7A8894");
    if (a.owner_name) chips += chip(`${a.owner_name}, ${a.territory || ""}`, "10212C");
    if ((a.competitors || []).length) chips += chip(a.competitors.join(", "), "FFD9DC", "C8102E");
    parts.push(para(chips, { after: 200 }));
    parts.push(h1("Snapshot"));
    const jobs = signals.filter((s) => s.type === "competitor_job");
    const problems = signals.filter((s) => s.type === "problem_job");
    const other = signals.filter((s) => !["competitor_job", "problem_job"].includes(s.type));
    parts.push(table([3000, 6360], [
      ["Field", "Value"],
      [run("Territory and rep"), run(`${a.territory || ""}, ${a.owner_name || "unassigned"}${a.route_basis ? ` (${a.route_basis.replace("_", " ")})` : ""}`)],
      [run("Lead strength"), run(a.strength)],
      [run("Signals"), run(`${jobs.length} competitor posting(s), ${problems.length} problem signal(s), ${other.length} other${(a.competitors || []).length ? `. Competitors: ${a.competitors.join(", ")}` : ""}`)],
      [run("Latest signal"), run(String(a.latest_signal_at || "").slice(0, 10))],
      [run("Deep dive"), run(rr ? `${rr.score} of 10, ${rr.verdict || ""}${rr.status === "draft" ? " (draft, not yet approved)" : ""}` : "Not yet researched")],
      [run("Status"), run(`${STATUS[a.status] || a.status}${a.excluded_reason ? ` (excluded: ${a.excluded_reason})` : ""}`)],
    ]));
    if (rr) {
      parts.push(h1("Master Prospector deep dive"));
      parts.push(para(run(`Score ${rr.score} of 10, ${rr.verdict || ""}. Researched ${String(rr.created_at || "").slice(0, 10)}`, { b: true })));
      if (rr.headline) parts.push(`<w:p><w:pPr><w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="1F8A4C"/></w:pBdr><w:spacing w:after="160"/><w:ind w:left="200"/></w:pPr>${hlRuns(rr.headline, { b: true, size: 24 })}</w:p>`);
      if (rr.summary) { parts.push(h2("What we found")); parts.push(para(hlRuns(rr.summary))); }
      if (rr.trigger) { parts.push(h2("Trigger")); parts.push(para(hlRuns(rr.trigger))); }
      if ((rr.evidence || []).length) {
        parts.push(h2("Evidence"));
        rr.evidence.forEach((e) => parts.push(para(run(`[${e.n}] `, { b: true }) + link(e.url, e.title || e.url) + (e.date ? run(`  (${e.date})`, { color: "5F6271", size: 20 }) : ""), { bullet: true, after: 60 })));
      }
      if (rr.why_solix_wins) { parts.push(h2("Why Solix wins")); parts.push(para(hlRuns(rr.why_solix_wins))); }
      if ((rr.contacts || []).length) parts.push(h2("People to reach"), table([3000, 4360, 2000], [["Name", "Title", "LinkedIn"]].concat(rr.contacts.map((c) => [run(c.name, { size: 20 }), run(c.title || "", { size: 20 }), link(c.linkedin_url, "Profile")]))));
      if (rr.first_touch?.subject || rr.first_touch?.body) {
        parts.push(h2("First touch email"));
        if (rr.first_touch.subject) parts.push(para(run("Subject: ", { b: true }) + run(rr.first_touch.subject)));
        String(rr.first_touch.body || "").split(/\r?\n/).forEach((line) => parts.push(para(run(line), { after: 60 })));
      }
      if (rr.gaps) { parts.push(h2("Still to confirm")); parts.push(para(run(rr.gaps))); }
    }
    if (jobs.length) {
      parts.push(h1("Competitor job postings"));
      parts.push(table([1200, 3400, 1900, 1900, 960], [["Date", "Job posting", "Product", "Location", "Link"]].concat(jobs.map((r) => [run(String(r.posted_at || "").slice(0, 10), { size: 20 }), hlRuns(`${r.role_title || r.title || ""}${r.role_strength ? ` (${r.role_strength})` : ""}`, { size: 20 }), hlRuns(r.competitor_product || "", { size: 20 }), run(r.location || "", { size: 20 }), link(r.evidence_url, "Open")]))));
      parts.push(h2("Why these postings matched"));
      jobs.filter((r) => r.evidence_text).slice(0, 10).forEach((r) => parts.push(para(run(`${r.role_title || r.title || ""}: `, { b: true, size: 20 }) + hlRuns(r.evidence_text, { size: 20 }), { after: 80 })));
    }
    if (problems.length) {
      parts.push(h1("Problem signals (no competitor named)"));
      parts.push(table([1200, 3400, 1900, 1900, 960], [["Date", "Job posting", "Problem", "Location", "Link"]].concat(problems.map((r) => [run(String(r.posted_at || "").slice(0, 10), { size: 20 }), run(r.role_title || r.title || "", { size: 20 }), run(r.problem_term || "", { size: 20 }), run(r.location || "", { size: 20 }), link(r.evidence_url, "Open")]))));
    }
    if (other.length) {
      parts.push(h1("Other signals"));
      parts.push(table([1200, 1700, 4600, 1860], [["Date", "Type", "What", "Link"]].concat(other.map((r) => [run(String(r.posted_at || r.first_seen_at || "").slice(0, 10), { size: 20 }), run(r.type.replace("_", " "), { size: 20 }), hlRuns(r.title || r.evidence_text || "", { size: 20 }), link(r.evidence_url, "Source")]))));
    }
    parts.push(para(run("Rep rule: never name the competitor in the first message. Talk about the problem the job or trigger points to.", { i: true, color: "5F6271", size: 20 }), { after: 0 }));
  });

  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body>${parts.join("")}<w:sectPr><w:footerReference w:type="default" r:id="rId3"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1000" w:right="1300" w:bottom="1100" w:left="1300" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="8" w:space="4" w:color="D41F2A"/></w:pBdr><w:tabs><w:tab w:val="right" w:pos="9360"/></w:tabs><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="C8102E"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">Solix Leads Radar</w:t></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">  ${X(footer || a0.name || "")}  |  Internal use only</w:t></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:tab/><w:t xml:space="preserve">Page </w:t></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:color w:val="5F6271"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${png ? '<Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/>' : ""}${rels.map((r) => `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${X(r.url)}" TargetMode="External"/>`).join("")}</Relationships>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:color w:val="10212C"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="280" w:after="100"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>`;
  const numbering = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="540" w:hanging="300"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
  const pkgRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypes);
  zip.file("_rels/.rels", pkgRels);
  zip.file("word/document.xml", document);
  zip.file("word/_rels/document.xml.rels", docRels);
  zip.file("word/styles.xml", styles);
  zip.file("word/numbering.xml", numbering);
  zip.file("word/footer1.xml", footerXml);
  if (png) zip.file("word/media/logo.png", png);
  return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", compression: "DEFLATE" });
}

export function saveBrief(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: `${String(name).replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 90)}.docx` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
