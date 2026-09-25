# Solix backend

FastAPI + MongoDB API for the Solix Technologies site (`../frontend`). Deployed
separately from the static frontend because GitHub Pages only serves static
files — it cannot run this service.

## What works without extra setup

Once deployed with a database and the four required secrets below, everything
works except two optional Emergent-platform integrations:

- **AI concierge chat (Sol)** — needs one free AI key (see "Sol" below).
  Without one, `/api/chat/stream` returns a clean 503 and the widget answers
  with its built-in scripted concierge instead.
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

## Sol, the AI concierge

Sol answers visitors in the site's chat widget. It runs on free-tier models
and is built like a production assistant:

- **Grounded answers (RAG).** `sol_knowledge.json` holds every product,
  solution, industry, article, press release, job, partner programme and
  service page on the site, split into ~150 sections with their URLs. Each
  question is matched against it with BM25 (in-process keyword search: no
  embedding API or vector database to pay for) and the best sections go into
  the prompt, so Sol quotes the site and links the page it drew on.
  Regenerate after changing site content (the deploy workflow warns when it's
  stale): `cd frontend && node scripts/sol-knowledge.js`
- **Tools.** `search_site` (Sol looks things up itself when the first
  retrieval isn't enough), `create_demo_request` and `request_expert_contact`
  (both save to Leads with `source: chat` and trigger the sales alert email).
- **Context.** Sol knows the page the visitor is on, the last 16 messages of
  the conversation, and replies in the site language they chose (EN/ES/FR/DE).
- **Failover.** Providers and models are tried in order; one that is rate
  limited or down is skipped (and rested for a minute) so free-tier limits
  never reach the visitor. If all fail, the widget falls back to its
  built-in scripted concierge.
- **Guardrails.** Prompt-injection resistant system prompt, no invented
  pricing or customers, per-session (20 per 5 min) and per-IP (60 per hour)
  rate limits.
- **Admin → Sol chats.** Every conversation, the page it started on, the
  model that answered, and whether it became a lead.

Set at least one key on the backend (all free, no card needed):

| Provider | Env var | Get a key | Default models (`SOL_*_MODELS` to change) |
|---|---|---|---|
| Google Gemini | `GEMINI_API_KEY` | https://aistudio.google.com/apikey | `gemini-2.5-flash,gemini-2.5-flash-lite` |
| Groq | `GROQ_API_KEY` | https://console.groq.com/keys | `openai/gpt-oss-120b,openai/gpt-oss-20b` |
| Mistral (Experiment plan) | `MISTRAL_API_KEY` | https://console.mistral.ai | `mistral-small-latest` |
| OpenRouter | `OPENROUTER_API_KEY` (shared with SEO) | https://openrouter.ai/keys | `SOL_OPENROUTER_MODELS`, else `OPENROUTER_MODELS` |
| Any OpenAI-compatible server | `SOL_CUSTOM_BASE_URL`, `SOL_CUSTOM_API_KEY`, `SOL_CUSTOM_MODELS` | e.g. a model you host, Together, Cerebras | — |

`SOL_PROVIDER_ORDER` (default `gemini,groq,mistral,openrouter,custom`) sets
the order. Setting two or three keys is recommended: Gemini for quality,
Groq for speed, OpenRouter as the last resort. `GET /api/chat/status` shows
which providers are active. Free tiers may use prompts to improve their
models, so move to a paid key (same variables) before handling sensitive
customer data.

## SEO / AEO / GEO analytics (Admin → SEO)

`seo.py` powers the admin's **SEO** section. Each data source is optional; until
one is connected the dashboard shows clearly labelled sample data for it.

| Source | Env var | What it feeds |
|---|---|---|
| Semrush Analytics API | `SEMRUSH_API_KEY` | Organic traffic and 12-month trend, keywords, pages, 10+ competitors per country, keyword gap, category demand, per-URL rankings in the CMS editor |
| OpenRouter (free models) | `OPENROUTER_API_KEY`, optional `OPENROUTER_MODELS`, `OPENROUTER_WEB` | GEO check: asks your buyer questions to an AI model and records which brands it names. Default model `nvidia/nemotron-3.5-lightning:free` (free; 50 requests/day across all free models). Comma-separate several models to average across assistants. `OPENROUTER_WEB=1` adds web search and citations, which OpenRouter bills even on free models |
| Claude with web search (alternative) | `ANTHROPIC_API_KEY` | Same check with live web search and citations; used only when `OPENROUTER_API_KEY` is not set |
| Google News, Hacker News, Reddit | none | Hot-topic radar (cached 6 hours) |
| NewsMCP | `NEWSMCP_API_KEY` (free key; keyless calls are blocked from cloud servers) | Adds news clustered into stories with independent-newsroom counts and named companies, so topics flag competitors in the news |
| Parallel Search + Extract | `PARALLEL_API_KEY` ($5 free credits a month) | Topic **Deep dive**: finds expert and analyst coverage and reads the full articles, including JavaScript-heavy pages; the AI model then summarises expert views, quoted numbers, debates, buyer questions, competitor moves and content angles, each cited. Without the key, deep dives read the radar's own articles with a plain fetch. Cached 24 hours |

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
