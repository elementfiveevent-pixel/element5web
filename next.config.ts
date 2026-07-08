import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin workspace root to this project so the lockfile warning disappears
    root: __dirname,
  },
};

export default nextConfig;
