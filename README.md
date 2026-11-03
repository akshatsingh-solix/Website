# Solix Technologies website

Everything a person sees: the public site, the `/admin` dashboard (leads,
Radar, outbound, SEO, content) and the SOLIXEmpower app under `/empower/`.
It is static and deploys to GitHub Pages.

The API those pages call is its own repository,
[solix-backend](https://github.com/akshatsingh-solix/solix-backend), and
deploys separately. **This repository contains no backend code**, and the
backend contains no website code. The two connect over HTTPS once both are
online, so each can be handed to a deployment team on its own.

| Folder | What it is |
| --- | --- |
| `frontend/` | The main site and the admin dashboard (React, Create React App + craco, Tailwind) |
| `empower/` | SOLIXEmpower (Vite), served at `/Website/empower/` |
| `.github/workflows/` | `deploy-pages.yml` builds and publishes both; `keep-backend-warm.yml` pings the API so its free tier does not sleep |

## How it connects to the backend

| Direction | Setting | Where it is set |
| --- | --- | --- |
| Site → API | `BACKEND_URL`, the API's public URL with no trailing slash (e.g. `https://solix-backend-mf5w.onrender.com`) | This repo: Settings → Secrets and variables → Actions → **Variables**. The build passes it to the apps as `REACT_APP_BACKEND_URL` and `VITE_API_URL`. |
| API accepts this site | `CORS_ORIGINS`, this site's origin (e.g. `https://akshatsingh-solix.github.io`) | The backend's environment |
| API links back here | `SITE_URL` (e.g. `https://akshatsingh-solix.github.io/Website`) | The backend's environment |
| Sol, the AI concierge, learns the site | Every deploy publishes `<site>/sol_knowledge.json` (from `frontend/scripts/sol-knowledge.js`); the backend's `SITE_KNOWLEDGE_URL` points at it | Generated here, read by the backend |

Without `BACKEND_URL` the site still builds and loads; forms, chat and the
admin stay disabled until it is set and the deploy workflow re-runs.

## Deploy

1. Deploy the backend first (see its README) and note its URL.
2. Here, set the `BACKEND_URL` repository variable to that URL.
3. Run **Deploy frontend to GitHub Pages** (Actions tab), or push to `main`.
4. On the backend, make sure `CORS_ORIGINS`, `SITE_URL` and
   `SITE_KNOWLEDGE_URL` point at this site.

## Local development

```bash
cd frontend
cp .env.example .env        # point REACT_APP_BACKEND_URL at a running backend
yarn install
yarn start                  # http://localhost:3000/Website
```

Run the backend locally from its own repository (`uvicorn server:app
--reload`, port 8000) and set `REACT_APP_BACKEND_URL=http://localhost:8000`.
After editing site content, run `node scripts/sol-knowledge.js` to refresh
`public/sol_knowledge.json`; the deploy does this too.
