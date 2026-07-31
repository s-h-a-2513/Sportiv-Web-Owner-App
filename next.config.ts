import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Suppress source-map upload logs unless CI
  silent: !process.env.CI,
  // Upload a larger set of source maps for prettier client stack traces
  widenClientFileUpload: true,
  // Tunneling optional — leave unset for local first-error setup
  // tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
