import fs from 'fs';
const code = `
export const getActiveSourceDomains = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sources = await ctx.db.query("sourceRegistry").withIndex("by_isActive", q => q.eq("isActive", true)).take(100);
    const domains = new Set<string>();
    for (const s of sources) {
      try { domains.add(new URL(s.url).hostname.replace(/^www\\./, "")); } catch {}
    }
    return Array.from(domains);
  }
});
`;
fs.appendFileSync('convex/sources.ts', code);
