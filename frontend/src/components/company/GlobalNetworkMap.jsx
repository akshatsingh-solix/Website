const NODES = [
  { city: "Santa Clara", region: "Headquarters", x: 130, y: 118 },
  { city: "London", region: "EMEA", x: 300, y: 70 },
  { city: "Hyderabad", region: "Engineering", x: 470, y: 150 },
  { city: "Singapore", region: "APAC", x: 560, y: 230 },
];

const cx = 340;
const cy = 190;

const Arc = ({ x, y, delay, dur }) => {
  const mx = (x + cx) / 2;
  const my = (y + cy) / 2 - 46;
  const d = `M ${x} ${y} Q ${mx} ${my}, ${cx} ${cy}`;
  return (
    <>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <path d={d} fill="none" stroke="#0088CF" strokeWidth="1" strokeDasharray="5 12" className="animate-dash" style={{ opacity: 0.4 }} />
      <circle r="2.6" fill="#0088CF">
        <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={d} />
      </circle>
    </>
  );
};

const OfficeNode = ({ city, region, x, y, delay }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="14" fill="none" stroke="#EE2424" strokeWidth="1" opacity="0.5">
      <animate attributeName="r" values="8;18;8" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.6;0;0.6" dur="3.2s" begin={`${delay}s`} repeatCount="indefinite" />
    </circle>
    <circle r="4.5" fill="#EE2424" />
    <text y="-22" textAnchor="middle" className="fill-foreground" style={{ fontSize: 12, fontFamily: "Outfit, sans-serif", fontWeight: 600 }}>{city}</text>
    <text y="-9" textAnchor="middle" className="fill-[#B0B0B2]" style={{ fontSize: 8.5, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.8, textTransform: "uppercase" }}>{region}</text>
  </g>
);

/**
 * Deliberately abstract rather than a literal (and inevitably imprecise
 * without real cartographic data) world map: a wireframe globe motif with
 * Solix's four real office locations - the same set in data/site.js's
 * OFFICES, used verbatim, nothing invented - arcing into one governed
 * hub. Communicates "global, connected" honestly instead of borrowing
 * stock-map imagery this environment has no way to source or verify.
 */
export const GlobalNetworkMap = () => (
  <svg viewBox="0 0 680 340" className="h-auto w-full" role="img" aria-label="Solix's four global offices - Santa Clara, London, Hyderabad and Singapore - connected to one governed platform">
    <defs>
      <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#EE2424" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#EE2424" stopOpacity="0" />
      </radialGradient>
    </defs>

    <g opacity="0.35" stroke="#2C4A66" fill="none" strokeWidth="1">
      <ellipse cx={cx} cy={cy} rx="230" ry="95" />
      <ellipse cx={cx} cy={cy} rx="230" ry="50" />
      <ellipse cx={cx} cy={cy} rx="120" ry="95" />
      <line x1={cx - 230} y1={cy} x2={cx + 230} y2={cy} />
    </g>

    {NODES.map((n, i) => <Arc key={n.city} x={n.x} y={n.y} delay={i * 0.6} dur={3 + i * 0.4} />)}

    <circle cx={cx} cy={cy} r="70" fill="url(#hubGlow)" />
    <g transform={`translate(${cx} ${cy})`}>
      <circle r="20" className="fill-background" stroke="#EE2424" strokeWidth="1.25" />
      <path d="M2.4 -11.4 -6.5 1.8h5.6l-2.4 10 10.1-13.8h-5.6l4.1-9.4Z" fill="#EE2424" />
      <text y="34" textAnchor="middle" className="fill-foreground" style={{ fontSize: 11, fontFamily: "Outfit, sans-serif", fontWeight: 600, letterSpacing: 0.3 }}>One governed platform</text>
    </g>

    {NODES.map((n, i) => <OfficeNode key={n.city} {...n} delay={i * 0.5} />)}
  </svg>
);
