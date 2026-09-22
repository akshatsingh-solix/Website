import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const LAYERS = [
  { key: "activate", label: "Activate", items: [{ n: "Enterprise AI", to: "/products/enterprise-ai" }, { n: "Enterprise Edition workspace", to: "/products/enterprise-edition" }], fill: "#EE2424", text: "#fff" },
  { key: "comply", label: "Comply", items: [{ n: "eDiscovery", to: "/products/ediscovery" }, { n: "Consumer Data Privacy", to: "/products/consumer-data-privacy" }], fill: "#1C2F43", text: "#F5F5F5" },
  { key: "optimize", label: "Optimize & Modernize", items: [{ n: "Enterprise Archiving", to: "/products/enterprise-archiving" }, { n: "Application Retirement", to: "/products/application-retirement" }, { n: "Enterprise Data Lake", to: "/products/enterprise-data-lake" }], fill: "#2C4A66", text: "#F5F5F5" },
  { key: "foundation", label: "Foundation", items: [{ n: "Common Data Platform · 150+ connectors · Preservation Zone · Catalog", to: "/products/common-data-platform" }], fill: "#0088CF", text: "#0D192D" },
];

const W = 320, H = 110, DX = 0, DY = 62;

const Slab = ({ i, fill }) => {
  const y = i * DY;
  const top = `M ${160} ${y} L ${320} ${y + 55} L ${160} ${y + 110} L ${0} ${y + 55} Z`;
  const left = `M ${0} ${y + 55} L ${160} ${y + 110} L ${160} ${y + 132} L ${0} ${y + 77} Z`;
  const right = `M ${160} ${y + 110} L ${320} ${y + 55} L ${320} ${y + 77} L ${160} ${y + 132} Z`;
  return (
    <motion.g initial={{ opacity: 0, y: -24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.12 * (LAYERS.length - i), ease: [0.22, 1, 0.36, 1] }}>
      <path d={left} fill={fill} opacity="0.55" />
      <path d={right} fill={fill} opacity="0.35" />
      <path d={top} fill={fill} opacity={0.95} stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
    </motion.g>
  );
};

export const ArchitectureStack = () => (
  <div className="grid items-center gap-10 lg:grid-cols-12" data-testid="architecture-stack">
    <div className="relative lg:col-span-5">
      <div className="absolute -inset-10 rounded-full bg-teal/10 blur-3xl" />
      <svg viewBox={`-10 -10 ${W + 20} ${H + DY * (LAYERS.length - 1) + 40}`} className="relative w-full" role="img" aria-label="Isometric diagram of the Solix platform layers">
        {[...LAYERS].reverse().map((l, idx) => <Slab key={l.key} i={LAYERS.length - 1 - idx} fill={l.fill} />)}
        {LAYERS.map((l, i) => (
          <text key={l.key} x={160} y={i * DY + 60} textAnchor="middle" fill={l.text} style={{ fontFamily: "Outfit, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>{l.label}</text>
        ))}
        {[0, 1, 2].map((i) => (
          <circle key={i} r="3" fill="#fff">
            <animateMotion dur={`${3 + i}s`} begin={`${i * 0.8}s`} repeatCount="indefinite" path={`M ${40 + i * 40} ${DY * 3 + 70} L ${60 + i * 40} ${20 + i * 10}`} />
          </circle>
        ))}
      </svg>
    </div>
    <div className="space-y-3 lg:col-span-7">
      {LAYERS.map((l, i) => (
        <motion.div key={l.key} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.08 * i }} className="grid gap-3 rounded-2xl border border-white/10 bg-card px-6 py-5 sm:grid-cols-12 sm:items-center" data-testid={`layer-${l.key}`}>
          <div className="flex items-center gap-3 sm:col-span-4">
            <span className="h-3 w-3 rounded-sm" style={{ background: l.fill }} />
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-200">{l.label}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-8">
            {l.items.map((it) => <Link key={it.n} to={it.to} className="rounded-full border border-white/10 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">{it.n}</Link>)}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);
