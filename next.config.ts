import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        port: "",
        protocol: "https",
        hostname: "inul-lms-video-subscribe.fly.storage.tigris.dev",
      },
    ],
  },
};

export default nextConfig;
