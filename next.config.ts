import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        // Either use domains:
        // domains: ["images.unsplash.com", "image.mux.com", "assets.mux.com"],

        // …or remotePatterns (more flexible/recommended):
        remotePatterns: [
            { protocol: "https", hostname: "img.clerk.com" },  // Clerk user profile images
            { protocol: "https", hostname: "image.mux.com" },   // Mux poster/thumbnail
            { protocol: "https", hostname: "assets.mux.com" },  // Mux storyboards, etc.
            { protocol: "https", hostname: "utfs.io" },  // UploadThing
            { protocol: "https", hostname: "i.ytimg.com" }, // YouTube Thumbnails
            { protocol: "https", hostname: "yt3.ggpht.com" }, // YouTube Channel Avatars
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_BUNNY_PULLZONE_HOST || "vz-cd04a7d4-494.b-cdn.net",
              pathname: "/**",
            },

            //FOR AWS
            {
                protocol: "https",
                hostname: "*.s3.*.amazonaws.com",
                pathname: "/**",
            },

            // {protocol: "https", hostname: ""}
            // { protocol: "https", hostname: "" },  // TODO: upload thing
        ],
        domains: [
            process.env.BUNNY_PULLZONE_HOST || "vz-cd04a7d4-494.b-cdn.net",
        ],
        formats: ["image/avif", "image/webp"],
    },
};

export default nextConfig;
