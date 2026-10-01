# Reva Intelligence

Reva is Trium's venture intelligence workspace for researching initiatives and scouting public market signals. It uses Convex for authentication, persistence, scheduled scouting, and email delivery.

## Modules

- **Benchmarking:** submit a prompt or initiative document, review the extracted brief, and generate a sourced comparison report for Nigeria and relevant peer markets. Reports can be exported as PDF, Word, or PowerPoint.
- **Continuous Scout:** monitor Reva-approved public sources for technology and Nigerian policy signals. Reva collects articles, generates candidate ideas, checks candidates against Vanta's portfolio, assesses Nigerian viability, and grades candidates against Trium's seven Vanta criteria.
- **Vanta handoff:** eligible candidates are submitted to the Vanta Idea Bank. Candidates pass the automatic gate only when viability is Medium or High and their Reva-generated Vanta-criteria score is at least 66. Near-duplicates are held for review.
- **DIT notifications:** passing candidates are queued for email through Resend and recorded in Reva's email history.

AI-generated assessments are preliminary and should be reviewed by Trium staff. Reva's assessment is based on Vanta's criteria; Vanta does not provide an API endpoint for Reva to request a final Vanta grade.

## Local development

Requirements: Node.js 20 or newer and access to a Convex development deployment.

```bash
npm install
```

Copy `.env.example` to `.env.local` and set `VITE_CONVEX_URL` for the Reva development deployment. Set server-side integration values in the Reva Convex deployment, not in Vite variables or browser code.

```bash
npx convex dev
npm run dev
```

The app runs at `http://localhost:5173` by default. Use `npm run typecheck` and `npm run build` to check the frontend. Convex functions are typechecked with `npx tsc --noEmit -p convex/tsconfig.json`.

## Convex environment variables

Configure these on each Reva Convex deployment as appropriate:

- `VANTA_CONVEX_SITE_URL` and `VANTA_DEV_CONVEX_SITE_URL`: Vanta auth issuers trusted by Reva.
- `VANTA_API_BASE_URL`: Vanta Convex site URL used for the HTTP API.
- `VANTA_API_KEY`: Vanta bearer key with **read** scope for portfolio matching and **write** scope for Idea Bank submissions.
- `GEMINI_API_KEY` and optional `GEMINI_MODEL`: grounded article synthesis and preliminary assessment.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `DIT_NOTIFICATION_EMAIL`: email delivery. Resend may restrict recipients until sender/domain verification is complete.
- `REVA_ADMIN_EMAIL`: Reva source-approval administrator.

See `.env.example` for the frontend URL variables and placeholders. Never commit `.env.local`, API keys, or deployment secrets.

## Scout flow

1. The Reva administrator approves sources in the Source Registry.
2. Scheduled jobs or an authorized user starts a scout run.
3. Reva collects public articles and derives candidate initiatives with Gemini.
4. Reva compares candidates locally with the Vanta portfolio returned by its read API. Exact matches are dropped; near matches are held for review.
5. Gemini assesses Nigeria viability and scores the seven Vanta criteria. A passing candidate is submitted to Vanta's Idea Bank and an email is queued for DIT.

A Vanta read-scope failure prevents screening so a candidate cannot pass without duplicate checking. A missing Vanta write scope is reported on Idea Bank submission; email delivery is separately controlled by Resend configuration.
