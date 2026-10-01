export function isTriumEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@trium\.ng$/i.test(email);
}

export function isApprovedVantaIdentity(
  identity: UserIdentity | null | undefined,
): identity is UserIdentity & { email: string; vantaApproved: true } {
  return isTriumEmail(identity?.email) && identity?.vantaApproved === true;
}
import type { UserIdentity } from "convex/server";
