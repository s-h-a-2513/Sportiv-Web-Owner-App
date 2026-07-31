import type { User } from "@supabase/supabase-js";

export function isOwner(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === "owner";
}

export function requireOwnerRole(user: User | null | undefined): asserts user is User {
  if (!user || !isOwner(user)) {
    throw new Error("Owner role required");
  }
}
