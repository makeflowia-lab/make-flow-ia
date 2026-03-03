import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deshabilitar StrictMode evita el doble-mount en dev que causa el error "trickle before connected" de LiveKit
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
};

export default nextConfig;
