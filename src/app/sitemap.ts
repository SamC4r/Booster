import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { videos } from '@/db/schema'
import { desc, eq, and } from 'drizzle-orm'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boostervideos.net'

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
    { url: `${SITE_URL}/feed`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/search`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/market`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/upload`, changeFrequency: 'weekly', priority: 0.5 },
  ]

  try {
    // include recent public, completed videos (up to 500)
    const recent = await db
      .select({ id: videos.id, updatedAt: videos.updatedAt, thumbnailUrl: videos.thumbnailUrl })
      .from(videos)
      .where(and(eq(videos.visibility, 'public'), eq(videos.status, 'completed')))
      .orderBy(desc(videos.updatedAt))
      .limit(500)

    for (const v of recent) {
      urls.push({
        url: `${SITE_URL}/videos/${v.id}`,
        lastModified: v.updatedAt?.toISOString() ?? new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
        images: v.thumbnailUrl ? [v.thumbnailUrl.startsWith('http') ? v.thumbnailUrl : `${SITE_URL}${v.thumbnailUrl}`] : undefined,
      })
    }
  } catch (err) {
    // If DB is not available in the build environment, fall back to static sitemap.
    console.warn('sitemap: failed to query recent videos', err)
  }

  return urls
}
