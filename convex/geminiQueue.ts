import { internalMutation } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// Reserve a project-wide request slot across every independently running action.
export const reserveSlot = internalMutation({
  args: { now: v.number() },
  returns: v.number(),
  handler: async (ctx, { now }) => {
    const row = await ctx.db.query("geminiQueue").withIndex("by_key", q => q.eq("key", "project")).first();
    const slotAt = Math.max(now, row?.nextSlotAt ?? now);
    if (row) await ctx.db.patch(row._id, { nextSlotAt: slotAt + 15_000 });
    else await ctx.db.insert("geminiQueue", { key: "project", nextSlotAt: slotAt + 15_000 });
    return Math.max(0, slotAt - now);
  },
});

export async function waitForGeminiSlot(ctx: ActionCtx) {
  const delay = await ctx.runMutation(internal.geminiQueue.reserveSlot, { now: Date.now() });
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
}
