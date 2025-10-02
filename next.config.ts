import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Either use domains:
    // domains: ["images.unsplash.com", "image.mux.com", "assets.mux.com"],

    // …or remotePatterns (more flexible/recommended):
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "image.mux.com" },   // Mux poster/thumbnail
      { protocol: "https", hostname: "assets.mux.com" },  // (optional) storyboards, etc.
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_BUNNY_PULLZONE_HOST || "vz-a1724747-84f.b-cdn.net",
        pathname: "/**",
      },
      // {protocol: "https", hostname: ""}
      // { protocol: "https", hostname: "" },  // TODO: upload thing
    ],
     domains: [
      process.env.BUNNY_PULLZONE_HOST || "vz-a1724747-84f.b-cdn.net",
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
