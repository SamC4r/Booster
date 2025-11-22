import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { videos } from '@/db/schema'
import { desc, eq, and } from 'drizzle-orm'

const SITE_URL =  'https://www.boostervideos.net'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily',
      priority: 1.0,
      images: [`${SITE_URL}/BoosterLongLogo.tmp.png`],
    },
    { url: `${SITE_URL}/explorer`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/next-up`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/market`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/studio`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  
}
