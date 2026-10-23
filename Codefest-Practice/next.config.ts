import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ViewPilot has API routes (`/api/interview`, `/api/robot`) and no remote
  // image domains; images are deliberately unoptimized for simple deploys.
  agentRules: false,
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
