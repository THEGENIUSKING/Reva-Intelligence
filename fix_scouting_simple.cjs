const fs = require("fs");

let content = fs.readFileSync("convex/scouting.ts", "utf8").replace(/\r\n/g, "\n");

const oldQuery = `export const listRecentArticlesPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(articleArchiveDoc),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const page = await ctx.db.query("scoutArticleSessions")
      .withIndex("by_processedAt")
      .order("desc")
      .paginate(args.paginationOpts);
    const rows = await Promise.all(page.page.map(async (session) => {
      const article = await ctx.db.get(session.articleId);
      if (!article) return null;
      return {
        _id: article._id,
        _creationTime: article._creationTime,
        urlHash: article.urlHash,
        url: article.url,
        title: article.title,
        sourceName: article.sourceName,
        sourceType: article.sourceType,
        aiSummary: article.aiSummary,
        aiSector: article.aiSector,
        isNewInSession: session.isNewInSession,
        sessionDate: session.sessionDate,
      };
    }));
    return { ...page, page: rows.filter((r) => r !== null) };
  },
});`;

const newQuery = `export const listRecentArticlesPage = query({
  args: { paginationOpts: paginationOptsValidator, isArchived: v.optional(v.boolean()) },
  returns: paginationResultValidator(articleArchiveDoc),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    let q = ctx.db.query("scoutArticleSessions");
    if (args.isArchived) {
      q = q.withIndex("by_isArchived_processedAt", q => q.eq("isArchived", true));
    } else {
      q = q.withIndex("by_isArchived_processedAt", q => q.eq("isArchived", undefined));
    }
    const page = await q.order("desc").paginate(args.paginationOpts);
    const rows = await Promise.all(page.page.map(async (session) => {
      const article = await ctx.db.get(session.articleId);
      if (!article) return null;
      return {
        _id: article._id,
        _creationTime: article._creationTime,
        urlHash: article.urlHash,
        url: article.url,
        title: article.title,
        sourceName: article.sourceName,
        sourceType: article.sourceType,
        aiSummary: article.aiSummary,
        aiSector: article.aiSector,
        isNewInSession: session.isNewInSession,
        sessionDate: session.sessionDate,
      };
    }));
    return { ...page, page: rows.filter((r) => r !== null) };
  },
});

export const archiveArticles = mutation({
  args: {
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    
    const cutoff = Date.now() - (args.olderThanDays * 24 * 60 * 60 * 1000);
    const sessions = await ctx.db.query("scoutArticleSessions")
      .withIndex("by_isArchived_processedAt", q => q.eq("isArchived", undefined))
      .filter(q => q.lt(q.field("processedAt"), cutoff))
      .take(100);
      
    for (const s of sessions) {
      await ctx.db.patch(s._id, { isArchived: true });
      await ctx.db.patch(s.articleId, { isArchived: true });
    }
    
    return sessions.length;
  }
});`;

content = content.replace(oldQuery, newQuery);

fs.writeFileSync("convex/scouting.ts", content);
