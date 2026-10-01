# Key visuals

The site's key visuals (`public/images/key-*.{jpg,webp}`) are not stock or
AI-service images: they are rendered from the fragment shaders in this folder,
so they use the exact brand colours (Solix Red `#EE2424`, Solix Blue
`#0088CF`, the navy scale) and carry no watermark or licence terms.

| Shader | Image | Used for |
| --- | --- | --- |
| `core.frag` | `key-core` 2560x1440 | Homepage hero: sources streaming into the governed core, outcomes leaving it |
| `slabs.frag` | `key-slabs` 1600x1200 | Platform frame and Platform page: four governed layers |
| `bolt.frag` | `key-bolt` 2000x1125 | Closing call to action: the Solix bolt, activated |
| `bolt-stage.frag` | `key-bolt-stage` 2000x1125 | The same scene without the bolt: the CTA band stands the live liquid-metal bolt in its ring (`key-bolt` is its still fallback) |
| `lattice.frag` | `key-lattice` 2000x1125 | Enterprise AI frame: the neural globe behind the console |
| `sigil-stage.frag` | `sigil-stage-red`, `sigil-stage-blue` 1600x1000 | The stage every content sigil stands on: halo ring, HUD rings, pedestal, data floor. `DEFINES="TONE 0.0"` (Solix Red) or `"TONE 1.0"` (Solix Blue) |

To re-render one (after editing its shader):

```bash
npm i --no-save playwright-core        # once; uses the Chromium Playwright finds
node scripts/art/render.js core 2560 1440 1.5
```

`render.js <scene> <width> <height> [supersample]` draws the shader in bands
(so no single GPU call runs long), supersamples, and writes
`public/images/key-<scene>.jpg`, `.webp` (1264 wide), `-720.webp` and
`-full.webp` (full size).

For the stages: `DEFINES="TONE 1.0" node scripts/art/render.js sigil-stage 1600 1000 1.5 sigil-stage-blue`
(the `-full.webp` it also writes is not used for these).

## Glyph library

Every content icon (lucide) also exists as a liquid-metal still, for the
sigils that lead product, solution, service, resource and press cards
(`components/materials/Sigil.jsx`). `glyphs.js` turns each icon into a
stroked silhouette (`public/brand/glyphs/<name>.svg`), runs it through Paper's
liquid-metal shader - the technique of Paper's liquid-logo, from its
Apache-2.0 package - at a fixed moment of the flow, and writes transparent
384px stills in Solix Red and Solix Blue chrome
(`public/images/glyphs/<name>-red.webp`, `-blue.webp`), plus the bolt of the
mark (`solix-bolt-red.webp`). The list it rendered is
`src/components/materials/glyphManifest.js`; icons missing from it fall back
to a chrome-gradient icon.

```bash
node scripts/art/glyphs.js              # every icon in data/site.js plus the extras it lists
node scripts/art/glyphs.js Rocket Users # just these (added to the manifest)
```

The live sigils (`<Sigil live>`) feed the same mask to the same shader with
the same settings, so the still is an exact placeholder for the flowing one.
