// node scripts/art/glyphs.js [IconName ...]   (CHROMIUM_PATH=... to pick a browser)
//
// The glyph library: every content icon (lucide) as a liquid-metal still, in
// Solix Red and Solix Blue chrome, for <Sigil> (components/materials). For
// each icon it writes
//   public/brand/glyphs/<name>.svg          the silhouette mask (stroked
//                                           outline), which the live shader
//                                           (LiquidMetalMark) also reads
//   public/images/glyphs/<name>-red.webp    transparent stills, 384px
//   public/images/glyphs/<name>-blue.webp
// and src/components/materials/glyphManifest.js, the list that exists.
// "SolixBolt" renders the bolt of the mark (red only) from its brand mask.
// With icon names as arguments, only those are rendered (and added to the
// manifest).
const fs = require("fs");
const path = require("path");
const http = require("http");
const { createElement } = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const lucide = require("lucide-react");
const { chromium } = require("playwright-core");

const ROOT = path.resolve(__dirname, "../..");
const MASKS = path.join(ROOT, "public/brand/glyphs");
const STILLS = path.join(ROOT, "public/images/glyphs");
const MANIFEST = path.join(ROOT, "src/components/materials/glyphManifest.js");

// Icons used outside data/site.js that also get a sigil (press categories,
// resource types without an item yet, company pages).
const EXTRA = ["Rocket", "Users", "Handshake", "BarChart3", "TrendingUp", "HeartHandshake", "ClipboardList", "Megaphone", "Plug", "Code", "LayoutGrid", "PenTool", "Target", "Boxes"];

// Same rule as glyphName() in components/materials/glyphs.js.
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase();

const TINTS = { red: "#EE2424", blue: "#22A6EE" };
const SIZE = 768; // drawn at, then downsampled to OUT
const OUT = 384;
const FRAME = 5200;

function iconNames() {
  const site = fs.readFileSync(path.join(ROOT, "src/data/site.js"), "utf8");
  const used = [...site.matchAll(/icon: ([A-Z][A-Za-z0-9]*)/g)].map((m) => m[1]);
  return [...new Set([...used, ...EXTRA, "SolixBolt"])];
}

function mask(Comp) {
  const svg = renderToStaticMarkup(createElement(Comp, { size: 1000, strokeWidth: 2.1, color: "#0D192D" }));
  return svg
    .replace(/ class="[^"]*"/, "")
    .replace(/viewBox="0 0 24 24"/, 'viewBox="-1.6 -1.6 27.2 27.2"')
    .replace(/ aria-hidden="true"/, "");
}

function serve() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".map": "application/json" };
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const file = url.startsWith("/art/") ? path.join(__dirname, url.slice(5)) : path.join(ROOT, url);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

(async () => {
  const only = process.argv.slice(2);
  const names = only.length ? only : iconNames();
  fs.mkdirSync(MASKS, { recursive: true });
  fs.mkdirSync(STILLS, { recursive: true });

  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("page:", e.message));
  await page.goto(`${base}/art/glyphs.html`);
  await page.waitForFunction(() => typeof window.renderGlyph === "function");

  const done = [];
  for (const name of names) {
    // The Solix bolt, from the brand mask the CTA band's live bolt uses.
    if (name === "SolixBolt") {
      const data = await page.evaluate(([u, c, s, o, f]) => window.renderGlyph(u, c, s, o, f), [`${base}/public/brand/solix-bolt-mask.svg`, TINTS.red, SIZE, OUT, FRAME]);
      fs.writeFileSync(path.join(STILLS, "solix-bolt-red.webp"), Buffer.from(data.split(",")[1], "base64"));
      done.push("solix-bolt");
      continue;
    }
    const Comp = lucide[name];
    if (!Comp) {
      console.warn("no lucide icon", name);
      continue;
    }
    const file = kebab(Comp.displayName || name);
    fs.writeFileSync(path.join(MASKS, `${file}.svg`), mask(Comp) + "\n");
    for (const [tone, tint] of Object.entries(TINTS)) {
      const t0 = Date.now();
      const data = await page.evaluate(([u, c, s, o, f]) => window.renderGlyph(u, c, s, o, f), [`${base}/public/brand/glyphs/${file}.svg`, tint, SIZE, OUT, FRAME]);
      fs.writeFileSync(path.join(STILLS, `${file}-${tone}.webp`), Buffer.from(data.split(",")[1], "base64"));
      console.log(file, tone, `${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    done.push(file);
  }
  await browser.close();
  server.close();

  {
    // A partial run adds to the manifest; a full run rewrites it.
    const prior = only.length && fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8").match(/new Set\((\[[^\]]*\])\)/)[1]) : [];
    const list = [...new Set([...prior, ...done])].sort();
    fs.writeFileSync(
      MANIFEST,
      `// Generated by scripts/art/glyphs.js - the icons that have a liquid-metal
// still (public/images/glyphs) and a mask (public/brand/glyphs).
// no-i18n
export const GLYPHS = new Set(${JSON.stringify(list, null, 1).replace(/\n\s*/g, " ")});
`,
    );
    console.log("manifest:", list.length, "glyphs");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
