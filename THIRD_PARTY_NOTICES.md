# Third-party notices

The website's live materials (iteration 8, see `memory/PRD.md`) build on
four open-source projects.

## liquid-glass-js (ported)

`frontend/src/components/materials/glassMap.js` ports the refraction model
(distance fields for rounded rectangles, circles and pills; edge, rim and
warp falloffs; corner boost; ripple) and `.liquid-glass` in
`frontend/src/index.css` follows its shading (tint gradient, rim light,
shadow).

    MIT License
    Copyright (c) 2025 Armagan Amcalar
    https://github.com/dashersw/liquid-glass-js

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.

## Paper Shaders (dependency) - liquid metal

`@paper-design/shaders-react` and `@paper-design/shaders`, Apache License
2.0, (c) Paper (https://github.com/paper-design/shaders). Used unmodified
for the liquid-metal Solix bolt, the live product and company sigils, and
(at build time, scripts/art/glyphs.js) the liquid-metal glyph stills in
public/images/glyphs. This is the permissively licensed package from the
authors of liquid-logo (liquid.paper.design). No code from the liquid-logo
repository itself (PolyForm Shield 1.0.0) is used.

## Lucide (dependency) - icons and glyph library

`lucide-react`, ISC, (c) Lucide Contributors (https://github.com/lucide-icons/lucide),
with parts derived from Feather (MIT, (c) Cole Bemis). The site's icons, and
the silhouette masks in public/brand/glyphs from which the liquid-metal
glyph stills are rendered, are drawn from Lucide's icon paths.

## ShaderGradient (dependency) - data terrains

`@shadergradient/react`, MIT, (c) ruucm and stone-skipper
(https://github.com/ruucm/shadergradient). Used unmodified for the
industry data terrains.

## React Three Fiber and three.js (dependencies) - platform explorer

`@react-three/fiber`, MIT, (c) Poimandres (https://github.com/pmndrs/react-three-fiber).
`three`, MIT, (c) three.js authors (https://github.com/mrdoob/three.js).
