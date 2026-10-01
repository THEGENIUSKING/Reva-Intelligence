"use node";

import { action, env } from "./_generated/server";
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
    if (!key) throw new Error("Brief extraction is not configured. Set GEMINI_API_KEY in Convex environment variables.");
    if (!args.text?.trim() && !args.documentId) throw new Error("Enter an idea description or attach a document.");

    const input: Array<Record<string, unknown>> = [];
    let sourceText = args.text?.trim() || "";
    if (args.documentId) {
      const doc = await ctx.runQuery(internal.files.getOwnedDocument, { id: args.documentId, ownerId: identity.subject });
      if (!doc) throw new Error("The attached document was not found in your account.");
      const url = await ctx.storage.getUrl(doc.storageId);
      if (!url) throw new Error("The uploaded document is no longer available.");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Could not read the uploaded document.");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");
      if (doc.contentType === "text/plain") sourceText += `\n\n${bytes.toString("utf8")}`;
      else if (doc.contentType === "application/pdf") input.push({ type: "document", mime_type: "application/pdf", data: bytes.toString("base64") });
      else throw new Error("Only PDF documents can be uploaded directly. Extract DOCX and PPTX files locally, then submit their text.");
    }

    input.push({
      type: "text",
      text: `Extract one proposed venture idea from the supplied content. Return only JSON with keys ideaName, sector, description, problem, solution, targetCustomer, monetization. Keep each value concise. Leave a value empty when the source does not provide it. Do not infer facts or add market research.\n\nSource content:\n${sourceText.slice(0, 90_000) || "See attached PDF document."}`,
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
    if (!response.ok) throw new Error(`Brief extraction provider returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
    const payload = await response.json() as any;
    const text = payload.steps?.find((step: any) => step.type === "model_output")?.content
      ?.filter((part: any) => part.type === "text")?.map((part: any) => part.text || "").join("");
    if (!text) throw new Error("Brief extraction returned no result.");
    const extracted = safeJson(text);
    if (args.documentId) {
      await ctx.runMutation(internal.files.deleteOwnedDocument, { id: args.documentId, ownerId: identity.subject });
    }
    return {
      ideaName: String(extracted.ideaName || ""),
      sector: String(extracted.sector || ""),
      description: String(extracted.description || ""),
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
    documentId: v.optional(v.id("uploadedDocuments")),
  },
  returns: v.object({ id: v.id("benchmarks"), report: v.any() }),
  handler: async (ctx, args): Promise<{ id: Id<"benchmarks">; report: unknown }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const key = env.GEMINI_API_KEY;
    if (!key) throw new Error("Benchmarking is not configured. Set GEMINI_API_KEY in Convex environment variables.");
    if (![args.description, args.problem, args.solution, args.targetCustomer].some((value) => value?.trim()) && !args.documentId) {
      throw new Error("Add details to the confirmed venture brief before starting research.");
    }

    const input: Array<Record<string, unknown>> = [];
    let brief = args.description.trim();
    if (args.documentId) {
      const doc = await ctx.runQuery(internal.files.getOwnedDocument, {
        id: args.documentId,
        ownerId: identity.subject,
      });
      if (!doc) throw new Error("The attached document was not found in your account.");
      const url = await ctx.storage.getUrl(doc.storageId);
      if (!url) throw new Error("The uploaded document is no longer available.");
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) throw new Error("Could not read the uploaded document.");
      const bytes = Buffer.from(await fileResponse.arrayBuffer());
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");
      if (doc.contentType === "text/plain") brief += `\n\nAttached brief:\n${bytes.toString("utf8")}`;
      else input.push({ type: "document", mime_type: "application/pdf", data: bytes.toString("base64") });
    }

    const prompt = `You are a venture research analyst. Assess the venture using current web research. Never invent a company, statistic, source, funding figure, or citation. Return only JSON with this exact shape:
{"ideaName":"string","sector":"string","description":"string","problem":"string","solution":"string","targetCustomer":"string","monetization":"string","benchmarks":[{"companyName":"string","country":"string","regionTier":"Nearby Africa|Emerging Peer|Global Leader","launchYear":"string","status":"string","fundingRaised":"string","operationalScale":"string","businessModel":"string","lessonsLearned":"string","sourceUrl":"https://...","sourceName":"string","confidence":"Verified source|Unverified"}],"blueprint":{"whatToApply":[{"title":"string","recommendation":"string","parallelBenchmark":"string"}],"whatToAvoid":[{"title":"string","warning":"string","pitfallReason":"string"}],"recurringPatterns":["string"],"triumStrategicVerdict":"string"}}
Use up to six real peer companies; cite direct URLs for each. If evidence is unavailable, return fewer peers and say so. Distinguish verified facts from analysis, explain uncertainty, and do not present model estimates as measured facts. Localize recommendations to Nigeria.

Venture name: ${args.ideaName.trim() || "Unspecified venture"}
Sector: ${args.sector.trim() || "Unspecified"}
Problem: ${args.problem?.trim() || "Not provided"}
Solution: ${args.solution?.trim() || "Not provided"}
Target customer: ${args.targetCustomer?.trim() || "Not provided"}
Monetization: ${args.monetization?.trim() || "Not provided"}
Brief: ${brief || "Not provided"}`;
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
    const benchmarks = Array.isArray(generated.benchmarks) ? generated.benchmarks.filter((item: any) =>
      item && typeof item.companyName === "string" && isGroundedUrl(item.sourceUrl, groundedHosts),
    ) : [];
    const report = {
      ideaName: String(generated.ideaName || args.ideaName || "Venture concept"),
      sector: String(generated.sector || args.sector || "Unspecified"),
      conceptHash: Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([identity.subject, args.ideaName, args.sector, args.description, args.problem, args.solution, args.targetCustomer, args.monetization])))))
        .map((byte) => byte.toString(16).padStart(2, "0")).join(""),
      description: String(generated.description || brief),
      problem: String(generated.problem || "Not stated"),
      solution: String(generated.solution || "Not stated"),
      targetCustomer: String(generated.targetCustomer || "Not stated"),
      monetization: String(generated.monetization || "Not stated"),
      counts: {
        total: benchmarks.length,
        nearbyAfrica: benchmarks.filter((item: any) => item.regionTier === "Nearby Africa").length,
        emergingPeers: benchmarks.filter((item: any) => item.regionTier === "Emerging Peer").length,
        globalLeaders: benchmarks.filter((item: any) => item.regionTier === "Global Leader").length,
      },
      benchmarks: benchmarks.map((item: any) => ({
        companyName: item.companyName,
        country: String(item.country || "Not verified"),
        regionTier: ["Nearby Africa", "Emerging Peer", "Global Leader"].includes(item.regionTier) ? item.regionTier : "Emerging Peer",
        launchYear: item.launchYear ? String(item.launchYear) : undefined,
        status: String(item.status || "Not verified"),
        fundingRaised: item.fundingRaised ? String(item.fundingRaised) : undefined,
        operationalScale: item.operationalScale ? String(item.operationalScale) : undefined,
        businessModel: String(item.businessModel || "Not verified"),
        lessonsLearned: String(item.lessonsLearned || "No verified lesson supplied"),
        sourceUrl: groundedUrlByHost.get(new URL(item.sourceUrl).hostname) || item.sourceUrl,
        sourceName: String(item.sourceName || new URL(item.sourceUrl).hostname),
        confidence: "Google Search citation",
      })),
      blueprint: {
        whatToApply: Array.isArray(generated.blueprint?.whatToApply) ? generated.blueprint.whatToApply : [],
        whatToAvoid: Array.isArray(generated.blueprint?.whatToAvoid) ? generated.blueprint.whatToAvoid : [],
        recurringPatterns: Array.isArray(generated.blueprint?.recurringPatterns) ? generated.blueprint.recurringPatterns : [],
        triumStrategicVerdict: String(generated.blueprint?.triumStrategicVerdict || "Insufficient evidence for a verdict."),
      },
    };
    const id: Id<"benchmarks"> = await ctx.runMutation(internal.benchmarks.saveGenerated, {
      ownerId: identity.subject,
      ...report,
    });
    return { id, report: { ...report, _id: id, createdAt: Date.now() } };
  },
});
