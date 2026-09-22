const SOURCES = ["SAP ERP", "Oracle EBS", "Salesforce", "Mainframe", "Email & Files", "Retired Apps"];
const OUTCOMES = ["AI Agents", "Analytics", "Compliance", "Archive"];

const Node = ({ x, y, label, side }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={side === "left" ? -112 : 0} y="-14" width="112" height="28" rx="6" className="fill-ink-900 stroke-white/15" strokeWidth="1" />
    <text x={side === "left" ? -56 : 56} y="4" textAnchor="middle" className="fill-slate-300" style={{ fontSize: 10.5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4 }}>
      {label}
    </text>
  </g>
);

const Flow = ({ d, delay = 0, color = "#0088CF", dur = 3.2 }) => (
  <>
    <path d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
    <path d={d} fill="none" stroke={color} strokeWidth="1" strokeDasharray="6 14" className="animate-dash" style={{ opacity: 0.45 }} />
    <circle r="2.6" fill={color}>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
    </circle>
  </>
);

export const DataFlowDiagram = () => {
  const leftX = 150;
  const rightX = 470;
  const cx = 310;
  const cy = 190;
  const leftYs = SOURCES.map((_, i) => 60 + i * 52);
  const rightYs = OUTCOMES.map((_, i) => 112 + i * 52);

  return (
    <svg viewBox="0 0 620 380" className="h-auto w-full" role="img" aria-label="Enterprise systems flowing into the Solix Common Data Platform and out to AI, analytics and compliance">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ED2423" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ED2423" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="coreStroke" x1="0" x2="1">
          <stop offset="0%" stopColor="#0088CF" />
          <stop offset="100%" stopColor="#ED2423" />
        </linearGradient>
      </defs>

      {leftYs.map((y, i) => (
        <Flow key={`l${i}`} d={`M ${leftX} ${y} C ${leftX + 60} ${y}, ${cx - 110} ${cy}, ${cx - 68} ${cy}`} delay={i * 0.45} />
      ))}
      {rightYs.map((y, i) => (
        <Flow key={`r${i}`} d={`M ${cx + 68} ${cy} C ${cx + 110} ${cy}, ${rightX - 60} ${y}, ${rightX} ${y}`} delay={0.6 + i * 0.5} color="#ED2423" dur={2.8} />
      ))}

      {SOURCES.map((s, i) => <Node key={s} x={leftX} y={leftYs[i]} label={s} side="left" />)}
      {OUTCOMES.map((s, i) => <Node key={s} x={rightX} y={rightYs[i]} label={s} side="right" />)}

      <circle cx={cx} cy={cy} r="96" fill="url(#coreGlow)" />
      <g transform={`translate(${cx} ${cy})`}>
        <rect x="-66" y="-46" width="132" height="92" rx="12" className="fill-ink-950" stroke="url(#coreStroke)" strokeWidth="1.25" />
        <rect x="-66" y="-46" width="132" height="92" rx="12" fill="none" stroke="url(#coreStroke)" strokeWidth="1.25" opacity="0.5">
          <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
        </rect>
        <g transform="translate(0 -26)">
          <circle r="11" fill="#ED2423" />
          <path d="M1.9 -9.1 -5.2 1.4h4.5l-1.9 8 8.1-11h-4.5l3.3-7.5Z" fill="#fff" />
        </g>
        <text y="16" textAnchor="middle" className="fill-white" style={{ fontSize: 12, fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: 0.4 }}>Common Data Platform</text>
        <text y="32" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1.2 }}>GOVERNED · PRESERVED</text>
      </g>
    </svg>
  );
};
