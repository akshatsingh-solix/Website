import { cn } from "@/lib/utils";
import { Picture } from "@/components/shared/Picture";
import { LiquidMetalMark } from "./LiquidMetalMark";
import { MetalIcon } from "./MetalIcon";
import { GLYPH_TINT, glyphMask, glyphName, glyphStill } from "./glyphs";

const STAGE = { red: "/Website/images/sigil-stage-red.jpg", blue: "/Website/images/sigil-stage-blue.jpg" };

/**
 * A content sigil: the item's icon as a liquid-metal glyph (liquid-logo's
 * technique, via Paper's shader - scripts/art/glyphs.js) standing in a ring
 * of light on the rendered stage (scripts/art/sigil-stage.frag), red for
 * archive, preservation and delivery, blue for AI and governance. Every
 * product, solution, service and resource card leads with one, so each
 * piece of content has its own visual inside one family.
 *
 *   <Sigil icon={Archive} tone="red" className="aspect-[16/9]" />
 *   <Sigil icon={BrainCircuit} tone="blue" live />   // the glyph flows (live-canvas slot)
 *   <Sigil glyph="solix-bolt" live />                 // the Solix bolt
 *
 * Motion, all transform/opacity: while pointed at (the parent carries
 * `group`) the stage eases in, the glyph rises off its pedestal and a light
 * sweep crosses the chrome; `float` adds a slow hover in place, for the one
 * large sigil of a section (compositor-only, off for reduced motion).
 * `live` swaps the still for the shader, which flows only while it holds
 * the page's live-canvas slot; the still is its placeholder, so the two are
 * drawn in the same geometry. Icons without a render fall back to a
 * chrome-gradient icon.
 */
export const Sigil = ({ icon, glyph, tone = "red", live = false, float = false, sizes = "(min-width: 1024px) 40vw, 100vw", className, glyphClassName, children, ...rest }) => {
  const name = glyph || glyphName(icon);
  const still = name ? glyphStill(name, name === "solix-bolt" ? "red" : tone) : null;
  const tint = name === "solix-bolt" ? GLYPH_TINT.red : GLYPH_TINT[tone];
  const stillImg = still ? <img src={still} alt="" aria-hidden="true" decoding="async" loading="lazy" className="absolute inset-0 h-full w-full" /> : null;

  return (
    <div className={cn("sigil dark relative isolate overflow-hidden bg-ink-950", className)} data-testid="sigil" data-glyph={name || undefined} {...rest}>
      <Picture src={STAGE[tone] || STAGE.red} sizes={sizes} className="sigil-stage absolute inset-0 h-full w-full object-cover" />
      {still && (
        <span aria-hidden="true" className="sigil-reflection" style={{ backgroundImage: `url(${still})` }} />
      )}
      <div className={cn("sigil-glyph", glyphClassName)} style={still ? { "--glyph": `url(${still})` } : undefined}>
        <span className={cn("absolute inset-0", float && "sigil-float")}>
          {still ? (
            live ? (
              <LiquidMetalMark src={glyphMask(name)} tint={tint} className="absolute inset-0" placeholder={stillImg} fallback={stillImg} />
            ) : (
              stillImg
            )
          ) : (
            <MetalIcon icon={icon} tone={tone} strokeWidth={1.4} className="absolute inset-[18%] h-[64%] w-[64%]" />
          )}
          {still && <span aria-hidden="true" className="sigil-sheen" />}
        </span>
      </div>
      {children}
    </div>
  );
};

/**
 * The glyph alone, without its stage: for a dark panel that is already a
 * stage of its own. Falls back to a chrome icon when there is no render.
 */
export const GlyphImage = ({ icon, glyph, tone = "red", className }) => {
  const name = glyph || glyphName(icon);
  return (
    <span aria-hidden="true" className={cn("relative block", className)}>
      {name ? (
        <img src={glyphStill(name, name === "solix-bolt" ? "red" : tone)} alt="" decoding="async" loading="lazy" className="absolute inset-0 h-full w-full" />
      ) : (
        <MetalIcon icon={icon} tone={tone} strokeWidth={1.4} className="absolute inset-[18%] h-[64%] w-[64%]" />
      )}
    </span>
  );
};

/** Red for archive, preservation and delivery; blue for AI and governance. */
export const solutionTone = (s) => (s?.group === "AI Solutions" ? "blue" : "red");

export default Sigil;

