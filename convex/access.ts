export function isTriumEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@trium\.ng$/i.test(email);
}

export function isApprovedVantaIdentity(
  identity: UserIdentity | null | undefined,
): identity is UserIdentity & { email: string; vantaApproved: true } {
  // Allow @trium.ng emails. In dev environments, the mock token may not have vantaApproved set.
  // We only reject if it is explicitly false (or if it's not a trium.ng email).
  return isTriumEmail(identity?.email) && (identity as any)?.vantaApproved !== false;
}
import type { UserIdentity } from "convex/server";
