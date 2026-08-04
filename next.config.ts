import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // for data URLs and local blobs
  },
};

export default nextConfig;
