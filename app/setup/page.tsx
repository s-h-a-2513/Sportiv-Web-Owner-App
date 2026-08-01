import { BrandMark } from "@/components/brand-mark";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

export const metadata = {
  title: "Setup required",
};

export default function SetupPage() {
  const env = getPublicSupabaseEnv();
  const message = env.ok
    ? "Supabase environment variables look configured. You can continue to sign in."
    : env.message;

  return (
    <main className="bg-wash-scene flex min-h-screen items-center justify-center px-6 py-12 md:px-10">
      <div className="neu-raised w-full max-w-lg rounded-[28px] p-6 md:p-8">
        <BrandMark size="md" href={env.ok ? "/login" : null} className="mb-6" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          {env.ok ? "Ready to go" : "Setup required"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>

        {!env.ok ? (
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-ink">
            <li>
              Open your host project settings (e.g. Vercel → Settings → Environment
              Variables).
            </li>
            <li>
              Add <code className="text-court">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-court">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              (same values as the Flutter app <code className="text-court">SUPABASE_*</code>{" "}
              keys).
            </li>
            <li>Redeploy the app so the new variables are baked into the build.</li>
          </ol>
        ) : (
          <a
            href="/login"
            className="neu-btn mt-6 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-white no-underline hover:no-underline"
          >
            Go to sign in
          </a>
        )}
      </div>
    </main>
  );
}
