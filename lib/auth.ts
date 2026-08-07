import type { User } from "@supabase/supabase-js";

export function isOwner(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === "owner";
}

export function requireOwnerRole(user: User | null | undefined): asserts user is User {
  if (!user || !isOwner(user)) {
    throw new Error("Owner role required");
  }
}

/**
 * Post-auth redirect target. Allows /app… and password-update recovery path only.
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) {
    return fallback;
  }
  const pathOnly = raw.split("?")[0] ?? raw;
  if (pathOnly === "/reset-password/update") return "/reset-password/update";
  if (pathOnly.startsWith("/app")) return pathOnly;
  return fallback;
}
