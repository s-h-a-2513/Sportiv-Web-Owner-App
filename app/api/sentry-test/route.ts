import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

/** Dev-only first-error verification endpoint. */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
