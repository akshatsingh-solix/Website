# MarkHub logo files

MarkHub is the marketing operating console. Solix is its first client. In the product header the MarkHub logo comes first, followed by a thin divider and then the client's logo on the right.

- **Symbol:** "Shared Stem". An M and an H share one upright, and that shared upright is the only part in the accent color: the hub where marketing meets every connected system.
- **Name:** "MarkHub", in [Barlow Semi Condensed](https://fonts.google.com/specimen/Barlow+Semi+Condensed) SemiBold (600).
- **Text:** [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3).
- **Palette:** Pilot Light.

| Role | Color |
|---|---|
| Ink (symbol and name on light) | `#131416` Press Ink |
| Paper (symbol and name on dark) | `#F6F5F2` Gallery Paper |
| Accent on light | `#476E00` Deep Signal |
| Accent on dark | `#BEEE33` Pilot Lime |
| Support | `#5B5E62` Graphite |

## Files

| File | Use |
|---|---|
| `markhub-symbol-on-light.svg` / `.png` | Symbol alone on light backgrounds (PNG 2048×2048, transparent) |
| `markhub-symbol-on-dark.svg` / `.png` | Symbol alone on dark backgrounds |
| `markhub-logo-on-light.svg` / `.png` | Symbol + name (PNG 400 px tall) |
| `markhub-logo-on-dark.svg` / `.png` | The same, for dark backgrounds |
| `markhub-x-solix-on-light.svg` / `.png` | MarkHub \| Solix co-brand lockup |
| `markhub-x-solix-on-dark.svg` / `.png` | The same, for dark backgrounds such as the admin header |
| `favicon.svg` | Tab icon that follows the browser's light/dark theme (used by the admin) |
| `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png` | Opaque icons for older browsers and phone home screens |

**SVG or PNG?** In the SVGs, the name is live, editable text, so it only renders correctly where Barlow Semi Condensed is installed or loaded as a web font. The same goes for the Solix wordmark, which needs Outfit. The PNGs have the fonts baked in. In the app, the admin draws the symbol inline (`src/components/admin/MarkHubBrand.jsx`) and loads only the "MarkHub" letters of the font.

## Rules

- **Clear space:** at least two stem widths on every side. One stem is 14/96 of the symbol's height.
- **Minimum size:** symbol 16 px, logo 96 px wide, co-brand lockup 160 px wide.
- **Co-brand lockup:** MarkHub always comes first, on the left. The divider uses the MarkHub ink at 25% opacity. Size the client logo so its own symbol is about as tall as the MarkHub symbol.
- **Accent:**
  - Only the shared stem takes the accent color, and it is never red.
  - Pilot Lime is for dark backgrounds only; on light backgrounds use Deep Signal.
- **Don't:** stretch, rotate, outline or add effects. Don't retype the symbol in a font, because its M and H share geometry no font has.

Every symbol file is a recolor of one master drawing, and its shapes were checked against that master.
