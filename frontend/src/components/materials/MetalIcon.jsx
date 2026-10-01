import { cn } from "@/lib/utils";

/*
 * Small icons in chrome: the liquid-metal glyphs' look at icon size, as an
 * SVG gradient on the stroke - bright band, dark horizon, a second band
 * below - so a 20px icon reads as the same material as a rendered sigil
 * without loading anything. The gradients are defined once (<MetalDefs />,
 * mounted at the app root) in each icon's own 24-unit space; `.dark`
 * sections swap to the lit set (see .metal-icon in index.css).
 */
const STOPS = {
  red: ["#E85A5A", "#B31818", "#5C0A0A", "#E23030", "#A01515", "#F07070"],
  "red-lit": ["#FFD3D3", "#FF5A5A", "#8A1010", "#FF6B6B", "#D42020", "#FFB3B3"],
  blue: ["#3FA9E4", "#0072AD", "#062F4D", "#1690D6", "#005B8C", "#62BDEF"],
  "blue-lit": ["#DDF2FF", "#4FBDF5", "#0A4A75", "#5CC6FA", "#0A93DA", "#BDE7FF"],
};
const OFFSETS = [0, 0.36, 0.5, 0.56, 0.8, 1];

export const MetalDefs = () => (
  <svg aria-hidden="true" width="0" height="0" focusable="false" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
    <defs>
      {Object.entries(STOPS).map(([key, colors]) => (
        <linearGradient key={key} id={`metal-${key}`} gradientUnits="userSpaceOnUse" x1="5" y1="1" x2="19" y2="23">
          {colors.map((c, i) => <stop key={c + i} offset={OFFSETS[i]} stopColor={c} />)}
        </linearGradient>
      ))}
    </defs>
  </svg>
);

/** A lucide icon stroked in red or blue chrome. Decorative: hidden from assistive tech. */
export const MetalIcon = ({ icon: Icon, tone = "red", strokeWidth = 1.75, className }) => {
  if (!Icon) return null;
  return <Icon aria-hidden="true" strokeWidth={strokeWidth} className={cn("metal-icon", tone === "blue" ? "metal-icon-blue" : "metal-icon-red", className)} />;
};

// Written out in full so Tailwind keeps the classes.
const TILE = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-11 w-11 rounded-xl",
  lg: "h-14 w-14 rounded-2xl",
};
const ICON = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-7 w-7" };

/**
 * An icon tile in the site's materials: a liquid-glass chip (white glass on
 * the light canvas, navy glass inside `.dark`) holding a chrome icon, with
 * a tinted glow that rises when its card is pointed at.
 */
export const GlyphTile = ({ icon, tone = "red", size = "md", className }) => (
  <span className={cn("glyph-tile liquid-glass liquid-glass-auto grid shrink-0 place-items-center", tone === "blue" ? "glyph-tile-blue" : "glyph-tile-red", TILE[size], className)}>
    <MetalIcon icon={icon} tone={tone} className={ICON[size]} strokeWidth={size === "lg" ? 1.5 : 1.75} />
  </span>
);

export default MetalIcon;
