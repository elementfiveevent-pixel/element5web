import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.5", "localhost"],
  turbopack: {
    // Pin workspace root to this project so the lockfile warning disappears
    root: __dirname,
  },
};

export default nextConfig;
