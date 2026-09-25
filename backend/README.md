# Solix backend

FastAPI + MongoDB API for the Solix Technologies site (`../frontend`). Deployed
separately from the static frontend because GitHub Pages only serves static
files — it cannot run this service.

## What works without extra setup

Once deployed with a database and the four required secrets below, everything
works except two optional Emergent-platform integrations:

- **AI concierge chat** (`EMERGENT_LLM_KEY`) — without it, `/api/chat/stream`
  returns a clean 503 and the widget shows "temporarily unavailable" instead
  of crashing.
- **Outbound lead email alerts** (`EMERGENT_EMAIL_KEY`) — without it, leads
  still save to MongoDB and show up in the admin dashboard; only the email
  ping to your sales inbox is skipped.

Everything else — lead capture forms, the admin dashboard (`/admin`, login
`ADMIN_EMAIL`/`ADMIN_PASSWORD`), newsroom, press-release PDF downloads — works
fully with just MongoDB configured.

## Deploy (Render, free tier)

1. **Database**: create a free cluster at https://www.mongodb.com/cloud/atlas,
   add a database user, allow network access from anywhere (0.0.0.0/0), and
   copy the connection string.
2. In the [Render dashboard](https://dashboard.render.com), **New > Blueprint**,
   point it at this GitHub repo — `render.yaml` (in this folder) defines the
   service, with `rootDir: backend` so Render only builds this subfolder.
3. When prompted, fill in the secrets Render marks as required:
   - `MONGO_URL` — the Atlas connection string from step 1
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — your admin login for `/admin`
   - (`JWT_SECRET` is generated for you; `DB_NAME` and `CORS_ORIGINS` default
     to sensible values — edit `render.yaml` if you need different ones)
4. Deploy. Render gives you a URL like `https://solix-backend.onrender.com`.
5. In the **website** repo, add that URL as a repository variable named
   `BACKEND_URL` (Settings → Secrets and variables → Actions → Variables),
   then re-run the "Deploy frontend to GitHub Pages" workflow so the frontend
   build picks it up.

Any other Python host (Railway, Fly.io, a VM) works too — the `Dockerfile`
here builds and runs the same service; just set the same environment
variables (see `.env.example`).

## SEO / AEO / GEO analytics (Admin → SEO)

`seo.py` powers the admin's **SEO** section. Each data source is optional; until
one is connected the dashboard shows clearly labelled sample data for it.

| Source | Env var | What it feeds |
|---|---|---|
| Semrush Analytics API | `SEMRUSH_API_KEY` | Organic traffic and 12-month trend, keywords, pages, 10+ competitors per country, keyword gap, category demand, per-URL rankings in the CMS editor |
| OpenRouter (free models) | `OPENROUTER_API_KEY`, optional `OPENROUTER_MODELS`, `OPENROUTER_WEB` | GEO check: asks your buyer questions to an AI model and records which brands it names. Default model `nvidia/nemotron-3.5-lightning:free` (free; 50 requests/day across all free models). Comma-separate several models to average across assistants. `OPENROUTER_WEB=1` adds web search and citations, which OpenRouter bills even on free models |
| Claude with web search (alternative) | `ANTHROPIC_API_KEY` | Same check with live web search and citations; used only when `OPENROUTER_API_KEY` is not set |
| Google News, Hacker News, Reddit | none | Hot-topic radar (cached 6 hours) |

- **Semrush units:** a sync pulls one country (about 300 keywords, 100 pages,
  and up to 20 competitors with 12-month history). Snapshots are stored in
  MongoDB and reused until an admin presses **Sync**, so browsing the
  dashboard costs no units. Lower `limits` in the `seo` settings document to
  spend fewer. The Semrush *Traffic Analytics* (.Trends) API is not used; its
  numbers come from the Analytics API's organic estimates.
- **New site:** set **New site domain** in SEO settings once it's live. Each
  CMS page then shows rankings for its new URL, and migrated pages also show
  the old-site URL's rankings so redirects can protect them.
- Competitors, category keywords, topics and AI buyer questions are all
  editable in SEO → Settings (admins only).

## Local development

```bash
cp .env.example .env   # fill in MONGO_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
pip install -r requirements.txt
uvicorn server:app --reload
```
