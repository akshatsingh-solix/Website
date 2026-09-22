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

## Notes / mock data
- Customer logos, testimonials, leadership (except founder/CEO), jobs, timeline years, stats are illustrative MOCK content in `data/site.js` — replace with real content.
- Resource "Continue reading" is a preview (no real article pages yet).

## Backlog
- P1: Admin view for submissions (table + CSV export), email notifications (Resend) on new leads
- P1: Real resource/article pages (CMS or Markdown), newsroom/press page
- P2: Search across site, locale switcher, cookie consent banner
- P2: Move content from `data/site.js` to backend collections with admin editing
- P2: Chat: lead capture inside chat (email handoff), "Book a demo" tool-call
- P2: FastAPI lifespan instead of on_event; env-driven chat model name
