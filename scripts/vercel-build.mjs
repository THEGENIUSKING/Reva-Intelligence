/**
 * scripts/vercel-build.mjs
 *
 * Reva Vercel Build Script:
 * Automatically runs Convex deployment if CONVEX_DEPLOY_KEY is set in Vercel,
 * otherwise builds the client bundle cleanly.
 */
import { execSync } from "node:child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });

console.log("==> Starting Reva build for Vercel deployment...");

if (process.env.VERCEL_ENV === "production" && process.env.CONVEX_DEPLOY_KEY) {
  console.log("==> Detected CONVEX_DEPLOY_KEY. Deploying Convex backend and building frontend...");
  run('npx convex deploy --cmd "npm run build" --cmd-url-env-var-name VITE_CONVEX_URL');
} else {
  console.log("==> Building frontend bundle...");
  run("npm run build");
}

console.log("==> Reva build completed successfully!");
