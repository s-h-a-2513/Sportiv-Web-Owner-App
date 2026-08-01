"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/form";

function isConfigError(message?: string) {
  if (!message) return false;
  return (
    message.includes("NEXT_PUBLIC_SUPABASE") ||
    message.includes("Environment Variables") ||
    message.includes("anon key")
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // REQUIRED: Next.js catches boundary errors before Sentry's global handlers
    Sentry.captureException(error);
  }, [error]);

  const showMessage =
    process.env.NODE_ENV === "development" || isConfigError(error.message);

  return (
    <div className="bg-wash-scene mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h2 className="font-display text-2xl font-bold text-ink">Something went wrong</h2>
      <p className="text-sm text-muted">
        An unexpected error occurred
        {error.digest ? ` (digest ${error.digest})` : ""}.
      </p>
      {showMessage && error.message ? (
        <div className="neu-inset w-full rounded-[20px] px-3 py-2 text-sm text-ink">
          {error.message}
        </div>
      ) : null}
      {isConfigError(error.message) ? (
        <a
          href="/setup"
          className="text-sm font-semibold text-court no-underline hover:underline"
        >
          Open setup instructions
        </a>
      ) : null}
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
