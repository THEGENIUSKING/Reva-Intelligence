"use node";

import { action, internalQuery, env } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { isApprovedVantaIdentity } from "./access";
import type { Id } from "./_generated/dataModel";

function safeJson(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(clean) as Record<string, any>;
}

function isGroundedUrl(value: unknown, groundedHosts: Set<string>) {
  if (typeof value !== "string" || !value.startsWith("https://")) return false;
  try {
    return groundedHosts.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

const scoringWeights = {
  strategicAlignment: 20,
  customerProblem: 20,
  solutionFit: 15,
  marketOpportunity: 15,
  differentiation: 10,
  sustainableAdvantage: 10,
  feasibility: 10,
} as const;

function buildScoringCriteria(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Gemini did not return a 7-criteria assessment.");
  const source = value as Record<string, unknown>;
  const criteria: Record<string, { score: number; max: number; rationale: string }> = {};
  for (const [key, max] of Object.entries(scoringWeights)) {
    const item = source[key];
    if (!item || typeof item !== "object") throw new Error(`Gemini omitted the ${key} assessment.`);
    const entry = item as Record<string, unknown>;
    const score = Number(entry.score);
    const rationale = typeof entry.rationale === "string" ? entry.rationale.trim() : "";
    if (!Number.isFinite(score) || !rationale) throw new Error(`Gemini returned an incomplete ${key} assessment.`);
    criteria[key] = { score: Math.max(0, Math.min(max, score)), max, rationale };
  }
  const totalScore = Object.values(criteria).reduce((sum, item) => sum + item.score, 0);
  const grade = totalScore >= 86 ? "A*" : totalScore >= 76 ? "A" : totalScore >= 66 ? "B" : totalScore >= 57 ? "C" : "D";
  return { ...criteria, totalScore, grade };
}


export const extractBrief = action({
  args: {
    text: v.optional(v.string()),
    documentId: v.optional(v.id("uploadedDocuments")),
  },
  returns: v.object({
    ideaName: v.string(),
    sector: v.string(),
    description: v.string(),
    problem: v.string(),
    solution: v.string(),
    targetCustomer: v.string(),
    monetization: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const key = env.GEMINI_API_KEY;
    let sourceText = args.text?.trim() || "";
    const input: Array<Record<string, unknown>> = [];

    if (args.documentId) {
      const doc = await ctx.runQuery(internal.files.getOwnedDocument, { id: args.documentId, ownerId: identity.subject });
      if (!doc) throw new Error("The uploaded document was not found in your account.");
      const url = await ctx.storage.getUrl(doc.storageId);
      if (!url) throw new Error("The uploaded document is no longer available.");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not read the uploaded document.");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");
      if (doc.contentType === "text/plain") {
        sourceText += `\n\n${bytes.toString("utf8")}`;
      } else if (doc.contentType === "application/pdf") {
        input.push({ type: "document", mime_type: "application/pdf", data: bytes.toString("base64") });
      } else {
        throw new Error("Upload a PDF or plain text document.");
      }
    }

    if (!key) {
      throw new Error("Brief extraction is not configured. Set GEMINI_API_KEY in Convex environment variables.");
    }
    if (!sourceText.trim() && !args.documentId) {
      throw new Error("Enter an idea description or attach a document.");
    }

    input.unshift({
      type: "text",
      text: `Extract one proposed venture idea from the supplied content. Return only JSON with keys: ideaName, sector, description, problem, solution, targetCustomer, monetization. Standardize sector to one of: 'Fintech & Financial Inclusion', 'AgriTech & Supply Chain', 'CleanTech & Energy Software', 'GovTech & Regulatory Tech', 'HealthTech & Life Sciences', 'Commerce, Retail & Logistics', 'InsurTech & Risk Analytics', 'Mobility & Smart Transit'. Use 'Uncategorized' when the evidence is insufficient. Do not add facts absent from the source.\n\nSource content:\n${sourceText.slice(0, 90_000) || "See the attached document."}`,
    });

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        model: env.GEMINI_MODEL || "gemini-3.8-flash",
        input,
        response_format: { type: "text", mime_type: "application/json" },
        generation_config: { thinking_level: "low", max_output_tokens: 3000 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Brief extraction provider returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }

    const payload = await response.json() as any;
    const text = payload.steps?.find((step: any) => step.type === "model_output")?.content
      ?.filter((part: any) => part.type === "text")?.map((part: any) => part.text || "").join("");
    if (!text) throw new Error("Brief extraction returned no result.");
    const extracted = safeJson(text);

    return {
      ideaName: String(extracted.ideaName || ""),
      sector: String(extracted.sector || "Uncategorized"),
      description: String(extracted.description || sourceText.slice(0, 200)),
      problem: String(extracted.problem || ""),
      solution: String(extracted.solution || ""),
      targetCustomer: String(extracted.targetCustomer || ""),
      monetization: String(extracted.monetization || ""),
    };
  },
});

export const runBenchmark = action({
  args: {
    ideaName: v.string(),
    sector: v.string(),
    description: v.string(),
    problem: v.optional(v.string()),
    solution: v.optional(v.string()),
    targetCustomer: v.optional(v.string()),
    monetization: v.optional(v.string()),
    flowType: v.optional(v.string()), // "flow4a_benchmark" | "flow4b_gap_initiatives"
    documentId: v.optional(v.id("uploadedDocuments")),
  },
  returns: v.object({ id: v.id("benchmarks"), report: v.any() }),
  handler: async (ctx, args): Promise<{ id: Id<"benchmarks">; report: unknown }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const ownerId = identity.subject;
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error("Benchmarking is not configured. Set GEMINI_API_KEY in Convex environment variables.");

    const isFlow4b = args.flowType === "flow4b_gap_initiatives";
    const input: Array<Record<string, unknown>> = [];
    const brief = [args.description, args.problem && `Problem: ${args.problem}`, args.solution && `Solution: ${args.solution}`, args.targetCustomer && `Target: ${args.targetCustomer}`, args.monetization && `Monetization: ${args.monetization}`].filter(Boolean).join("\n\n");

    const domains = await ctx.runQuery(internal.sources.getActiveSourceDomains, {});
    const searchInstruction = `CRITICAL CRAWLING INSTRUCTION: You MUST use the google_search tool to actively scrape the internet and find real benchmarks. You MUST prioritize crawling the following curated sources in our system:
  ${domains.map((domain: string) => `site:${domain}`).join(" OR ")}
Use Google Search evidence for every factual claim. Do not invent user counts, revenue, ROI, customer demographics, partnerships, funding, or legal conclusions; state "not publicly reported" when evidence is unavailable. Separate cited facts from your analysis.`;

    let prompt = "";
    if (isFlow4b) {
      // Flow 4B: Gap Analysis & Viable Initiative Ideas Generator
      prompt = `You are a venture builder at Trium (Coronation Group ecosystem).
${searchInstruction}

Perform a competitive and market gap analysis against this initiative in Nigeria and peer emerging markets.
Then, generate 2 to 3 distinct, highly viable initiative ideas designed to fill the identified gaps.

Return ONLY a JSON object with this exact structure:
{
  "ideaName": "${args.ideaName.trim()}",
  "sector": "${args.sector.trim()}",
  "description": "${args.description.slice(0, 300)}",
  "benchmarks": [
    {
      "companyName": "string",
      "country": "string",
      "regionTier": "Nearby Africa|Emerging Peer|Global Leader",
      "launchYear": "string",
      "status": "Active|Pivoted|Shut down",
      "fundingRaised": "string",
      "operationalScale": "string",
      "businessModel": "string",
      "customersAndRevenues": "string",
      "roiAndViability": "string",
      "keyPartners": "string",
      "lessonsLearned": "string",
      "sourceUrl": "https://...",
      "sourceName": "string",
      "confidence": "Gemini Search-cited; verify at source"
    }
  ],
  "blueprint": {
    "whatToApply": [{"title": "string", "recommendation": "string", "parallelBenchmark": "string"}],
    "whatToAvoid": [{"title": "string", "warning": "string", "pitfallReason": "string"}],
    "recurringPatterns": ["string"],
    "triumStrategicVerdict": "string"
  },
  "gapInitiativeIdeas": [
    {
      "ideaName": "Name expressing purpose/goals",
      "description": "1 or 2 sentence description",
      "category": "${args.sector.trim()}",
      "problem": "Describe existing problem and how it affects people/businesses",
      "solution": "Explain how idea solves problem and how to commercialize",
      "similarSolutions": "Local or international examples or competition to learn from",
      "targetCustomer": "Relevant customer segment (middle class, SMEs, large corporates, etc.) and value derived",
      "goToMarket": "Access channels (agents, branches, digital, partnerships, etc.)",
      "valueDrivers": ["Financial Inclusion", "Ecosystem Sticky Deposits", "B2B Supply Chain Digitization"],
      "monetization": "How idea generates revenue for each participating entity/partner",
      "additionalDetails": "Operational nuances in Nigeria",
      "sourceLink": "https://..."
    }
  ]
}

Venture: ${args.ideaName}
Sector: ${args.sector}
Brief: ${brief}`;
    } else {
      // Flow 4A: Global Precedent Benchmarking + 7-Criteria Assessment Guide
      prompt = `You are an investment analyst at Trium (Coronation Group ecosystem).
${searchInstruction}

Research empirical local (Nigeria / Nearby Africa) and international (Emerging Peer / Global Leader) benchmarks for this venture.
Evaluate the venture against Trium's 7 Investment Committee Criteria:
1. Strategic Alignment (Weight: 20/100) - Ideation themes, long-term vision, strategy wheel & discriminating capabilities.
2. Customer-Problem (Weight: 20/100) - Real & specific problem, willingness to adopt/pay, needs & expectations fit.
3. Solution Fit (Weight: 15/100) - Customer base expansion, market size attractiveness, understanding market dynamics to lead.
4. Market Opportunity (Weight: 15/100) - Uniqueness vs competitors, meaningful process/product improvements, significant impact.
5. Differentiation (Weight: 10/100) - Longevity/relevance, competitor maturity, defense against disruption.
6. Sustainable Advantage (Weight: 10/100) - Resources to execute, ease of acquiring technology/expertise, implementation obstacles.
7. Feasibility (Weight: 10/100) - Building additional capabilities, ease of expanding to new segments/markets.

Return ONLY a JSON object with this exact shape:
{
  "ideaName": "${args.ideaName.trim()}",
  "sector": "${args.sector.trim()}",
  "description": "${args.description.slice(0, 300)}",
  "benchmarks": [
    {
      "companyName": "string",
      "country": "string",
      "regionTier": "Nearby Africa|Emerging Peer|Global Leader",
      "launchYear": "string",
      "status": "Active|Pivoted|Shut down",
      "fundingRaised": "string",
      "operationalScale": "string",
      "businessModel": "string",
      "customersAndRevenues": "string",
      "roiAndViability": "string",
      "keyPartners": "string",
      "lessonsLearned": "string",
      "sourceUrl": "https://...",
      "sourceName": "string",
      "confidence": "Gemini Search-cited; verify at source"
    }
  ],
  "blueprint": {
    "whatToApply": [{"title": "string", "recommendation": "string", "parallelBenchmark": "string"}],
    "whatToAvoid": [{"title": "string", "warning": "string", "pitfallReason": "string"}],
    "recurringPatterns": ["string"],
    "triumStrategicVerdict": "string"
  },
  "scoringCriteria": {
    "strategicAlignment": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "customerProblem": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "solutionFit": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "marketOpportunity": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "differentiation": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "sustainableAdvantage": { "score": 0, "rationale": "Evidence-based assessment against all three considerations" },
    "feasibility": { "score": 0, "rationale": "Evidence-based assessment against both considerations" }
  }
}

Score only from supplied facts and the cited research. Maximum scores are 20, 20, 15, 15, 10, 10, and 10 respectively. Include one concise rationale that addresses each criterion's listed considerations. Omit totalScore and grade; Reva computes both. Use up to six real companies with direct Search citations. Distinguish cited facts from model judgment.
Venture: ${args.ideaName}
Sector: ${args.sector}
Brief: ${brief}`;
    }

    input.unshift({ type: "text", text: prompt });

    const model = env.GEMINI_MODEL || "gemini-3.8-flash";
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        model,
        input,
        tools: [{ type: "google_search" }],
        response_format: { type: "text", mime_type: "application/json" },
        generation_config: { thinking_level: "low", max_output_tokens: 8192 },
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 400);
      throw new Error(`Research provider returned ${response.status}: ${detail}`);
    }

    const payload = await response.json() as any;
    const modelOutput = payload.steps?.find((step: any) => step.type === "model_output");
    const textBlocks = modelOutput?.content?.filter((part: any) => part.type === "text") || [];
    const text = textBlocks.map((part: any) => part.text || "").join("");
    if (!text) throw new Error("The research provider returned no report.");

    const generated = safeJson(text);
    const groundedUrls: string[] = textBlocks.flatMap((part: any) => part.annotations || [])
      .map((annotation: any) => annotation.url)
      .filter((url: unknown): url is string => typeof url === "string" && /^https:\/\//.test(url));
    const groundedHosts = new Set(groundedUrls.map((url) => new URL(url).hostname));
    const groundedUrlByHost = new Map(groundedUrls.map((url) => [new URL(url).hostname, url]));

    const benchmarks = Array.isArray(generated.benchmarks) ? generated.benchmarks.flatMap((item: any) => {
      if (!item || typeof item !== "object" || !isGroundedUrl(item.sourceUrl, groundedHosts)) return [];
      const host = new URL(item.sourceUrl).hostname;
      const companyName = typeof item.companyName === "string" ? item.companyName.trim() : "";
      if (!companyName) return [];
      return [{
        companyName,
        country: typeof item.country === "string" ? item.country : "Not stated",
        regionTier: ["Nearby Africa", "Emerging Peer", "Global Leader"].includes(item.regionTier) ? item.regionTier : "Unclassified",
        launchYear: item.launchYear ? String(item.launchYear) : undefined,
        status: typeof item.status === "string" ? item.status : "Not verified",
        fundingRaised: item.fundingRaised ? String(item.fundingRaised) : undefined,
        operationalScale: item.operationalScale ? String(item.operationalScale) : undefined,
        businessModel: typeof item.businessModel === "string" ? item.businessModel : "",
        customersAndRevenues: item.customersAndRevenues ? String(item.customersAndRevenues) : undefined,
        roiAndViability: item.roiAndViability ? String(item.roiAndViability) : undefined,
        keyPartners: item.keyPartners ? String(item.keyPartners) : undefined,
        lessonsLearned: typeof item.lessonsLearned === "string" ? item.lessonsLearned : "",
        sourceUrl: groundedUrlByHost.get(host) || item.sourceUrl,
        sourceName: typeof item.sourceName === "string" && item.sourceName.trim() ? item.sourceName : host,
        confidence: "Gemini Search-cited; verify claims at source",
      }];
    }) : [];
    const gapInitiativeIdeas = isFlow4b && Array.isArray(generated.gapInitiativeIdeas)
      ? generated.gapInitiativeIdeas.flatMap((item: any) => {
        if (!item || typeof item !== "object" || !isGroundedUrl(item.sourceLink, groundedHosts)) return [];
        const requiredFields = ["ideaName", "description", "category", "problem", "solution", "similarSolutions", "targetCustomer", "goToMarket", "monetization"];
        if (requiredFields.some((field) => typeof item[field] !== "string" || !item[field].trim())) return [];
        const host = new URL(item.sourceLink).hostname;
        return [{
          ideaName: item.ideaName,
          description: item.description,
          category: item.category,
          problem: item.problem,
          solution: item.solution,
          similarSolutions: item.similarSolutions,
          targetCustomer: item.targetCustomer,
          goToMarket: item.goToMarket,
          valueDrivers: Array.isArray(item.valueDrivers) ? item.valueDrivers.filter((value: unknown): value is string => typeof value === "string") : [],
          monetization: item.monetization,
          ...(typeof item.additionalDetails === "string" ? { additionalDetails: item.additionalDetails } : {}),
          sourceLink: groundedUrlByHost.get(host) || item.sourceLink,
        }];
      })
      : undefined;

    const report = {
      ideaName: String(generated.ideaName || args.ideaName || "Venture concept"),
      sector: String(generated.sector || args.sector || "Fintech & Financial Inclusion"),
      conceptHash: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([ownerId, args.ideaName, args.sector, args.description, args.flowType])))))
        .map((byte) => byte.toString(16).padStart(2, "0")).join(""),
      description: String(generated.description || brief),
      problem: String(args.problem || generated.problem || ""),
      solution: String(args.solution || generated.solution || ""),
      targetCustomer: String(args.targetCustomer || generated.targetCustomer || ""),
      monetization: String(args.monetization || generated.monetization || ""),
      flowType: args.flowType || "flow4a_benchmark",
      counts: {
        total: benchmarks.length,
        nearbyAfrica: benchmarks.filter((item: any) => item.regionTier === "Nearby Africa").length,
        emergingPeers: benchmarks.filter((item: any) => item.regionTier === "Emerging Peer").length,
        globalLeaders: benchmarks.filter((item: any) => item.regionTier === "Global Leader").length,
      },
      benchmarks,
      blueprint: {
        whatToApply: Array.isArray(generated.blueprint?.whatToApply) ? generated.blueprint.whatToApply : [],
        whatToAvoid: Array.isArray(generated.blueprint?.whatToAvoid) ? generated.blueprint.whatToAvoid : [],
        recurringPatterns: Array.isArray(generated.blueprint?.recurringPatterns) ? generated.blueprint.recurringPatterns : [],
        triumStrategicVerdict: String(generated.blueprint?.triumStrategicVerdict || ""),
      },
      scoringCriteria: isFlow4b ? undefined : buildScoringCriteria(generated.scoringCriteria),
      gapInitiativeIdeas,
    };

    const id: Id<"benchmarks"> = await ctx.runMutation(internal.benchmarks.saveGenerated, {
      ownerId,
      ...report,
    });

    return { id, report: { ...report, _id: id, createdAt: Date.now() } };
  },
});
