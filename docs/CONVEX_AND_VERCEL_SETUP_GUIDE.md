# Project Reva — Convex Database & Vercel Deployment Guide

This guide provides complete, step-by-step instructions to initialize and run **Convex** for development and production databases, and deploy the entire **Project Reva Platform** to **Vercel**.

---

## 1. Architectural Architecture Overview

```
                               ┌──────────────────────────────────────────────┐
                               │           Vercel Production Edge             │
                               │  (React 18 + Vite SPA · Port 5173 / HTTPS)   │
                               └──────────────────────┬───────────────────────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       │                                                             │
                       ▼                                                             ▼
       ┌───────────────────────────────┐                             ┌───────────────────────────────┐
       │     Convex Cloud Database     │                             │      External Integrations    │
       │   (Dev & Prod Deployment)     │                             │                               │
       │                               │                             │ • Vanta API: Read-Only        │
       │ • benchmarks                  │                             │ • DIT Mail: digital-incubation│
       │ • initiatives                 │                             │ • LLMs: Gemini 2.0 / Groq     │
       │ • sourceRegistry              │                             │ • Crawlers: 50 Sites + Gov    │
       │ • emailLogs                   │                             │ • Embeddings: 100% On-Device  │
       │ • scrapedItems                │                             └───────────────────────────────┘
       └───────────────────────────────┘
```

- **Database:** Dedicated Convex deployment housing all Reva operational data (`convex/schema.ts`).
- **Frontend / Hosting:** Vercel edge hosting running the unified Reva UI.
- **Zero-Cost Constraint:** Strict zero software cost operating on free-tier APIs and open-source models.
- **Vanta Integration:** Read-only connection to Vanta's portfolio (`GET /api/v1/portfolio`) ensuring zero data corruption or unapproved modifications.

---

## 2. Convex Setup (Development & Production)

### Step 2.1: Local Development Initialization
To link your local environment to a Convex cloud instance:

1. Open PowerShell or Terminal in the Reva project directory:
   ```powershell
   cd "c:\Users\OlanrewajuTaiwo\OneDrive - Trium Limited\Desktop\Reva Project"
   ```

2. Run the Convex development CLI:
   ```powershell
   npx convex dev
   ```
   - The CLI will open a browser window to authenticate with your GitHub or Google account.
   - Select or create a project name (e.g., `reva-trium-intelligence`).
   - Convex will automatically create `.env.local` containing:
     ```env
     CONVEX_DEPLOYMENT=dev:...
     VITE_CONVEX_URL=https://...convex.cloud
     ```
   - It will automatically deploy the schema in `convex/schema.ts` and all backend functions in `convex/*.ts`.

### Step 2.2: Seeding Curated Sources into Convex
Once your Convex deployment is active, run the seed mutation to populate the 50 curated emerging market tech publications and Nigerian regulatory agencies:

```powershell
npx convex run seed:seedAllSources
```

This immediately registers:
- **35 Curated Emerging Market Tech Trackers** (East Africa, MENA, Southeast Asia, Latin America, Pan-African ex-NG).
- **15 Global Fallbacks** (Crunchbase, TechCrunch, Y Combinator, PitchBook, etc.).
- **16 Nigerian Regulatory Agencies & Gazettes** (CBN, SEC, NCC, NITDA, FCCPC, FIRS, NERC, NAICOM, Federal Gazettes).

---

## 3. Vercel Deployment Setup

Reva is pre-configured with `vercel.json` and a custom deployment build pipeline in `scripts/vercel-build.mjs`.

### Step 3.1: Obtain Convex Production Deploy Key
1. Go to your Convex Dashboard: [https://dashboard.convex.dev](https://dashboard.convex.dev)
2. Select your `reva-trium-intelligence` project.
3. Navigate to **Settings** &rarr; **Deploy Keys**.
4. Generate a new Deploy Key and copy it (starts with `prod:...`).

### Step 3.2: Deploying to Vercel via Vercel Dashboard (Recommended)
1. Push the repository to GitHub:
   ```powershell
   git add .
   git commit -m "feat: complete Convex schema, backend functions, and React dashboard"
   git push origin master
   ```
2. In the [Vercel Dashboard](https://vercel.com):
   - Click **Add New** &rarr; **Project**.
   - Import your `Reva Project` repository.
   - Framework Preset: **Vite**.
   - Build Command: `npm run build:vercel` (pre-configured via `vercel.json`).
   - Output Directory: `dist`.

3. Under **Environment Variables**, add the following:

| Variable Name | Value | Purpose |
|---|---|---|
| `CONVEX_DEPLOY_KEY` | `prod:...` | Deploys Convex backend on production release |
| `VITE_CONVEX_URL` | `https://<prod-deployment>.convex.cloud` | Connects React frontend to Convex |
| `GEMINI_API_KEY` | Your Google AI Studio API Key (Free) | Zero-cost LLM synthesis |
| `GROQ_API_KEY` | Your Groq API Key (Free) | Fallback high-speed reasoning |
| `TAVILY_API_KEY` | Your Tavily Key (Free 1k/mo) | Emerging markets live search |
| `RESEND_API_KEY` | Your Resend Key (Free 3k/mo) | Auto-email dispatch to DIT |
| `DIT_NOTIFICATION_EMAIL` | `digital-incubation@trium.ng` | Official DIT notification inbox |

4. Click **Deploy**. Vercel will run `scripts/vercel-build.mjs`, deploy the Convex server functions, and bundle the client.

### Step 3.3: Deploying via Vercel CLI (Alternative)
```powershell
npm install -g vercel
vercel
vercel --prod
```

---

## 4. Local Demo Execution

You can run the full interactive platform locally right now without waiting for cloud credentials:

```powershell
npm run dev
```

Visit `http://localhost:5173` to explore:
1. **Flow 1 (Global Benchmarking):** Input concepts, scan 3-tier markets, review "Apply vs Avoid in Nigeria" blueprint, and download instant publication-quality PDF, Word, and PowerPoint reports.
2. **Flow 2a (Nigerian Viability & Vanta):** Deduplicate against Vanta with nuance retention, test 6-dimension Nigeria market viability, and review auto-calibrated Trium 7-criteria passing scorecards (&ge;66 pts).
3. **Flow 2b (Emerging Tech Scout):** Simulate daily crawl of 50 emerging & global sites and auto-dispatch passing ideas to DIT.
4. **Flow 2c (Nigerian Policy Scout):** Monitor CBN, SEC, NERC, FIRS, and NITDA circulars, extrapolating high-margin venture models.
5. **Curated Source Registry:** Manage the 50 sites and exercise Dual Admin Sign-Off governance (Reva Admin & Vanta Admin).
6. **DIT Notification Audit:** Inspect verified email dispatches and preview HTML emails sent to `digital-incubation@trium.ng`.

---

## 5. Security & Governance Compliance

- **Zero Software Cost:** Reva utilizes only free-tier APIs and local models.
- **Zero Vanta Data Exposure:** Deduplication against Vanta Idea Bank runs 100% on-device via local sentence embeddings. No internal portfolio ideas are ever transmitted to public AI training endpoints.
- **Dual Sign-Off Requirement:** No source can be activated into the daily crawling schedule without explicit digital sign-off from both a Reva Platform Admin and a Vanta Studio Admin.
- **Read-Only Vanta Access:** Reva reads from Vanta via `GET /api/v1/portfolio` or local cache; submission write-backs are staged for review and do not execute destructive writes.
