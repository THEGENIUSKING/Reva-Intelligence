import { query, mutation, internalMutation, env } from "./_generated/server";
import { v } from "convex/values";
import { isApprovedVantaIdentity } from "./access";

/**
 * List sources registered in the system with optional tier/active filters.
 */
export const listSources = query({
  args: {
    tier: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    let items = await ctx.db.query("sourceRegistry").withIndex("by_name").take(500);

    if (args.tier) {
      items = items.filter((s) => s.tier === args.tier);
    }
    if (args.isActive !== undefined) {
      items = items.filter((s) => s.isActive === args.isActive);
    }

    return items;
  },
});

export const myApprovalRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) return null;
    const email = identity.email.toLowerCase();
    return email === env.REVA_ADMIN_EMAIL?.trim().toLowerCase() ? "reva" : null;
  },
});

export const approvalSetup = query({
  args: {},
  returns: v.object({
    authorized: v.boolean(),
    role: v.union(v.literal("reva"), v.null()),
    revaAdminConfigured: v.boolean(),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const authorized = isApprovedVantaIdentity(identity);
    const revaEmail = env.REVA_ADMIN_EMAIL?.trim().toLowerCase();
    const email = identity?.email?.trim().toLowerCase();
    const role = authorized && revaEmail && email === revaEmail ? "reva" as const : null;
    return {
      authorized,
      role,
      revaAdminConfigured: Boolean(revaEmail),
    };
  },
});

/**
 * Record the single Reva administrator's approval for a source.
 */
export const signOffSource = internalMutation({
  args: {
    id: v.id("sourceRegistry"),
    adminRole: v.literal("reva"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) {
      throw new Error("Source not found");
    }

    const patchData = {
      signOffRevaAdmin: args.approved,
      // Kept true for compatibility with source rows created under the old dual-approval model.
      signOffVantaAdmin: args.approved,
      isActive: args.approved,
      approvedAt: args.approved ? Date.now() : undefined,
    };
    await ctx.db.patch(args.id, patchData);
    return { ...source, ...patchData };
  },
});

/**
 * Add a new source to the registry. Requires sign-off before becoming active.
 */
export const addSource = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    feedUrl: v.optional(v.string()),
    region: v.string(),
    tier: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const parsed = new URL(args.url);
    if (parsed.protocol !== "https:") throw new Error("Source URLs must use HTTPS");
    if (args.feedUrl && new URL(args.feedUrl).protocol !== "https:") throw new Error("Feed URLs must use HTTPS");
    const normalizedUrl = parsed.toString().replace(/\/$/, "");
    const existing = await ctx.db.query("sourceRegistry").withIndex("by_url", (q) => q.eq("url", normalizedUrl)).first();
    if (existing) throw new Error("This source is already registered.");

    return await ctx.db.insert("sourceRegistry", {
      name: args.name,
      url: normalizedUrl,
      ...(args.feedUrl ? { feedUrl: new URL(args.feedUrl).toString() } : {}),
      region: args.region,
      tier: args.tier,
      category: args.category,
      isActive: false,
      lastScrapedAt: undefined,
      failureCount: 0,
      signOffRevaAdmin: false,
      signOffVantaAdmin: false,
    });
  },
});

export const importCuratedSources = mutation({
  args: {
    sources: v.array(v.object({
      name: v.string(),
      url: v.string(),
      region: v.string(),
      category: v.string(),
      tier: v.string(),
    })),
  },
  returns: v.object({ added: v.number(), alreadyPresent: v.number() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    if (args.sources.length > 100) throw new Error("Import the source catalog in batches of 100 or fewer.");
    let added = 0;
    let alreadyPresent = 0;
    for (const source of args.sources) {
      const parsed = new URL(source.url);
      if (parsed.protocol !== "https:") throw new Error("Source URLs must use HTTPS");
      const url = parsed.toString().replace(/\/$/, "");
      const existing = await ctx.db.query("sourceRegistry")
        .withIndex("by_url", (q) => q.eq("url", url))
        .first();
      if (existing) {
        alreadyPresent++;
        continue;
      }
      await ctx.db.insert("sourceRegistry", {
        ...source,
        url,
        isActive: false,
        failureCount: 0,
        signOffRevaAdmin: false,
        signOffVantaAdmin: false,
      });
      added++;
    }
    return { added, alreadyPresent };
  },
});

/** Approve a source only when the caller is the configured Reva administrator. */
export const approveSource = mutation({
  args: {
    id: v.id("sourceRegistry"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity) || !identity?.email) throw new Error("An approved Trium Vanta account is required");
    const email = identity.email.toLowerCase();
    const revaAdmin = env.REVA_ADMIN_EMAIL?.trim().toLowerCase();
    if (!revaAdmin || email !== revaAdmin) throw new Error("Only the configured Reva administrator can approve sources");

    const source = await ctx.db.get(args.id);
    if (!source) throw new Error("Source not found");
    const patchData = { signOffRevaAdmin: args.approved, signOffVantaAdmin: args.approved };
    await ctx.db.patch(args.id, {
      ...patchData,
      isActive: args.approved,
      approvedAt: args.approved ? Date.now() : undefined,
    });
    return { ...source, ...patchData, isActive: args.approved };
  },
});

/**
 * Update scrape timestamp or record failure.
 */
export const recordScrapeAttempt = internalMutation({
  args: {
    id: v.id("sourceRegistry"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id);
    if (!source) return;

    if (args.success) {
      await ctx.db.patch(args.id, {
        lastScrapedAt: Date.now(),
        failureCount: 0,
      });
    } else {
      await ctx.db.patch(args.id, {
        failureCount: source.failureCount + 1,
      });
    }
  },
});
