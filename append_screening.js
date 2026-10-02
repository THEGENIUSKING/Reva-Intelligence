import fs from 'fs';
const code = `
export const screenBatch = action({
  args: { scoutType: v.union(v.literal("emerging_tech"), v.literal("nigeria_policy")), candidates: v.array(scoutCandidate) },
  returns: v.object({ processed: v.number(), errors: v.array(v.string()) }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("Unauthorized");
    return await ctx.runAction(internal.screening.processScoutCandidates, args);
  }
});
`;
fs.appendFileSync('convex/screening.ts', code);
