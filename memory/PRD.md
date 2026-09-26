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
