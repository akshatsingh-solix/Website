// The admin's atmosphere: slow drifting colour fields, a faint grid that
// fades out toward the edges, and a field of thin wave lines along the
// bottom. Fixed behind everything, never interactive, CSS-animated only
// (paused under prefers-reduced-motion by the global rule in index.css).
const WAVES = Array.from({ length: 14 }, (_, i) => i);

const wavePath = (i) => {
  const y = 120 + i * 9;
  const a = 26 + i * 2.2;
  return `M-200,${y} C 200,${y - a} 400,${y + a} 800,${y} S 1400,${y - a} 1800,${y} S 2400,${y + a} 2800,${y}`;
};

export const AdminBackdrop = () => (
  <div className="admin-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <div className="admin-backdrop-base absolute inset-0" />
    <div className="admin-blob admin-blob-a" />
    <div className="admin-blob admin-blob-b" />
    <div className="admin-blob admin-blob-c" />
    <div className="admin-grid absolute inset-0" />
    <svg className="admin-waves absolute inset-x-0 bottom-0 h-[46vh] w-[200%]" viewBox="0 0 2600 300" preserveAspectRatio="none">
      <defs>
        <linearGradient id="admin-wave-ink" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="rgb(0 136 207)" stopOpacity="0" />
          <stop offset="30%" stopColor="rgb(0 136 207)" stopOpacity="0.9" />
          <stop offset="70%" stopColor="rgb(238 36 36)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgb(238 36 36)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {WAVES.map((i) => (
        <path key={i} d={wavePath(i)} fill="none" stroke="url(#admin-wave-ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" style={{ opacity: 0.05 + (i / WAVES.length) * 0.16 }} />
      ))}
    </svg>
    <div className="admin-vignette absolute inset-0" />
  </div>
);
