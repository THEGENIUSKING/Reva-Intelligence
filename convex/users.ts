import { query } from "./_generated/server";
import { v } from "convex/values";
import { isApprovedVantaIdentity } from "./access";

export const currentIdentity = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      authorized: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const result: { name?: string; email?: string; authorized: boolean } = {
      authorized: isApprovedVantaIdentity(identity),
    };
    if (identity.name) result.name = identity.name;
    if (identity.email) result.email = identity.email;
    return result;
  },
});
