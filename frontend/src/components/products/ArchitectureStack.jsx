import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useTx } from "@/i18n/tx";

// i18n: layer labels and product names are translated at render.
const LAYERS = [
  { key: "activate", label: "Activate", items: [{ n: "Enterprise AI", to: "/products/enterprise-ai" }, { n: "Enterprise Edition workspace", to: "/products/enterprise-edition" }], fill: "#EE2424", text: "#fff" },
  { key: "comply", label: "Comply", items: [{ n: "eDiscovery", to: "/products/ediscovery" }, { n: "Consumer Data Privacy", to: "/products/consumer-data-privacy" }], fill: "#1C2F43", text: "#F5F5F5" },
  { key: "optimize", label: "Optimize & Modernize", items: [{ n: "Enterprise Archiving", to: "/products/enterprise-archiving" }, { n: "Application Retirement", to: "/products/application-retirement" }, { n: "Enterprise Data Lake", to: "/products/enterprise-data-lake" }], fill: "#2C4A66", text: "#F5F5F5" },
  { key: "foundation", label: "Foundation", items: [{ n: "Common Data Platform · 150+ connectors · Preservation Zone · Catalog", to: "/products/common-data-platform" }], fill: "#0088CF", text: "#0D192D" },
];

const W = 320, H = 110, DX = 0, DY = 62;

// Each slab rides its own offset: the stack arrives exploded and settles
// into place as it scrolls up the screen - layers inheriting the one below.
const Slab = ({ i, fill, spread, label, text }) => {
  const y = i * DY;
  const dy = useTransform(spread, (v) => (i - (LAYERS.length - 1) / 2) * v);
  const top = `M ${160} ${y} L ${320} ${y + 55} L ${160} ${y + 110} L ${0} ${y + 55} Z`;
  const left = `M ${0} ${y + 55} L ${160} ${y + 110} L ${160} ${y + 132} L ${0} ${y + 77} Z`;
  const right = `M ${160} ${y + 110} L ${320} ${y + 55} L ${320} ${y + 77} L ${160} ${y + 132} Z`;
  return (
    <motion.g style={{ y: dy }}>
      <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.12 * (LAYERS.length - i) }}>
        <path d={left} fill={fill} opacity="0.55" />
        <path d={right} fill={fill} opacity="0.35" />
        <path d={top} fill={fill} opacity={0.95} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
        <text x={160} y={y + 60} textAnchor="middle" fill={text} style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>{label}</text>
      </motion.g>
    </motion.g>
  );
};

export const ArchitectureStack = () => {
  const tx = useTx();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 55%"] });
  const spread = useSpring(useTransform(scrollYProgress, [0, 1], [70, 0]), { stiffness: 80, damping: 20 });
  return (
  <div className="grid items-center gap-10 lg:grid-cols-12" data-testid="architecture-stack">
    <div ref={ref} className="relative lg:col-span-5">
      <div className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(0,136,207,0.22),transparent)]" />
      <svg viewBox={`-10 -120 ${W + 20} ${H + DY * (LAYERS.length - 1) + 260}`} className="relative w-full overflow-visible" role="img" aria-label={tx("Isometric diagram of the Solix platform layers")}>
        {[...LAYERS].reverse().map((l, idx) => <Slab key={l.key} i={LAYERS.length - 1 - idx} fill={l.fill} spread={spread} label={tx(l.label)} text={l.text} />)}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill="#fff">
            <animateMotion dur={`${3 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" path={`M ${40 + i * 40} ${DY * 3 + 70} L ${60 + i * 40} ${20 + i * 10}`} />
          </circle>
        ))}
      </svg>
    </div>
    <div className="space-y-3 lg:col-span-7">
      {LAYERS.map((l, i) => (
        <motion.div key={l.key} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 * i }} className="spot relative grid gap-3 rounded-2xl border border-line/10 bg-card px-6 py-5 sm:grid-cols-12 sm:items-center" data-testid={`layer-${l.key}`}>
          <div className="flex items-center gap-3 sm:col-span-4">
            <span className="h-3 w-3 rounded-sm" style={{ background: l.fill }} />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">{tx(l.label)}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-8">
            {l.items.map((it) => <Link key={it.n} to={it.to} className="rounded-full border border-line/10 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">{tx(it.n)}</Link>)}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
  );
};
