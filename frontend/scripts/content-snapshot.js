#!/usr/bin/env node
/**
 * Jamstack content snapshot: fetches every published CMS item (with bodies)
 * from the backend and writes public/content-snapshot.json, which ships with
 * the static build. The site renders from it instantly and never depends on
 * the backend being awake; newer items are picked up at runtime.
 *
 *   REACT_APP_BACKEND_URL=https://... node scripts/content-snapshot.js
 *
 * Always exits 0: if the backend is unreachable the existing file is kept.
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "public", "content-snapshot.json");
const base = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");

async function main() {
  if (!base) {
    console.log("content-snapshot: no REACT_APP_BACKEND_URL, keeping the existing snapshot");
    return;
  }
  // The free backend may be asleep: allow a slow first response and retry once.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 90000);
      const res = await fetch(`${base}/api/content?full=true&limit=1000`, { signal: ctrl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { items } = await res.json();
      if (!Array.isArray(items)) throw new Error("unexpected response");
      fs.writeFileSync(OUT, JSON.stringify({ items, generated_at: new Date().toISOString() }) + "\n");
      console.log(`content-snapshot: wrote ${items.length} published item(s)`);
      return;
    } catch (err) {
      console.log(`content-snapshot: attempt ${attempt} failed (${err.message})`);
    }
  }
  console.log("content-snapshot: keeping the existing snapshot");
}

main().catch((err) => console.log(`content-snapshot: ${err.message}`));
