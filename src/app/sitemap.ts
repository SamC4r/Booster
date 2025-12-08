import type { MetadataRoute } from 'next'

const SITE_URL =  'https://www.boostervideos.net'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
      images: [`${SITE_URL}/logo.webp`],
    },
    { url: `${SITE_URL}/next-up`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/market`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.6 },

  ]

  return urls;
}
