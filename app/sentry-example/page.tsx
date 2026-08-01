"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/form";

/**
 * Temporary public page to verify Sentry error capture end-to-end.
 * Remove after first-error verification if desired.
 */
export default function SentryExamplePage() {
  const [sent, setSent] = useState(false);

  return (
    <main className="bg-wash-scene flex min-h-screen items-center justify-center px-6 py-12 md:px-10">
      <div className="neu-raised w-full max-w-md rounded-[28px] p-6 md:p-8">
        <BrandMark size="md" href="/" className="mb-6" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Sentry example</h1>
        <p className="mt-2 text-sm text-muted">
          Captures a real client exception through the Next.js SDK init path.
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => {
            setSent(true);
            Sentry.captureException(
              new Error("Sportiv owner-web Sentry test error (first-error setup)"),
            );
          }}
        >
          Send test error
        </Button>
        {sent ? (
          <p className="mt-3 text-sm font-semibold text-court">
            Event sent — waiting for it to appear in Sentry…
          </p>
        ) : null}
      </div>
    </main>
  );
}
