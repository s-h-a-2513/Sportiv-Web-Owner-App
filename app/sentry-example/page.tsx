"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Temporary public page to verify Sentry error capture end-to-end.
 * Remove after first-error verification if desired.
 */
export default function SentryExamplePage() {
  const [sent, setSent] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        background: "#FFFAF6",
        color: "#1A1410",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 20,
          padding: 24,
          background: "#fff",
          boxShadow: "0 8px 24px rgba(26,20,16,0.08)",
        }}
      >
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Sentry example</h1>
        <p style={{ fontSize: 14, color: "#3D342E", marginBottom: 16 }}>
          Captures a real client exception through the Next.js SDK init path.
        </p>
        <button
          type="button"
          style={{
            background: "#FF6B00",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
          onClick={() => {
            setSent(true);
            Sentry.captureException(
              new Error(
                "Sportiv owner-web Sentry test error (first-error setup)",
              ),
            );
          }}
        >
          Send test error
        </button>
        {sent ? (
          <p style={{ marginTop: 12, fontSize: 14, color: "#FF6B00" }}>
            Event sent — waiting for it to appear in Sentry…
          </p>
        ) : null}
      </div>
    </main>
  );
}
