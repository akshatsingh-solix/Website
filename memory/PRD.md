# Solix Technologies — Website Rebuild (PRD)

## Original problem statement
Rebuild the Solix Technologies website (https://www.solix.com/) from scratch as a highly interactive, appealing and authoritative site showcasing expertise in enterprise data management and AI. Establish brand imagery, typography, iconography and content flow.

## User choices (Jun 2026)
1. Full multi-page site
2. Full stack right away (React + FastAPI + MongoDB)
3. Fresh revamp mapped to Solix brand identity, stand out in the industry
4. Functional AI chatbot → **GPT-5.4-mini via Emergent LLM key** (user replied "go" = option a)
5. Form submissions saved to backend
- Icons: lucide-react; components: shadcn/ui

## Design system (see /app/design_guidelines.json)
- Theme: dark midnight (#020817) + ember orange primary (#F97316) + electric teal accent (#00D4FF)
- Fonts: Outfit (display), IBM Plex Sans (body), JetBrains Mono (labels)
- Patterns: glass sticky nav w/ mega menu, bento grids, grid-line backgrounds, grain, framer-motion reveals, marquee, count-up stats
- Brand images generated (in /app/frontend/public/images): hero-architecture, platform-cube, ai-neural, company-office

## Architecture
- Frontend: `/app/frontend/src`
  - `App.js` routes; `components/layout` (Navbar mega-menu, Footer w/ newsletter, Layout)
  - `components/home/*` sections; `components/shared/*` (Reveal, Section, PageHero, CTABand, CountUp, Logo, ResourceDialog, ScrollToTop)
  - `components/chat/ConciergeWidget.jsx` (SSE streaming chat, localStorage session, history restore, reset)
  - `components/forms/LeadForm.jsx` (react-hook-form + zod → POST /api/submissions)
  - `data/site.js` — all mock content (nav, products, solutions, industries, resources, jobs, partners, leadership, timeline)
  - `lib/api.js` — axios + fetch-stream helpers
- Backend: `/app/backend/server.py`, `knowledge.py` (concierge system prompt)
  - `GET /api/` health
  - `POST /api/submissions` (types: demo|contact|newsletter|career|partner|download), `GET /api/submissions?type=`
  - `POST /api/chat/stream` SSE (`data: {"delta"}` … `data: {"done": true}`), `GET/DELETE /api/chat/{session_id}`
  - Mongo collections: `submissions`, `chat_messages`
  - Env: MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY

## Pages
/ , /products, /products/:slug (8 products), /solutions (#anchors), /industries, /industries/:slug (8), /resources (?type filter + search + gated download dialog), /company, /careers (apply dialog), /partners (partner form), /contact (?type=demo|contact, ?interest=slug), 404

## Implemented (2026-06)
- Full multi-page frontend with distinctive dark brand system, mega-menu nav, mobile sheet nav, animated hero data-flow diagram, bento grids, industries hover explorer, testimonials carousel, resources filters, footer newsletter
- Backend submissions API + streaming AI concierge (GPT-5.4-mini) with Mongo-persisted multi-turn history
- Testing: iteration_1 — backend 100% (11/11 pytest), frontend 100% (all flows incl. chat streaming, forms → DB)

### Iteration 2 (2026-06) — all four next-action features
- **Lead Email Alerts**: Emergent-managed email (`emailer.py`, guardrail gate) sends an HTML alert for demo/contact/partner/career/download (never newsletter) to the configured recipient; delivery log in `notifications` collection. Recipient = `settings.alert_email` (set in admin) → fallback env `SALES_ALERT_EMAIL` (currently the test inbox `delivered@resend.dev` — user must set a real sales inbox in Admin → Alerts & settings).
- **Admin Leads Dashboard** (`/admin/login`, `/admin`, `/admin/settings`): single seeded admin (bcrypt + JWT bearer, 5-attempt lockout), stats, type filters, debounced search, pagination, lead detail dialog, delete, CSV export, alert recipient setting + delivery log. Backend: `auth.py`, `admin.py`.
- **Chat Demo Booking**: `create_demo_request` tool in `chat.py` (LlmChat.with_tools + stream loop); saves `type=demo, source=chat`, emits SSE `demo_booked`, frontend renders BookingCard; assistant markdown (bold/bullets) rendered.
- **Insights Article Pages** (`/resources/:slug`): 10 long-form articles in `data/articles.js` (block renderer `ArticleBody.jsx`), TOC, byline, share, related reads; gated ones unlock via download LeadForm (sessionStorage).
- Testing: iteration_2 — backend 17/17, frontend 100%.

### Iteration 3 (2026-06)
- **Newsroom** (`/newsroom`, in Company nav + footer): featured release, press releases with category filters, coverage highlights, media kit (SVG logos + brand guidelines in `/public/brand/`, brand colors, copyable boilerplate), press contact card. Data in `data/newsroom.js`. Self-tested via screenshot (filters, asset download, no console errors).
- Sales alert inbox: user chose to skip for now — still the test inbox `delivered@resend.dev`; set via Admin → Alerts & settings.

### Iteration 4 (2026-06)
- **Lead Status Tracking**: `PATCH /api/admin/submissions/{id}` {status: new|contacted|qualified, notes}; status filter on list/export, `by_status` in stats, status+notes columns in CSV. Admin dialog has status radio + private notes + save; status badge column and status dropdown filter; "Awaiting contact"/"Qualified" stat cards.
- **Press Release Pages** (`/newsroom/:id`): 7 releases with full bodies (`data/newsroom.js`), hero image, quotes, boilerplate, media contact, share, related releases; **Download PDF** via `POST /api/press/pdf` (reportlab, `press.py`). Newsroom list + featured card link to detail pages.
- **Sales inbox reminder**: amber banner on admin Leads page while alert recipient is still `delivered@resend.dev` (user has skipped providing a real address twice).
- Self-tested via screenshots/curl (PDF download, status save, filter, banner). No testing_agent run this iteration.

### Iteration 5 (2026-09) — "Signal" motion redesign
Design language: every page opens in a navy data field and resolves into the light editorial canvas as you scroll (noise into signal). Brand tokens unchanged (Solix Red #EE2424, Solix Blue #0088CF, navy scale, Outfit / IBM Plex Sans / JetBrains Mono); blue still never fills a button.
- **SignalField** (`components/motion/signal/`): raw-WebGL particle engine (no 3D library), code-split, draws only on screen. Formations: flow (streams funnelling through a core), cloud, sphere, globe, bolt (the Solix mark), stack, cube, ring, helix, grid, `text:<word>`. Pointer repulsion + camera parallax, click shockwave. Reduced motion = one still frame; no WebGL = CSS glow.
- **Motion core** (`components/motion/`): Lenis smooth scroll (off for touch + reduced motion, pauses under Radix scroll locks), route curtain (Layout swaps routes under it; `FrozenOutlet` keeps the leaving page), first-session intro ident (skipped for reduced motion, slow networks, automation; `?intro=1` forces it), scroll progress bar, SplitWords kinetic headlines, ScrambleText decode labels, Odometer counters, VelocityMarquee, delegated pointer spotlight (`.spot` class on any card).
- **Chrome**: navbar switches to light-on-navy over dark surfaces (`layout/navTone.js`, `useDarkSurface(ref)`; dark `Section`s register automatically), tucks away on scroll down, sliding hover pill, staggered mega menus, kinetic mobile menu; footer with interactive outline wordmark; CTA band opens with a clip reveal, beam border and pointer glow.
- **Home**: pinned 3-beat hero (streams -> governed core -> bolt) with depth-parallax product cards, light sheet rising over it; odometer stats; scroll-drawn growth chart with scrubber (replaced recharts); pinned horizontal lifecycle (vertical timeline under 1024px); expanding outcome panels (cards under 1024px); governed-AI console demo (typed question, policy checks, masked streaming answer); industries wipe transitions; swipeable testimonials with countdown ring.
- **Inner pages**: PageHero is a navy slab with a per-section formation (platform cube, products stack, solutions helix, industries globe, resources/newsroom grid, partners/services ring, company bolt); Contact and 404 are full navy stages; architecture stack assembles on scroll; company timeline draws; number rings fill.
- i18n: all new copy translated (es/fr/de). Auth pages (solix.com/ai layout) and the SOLIXEmpower site are unchanged.

### Iteration 6 (2026-09) — frames, rendered key visuals, command palette
- **Key visuals rendered from shaders** (`frontend/scripts/art`, see its README): governed glass core (hero), platform layer stack, Solix bolt monolith (CTA), neural globe (Enterprise AI). Brand-exact colours, no stock or AI-service licences. `Picture` serves their full-size WebP too.
- **Hero**: live nebula shader + the core render (dollies in with the beats, pointer parallax, screen-blended) + particles anchored on the core with light trails (`trails` engine option) + HUD frame with live counters + bottom story scrubber.
- **Homepage consolidated from 13 sections to 7 frames**: 01 The case (chart with facts, counters, sector ribbon in one bento), 02 The platform (six eras pinned over the layer stack; eras light their layer and platform move), 03 What you get (outcomes / products toggle), 04 Enterprise AI (console over the neural globe), 05 Industries & customers (customer voice inside the industry panel), 06 Insights, CTA. Chapter rail (scrollspy) on wide screens.
- **Command palette** (`components/search`): Cmd/Ctrl+K or "/" searches pages, products, solutions, industries, resources and quick actions; code-split.
- Inner pages: nebula behind every PageHero, HUD corners on framed visuals; Platform page gets the live flow explainer and the layer-stack render.

### Iteration 7 (2026-09) — performance and short-screen layout
Feedback: choppy frames, text overlapping on a laptop (1536x730-class viewport at 125% scaling), scrolling should follow the touchpad with no lag.
- **Native scroll**: Lenis removed (it eased every wheel/touchpad delta over ~1s). `lib/scroll.js` keeps `scrollWindowTo` for in-page jumps (native smooth scroll, instant for reduced motion). No `useSpring` on any scroll-linked value (hero beats, scrubber, progress bar, growth chart, platform bar, company timeline, architecture stack).
- **Compositing budget** (rules for new work): one WebGL canvas per screen (the nebula shader is gone); no `mix-blend-mode` and no `backdrop-filter` over anything that animates (hero cards, AI console, contact form, dark navbar); no looping animation that repaints (gradient text is static, `beam-border` only runs on hover/focus, no SMIL network SVG); no `filter` left on revealed blocks (`Reveal` sets one only with `blur`); scroll reveals use transform/opacity only (CTA band scales instead of animating `clip-path`). Grain is plain alpha.
- **SignalField**: DPR capped at 1.25 on desktop, no trails in the hero, adaptive quality (sustained long frames step resolution, then particle count, down), formation follows the scroll within ~0.1s.
- **Short viewports**: Tailwind `short:` variant (max-height 820px, plugin variant so `max-sm:` keeps working). Hero copy sits in the band between header and scrubber (`.hero-beat`, `align-items: safe center`), headlines sized by `min(vw, svh)`, trust row/HUD/cost chip hide when short; pinned platform frame sizes its 4:3 render by viewport height; PageHero headline height-aware. Event promo opens as the pill on short screens; the chat launcher is icon-only on phones.
- Measured (headless Chromium, 1530x700): wheel-to-scroll 977ms -> 43ms; main-thread time over ~9 screens of scrolling 10.4s -> 2.1s (WebGL off), style recalcs 5.4k -> 0.6k.

### Iteration 8 (2026-09) - live materials: liquid glass, liquid metal, data terrains, 3D platform explorer
Built on four open-source projects, each used where it earns its place inside the iteration 7 budget (see `THIRD_PARTY_NOTICES.md`).
- **Budget, enforced** (`lib/liveCanvas.js`, `hooks/use-live-canvas.js`): every live WebGL canvas (SignalField, liquid metal, terrains, explorer) joins one arbiter. Only the canvas covering most of the viewport gets frames; the rest hold their last frame; a hidden tab gets none. Elements carry `data-live-canvas="running|held"` for tests. Graphics tiers: live, still (reduced motion: one frame), static (no WebGL2, Save-Data, 2G, <=2 GB memory: posters, and the 3D libraries never load).
- **Liquid glass** (after liquid-glass-js): `.liquid-glass` (+ `-dark`, `-light`, `-auto`, `-red`) is its shading as static CSS layers, safe over live canvases. `<LiquidGlass lens>` adds real refraction: its distance-field and falloff math, computed once per element size as an SVG displacement map for `backdrop-filter` (Chromium; frosted blur elsewhere). Use the lens only over still images. On: primary buttons (lit rim), the new `glass` button variant, hero product cards, the Contact form and tabs, Ask Sol, the command palette, the PageHero window bar, and regulation chips over industry photos.
- **Liquid metal** (liquid-logo's technique, via Paper's Apache-2.0 `@paper-design/shaders-react`): the CTA band ending every page stands the Solix bolt in liquid metal inside the `key-bolt-stage` render (the key-bolt scene without its bolt), with a silhouette placeholder while it compiles and `key-bolt` as the static fallback.
- **Data terrains** (`@shadergradient/react`): each industry has a signature (`components/materials/terrainSignatures.js`) whose motion follows its data (fast ripples for trades, CDRs and POS; slow swells for grid assets, clinical and public records) inside the brand palette. Industry pages open on "The shape of <industry> data." with glass panels (regulations, retention horizon marked indicative, starting products from `data/industryContext.js`). The Industries page has a signature explorer. Usage rules found by reading the library: pointer events off (its camera controls cancel the wheel), grain off, 3d light (env fetches three HDRs from a third-party host), a fixed plane type, mount once (no lazyLoad), and a FrameGate that stops R3F's loop when not granted.
- **Platform explorer** (React Three Fiber): the four layers in 3D (glass slabs, data rising blue to red, red-chrome bolt extruded from the mark, RoomEnvironment reflections) with every product on its layer (`data/platformLayers.js`). Platform page: industry lens (lights starting layers and products, data flow at the industry's pace). Industry pages: lens fixed; "Recommended products" now uses that industry's starting products. Product pages: "Where <product> runs on the platform" with the product marked. Demand rendering when not granted; all content is keyboard-operable DOM.
- Bundles (gzip): main +2 KB. Lazy chunks, fetched only when their section nears the viewport: three + R3F 230 KB (shared by terrains and explorer), shadergradient 49 KB, Paper Shaders 14 KB; the new sections themselves a few KB each.
- Verified (headless Chromium): scrolling 10 page types top to bottom in 450px steps never has more than one canvas running; no page errors; no horizontal overflow at 390px; reduced motion renders still frames; Spanish renders fully translated.
- i18n: all 75 new strings translated (es/fr/de).

### Iteration 9 (2026-10) - one visual system for every piece of content
Feedback: the new materials lived only in the navy bands; the light sections (product catalogue, solutions, services, values, careers, partners, resources, press) were still plain white cards with small tinted icons, and several products shared one picture.
- **Glyph library** (`scripts/art/glyphs.js`, see its README): 63 content icons as liquid-metal stills in Solix Red and Solix Blue chrome, rendered by Paper's liquid-metal shader (liquid-logo's technique) from stroked silhouettes, plus the bolt of the mark. Masks in `public/brand/glyphs`, stills in `public/images/glyphs` (2.2 MB, loaded lazily per card), list in `components/materials/glyphManifest.js`.
- **Sigil stage** (`scripts/art/sigil-stage.frag`): halo ring, HUD rings, pedestal and data floor, red and blue.
- **Components**: `Sigil` (stage + glyph + floor reflection; on hover the stage eases in, the glyph rises and a light sweep crosses the chrome; `float` for a section's one large sigil; `live` swaps in the flowing shader, inside the live-canvas budget), `GlyphImage` (the glyph alone, for dark panels), `MetalIcon` (SVG chrome gradient on any icon, lit set inside `.dark`), `GlyphTile` (glass tile + chrome icon). All motion is transform/opacity.
- **Applied everywhere**: every product card (bento, catalogue, related, industry picks, finder results) leads with its own sigil, the bento's flagship flowing live; solution cards and outcome panels; services overview and sections; platform sections; partner tiers; resource cards and article covers (type glyph in the chrome of the product it covers); press releases without a photo; industry without a photo (Pharma); Resources, Services, press and Pharma heroes; company mission (the bolt, live); product "How it works" (the product's glyph, live). Glass chrome tiles replace flat icon tiles in the mega menus, command palette, values, careers, perks, contact, AI pillars, approach, account, lead forms and explorers.
- **3D explorer** now has an outcome lens (Solutions page: "Fifteen programs. The same four layers.") and replaces the 2D architecture stack on the Products page (it listed 8 of 26 products).
- **Budget fixes**: backdrop blurs removed over animating content (newsroom/press/article hero cards now static liquid glass; family-visual stops and tour caption; command palette and overlay; nav search pill and menu button; chapter rail).
- Verified (headless Chromium): every page screenshotted at 1440 and 390; scrolling 9 page types never has more than one canvas running; no horizontal overflow at 390px; no page errors. i18n: 9 new strings translated (es/fr/de); `PlatformExplorer` registered as a prop component in the extractor.

## Notes / mock data
- Customer logos, testimonials, leadership (except founder/CEO), jobs, timeline years, stats are illustrative MOCK content in `data/site.js` — replace with real content.
- Resource "Continue reading" is a preview (no real article pages yet).

## Backlog
- P1: Set a real sales inbox for alerts (Admin → Alerts & settings) — currently test inbox
- P1: Lead status workflow in admin (new / contacted / qualified), notes per lead
- P1: Newsroom/press page; CMS or Markdown-backed articles with admin editing
- P2: Search across site, locale switcher, cookie consent banner
- P2: Move content from `data/site.js` to backend collections
- P2: FastAPI lifespan instead of on_event; env-driven chat model name

## Env (backend/.env)
MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY, EMERGENT_EMAIL_KEY, EMAIL_FROM_NAME, SALES_ALERT_EMAIL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
