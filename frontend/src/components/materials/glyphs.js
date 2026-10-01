import { GLYPHS } from "./glyphManifest";

/*
 * The glyph library (scripts/art/glyphs.js): every content icon as a liquid-
 * metal still in Solix Red and Solix Blue chrome, plus the silhouette mask
 * the live shader reads. Content keeps its lucide icon; these look the
 * rendered version up by the icon's name.
 */
const BASE = process.env.PUBLIC_URL || "";

// "BrainCircuit" -> "brain-circuit", "BarChart3" -> "bar-chart-3"; the same rule as the render script.
const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase();

/** The glyph's file name for a lucide icon, or null when it has no render. */
export const glyphName = (Icon) => {
  const name = Icon?.displayName;
  if (!name) return null;
  const file = kebab(name);
  return GLYPHS.has(file) ? file : null;
};

export const glyphStill = (name, tone = "red") => `${BASE}/images/glyphs/${name}-${tone}.webp`;
export const glyphMask = (name) => (name === "solix-bolt" ? `${BASE}/brand/solix-bolt-mask.svg` : `${BASE}/brand/glyphs/${name}.svg`);

/** Chrome tints the stills were rendered with; the live shader uses the same. */
export const GLYPH_TINT = { red: "#EE2424", blue: "#22A6EE" };
