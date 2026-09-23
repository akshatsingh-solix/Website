// A generated animated visual (nodes + traveling particles) standing in for
// stock "neural network" photography - same visual language as
// DataFlowDiagram, so the brand's motion graphics are consistent rather than
// mixing custom SVG with generic abstract photos.
import { useTx } from "@/i18n/tx";

const NODES = [
  [40, 60], [140, 30], [230, 80], [320, 40], [380, 110],
  [80, 150], [190, 170], [300, 150], [370, 200],
  [50, 250], [150, 260], [250, 240], [340, 270],
  [110, 340], [220, 330], [320, 350],
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [1, 6], [2, 6], [3, 7], [4, 8],
  [5, 6], [6, 7], [7, 8], [5, 9], [6, 10], [7, 11], [8, 12],
  [9, 10], [10, 11], [11, 12], [9, 13], [10, 14], [11, 14], [12, 15], [14, 15],
];

const PULSE_EDGES = [0, 4, 7, 11, 15, 19, 22];

export const NeuralField = ({ className }) => {
  const tx = useTx();
  return (
  <svg viewBox="0 0 420 400" className={className} role="img" aria-label={tx("Animated network representing governed enterprise AI")}>
    <defs>
      <radialGradient id="nf-core" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#0088CF" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#0088CF" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="210" cy="200" r="180" fill="url(#nf-core)" />
    {EDGES.map(([a, b], i) => {
      const [x1, y1] = NODES[a];
      const [x2, y2] = NODES[b];
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.10)" strokeWidth="1" />;
    })}
    {PULSE_EDGES.map((edgeIdx, i) => {
      const [a, b] = EDGES[edgeIdx];
      const [x1, y1] = NODES[a];
      const [x2, y2] = NODES[b];
      const color = i % 2 === 0 ? "#0088CF" : "#EE2424";
      return (
        <g key={edgeIdx}>
          <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.25" opacity="0.5">
            <animate attributeName="opacity" values="0.1;0.6;0.1" dur={`${3 + (i % 3)}s`} begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </line>
          <circle r="2.4" fill={color}>
            <animateMotion dur={`${3.5 + (i % 4) * 0.6}s`} begin={`${i * 0.5}s`} repeatCount="indefinite" path={`M ${x1} ${y1} L ${x2} ${y2}`} />
          </circle>
        </g>
      );
    })}
    {NODES.map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 4.5 : 3} fill={i % 5 === 0 ? "#EE2424" : "#5b7896"} opacity={i % 5 === 0 ? 1 : 0.8}>
        {i % 5 === 0 && <animate attributeName="r" values="3.5;5.5;3.5" dur="2.6s" repeatCount="indefinite" begin={`${i * 0.15}s`} />}
      </circle>
    ))}
  </svg>
  );
};
