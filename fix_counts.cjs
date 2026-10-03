const fs = require("fs");

let content = fs.readFileSync("convex/scouting.ts", "utf8");

content = content.replace(
  'totalFindingsAllTime: v.number(),',
  'totalFindingsAllTime: v.number(), totalArticlesAllTime: v.number(),'
);

content = content.replace(
  'totalFindingsAllTime: (await ctx.db.query("scoutFindings").collect()).length,',
  'totalFindingsAllTime: (await ctx.db.query("scoutFindings").collect()).length,\n        totalArticlesAllTime: (await ctx.db.query("scoutArticleSessions").withIndex("by_isArchived_processedAt", q => q.eq("isArchived", undefined)).collect()).length,'
);

fs.writeFileSync("convex/scouting.ts", content);
