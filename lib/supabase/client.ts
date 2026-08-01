import { createBrowserClient } from "@supabase/ssr";

function requirePublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  // JWT anon keys are long; short values usually mean a truncated/wrong key was pasted.
  if (anonKey.length < 100) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY looks invalid (too short). Copy the full anon/public key from the Supabase dashboard or the Flutter app .env (SUPABASE_ANON_KEY).",
    );
  }

  return { url, anonKey };
}

export function createClient() {
  const { url, anonKey } = requirePublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
