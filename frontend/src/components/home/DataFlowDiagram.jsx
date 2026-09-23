import { useTx } from "@/i18n/tx";

// i18n: labels are translated at render.
const SOURCES = ["SAP ERP", "Oracle EBS", "Salesforce", "Mainframe", "Email & Files", "Retired Apps"];
// i18n
const OUTCOMES = ["AI Agents", "Analytics", "Compliance", "Archive"];

// `highlight` ("sources" | "core" | "outcomes") lets a caller narrate the
// diagram step by step - the lit stage glows, the rest recedes.
const Node = ({ x, y, label, side, lit, dim, color }) => (
  <g transform={`translate(${x} ${y})`} style={{ opacity: dim ? 0.35 : 1, transition: "opacity 400ms ease" }}>
    <rect
      x={side === "left" ? -112 : 0}
      y="-14"
      width="112"
      height="28"
      rx="6"
      className="fill-card"
      stroke={lit ? color : "rgb(var(--line) / 0.15)"}
      strokeWidth={lit ? 1.25 : 1}
      style={{ transition: "stroke 400ms ease" }}
    />
    <text x={side === "left" ? -56 : 56} y="4" textAnchor="middle" fill={lit ? "#fff" : "#B0B0B2"} style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4, transition: "fill 400ms ease" }}>
      {/* Longer translations are fitted to the 112px node rather than overflowing it. */}
      <tspan textLength={label.length > 16 ? 102 : undefined} lengthAdjust="spacingAndGlyphs">{label}</tspan>
    </text>
  </g>
);

const Flow = ({ d, delay = 0, color = "#0088CF", dur = 3.2, dim }) => (
  <g style={{ opacity: dim ? 0.3 : 1, transition: "opacity 400ms ease" }}>
    <path d={d} fill="none" stroke="rgb(var(--line) / 0.1)" strokeWidth="1" />
    <path d={d} fill="none" stroke={color} strokeWidth="1" strokeDasharray="6 14" className="animate-dash" style={{ opacity: 0.5 }} />
    <circle r="2.6" fill={color}>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
    </circle>
  </g>
);

export const DataFlowDiagram = ({ highlight = null, className = "h-auto w-full" }) => {
  const tx = useTx();
  const leftX = 150;
  const rightX = 470;
  const cx = 310;
  const cy = 190;
  const leftYs = SOURCES.map((_, i) => 60 + i * 52);
  const rightYs = OUTCOMES.map((_, i) => 112 + i * 52);
  const dimSources = highlight && highlight !== "sources";
  const dimOutcomes = highlight && highlight !== "outcomes";
  const coreLit = !highlight || highlight === "core";

  return (
    <svg viewBox="0 0 620 380" className={className} role="img" aria-label={tx("Enterprise systems flowing into the Solix Common Data Platform and out to AI, analytics and compliance")}>
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#EE2424" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#EE2424" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="coreStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#0088CF" />
          <stop offset="100%" stopColor="#EE2424" />
        </linearGradient>
      </defs>

      {leftYs.map((y, i) => (
        <Flow key={`l${i}`} d={`M ${leftX} ${y} C ${leftX + 60} ${y}, ${cx - 110} ${cy}, ${cx - 68} ${cy}`} delay={i * 0.45} dim={dimSources && highlight !== "core"} />
      ))}
      {rightYs.map((y, i) => (
        <Flow key={`r${i}`} d={`M ${cx + 68} ${cy} C ${cx + 110} ${cy}, ${rightX - 60} ${y}, ${rightX} ${y}`} delay={0.6 + i * 0.5} color="#EE2424" dur={2.8} dim={dimOutcomes && highlight !== "core"} />
      ))}

      {SOURCES.map((s, i) => <Node key={s} x={leftX} y={leftYs[i]} label={tx(s)} side="left" lit={highlight === "sources"} dim={dimSources} color="#0088CF" />)}
      {OUTCOMES.map((s, i) => <Node key={s} x={rightX} y={rightYs[i]} label={tx(s)} side="right" lit={highlight === "outcomes"} dim={dimOutcomes} color="#EE2424" />)}

      <circle cx={cx} cy={cy} r="96" fill="url(#coreGlow)" style={{ opacity: coreLit ? 1 : 0.35, transition: "opacity 400ms ease" }} />
      <g transform={`translate(${cx} ${cy})`}>
        <rect x="-66" y="-46" width="132" height="92" rx="12" className="fill-background" stroke="url(#coreStroke)" strokeWidth={highlight === "core" ? 2 : 1.25} />
        <rect x="-66" y="-46" width="132" height="92" rx="12" fill="none" stroke="url(#coreStroke)" strokeWidth="1.25" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
        </rect>
        <g transform="translate(0 -26)">
          <circle r="11" fill="#EE2424" />
          <path d="M1.9 -9.1 -5.2 1.4h4.5l-1.9 8 8.1-11h-4.5l3.3-7.5Z" fill="#fff" />
        </g>
        <text y="16" textAnchor="middle" className="fill-foreground" style={{ fontSize: 12, fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: 0.4 }}>{tx("Common Data Platform")}</text>
        <text y="32" textAnchor="middle" fill="#B0B0B2" style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2 }}>{tx("GOVERNED · PRESERVED")}</text>
      </g>
    </svg>
  );
};
