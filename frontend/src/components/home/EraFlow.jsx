// Animated stand-in for the "tape reels through servers to an AI core" ribbon
// photo: a literal flow chart, moving left to right through each data era,
// in the same generated-graphics language as DataFlowDiagram/NeuralField.
const STOPS = [
  { label: "Active", x: 40 },
  { label: "Inactive", x: 130 },
  { label: "Archived", x: 220 },
  { label: "Retired", x: 310 },
  { label: "Preserved", x: 400 },
  { label: "Activated", x: 490 },
];

export const EraFlow = ({ className }) => (
  <svg viewBox="0 0 540 140" className={className} role="img" aria-label="Data flowing through every era, from active use to AI-activated">
    <defs>
      <linearGradient id="ef-line" x1="0" x2="1">
        <stop offset="0%" stopColor="#0088CF" />
        <stop offset="100%" stopColor="#EE2424" />
      </linearGradient>
    </defs>
    <line x1="40" y1="70" x2="490" y2="70" stroke="url(#ef-line)" strokeWidth="1.5" opacity="0.4" />
    {[0, 1, 2].map((i) => (
      <circle key={i} r="3" fill="#fff">
        <animateMotion dur="6s" begin={`${i * 2}s`} repeatCount="indefinite" path="M 40 70 L 490 70" />
        <animate attributeName="opacity" values="0;1;1;0" dur="6s" begin={`${i * 2}s`} repeatCount="indefinite" />
      </circle>
    ))}
    {STOPS.map((s, i) => (
      <g key={s.label} transform={`translate(${s.x} 70)`}>
        <circle r="20" className="fill-ink-900" stroke={i === STOPS.length - 1 ? "#EE2424" : "rgba(255,255,255,0.15)"} strokeWidth="1.25">
          {i === STOPS.length - 1 && <animate attributeName="stroke-opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />}
        </circle>
        <text y="42" textAnchor="middle" className="fill-[#B0B0B2]" style={{ fontSize: 9.5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.6, textTransform: "uppercase" }}>
          {s.label}
        </text>
      </g>
    ))}
  </svg>
);
