// node scripts/art/render.js <scene> <W> <H> [SS] [outname]  (CHROMIUM_PATH=... to pick a browser)
const { chromium } = require("playwright-core");
const fs = require("fs");
(async () => {
  const [scene, W = "1600", H = "1000", SS = "1", name] = process.argv.slice(2);
  const frag = fs.readFileSync(`${__dirname}/${scene}.frag`, "utf8");
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  p.on("console", (m) => console.log("console:", m.text()));
  await p.goto("file://" + __dirname + "/render.html");
  const t0 = Date.now();
  const r = await p.evaluate(([f, w, h, ss]) => window.renderScene(f, w, h, ss, 0), [frag, +W, +H, +SS]);
  const base = `${__dirname}/../../public/images/${name || "key-" + scene}`;
  
  const save = (d, f) => fs.writeFileSync(f, Buffer.from(d.split(",")[1], "base64"));
  save(r.full, `${base}-full.webp`); save(r.fullJpg, `${base}.jpg`); save(r.w1264, `${base}.webp`); save(r.w720, `${base}-720.webp`);
  console.log("rendered", scene, W + "x" + H, "ss" + SS, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  await b.close();
})().catch((e) => { console.error(e.message); process.exit(1); });
