import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { glassMap } from "./glassMap";

// Chromium (Chrome, Edge, Opera, Samsung Internet) is the only engine that
// accepts an SVG filter in `backdrop-filter`; everywhere else the lens
// falls back to a plain frosted blur (see .liquid-glass-lens in index.css).
let lensSupport;
const supportsLens = () => {
  if (lensSupport !== undefined) return lensSupport;
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches;
  lensSupport = !reduced && /(Chrome|Chromium)\//.test(ua) && !/Firefox\//.test(ua) && typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "blur(1px)");
  return lensSupport;
};

// Written out in full so Tailwind keeps the classes (it only sees literals).
const TONES = {
  auto: "liquid-glass-auto",
  dark: "liquid-glass-dark",
  light: "liquid-glass-light",
  red: "liquid-glass-red",
  none: "liquid-glass-none",
};

/**
 * A liquid-glass surface: the shading model of liquid-glass-js (a white to
 * grey tint, an exponential rim light, a corner highlight and a soft drop
 * shadow) drawn with static CSS layers - see `.liquid-glass` in index.css.
 *
 *   <LiquidGlass tone="dark" className="rounded-2xl p-4">…</LiquidGlass>
 *   <LiquidGlass lens shape="pill" className="rounded-full px-3 py-1">…</LiquidGlass>
 *
 * `lens` adds real refraction of whatever is behind the element (glassMap.js).
 * Keep it for surfaces over a still backdrop - a photo, a render - never over
 * a live canvas or anything that animates, or the compositor has to redo the
 * filter on every frame (PRD compositing budget).
 */
export const LiquidGlass = forwardRef(function LiquidGlass(
  { as: Tag = "div", tone = "auto", shape = "rounded", lens = false, params, className, style, children, ...rest },
  forwardedRef,
) {
  const localRef = useRef(null);
  const filterId = `lg${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [map, setMap] = useState(null);

  const ref = useCallback(
    (node) => {
      localRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );

  useEffect(() => {
    const el = localRef.current;
    if (!lens || !el || !supportsLens() || typeof ResizeObserver === "undefined") return undefined;
    let frame = 0;
    const build = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Layout size, not the transformed box: a hover lift must not rebuild the map.
        const width = el.offsetWidth;
        const height = el.offsetHeight;
        if (!width || !height) return;
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        setMap(glassMap({ width, height, radius, shape, params }));
      });
    };
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
    // `params` is a literal per call site; its identity is not a reason to rebuild.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lens, shape]);

  const lensStyle = map
    ? { backdropFilter: `url(#${filterId}) saturate(1.6) brightness(1.06)`, WebkitBackdropFilter: `url(#${filterId}) saturate(1.6) brightness(1.06)` }
    : null;

  return (
    <Tag
      ref={ref}
      data-glass={shape}
      className={cn("liquid-glass", !lens && TONES[tone], lens && "liquid-glass-lens", map && "liquid-glass-refracting", className)}
      style={lensStyle ? { ...style, ...lensStyle } : style}
      {...rest}
    >
      {map && (
        <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute" focusable="false">
          <filter id={filterId} x="0" y="0" width={map.width} height={map.height} filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={map.url} x="0" y="0" width={map.width} height={map.height} preserveAspectRatio="none" result="map" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="soft" />
            <feDisplacementMap in="soft" in2="map" scale={map.scale} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      {children}
    </Tag>
  );
});

export default LiquidGlass;
