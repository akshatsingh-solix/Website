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
| `lattice.frag` | `key-lattice` 2000x1125 | Enterprise AI frame: the neural globe behind the console |

To re-render one (after editing its shader):

```bash
npm i --no-save playwright-core        # once; uses the Chromium Playwright finds
node scripts/art/render.js core 2560 1440 1.5
```

`render.js <scene> <width> <height> [supersample]` draws the shader in bands
(so no single GPU call runs long), supersamples, and writes
`public/images/key-<scene>.jpg`, `.webp` (1264 wide), `-720.webp` and
`-full.webp` (full size).
