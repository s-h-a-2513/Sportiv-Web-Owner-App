"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Dev-only Sentry demo — redirects away in production. */
export default function SentryExamplePage() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      router.replace("/login");
    }
  }, [router]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <main className="bg-wash-scene flex min-h-screen items-center justify-center px-6 py-12">
      <p className="text-sm text-muted">
        Open this page only in development. Use <code>/api/sentry-test</code> to emit a test
        event.
      </p>
    </main>
  );
}
