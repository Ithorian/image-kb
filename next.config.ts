import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // for data URLs and local blobs
  },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;