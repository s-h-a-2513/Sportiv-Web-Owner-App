"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/form";

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

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-start justify-center gap-4 px-6 py-16">
      <h2 className="text-2xl font-semibold text-ink">Something went wrong</h2>
      <p className="text-sm text-muted">
        An unexpected error occurred
        {error.digest ? ` (digest ${error.digest})` : ""}.
      </p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
