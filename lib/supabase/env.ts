export type PublicSupabaseEnv =
  | { ok: true; url: string; anonKey: string }
  | { ok: false; message: string };

/**
 * Validates public Supabase env for browser, server, and middleware.
 * Returns a safe message (no secret values) when misconfigured.
 */
export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false,
      message:
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them in your host’s Environment Variables (Vercel → Settings → Environment Variables), then redeploy.",
    };
  }

  // JWT anon keys are long; short values usually mean a truncated/wrong key was pasted.
  if (anonKey.length < 100) {
    return {
      ok: false,
      message:
        "NEXT_PUBLIC_SUPABASE_ANON_KEY looks invalid (too short). Set the full anon/public key from the Supabase dashboard (same value as Flutter SUPABASE_ANON_KEY), then redeploy.",
    };
  }

  return { ok: true, url, anonKey };
}

export function requirePublicSupabaseEnv(): { url: string; anonKey: string } {
  const env = getPublicSupabaseEnv();
  if (!env.ok) {
    throw new Error(env.message);
  }
  return { url: env.url, anonKey: env.anonKey };
}
