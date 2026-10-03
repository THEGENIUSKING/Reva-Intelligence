const fs = require("fs");
let content = fs.readFileSync("convex/scouting.ts", "utf8");

const pageQuery = `export const listFindingsPage = query({
  args: { paginationOpts: paginationOptsValidator, typeFilter: v.optional(v.union(v.literal("emerging_tech"), v.literal("nigeria_policy"))) },
  returns: paginationResultValidator(findingDoc),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    let q = ctx.db.query("scoutFindings");
    if (args.typeFilter) {
      return await q.withIndex("by_scoutType_createdAt", q => q.eq("scoutType", args.typeFilter!)).order("desc").paginate(args.paginationOpts);
    } else {
      return await q.withIndex("by_createdAt").order("desc").paginate(args.paginationOpts);
    }
  }
});

export const listRecentFindings = query({`;

content = content.replace("export const listRecentFindings = query({", pageQuery);

// Add totalFindingsAllTime to getOverview
content = content.replace(
  "articlesLastDay: v.number(), ideasLastDay: v.number(), geminiConfigured: v.boolean(),",
  "articlesLastDay: v.number(), ideasLastDay: v.number(), geminiConfigured: v.boolean(), totalFindingsAllTime: v.number(),"
);
content = content.replace(
  "articlesLastDay: recentArticles.length,",
  "totalFindingsAllTime: (await ctx.db.query(\"scoutFindings\").collect()).length,\n        articlesLastDay: recentArticles.length,"
);

fs.writeFileSync("convex/scouting.ts", content, "utf8");
