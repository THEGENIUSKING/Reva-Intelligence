import type { AuthConfig } from "convex/server";
import { env } from "./_generated/server";

// Vanta auth providers – Production, Development, and optional fallback.
const providers: AuthConfig["providers"] = [];

if (env.VANTA_CONVEX_SITE_URL) {
  providers.push({
    domain: env.VANTA_CONVEX_SITE_URL,
    applicationID: "convex",
  });
}

if (env.VANTA_DEV_CONVEX_SITE_URL) {
  providers.push({
    domain: env.VANTA_DEV_CONVEX_SITE_URL,
    applicationID: "convex",
  });
}

// New: support explicit production provider (useful when staging separate Vanta deployment).
if (env.VANTA_PROD_CONVEX_SITE_URL) {
  providers.push({
    domain: env.VANTA_PROD_CONVEX_SITE_URL,
    applicationID: "convex",
  });
}

export default {
  providers,
} satisfies AuthConfig;
