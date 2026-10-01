import { action, env } from "./_generated/server";
import { v } from "convex/values";
import { isApprovedVantaIdentity } from "./access";

/** Read-only connectivity check. Only returns connection state and a count. */
export const checkConnection = action({
  args: {},
  returns: v.object({ connected: v.boolean(), checkedAt: v.number(), ideaBankRecords: v.number(), message: v.string() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!isApprovedVantaIdentity(identity)) throw new Error("An approved Trium Vanta account is required");
    const key = env.VANTA_API_KEY;
    const base = env.VANTA_API_BASE_URL;
    if (!key || !base) return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: "Vanta read API is not configured on this Reva deployment." };
    let url: URL;
    try { url = new URL("/api/v1/portfolio?limit=1000", base); }
    catch { return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: "Vanta API base URL is invalid." }; }
    if (url.protocol !== "https:") return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: "Vanta API must use HTTPS." };
    try {
      const response = await fetch(url, {
        headers: { authorization: `Bearer ${key}`, accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: `Vanta API returned HTTP ${response.status}.` };
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== "object" || !("items" in payload) || !Array.isArray(payload.items)) {
        return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: "Vanta returned an unexpected response." };
      }
      const ideaBankRecords = payload.items.filter((item: unknown) => item && typeof item === "object" && "portfolioTab" in item && item.portfolioTab === "bank").length;
      return { connected: true, checkedAt: Date.now(), ideaBankRecords, message: "Vanta portfolio read is working. Idea Bank submission also requires write scope; Reva checks that when it submits an eligible idea." };
    } catch {
      return { connected: false, checkedAt: Date.now(), ideaBankRecords: 0, message: "Could not reach Vanta. Check the API URL, key scope, and Vanta deployment." };
    }
  },
});
