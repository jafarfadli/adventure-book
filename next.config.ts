import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served under a subpath on the shared Funnel hostname (spec §12).
  basePath: process.env.BASE_PATH || "/adventure",
};

export default nextConfig;
