# Reva Intelligence

Reva is Trium's venture intelligence workspace for benchmarking initiatives and scouting public market signals. Convex provides authentication, persistence, scheduled scout runs, and email audit history.

## Modules

- **Benchmarking:** accepts text and PDF, DOCX, PPTX, TXT, or Markdown briefs. It has separate precedent-benchmark and gap-driven idea flows. Gemini Search-cited peers and scores are saved only after a successful research response; the report labels source claims for verification. PDF bytes are sent to Gemini for document extraction, while supported office/text formats are extracted in the browser.
- **Continuous Scout:** scheduled jobs run the emerging-market and Nigerian policy scouts daily; an authorized operator can run both from one button. New articles receive Gemini summaries, sector and industry labels, and any grounded opportunity is screened in Reva.
- **Reva screening:** scout opportunities are scored against the seven Trium criteria. A candidate passes at 66/100 or above and Medium/High Nigeria viability. Vanta is not the screening engine.
- **Vanta duplicate checks:** Reva reads the configured Vanta portfolio and reports matching names, descriptions, counts, and similarity. If Vanta is unavailable, the result is explicitly unverified; screening can still proceed and the duplicate state is recorded as not checked. Reva does not write ideas back to Vanta.
- **DIT notifications:** passing scout candidates are queued through Resend when the DIT mailbox and sender are configured. Delivery state is recorded in the email log; a passing score alone is not proof of delivery.
- **Source Registry:** sources can be added manually or imported from Excel/CSV. The stored categories are Emerging Market, Nigerian Regulatory, Legal and Policy Environment, and Global Fallback. Reva admin approval controls activation; the legacy Vanta approval field mirrors that state.
- **Automations:** platform-managed scout and screening pipelines are listed with their triggers and actions. Custom schedules can run both scouts, the emerging-market scout, or the Nigerian policy scout from hourly to monthly intervals; schedules can be paused and resumed.

AI-generated research and assessments are preliminary. Review source citations, assumptions, and scores before investment or operating decisions.

## Local development

Requirements: Node.js 20 or newer and access to a Convex development deployment.

```bash
npm install
npx convex dev
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local`. Configure Gemini, Vanta, Resend, DIT, and source-admin values server-side in the Reva Convex deployment, not in Vite variables or browser code. The Vite app runs at `http://localhost:5173` by default.

Use `npm run typecheck` and `npm run build` for the frontend/Convex TypeScript check and production build. Never commit `.env.local`, API keys, or deployment secrets.

## Convex environment variables

- `VANTA_CONVEX_SITE_URL` and `VANTA_DEV_CONVEX_SITE_URL`: Vanta auth issuers trusted by Reva.
- `VANTA_API_BASE_URL` and read-scoped `VANTA_API_KEY`: live Vanta portfolio duplicate checks.
- `GEMINI_API_KEY` and optional `GEMINI_MODEL`: document extraction, cited benchmark research, scout classification, and Reva screening.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `DIT_NOTIFICATION_EMAIL`: screening-alert delivery.
- `REVA_ADMIN_EMAIL`: source activation administrator.

See `.env.example` for the frontend URL variables and server-side configuration placeholders.

## Scout flow

1. The configured Reva administrator registers and activates sources.
2. Scheduled daily runs or an authorized operator crawl the active sources.
3. Gemini classifies each newly captured article and derives opportunity candidates only when supported by the article.
4. Reva scores candidates using its seven criteria; Vanta duplicate matching runs separately when configured.
5. Passing candidates are queued to DIT when email configuration is complete; the email log records delivery outcomes.
