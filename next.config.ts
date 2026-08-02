import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-hosting with Docker: emit a minimal runtime tree (.next/standalone)
  // containing only the production server and its traced dependencies.
  output: "standalone",
};

export default nextConfig;
