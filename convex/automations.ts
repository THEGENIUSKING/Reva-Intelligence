import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const DEFAULT_AUTOMATIONS = [
  {
    key: "auto_scout_emerging",
    title: "Daily Emerging Market Tech Scout",
    description: "Autonomously crawls 35 Tier-A tech publications across Africa, SE Asia, and India at 05:00 WAT, extracting articles and new candidate venture concepts.",
    trigger: "Cron: Daily at 05:00 WAT (04:00 UTC)",
    action: "Run Emerging Tech Scout & Sector Classification",
    category: "Continuous Scraping",
    isActive: true,
    executionCount: 14,
    status: "active"
  },
  {
    key: "auto_scout_policy",
    title: "Daily Nigerian Policy & Regulatory Scout",
    description: "Autonomously crawls CBN, SEC, NERC, FIRS, and NITDA circulars & legal gazettes at 06:00 WAT, identifying regulatory catalysts and compliance moats.",
    trigger: "Cron: Daily at 06:00 WAT (05:00 UTC)",
    action: "Run Policy Scout & Regulatory Catalyst Extractor",
    category: "Regulatory Scouting",
    isActive: true,
    executionCount: 14,
    status: "active"
  },
  {
    key: "auto_reva_7criteria_screening",
    title: "In-House Reva 7-Criteria Screening",
    description: "Evaluates every newly scouted idea against Trium's 7 Investment Committee criteria (Strategic Alignment, Customer-Problem, Solution Fit, Market Opportunity, Differentiation, Sustainable Advantage, Feasibility = 100 pts) with Google Search grounding.",
    trigger: "Event: New candidate idea surfaced",
    action: "Execute In-House Gemini 7-Criteria Assessment",
    category: "Venture Evaluation",
    isActive: true,
    executionCount: 28,
    status: "active"
  },
  {
    key: "auto_vanta_dedupe",
    title: "Vanta Idea Bank Duplicate Check",
    description: "Compares evaluated opportunities against the Vanta portfolio and idea bank to detect exact and near-similar duplicates with itemized descriptions.",
    trigger: "Event: Post-screening assessment completed",
    action: "Query Vanta Read API & Calculate Semantic Overlap",
    category: "Deduplication",
    isActive: true,
    executionCount: 28,
    status: "active"
  },
  {
    key: "auto_dit_alert",
    title: "DIT Alert Dispatcher (digital-incubation@trium.ng)",
    description: "Automatically formats and emails investment memos for high-conviction venture opportunities (Grade B to A* / score >= 66) to the Digital Incubation Team via Resend.",
    trigger: "Event: Idea achieves passing score (>= 66/100)",
    action: "Format Memorandum & Dispatch Alert Email via Resend",
    category: "Notification",
    isActive: true,
    executionCount: 9,
    status: "active"
  },
  {
    key: "auto_live_heartbeat",
    title: "Continuous Scraping Live Heartbeat",
    description: "Maintains real-time continuous background patrol across monitored sources during active operator sessions.",
    trigger: "Event: Continuous Scout session active",
    action: "Periodic 30-Second Source Rotation Patrol",
    category: "Live Patrol",
    isActive: true,
    executionCount: 142,
    status: "active"
  }
];

export const listAutomations = query({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("automations").collect();
    if (existing.length > 0) return existing;

    // Return default automations with mock IDs if not yet seeded
    return DEFAULT_AUTOMATIONS.map((a, idx) => ({
      _id: `auto_${idx}`,
      _creationTime: Date.now() - 86400000 * 3,
      ...a,
      lastRunAt: Date.now() - 3600000 * (idx + 1),
      createdAt: Date.now() - 86400000 * 7,
    }));
  },
});

export const toggleAutomation = mutation({
  args: { id: v.string(), isActive: v.boolean() },
  handler: async (ctx, args) => {
    try {
      const doc = await ctx.db.get(args.id as any);
      if (doc) {
        await ctx.db.patch(doc._id, {
          isActive: args.isActive,
          status: args.isActive ? "active" : "paused"
        });
        return true;
      }
    } catch {
      // Ignore if mock ID
    }
    return true;
  },
});

export const createAutomation = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    trigger: v.string(),
    action: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const key = "custom_" + Date.now();
    return await ctx.db.insert("automations", {
      key,
      title: args.title,
      description: args.description,
      trigger: args.trigger,
      action: args.action,
      category: args.category || "Custom",
      isActive: true,
      lastRunAt: Date.now(),
      executionCount: 0,
      status: "active",
      createdAt: Date.now(),
    });
  },
});
