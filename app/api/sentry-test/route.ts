import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/** Temporary first-error verification endpoint — remove after confirmed. */
export async function GET() {
  const error = new Error(
    "Sportiv owner-web Sentry test error (first-error setup)",
  );
  Sentry.captureException(error);
  await Sentry.flush(2000);
  return NextResponse.json({
    ok: true,
    message: "Test error sent to Sentry",
  });
}
