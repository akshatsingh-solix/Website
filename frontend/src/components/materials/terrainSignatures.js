/*
 * Data-terrain signatures (<DataTerrain>, @shadergradient/react), one per
 * industry. The palette stays inside the Solix brand - navy scale, Solix
 * Blue #0088CF, Solix Red #EE2424 - and the motion carries the industry:
 * fast, dense ripples where data arrives as high-frequency events (trades,
 * call records, transactions), long slow swells where records must live for
 * decades (grid assets, clinical history, public records).
 *
 *   color1 -> color2  across the surface
 *   color3            on the crests (Solix Red where data is "activated")
 *   uSpeed            how fast the data moves
 *   uStrength         swell height: how much history is carried
 *   uDensity          ripple frequency: how granular the events are
 */
// no-i18n
export const TERRAIN_SIGNATURES = {
  "financial-services": { color1: "#0D192D", color2: "#0088CF", color3: "#EE2424", uSpeed: 0.26, uStrength: 1.6, uDensity: 2.1, cAzimuthAngle: 180, cPolarAngle: 78, cDistance: 2.6, rotationX: 50, rotationY: 0, rotationZ: -60 },
  "healthcare": { color1: "#0D192D", color2: "#1C2F43", color3: "#0088CF", uSpeed: 0.09, uStrength: 2.6, uDensity: 1.1, cAzimuthAngle: 180, cPolarAngle: 82, cDistance: 3.2, rotationX: 50, rotationY: 0, rotationZ: -40 },
  "manufacturing": { color1: "#112036", color2: "#2C4A66", color3: "#EE2424", uSpeed: 0.16, uStrength: 2.2, uDensity: 1.5, cAzimuthAngle: 180, cPolarAngle: 80, cDistance: 2.9, rotationX: 50, rotationY: 0, rotationZ: -75 },
  "public-sector": { color1: "#0D192D", color2: "#1C2F43", color3: "#0088CF", uSpeed: 0.07, uStrength: 1.4, uDensity: 1.0, cAzimuthAngle: 180, cPolarAngle: 84, cDistance: 3.4, rotationX: 50, rotationY: 0, rotationZ: -50 },
  "pharma-biotech": { color1: "#0D192D", color2: "#0088CF", color3: "#EE2424", uSpeed: 0.12, uStrength: 2.0, uDensity: 1.3, cAzimuthAngle: 180, cPolarAngle: 80, cDistance: 3.0, rotationX: 50, rotationY: 0, rotationZ: -30 },
  "retail": { color1: "#112036", color2: "#0088CF", color3: "#EE2424", uSpeed: 0.34, uStrength: 1.9, uDensity: 2.3, cAzimuthAngle: 180, cPolarAngle: 76, cDistance: 2.5, rotationX: 50, rotationY: 0, rotationZ: -65 },
  "energy": { color1: "#0D192D", color2: "#2C4A66", color3: "#EE2424", uSpeed: 0.08, uStrength: 3.4, uDensity: 0.9, cAzimuthAngle: 180, cPolarAngle: 82, cDistance: 3.4, rotationX: 50, rotationY: 0, rotationZ: -55 },
  "telecom": { color1: "#0D192D", color2: "#0088CF", color3: "#EE2424", uSpeed: 0.4, uStrength: 1.4, uDensity: 2.6, cAzimuthAngle: 180, cPolarAngle: 76, cDistance: 2.4, rotationX: 50, rotationY: 0, rotationZ: -80 },
  "insurance": { color1: "#0D192D", color2: "#1C2F43", color3: "#EE2424", uSpeed: 0.1, uStrength: 2.8, uDensity: 1.2, cAzimuthAngle: 180, cPolarAngle: 82, cDistance: 3.2, rotationX: 50, rotationY: 0, rotationZ: -45 },
};

// The brand default: the Solix palette at an even, unhurried pace.
export const DEFAULT_SIGNATURE = { color1: "#0D192D", color2: "#0088CF", color3: "#EE2424", uSpeed: 0.14, uStrength: 2.2, uDensity: 1.4, cAzimuthAngle: 180, cPolarAngle: 80, cDistance: 2.9, rotationX: 50, rotationY: 0, rotationZ: -60 };

export const terrainSignature = (slug) => TERRAIN_SIGNATURES[slug] || DEFAULT_SIGNATURE;
