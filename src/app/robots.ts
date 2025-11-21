import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boostervideos.net'

export default function robots(): MetadataRoute.Robots {
  return {
    host: SITE_URL,
    rules: [
      // Allow all standard crawlers on the main site
      { userAgent: "*", allow: "/" },
      // Disallow internal and API routes from being indexed
      { userAgent: "*", disallow: "/api" },
      { userAgent: "*", disallow: "/_next" },
      { userAgent: "*", disallow: "/internal" },
    ],
    // reference the sitemap
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

