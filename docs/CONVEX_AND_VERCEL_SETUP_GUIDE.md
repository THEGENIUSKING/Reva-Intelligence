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
| `GEMINI_API_KEY` | Server-side Gemini API key | Brief extraction, grounded benchmarking, article classification, and screening |
| `VANTA_API_BASE_URL` | Vanta Convex site URL | Live Vanta portfolio read API |
| `VANTA_API_KEY` | Read-scoped Vanta bearer key | Duplicate matching; no Idea Bank write-back |
| `RESEND_API_KEY` | Server-side Resend API key | Queue screening alerts to DIT |
| `RESEND_FROM_EMAIL` | Verified sender address | Required for DIT email delivery |
| `DIT_NOTIFICATION_EMAIL` | `digital-incubation@trium.ng` | Official DIT notification inbox |
| `REVA_ADMIN_EMAIL` | Reva administrator email | Approve or pause registered sources |

4. Click **Deploy**. Vercel will run `scripts/vercel-build.mjs`, deploy the Convex server functions, and bundle the client.

### Step 3.3: Deploying via Vercel CLI (Alternative)
```powershell
npm install -g vercel
vercel
vercel --prod
```

---

## 4. Local Demo Execution

Run the Vite app locally after configuring a Convex development deployment and an authorized Vanta identity:

```powershell
npm run dev
```

Visit `http://localhost:5173` to use the workspace. Benchmark research requires Gemini; scheduled or manual scouting requires active registered sources; DIT delivery additionally requires Resend sender and recipient configuration. Reports and counts come from configured services and saved Convex records, not demo fixtures.

---

## 5. Security & Governance Compliance

- **Provider configuration:** Benchmark research and scout classification require a server-side Gemini key; DIT delivery requires a verified Resend sender and configured DIT recipient.
- **Vanta duplicate checks:** Reva reads the live Vanta portfolio API. A missing or failed API check is reported as unavailable; it is never replaced with a sample portfolio or a fabricated unique verdict.
- **Source activation:** The configured Reva administrator controls source activation. The legacy Vanta approval field mirrors this state and is not an independent approval.
- **Read-only Vanta access:** Scout screening does not submit ideas to Vanta. Reva performs its own seven-criteria assessment, with Vanta used only for optional duplicate matching.
