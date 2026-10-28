import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served under a subpath on the shared Funnel hostname (spec §12).
  basePath: process.env.BASE_PATH || "/adventure",
  // Keeps the dev-only badge out of Playwright screenshots; no effect in production.
  devIndicators: false,
};

export default nextConfig;
