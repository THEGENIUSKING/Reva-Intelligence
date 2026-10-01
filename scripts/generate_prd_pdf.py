import os
import subprocess
import sys

def build_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Trium Idea Intelligence Platform — PRD v1.1.0</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  @page {
    size: A4 portrait;
    margin: 18mm 16mm 20mm 16mm;
    @top-right {
      content: "TRIUM IDEA INTELLIGENCE — PRD v1.1.0";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
      font-weight: 600;
    }
    @bottom-center {
      content: "Trium Limited • Confidential Venture Studio Architecture";
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @bottom-right {
      content: "Page " counter(page);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      color: #64748b;
      font-weight: 700;
    }
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.55;
    font-size: 9.3pt;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .cover-header {
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 16px;
    margin-bottom: 22px;
  }

  .badge-tag {
    display: inline-block;
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #ffedd5;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  h1 {
    font-size: 21pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin: 4px 0 6px 0;
    letter-spacing: -0.5px;
  }

  .subtitle {
    font-size: 10.5pt;
    color: #475569;
    font-weight: 500;
    margin-bottom: 14px;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px 14px;
    margin-bottom: 18px;
  }

  .meta-item strong {
    display: block;
    font-size: 7pt;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .meta-item span {
    font-size: 8.5pt;
    color: #0f172a;
    font-weight: 600;
  }

  h2 {
    font-size: 12.5pt;
    font-weight: 700;
    color: #0f172a;
    border-left: 3.5px solid #ea580c;
    padding-left: 10px;
    margin-top: 24px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10pt;
    font-weight: 700;
    color: #1e3a8a;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  .callout {
    background: #f0fdf4;
    border-left: 3.5px solid #16a34a;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 12px 0;
    font-size: 9pt;
  }

  .callout-info {
    background: #f8fafc;
    border-left: 3.5px solid #0284c7;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 12px 0;
    font-size: 9pt;
  }

  .callout-warning {
    background: #fffbeb;
    border-left: 3.5px solid #d97706;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 12px 0;
    font-size: 9pt;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  th {
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 7px 10px;
    border: 1px solid #0f172a;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  td {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .badge-pass {
    display: inline-block;
    background: #dcfce7;
    color: #15803d;
    font-weight: 700;
    font-size: 7.5pt;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge-warn {
    display: inline-block;
    background: #fef3c7;
    color: #b45309;
    font-weight: 700;
    font-size: 7.5pt;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .badge-fail {
    display: inline-block;
    background: #fee2e2;
    color: #b91c1c;
    font-weight: 700;
    font-size: 7.5pt;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .diagram-box {
    background: #0f172a;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 7.5pt;
    line-height: 1.35;
    padding: 12px 14px;
    border-radius: 6px;
    margin: 12px 0;
    white-space: pre;
    overflow-x: auto;
    border: 1px solid #334155;
  }

  .page-break {
    page-break-before: always;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
  }
</style>
</head>
<body>

<div class="cover-header">
  <span class="badge-tag">Trium Limited • Product Innovation Architecture</span>
  <h1>Trium Idea Intelligence Platform (Project Reva)</h1>
  <div class="subtitle">Product Requirements Document — Global Benchmarking, Local Viability & Daily Idea/Policy Scouting</div>
  
  <div class="meta-grid">
    <div class="meta-item">
      <strong>Document Version</strong>
      <span>v1.1.0 (Incorporated)</span>
    </div>
    <div class="meta-item">
      <strong>Product Owner</strong>
      <span>Olanrewaju Taiwo</span>
    </div>
    <div class="meta-item">
      <strong>Primary Recipient</strong>
      <span>"Digital Incubation" Team</span>
    </div>
    <div class="meta-item">
      <strong>Software Cost</strong>
      <span>$0.00 / Free Tools Only</span>
    </div>
  </div>
</div>

<h2>1. Executive Summary & Strategic Context</h2>
<p>
  <strong>Trium Limited</strong> requires a unified platform that performs two vital venture building jobs:
  First, it benchmarks candidate ideas against what has been built globally, with deliberate emphasis on emerging and nearby African markets, generating actionable <strong>Apply in Nigeria</strong> and <strong>Avoid in Nigeria</strong> operational guidance.
  Second, it screens ideas for Nigerian market viability, compares them with the <strong>Vanta Idea Bank</strong> using privacy-preserving local deduplication, pre-grades candidate initiatives against Trium's established 7 criteria, and delivers them either on-demand or automatically every morning to the <strong>Digital Incubation Team (DIT)</strong>.
</p>

<div class="diagram-box">
+-------------------------------------------------------------------------------------------------------+
|                                    TRIUM IDEA INTELLIGENCE ARCHITECTURE                               |
+-------------------------------------------------------------------------------------------------------+
|  [ INGESTION LAYER ]                                                                                  |
|  * Prompt Input (Text)         * Uploads (PDF, DOCX, PPTX)                                            |
|  * Daily Emerging Tech (30-50) * Nigerian Regulatory & Policy Gazettes (CBN, SEC, NITDA, FIRS, etc.)  |
|                                                                                                       |
|                                                  │                                                    |
|                                                  ▼                                                    |
|  [ SHARED PROCESSING ENGINES ]                                                                        |
|  ┌──────────────────────────┐  ┌───────────────────────────────────────────────────────────────────┐  |
|  │ Flow 1: Global &         │  │ Flows 2a, 2b, 2c: Shared Idea Pipeline                            │  |
|  │ Emerging Benchmarking    │  │ ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐ │  |
|  │ * Financial & Ops Metrics│  │ │ Idea Extract  │──►│ Local Dedupe  │──►│ Nigeria Viability     │ │  |
|  │ * Peer Market Weighting  │  │ │ (Trium Schema)│   │ (vs Vanta Bank│   │ (Demand, Regs, FX)    │ │  |
|  │ * "Apply vs Avoid (NG)"  │  │ └───────────────┘   └───────────────┘   └───────────┬───────────┘ │  |
|  │ * PDF / Word / PPT Export│  │                                                     ▼                 │  |
|  │                          │  │ ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐ │  |
|  │                          │  │ │ Dispatch to   │◄──│ Vanta 7-Grade │◄──│ Draft Submission Resp │ │  |
|  │                          │  │ │ DIT Mailbox   │   │ (Score >= 66) │   │ (Calibrated Pass B-A) │ │  |
|  └──────────────────────────┘  │ └───────────────┘   └───────────────┘   └───────────────────────┘ │  |
|                                └───────────────────────────────────────────────────────────────────┘  |
+-------------------------------------------------------------------------------------------------------+
</div>

<h2>2. The Four In-Scope Flows</h2>
<table>
  <thead>
    <tr>
      <th style="width: 14%;">Flow</th>
      <th style="width: 32%;">What It Does</th>
      <th style="width: 16%;">Trigger</th>
      <th>Output & Destination</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Global Benchmarking</strong></td>
      <td>Researches an idea across global, emerging and nearby markets; extracts comparable operational numbers, business models, and failure post-mortems.</td>
      <td>On demand (prompt or doc upload)</td>
      <td>Report in <strong>PDF, Word (DOCX) or PowerPoint (PPTX)</strong> with dedicated Apply / Avoid guidance for Nigeria.</td>
    </tr>
    <tr>
      <td><strong>2a. Local Viability</strong></td>
      <td>Extracts ideas from prompt/document, removes exact duplicates in Vanta, tests survivors for Nigerian viability, drafts and grades submission responses.</td>
      <td>On demand</td>
      <td>Graded, submission-ready entries with full Vanta scorecard and gap breakdown. Exportable as PDF/Word/PPT.</td>
    </tr>
    <tr>
      <td><strong>2b. Emerging Tech Scout</strong></td>
      <td>Scrapes 30 to 50 emerging-market tech sources daily (Nigeria data excluded; global fallback to Tier B if &lt;30); runs shared 2a pipeline.</td>
      <td>Daily (05:00 WAT cron)</td>
      <td>Automated structured HTML email to <code>digital-incubation@trium.ng</code> for ideas achieving Grade B or higher.</td>
    </tr>
    <tr>
      <td><strong>2c. Nigerian Policy Scout</strong></td>
      <td>Scrapes Nigerian regulatory bodies, official gazettes, and legal trackers for incoming and enacted policy; derives venture opportunities; runs 2a pipeline.</td>
      <td>Daily (06:00 WAT cron)</td>
      <td>Automated email to <code>digital-incubation@trium.ng</code> for ideas achieving Grade B or higher, citing the governing policy clause.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. Vanta Integration & Established 7-Criteria Scale</h2>
<p>
  Vanta is the single source of truth for the Idea Bank and evaluation rules. In Version 1.0, <strong>Vanta access is read-only</strong> (read via API <code>GET /api/v1/portfolio</code> or direct Convex role). Automatic write-back into Vanta is deferred to a future phase after human sign-off.
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Criterion</th>
      <th style="width: 10%;">Weight</th>
      <th style="width: 18%;">Key</th>
      <th>Evaluation Consideration & Calibration</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>1. Strategic Alignment</strong></td>
      <td><strong>20 pts</strong></td>
      <td><code>strategic_alignment</code></td>
      <td>Adheres to Trium ideation themes; aligns with long-term studio vision; leverages Trium's strategy wheel and unfair capabilities.</td>
    </tr>
    <tr>
      <td><strong>2. Customer-Problem Fit</strong></td>
      <td><strong>20 pts</strong></td>
      <td><code>customer_problem</code></td>
      <td>Solves a real, acute, and verified customer/partner pain point in Nigeria; validated willingness to adopt and repeatedly pay.</td>
    </tr>
    <tr>
      <td><strong>3. Solution Fit</strong></td>
      <td><strong>15 pts</strong></td>
      <td><code>solution_fit</code></td>
      <td>Expands Trium customer base; sizable addressable market (TAM/SAM); deep understanding of market dynamics to secure market leadership.</td>
    </tr>
    <tr>
      <td><strong>4. Market Opportunity</strong></td>
      <td><strong>15 pts</strong></td>
      <td><code>market_opportunity</code></td>
      <td>Unique versus incumbents and informal alternatives; significantly improves broken supply chains; creates high economic impact.</td>
    </tr>
    <tr>
      <td><strong>5. Differentiation & Moat</strong></td>
      <td><strong>10 pts</strong></td>
      <td><code>differentiation</code></td>
      <td>Long-term relevance; defensibility against well-funded incumbents, copy-cats, platform disruption, and disintermediation.</td>
    </tr>
    <tr>
      <td><strong>6. Sustainable Advantage</strong></td>
      <td><strong>10 pts</strong></td>
      <td><code>sustainable_advantage</code></td>
      <td>Trium studio capability fit; resource and capital availability; access to proprietary distribution; mitigation of macro/FX headwinds.</td>
    </tr>
    <tr>
      <td><strong>7. Feasibility & Scalability</strong></td>
      <td><strong>10 pts</strong></td>
      <td><code>feasibility</code></td>
      <td>Expandability into ancillary products/fintech rails; ease of geographic expansion across Nigerian geopolitical zones and regional Africa.</td>
    </tr>
  </tbody>
</table>

<div class="card">
  <strong>Vanta Scoring Scale & Action Mapping:</strong><br>
  <span class="badge-pass">A* (86–100 pts)</span> Outstanding — Immediate IC Fast-Track &nbsp;|&nbsp;
  <span class="badge-pass">A (76–85 pts)</span> Excellent — Pass & Advance to EVO Gate 0/1 &nbsp;|&nbsp;
  <span class="badge-warn">B (66–75 pts)</span> Good — <strong>PASS THRESHOLD & DIT TRIGGER</strong> &nbsp;|&nbsp;
  <span class="badge-warn">C (57–65 pts)</span> Average — Hold in Bank / Needs Validation &nbsp;|&nbsp;
  <span class="badge-fail">D (&lt;57 pts)</span> Below Threshold — Decline
</div>

<h2>4. Confidentiality & Local Model Architecture (Zero Data Exposure)</h2>
<div class="callout-warning">
  <strong>Client Requirement on Data Privacy:</strong> <em>"sensitive steps should use a locally run open model or an efficient alternative that don't expose data."</em>
</div>
<p>
  To guarantee that unpublished, confidential ideas inside the Vanta Idea Bank are never leaked to external public AI providers whose terms allow training:
</p>
<ul>
  <li><strong>Local Deduplication Embeddings:</strong> High-dimensional embeddings of Vanta's Idea Bank are computed <strong>100% on-device</strong> using local open-source models (<code>sentence-transformers/all-MiniLM-L6-v2</code>). No proprietary Vanta text is sent to third-party embedding APIs.</li>
  <li><strong>Candidate Shortlisting:</strong> Nearest-neighbor cosine similarity runs locally in Python/pgvector to identify candidate pairs.</li>
  <li><strong>Local LLM Judge:</strong> For ambiguous candidate pairs (similarity between 65% and 88%), Reva uses a <strong>local open model</strong> (via local Ollama / Llama 3.2 3B) or an on-device semantic differencing rule to determine whether an idea is an <em>Exact Duplicate</em>, <em>Near-Similar</em> (differentiated wedge), or <em>New</em>.</li>
  <li><strong>Public Data Pipeline:</strong> Public benchmark scanning (Flow 1) and public news/policy scraping (Flows 2b and 2c) consume zero internal company data and safely utilize the generous Google Gemini 2.0 Flash Free Tier and Groq Free Tier at <strong>$0.00 cost</strong>.</li>
</ul>

<div class="page-break"></div>

<h2>5. Governance & Source Registry Rules</h2>

<div class="card">
  <strong>Dual Sign-Off Governance Policy:</strong><br>
  As established by Trium, any update to the curated source registries (emerging tech portals or Nigerian regulatory trackers) or monthly additions proposed by the autonomous discovery engine <strong>requires explicit sign-off from both a Reva Platform Admin and a Vanta Admin</strong> before entering active daily production.
</div>

<div class="grid-2">
  <div class="card">
    <h3 style="margin-top:0;">Flow 2b: Emerging Market Sources (35 Tier A + 15 Tier B)</h3>
    <ul style="font-size: 8pt; padding-left: 14px;">
      <li><strong>Africa (Ex-NG):</strong> Disrupt Africa, WeeTracker, TechMoran, Techweez, Ventureburn, CIO Africa, Tech In Africa, KokoFeed.</li>
      <li><strong>MENA:</strong> Wamda, MAGNiTT, Enterprise Egypt, Waya Media.</li>
      <li><strong>Southeast Asia:</strong> Tech in Asia, e27, DealStreetAsia, KrASIA, DailySocial ID, Vulcan Post, Vietcetera.</li>
      <li><strong>South Asia:</strong> Entrackr, Inc42, YourStory, MediaNama.</li>
      <li><strong>Latin America:</strong> Contxto, Startups Real, Startups.com.br, Tekios, LatamList.</li>
      <li><strong>Tier B Global Fallbacks:</strong> Crunchbase News, TechCrunch, VentureBeat, Sifted, PitchBook, Rest of World.</li>
    </ul>
  </div>

  <div class="card">
    <h3 style="margin-top:0;">Flow 2c: Nigerian Regulatory & Policy Watch</h3>
    <ul style="font-size: 8pt; padding-left: 14px;">
      <li><strong>Scope:</strong> Enacted circulars AND incoming instruments (National Assembly proposed bills, regulator exposure drafts, consultative papers).</li>
      <li><strong>Regulators:</strong> Central Bank of Nigeria (CBN), SEC Nigeria, NCC, NITDA, FCCPC, FIRS, NAFDAC, NERC, NAICOM, FMCIDE.</li>
      <li><strong>Official Records:</strong> Federal Republic of Nigeria Official Gazettes.</li>
      <li><strong>Policy Journalism:</strong> BusinessDay Law & Policy, Nairametrics Regulatory Watch, Stears, TechCabal Policy Watch.</li>
    </ul>
  </div>
</div>

<h2>6. Digital Incubation Team (DIT) Notification Specification</h2>
<ul>
  <li><strong>Official Recipient:</strong> <code>"Digital Incubation" &lt;digital-incubation@trium.ng&gt;</code></li>
  <li><strong>Email Engine:</strong> Delivery via <strong>Resend</strong> (leveraging Trium/Vanta's existing Resend account) with SMTP failover.</li>
  <li><strong>Trigger Rule:</strong> Automated immediate dispatch whenever an idea achieves <strong>Grade B, A, or A* (Score &ge; 66)</strong> during daily 2b or 2c runs.</li>
  <li><strong>Email Brief Content:</strong>
    <ul>
      <li><em>Subject Line:</em> <code>[TRIUM INTEL] [Grade {Grade} - {Score}/100] {Idea Name} — {Origin Market / Regulatory Policy}</code></li>
      <li><em>Executive Overview:</em> Distinctive idea name, core problem, proposed solution, target customer segment, monetization model.</li>
      <li><em>Origin Benchmark or Policy Clause:</em> Specific startup/model observed abroad OR exact regulatory section/bill cited.</li>
      <li><em>The Nigerian Play:</em> Specific Apply and Avoid recommendations tailored to local payment rails, infrastructure, and consumer willingness-to-pay.</li>
      <li><em>Vanta Scorecard Breakdown:</em> Scores across all 7 criteria with concise rationales, 3 Key Strengths, and 3 Key Risks.</li>
      <li><em>Review Action:</em> Direct links to review full benchmark or park idea.</li>
    </ul>
  </li>
</ul>

<h2>7. Free-Tier Tool Selection Matrix (Strict $0 Mandate)</h2>
<table>
  <thead>
    <tr>
      <th>Tool Category</th>
      <th>Tool Selected</th>
      <th>Free Tier Quota & Fit</th>
      <th>Architectural Function</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="2"><strong>Language Model & Reasoning</strong></td>
      <td><strong>Google Gemini 2.0 Flash</strong></td>
      <td>100% Free (15 RPM, 1,500 RPD, 1M context)</td>
      <td>Primary LLM for public document extraction, benchmark research, and drafting.</td>
    </tr>
    <tr>
      <td><strong>Groq Cloud (Llama 3.3 70B)</strong></td>
      <td>100% Free (30 RPM, 14.4k RPD)</td>
      <td>Fallback fast LLM for article classification and JSON sanitization.</td>
    </tr>
    <tr>
      <td><strong>Privacy Deduplication</strong></td>
      <td><strong>Sentence-Transformers (Local)</strong></td>
      <td>100% Free & Unlimited (On-device compute)</td>
      <td>Computes Vanta Idea Bank embeddings locally with zero data sent outside.</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>Scraping & Feed Extraction</strong></td>
      <td><strong>Feedparser & Trafilatura</strong></td>
      <td>100% Free Open Source (Local Python)</td>
      <td>Core daily scraper for RSS feeds, sitemaps, and clean article body text.</td>
    </tr>
    <tr>
      <td><strong>Playwright / Crawl4AI</strong></td>
      <td>100% Free Open Source (Local Headless)</td>
      <td>Scrapes dynamic JavaScript pages without burning third-party API credits.</td>
    </tr>
    <tr>
      <td rowspan="2"><strong>Targeted Search</strong></td>
      <td><strong>Tavily Search API</strong></td>
      <td>Free Tier: 1,000 searches/month</td>
      <td>Targeted research queries for Flow 1 benchmarks and monthly discovery.</td>
    </tr>
    <tr>
      <td><strong>Exa Search API</strong></td>
      <td>Free Tier credits</td>
      <td>Semantic company search and finding parallel emerging market peers.</td>
    </tr>
    <tr>
      <td><strong>Document Parsers</strong></td>
      <td><strong>pdfplumber, python-docx, pptx</strong></td>
      <td>100% Free Open Source</td>
      <td>Local extraction of tables, text, and layouts from uploaded documents.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>8. Phased Delivery Plan</h2>

<table>
  <thead>
    <tr>
      <th style="width: 14%;">Phase</th>
      <th style="width: 36%;">Scope & Deliverables</th>
      <th style="width: 25%;">Tooling Used</th>
      <th style="width: 25%;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Phase 0 & 1</strong></td>
      <td>
        <strong>Discovery & Flow 1: Global Benchmarking</strong><br>
        * Confirm Vanta read schemas, grading scale & criteria.<br>
        * Input ingestion (prompt, PDF, DOCX, PPTX).<br>
        * Multi-tier benchmark research (Global, Emerging, Nearby).<br>
        * "Apply vs Avoid (Nigeria)" generation & Multi-format export (PDF, Word, PPT).
      </td>
      <td>
        Python 3.12, <code>pdfplumber</code>, <code>python-pptx</code>, Gemini 2.0 Flash Free Tier, Tavily Free Tier.
      </td>
      <td><span class="badge-pass">Workspace Ready</span><br>PRD Approved</td>
    </tr>
    <tr>
      <td><strong>Phase 2</strong></td>
      <td>
        <strong>Shared Pipeline & Flow 2a: Local Viability</strong><br>
        * Vanta read connector (Idea Bank sync).<br>
        * Local sentence-transformers deduplication (zero data exposure).<br>
        * Nigeria viability assessment (Medium+ gate).<br>
        * Trium 7-criteria response drafting calibrated for Grade B-A.
      </td>
      <td>
        Vanta HTTP API, <code>sentence-transformers</code> (local), Gemini Flash, Pydantic schemas.
      </td>
      <td><span class="badge-warn">Scheduled Next</span></td>
    </tr>
    <tr>
      <td><strong>Phase 3</strong></td>
      <td>
        <strong>Autonomous Daily Scouts (Flow 2b & 2c)</strong><br>
        * Curated 50-source emerging tech feed crawler (ex-NG, Tier B fallback).<br>
        * Nigerian regulatory, exposure draft & gazette crawler.<br>
        * Daily cron runners (05:00 and 06:00 WAT).<br>
        * Automated Resend email dispatcher to <code>digital-incubation@trium.ng</code>.
      </td>
      <td>
        <code>feedparser</code>, <code>trafilatura</code>, Playwright, Resend API, Jinja2 templates.
      </td>
      <td><span class="badge-warn">Scheduled Next</span></td>
    </tr>
    <tr>
      <td><strong>Phase 4</strong></td>
      <td>
        <strong>Hardening & Governance</strong><br>
        * Dual admin sign-off dashboard for source additions.<br>
        * Monthly AI discovery runner for emerging tech trackers.<br>
        * End-to-end integration testing with live Vanta assessments.
      </td>
      <td>
        FastAPI, SQLite/pgvector, Antigravity Agent.
      </td>
      <td><span class="badge-warn">Future Iteration</span></td>
    </tr>
  </tbody>
</table>

<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 8pt;">
  Trium Idea Intelligence Platform (Project Reva) • PRD v1.1.0 • Confidential & Proprietary to Trium Limited
</div>

</body>
</html>
"""

def main():
    docs_dir = os.path.join(os.getcwd(), "docs")
    os.makedirs(docs_dir, exist_ok=True)
    
    html_path = os.path.join(docs_dir, "REVA_PRODUCT_REQUIREMENTS_DOCUMENT.html")
    pdf_path = os.path.join(docs_dir, "REVA_PRODUCT_REQUIREMENTS_DOCUMENT.pdf")
    
    print("Writing HTML...")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(build_html())
    print(f"HTML written to {html_path}")
    
    # Chrome path
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    print(f"Using browser: {chrome_path}")
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
        print(f"SUCCESS: Generated PDF at {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
    else:
        print(f"FAILED to generate PDF. Error: {res.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    main()

