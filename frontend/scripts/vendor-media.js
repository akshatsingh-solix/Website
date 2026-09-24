#!/usr/bin/env node
/**
 * Copies the OpenArt visuals listed in src/data/openart-media.json into
 * public/media/openart/, so the site serves them itself instead of
 * hot-linking the OpenArt CDN.
 *
 *   node scripts/vendor-media.js          # fetch files that are missing
 *   node scripts/vendor-media.js --force  # re-fetch everything
 *
 * Runs on deploy before the build. It never fails the build: pages fall
 * back to the CDN copy, then to the site's existing photography, so a
 * failed fetch only costs a slower first paint.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const { assets } = require(path.join(ROOT, "src", "data", "openart-media.json"));
const OUT = path.join(ROOT, "public", "media", "openart");
const FORCE = process.argv.includes("--force");

const fetchTo = async (url, dest) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!/^(image|video)\//.test(type)) throw new Error(`unexpected content-type ${type || "(none)"}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  for (const [name, a] of Object.entries(assets)) {
    if (a.watermarked) { console.log(`  ${name}: skipped (watermarked preview; export a clean original first)`); continue; }
    const dest = path.join(OUT, a.file);
    if (!FORCE && fs.existsSync(dest) && fs.statSync(dest).size > 0) { ok++; continue; }
    try {
      const bytes = await fetchTo(a.url, dest);
      console.log(`  ${name}: ${a.file} (${Math.round(bytes / 1024)} KB)`);
      ok++;
    } catch (e) {
      console.warn(`  ${name}: could not fetch (${e.message}); pages will use the CDN or fallback image`);
    }
  }
  const clean = Object.values(assets).filter((a) => !a.watermarked).length;
  console.log(`OpenArt media: ${ok}/${clean} clean assets available locally`);
})();
