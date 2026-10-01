# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Trium Idea Intelligence Platform (Project Reva)
**Document Version:** 1.1.0 (Fully Reconciled with Uploaded PRD & Open Questions)  
**Target Organization:** Trium Limited (Venture Studio)  
**Product Owner:** Olanrewaju Taiwo, Product Innovation  
**Integrated Platform:** Vanta Venture Portfolio & Idea Bank  
**Author:** Antigravity AI Engineering & Architecture Team  
**Date:** September 2026  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Strategic Context

### 1.1 Context & Venture Studio Mission
Trium Limited is an African venture builder operating on a disciplined, staged venture-creation model governed by the **EVO stage-gate lifecycle (POL-EVO-001)**:
$$\text{Sourcing (Gate 0)} \longrightarrow \text{Ideation (Gate 1)} \longrightarrow \text{Pretotype (Gate 2)} \longrightarrow \text{Prototype (Gate 3)} \longrightarrow \text{MVP (Gate 4)} \longrightarrow \text{Commercialisation (Gate 5)} \longrightarrow \text{Scale (Gate 6)} \longrightarrow \text{Spin-Out (Gate 7)}$$

Trium manages its active ventures, candidate concepts, and institutional knowledge inside **Vanta**, its centralized venture portfolio and assessment platform.

### 1.2 The Platform Mission
Trium needs one platform that performs two vital jobs:
1. **Global Benchmarking:** Researches an idea across global, emerging, and nearby African markets, extracting comparable operational numbers, business models, and failure post-mortems, concluding with actionable **Apply in Nigeria** and **Avoid in Nigeria** operational guidance.
2. **Local Viability & Scouting:** Screens ideas for Nigerian market viability, compares them with the Vanta Idea Bank using privacy-preserving local deduplication, pre-grades candidate initiatives against Trium's established 7 criteria, and delivers them either on-demand or automatically every morning to the **Digital Incubation Team (DIT)**.

---

## 2. In-Scope Feature Flows & Pipeline Architecture

```
+----------------------------------------------------------------------------------------------------+
|                                    PROJECT REVA ARCHITECTURE                                       |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ INGESTION LAYER ]                                                                               |
|  * Prompt Input (Text)       * Document Uploads (PDF, DOCX, PPTX)                                  |
|  * Daily Emerging Tech (30-50) * Nigerian Regulatory & Policy Gazettes                             |
|                                                                                                    |
|                                 │                                                                  |
|                                 ▼                                                                  |
|  [ SHARED PROCESSING ENGINES ]                                                                     |
|  ┌─────────────────────────┐  ┌──────────────────────────────────────────────────────────────────┐ |
|  │ Flow 1: Global &        │  │ Flows 2a, 2b, 2c: Shared Idea Pipeline                           │ |
|  │ Emerging Benchmarking   │  │ ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐ │ |
|  │ * Metric Extraction     │  │ │ Idea Extract │──►│ Local Dedupe │──►│ Nigeria Viability      │ │ |
|  │ * Peer Market Weighting │  │ │(Trium Schema)│   │(vs Vanta Bank│   │ (Demand, Regs, FX)     │ │ |
|  │ * "Apply vs Avoid (NG)" │  │ └──────────────┘   └──────────────┘   └───────────┬────────────┘ │ |
|  │ * PDF / Word / PPT      │  │                                                   ▼              │ |
|  │                         │  │ ┌──────────────┐   ┌──────────────┐   ┌────────────────────────┐ │ |
|  │                         │  │ │ Dispatch to  │◄──│ Vanta 7-Grade│◄──│ Draft Submission Resp  │ │ |
|  │                         │  │ │ DIT Mailbox  │   │(Score >= 66) │   │ (Calibrated Pass B-A)  │ │ |
|  └─────────────────────────┘  │ └──────────────┘   └──────────────┘   └────────────────────────┘ │ |
|                               └──────────────────────────────────────────────────────────────────┘ |
+----------------------------------------------------------------------------------------------------+
```

### Flow 1: Global & Emerging Market Benchmarking (On-Demand)
* **Trigger:** On demand via typed prompt or uploaded PDF, DOCX, PPTX, or TXT.
* **Extraction:** In-memory local text extraction via `pdfplumber`, `python-docx`, `python-pptx` (Tesseract OCR for scans); structured into concept entities using Gemini 2.0 Flash Free Tier at **$0.00 cost**.
* **Confirmation:** Generates a one-paragraph idea brief (problem, solution, customer, business model, sector) for user confirmation before research begins.
* **Scan & Research:** Region-specific queries across Tavily Search Free Tier and Exa Free Tier covering 3 tiers: Global Leaders, Emerging Markets, and Nearby Markets.
  * *Emerging Markets:* India, Indonesia, Philippines, Vietnam, Pakistan, Bangladesh, Brazil, Mexico, Colombia, Egypt, Turkey.
  * *Nearby Markets:* Ghana, Kenya, South Africa, Egypt, Cote d'Ivoire, Senegal, Rwanda, Ethiopia, Tanzania, Uganda.
* **Synthesis & Output:** Generates a benchmark record table, comparison matrix, recurring patterns, and a dedicated **Apply in Nigeria** and **Avoid in Nigeria** blueprint. Outputs in user-selected **PDF, Word (DOCX), or PowerPoint (PPTX)** formatted in Trium brand styling.

### Flow 2a: On-Demand Local Viability & Vanta Ingestion Engine
* **Trigger:** On demand via prompt or document upload.
* **Shared Pipeline:**
  1. *Extract Ideas:* Disaggregates multi-idea documents into discrete initiative records using Trium schema.
  2. *Local Deduplication vs Vanta:* Reads Vanta Idea Bank via read API/database role. Computes similarity embeddings **locally** (`sentence-transformers/all-MiniLM-L6-v2`) so sensitive Idea Bank content never touches external APIs. LLM judge classifies:
     * **Exact Duplicate:** Drop; link to existing Vanta initiative.
     * **Near-Similar:** Keep; record the differentiator and Vanta entry it resembles.
     * **New:** Keep.
  3. *Nigeria Viability Filter:* Scores against 6 dimensions (Demand & affordability, Regulation, Infrastructure & payments, Competition, Unit economics & FX, Distribution & trust). Keeps **Medium or High** viability.
  4. *Draft Submission Responses:* Drafts high-quality submission responses adhering strictly to Vanta fields and calibrated to pass.
  5. *Vanta 7-Criteria Grading:* Evaluates against live Vanta criteria (Score &ge; 66, Grade B to A).
  6. *Output:* On-screen display and exportable as PDF/Word/PPT.

### Flow 2b: Daily Emerging-Market Tech Scout
* **Trigger:** Daily automated background cron at 05:00 WAT.
* **Hybrid Source Architecture:** Scrapes 35 curated emerging-market tech publications (Tier A) with automatic fallback to top 15 global tech publications (Tier B) if healthy Tier A sources are < 30.
* **Nigeria Exclusion Rule:** Automatically excludes articles whose subject is Nigeria to avoid circular local news.
* **Pipeline Execution:** Converts articles to Trium initiatives &rarr; Local Vanta Deduplication &rarr; Nigeria Viability &rarr; 7-Criteria Grading.
* **Trigger & Action Alerting:** If Grade B or higher (Score &ge; 66), auto-dispatches an HTML brief via Resend/SMTP to `"Digital Incubation" <digital-incubation@trium.ng>`.

### Flow 2c: Daily Nigerian Policy Scout
* **Trigger:** Daily automated background cron at 06:00 WAT.
* **Source Scope:** Official portals of CBN, SEC, NCC, NITDA, FCCPC, FIRS, NAFDAC, NERC, NAICOM, Federal Republic of Nigeria Official Gazettes, and legal media (BusinessDay, Nairametrics, Stears, TechCabal).
* **Policy Scope:** Both enacted rules AND incoming policy instruments (National Assembly proposed bills, regulator exposure drafts, and consultative papers).
* **Opportunity Synthesis:** Extrapolates venture opportunities created by regulatory shifts (e.g. compliance SaaS, deregulated sector IPPs, open banking rails), citing the specific regulatory section.
* **Downstream Flow:** Follows identical 2a pipeline &rarr; Auto-emails passing ideas (Grade B+) to `"Digital Incubation" <digital-incubation@trium.ng>`.

---

## 3. Vanta Integration & Established Criteria

### 3.1 Vanta Read-Only Scope (v1)
* Vanta is the single source of truth for the Idea Bank and scoring criteria.
* In Version 1.0, **access is read-only**:
  * Read via `GET /api/v1/portfolio?limit=500` authenticated with bearer token (`vnt_...`) or direct Convex database query.
  * Direct write-back into Vanta is deferred to Phase 4/5 after human sign-off.

### 3.2 Trium's 7 Vanta Assessment Criteria (Sum: 100 pts)
1. **Strategic Alignment (20 pts):** Adheres to Trium themes; aligns with long-term vision; studio unfair capabilities fit.
2. **Customer-Problem Fit (20 pts):** Real, verified pain point in Nigeria; validated willingness to adopt and pay.
3. **Solution Fit (15 pts):** Sizable addressable market (TAM/SAM); clear market dynamics and product fit.
4. **Market Opportunity (15 pts):** Unique vs competitors and informal alternatives; high economic impact.
5. **Differentiation & Moat (10 pts):** Long-term defensibility against fast-followers, incumbents, and disintermediation.
6. **Sustainable Advantage (10 pts):** Trium studio capability fit; resource availability; FX/macro mitigation.
7. **Feasibility & Scalability (10 pts):** Scalability across Nigerian geopolitical zones and regional Africa.

### 3.3 Grading Thresholds
* **A\* (86–100 pts):** Outstanding (Immediate IC Fast-Track)
* **A (76–85 pts):** Excellent (Pass & Advance to EVO Gate 0/1)
* **B (66–75 pts):** Good &mdash; **Passing Threshold & DIT Trigger**
* **C (57–65 pts):** Average (Hold in Bank / Needs Validation)
* **D (<57 pts):** Below Threshold (Decline)

---

## 4. Confidentiality & Zero Data Exposure Architecture

As mandated by Trium:
> *"sensitive steps should use a locally run open model or an efficient alternative that don't expose data"*

1. **Local Embeddings:** All vector embeddings of Vanta Idea Bank records are computed locally using open-source `sentence-transformers/all-MiniLM-L6-v2`. No unpublished Trium data is sent to external embedding APIs.
2. **Local Candidate Shortlisting:** Cosine similarity comparisons are performed entirely within local compute memory / SQLite-pgvector.
3. **Local LLM Judge:** Ambiguous candidate pairs are adjudicated using a locally hosted open-source model (e.g. Ollama Llama 3.2 3B) or deterministic semantic difference heuristics.
4. **Public Workflows:** Public web benchmarks (Flow 1) and public news/gazette scouting (Flows 2b & 2c) utilize Google Gemini 2.0 Flash Free Tier and Groq Free Tier at **$0.00 cost**.

---

## 5. Governance & Operational Protocols

* **Dual Sign-Off Rule:** Any modification to the source registries (emerging tech portals or Nigerian policy trackers) or approval of monthly discovery candidates requires **explicit sign-off from both a Reva Platform Admin and a Vanta Admin**.
* **Monthly Discovery Runner:** Uses Tavily and Exa monthly to scout new emerging market trackers, queueing them for dual admin approval.
* **Notification Recipient:** Official mailbox is `"Digital Incubation" <digital-incubation@trium.ng>`. Email delivery is handled via **Resend** (leveraging Vanta's existing Resend account) with SMTP failover.
* **Source Health Monitoring:** Sources failing 3 consecutive runs or producing no new items for 30 days are automatically flagged.

---

## 6. Phased Implementation Roadmap

* **Phase 0 & 1 (Current / Implemented):** Workspace setup (`Reva Project`), Python 3.12 `.venv`, git tracking, dual-root workspace, free document parsers, and Flow 1 Global Benchmarking engine.
* **Phase 2:** Shared Idea Pipeline & Flow 2a Local Viability (Vanta read connector, local private deduplication, Nigeria viability rubric, 7-criteria response generator).
* **Phase 3:** Autonomous Daily Scouts (Flow 2b & 2c: 50 curated emerging tech portals, Nigerian regulatory/gazette crawlers, daily 05:00/06:00 WAT cron, Resend DIT alert dispatcher).
* **Phase 4:** Hardening & Dual-Admin Governance (monthly source discovery, dual sign-off workflow, assessor calibration loop).

---
*End of PRD v1.1.0.*

