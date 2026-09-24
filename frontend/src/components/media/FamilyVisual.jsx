import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { Check, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { mediaSources, mediaVideo } from "@/lib/media";
import { useLocalized } from "@/i18n/localize";
import { useTx } from "@/i18n/tx";
import { MediaImage } from "./MediaImage";

// The overlay is drawn on a 400x300 canvas stretched over the 4:3 stage.
const W = 400;
const H = 300;
const TONE = { red: "#EE2424", blue: "#0088CF" };
const ZOOM = 1.45;

const point = (s) => [(s.x * W) / 100, (s.y * H) / 100];
// A gentle arc between two stops, bowed to one side.
const arc = (a, b) => {
  const [ax, ay] = point(a);
  const [bx, by] = point(b);
  const k = 0.18;
  return `M${ax} ${ay} Q${(ax + bx) / 2 - (by - ay) * k} ${(ay + by) / 2 + (bx - ax) * k} ${bx} ${by}`;
};
const clamp = (v, m) => Math.max(-m, Math.min(m, v));

/**
 * A product family's OpenArt render as a living visual: the still drifts
 * slowly (or its looping clip plays, when the manifest has one), data flows
 * along the links between the family's stops, and - in the interactive
 * variant - each stop is a button, with the camera easing in on the active
 * one. Motion stops off-screen, on the pause button, and for visitors who
 * prefer reduced motion.
 */
export const FamilyVisual = ({ family: source, variant = "hero", active, onSelect, visited, zoom = false, className, children }) => {
  const tx = useTx();
  const family = useLocalized(source);
  const ref = useRef(null);
  const svgRef = useRef(null);
  const videoRef = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { margin: "120px" });
  const [userPaused, setUserPaused] = useState(false);
  const paused = userPaused || reduce || !inView;
  const interactive = variant === "interactive";
  const color = TONE[family.tone] || TONE.red;
  const video = mediaVideo(family.id);
  const sources = useMemo(() => mediaSources(family.id), [family.id]);
  const byId = useMemo(() => Object.fromEntries(family.stops.map((s) => [s.id, s])), [family.stops]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg?.pauseAnimations) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused, family.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, video]);

  // Pointer parallax on the backdrop (hero only).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 18 });
  const py = useSpring(my, { stiffness: 60, damping: 18 });
  const onPointerMove = (e) => {
    if (reduce || interactive || e.pointerType !== "mouse") return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width - 0.5) * -18);
    my.set(((e.clientY - r.top) / r.height - 0.5) * -14);
  };
  const onPointerLeave = () => { mx.set(0); my.set(0); };

  const target = zoom && active ? byId[active] : null;
  const camera = target
    ? { scale: ZOOM, x: `${clamp(-ZOOM * (target.x - 50), (ZOOM - 1) * 50)}%`, y: `${clamp(-ZOOM * (target.y - 50), (ZOOM - 1) * 50)}%` }
    : { scale: 1, x: "0%", y: "0%" };
  const touches = (link) => active && link.includes(active);

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn("dark relative isolate aspect-[4/3] w-full overflow-hidden rounded-3xl bg-ink-950", paused && "motion-paused", className)}
      data-testid={`family-visual-${family.id}`}
    >
      <motion.div className="absolute inset-0" animate={camera} transition={{ duration: reduce ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}>
        <motion.div className="absolute -inset-[4%]" style={{ x: px, y: py }}>
          <div className="visual-drift absolute inset-0">
            {video ? (
              <video ref={videoRef} key={video} src={video} poster={sources[0]} muted loop playsInline autoPlay={!paused} aria-hidden className="h-full w-full object-cover" />
            ) : (
              <MediaImage key={family.id} sources={sources} alt={interactive ? "" : tx("{{name}}: how data moves through Solix", { name: family.name })} className="h-full w-full object-cover" />
            )}
          </div>
        </motion.div>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_35%,rgba(13,25,45,0.55)_100%)]" />

        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full">
          {family.links.map((link, i) => {
            const d = arc(byId[link[0]], byId[link[1]]);
            const hot = touches(link);
            const dur = 3.4 + i * 0.45;
            return (
              <g key={`${family.id}-${link.join("-")}`}>
                <path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke={hot ? color : "#7CC6EE"} strokeOpacity={hot ? 0.95 : 0.5} strokeWidth={hot ? 2 : 1.25} vectorEffect="non-scaling-stroke" className="flow-dash transition-[stroke,stroke-opacity]" />
                {[0, 1, 2].map((k) => (
                  <circle key={k} r={hot ? 2.8 : 2} fill={hot ? color : "#CDEBFF"} opacity={hot ? 1 : 0.85}>
                    <animateMotion dur={`${dur}s`} begin={`${(k * dur) / 3}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>

        {family.stops.map((s, i) => {
          const Icon = s.icon;
          const on = active === s.id;
          const pos = { left: `${s.x}%`, top: `${s.y}%` };
          if (!interactive) {
            return (
              <span key={s.id} aria-hidden className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
                <span className="stop-pulse absolute inset-0 rounded-full" style={{ background: color, animationDelay: `${i * 0.6}s` }} />
                <span className="relative block h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_0_4px_rgba(255,255,255,0.14)]" />
              </span>
            );
          }
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect?.(s.id)}
              aria-pressed={on}
              aria-label={`${i + 1}. ${s.title}`}
              className="group absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none"
              style={pos}
              data-testid={`visual-stop-${s.id}`}
            >
              {on && <span className="stop-pulse absolute inset-0 rounded-full" style={{ background: color }} />}
              <span
                className={cn("relative grid h-9 w-9 place-items-center rounded-full border text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-white sm:h-10 sm:w-10", on ? "scale-110 border-transparent" : "border-white/25 bg-ink-950/70")}
                style={on ? { background: color, boxShadow: `0 0 0 6px ${color}33, 0 10px 30px -8px ${color}` } : undefined}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {visited?.has(s.id) && !on && (
                  <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-white text-ink-950"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
                )}
              </span>
              <span className={cn("pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-md transition-colors sm:block", on ? "bg-white text-ink-950" : "bg-ink-950/75 text-white/90")}>
                <span className="font-mono tabular-nums opacity-60">{i + 1}</span> · {s.label}
              </span>
            </button>
          );
        })}
      </motion.div>

      {children}

      {!reduce && (
        <button
          type="button"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
          aria-label={userPaused ? tx("Play animation") : tx("Pause animation")}
          className="absolute bottom-3 right-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-ink-950/60 text-white/80 backdrop-blur transition hover:bg-ink-950/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          data-testid="visual-pause"
        >
          {userPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};
