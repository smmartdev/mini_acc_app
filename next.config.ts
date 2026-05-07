import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  serverExternalPackages: ["typeorm", "reflect-metadata"],
};

export default nextConfig;