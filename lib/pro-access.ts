import type { TeamMemberDoc } from "@/lib/schema";

export function hasActiveProAccess(member: Pick<TeamMemberDoc, "proStatus" | "proExpiresAt"> | undefined): boolean {
  if (member?.proStatus !== "active") return false;
  const expiry = member.proExpiresAt?.toMillis?.();
  return !expiry || expiry > Date.now();
}
