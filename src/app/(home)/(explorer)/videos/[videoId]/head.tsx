import React from 'react'
import { db } from '@/db'
import { videos, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

type Props = { params: { videoId: string } }

function truncate(str: string | null | undefined, n = 160) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export default async function Head({ params }: Props) {
  const { videoId } = params

  const [row] = await db
    .select({
      id: videos.id,
      title: videos.title,
      description: videos.description,
      thumbnailUrl: videos.thumbnailUrl,
      createdAt: videos.createdAt,
      playbackUrl: videos.playbackUrl,
      userId: videos.userId,
      authorName: users.name,
      authorImage: users.imageUrl,
    })
    .from(videos)
    .leftJoin(users, eq(videos.userId, users.id))
    .where(eq(videos.id, videoId))
    .limit(1)

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boostervideos.net'
  const pageUrl = `${site}/videos/${videoId}`
  const title = row?.title ? `${row.title} | Booster` : 'Booster'
  const description = truncate(row?.description ?? 'Watch this video on Booster', 160)
  const image = row?.thumbnailUrl ? (row.thumbnailUrl.startsWith('http') ? row.thumbnailUrl : `${site}${row.thumbnailUrl}`) : `${site}/BoosterLongLogo.tmp.png`

  const jsonLd = row
    ? JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: row.title,
        description: row.description ?? '',
        thumbnailUrl: image,
        uploadDate: row.createdAt?.toISOString?.() ?? undefined,
        contentUrl: row.playbackUrl ?? undefined,
        url: pageUrl,
        author: row.authorName ? { '@type': 'Person', name: row.authorName } : { '@type': 'Organization', name: 'Booster' },
      })
    : ''

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={pageUrl} />
      <meta name="robots" content="index,follow" />

      {/* Open Graph */}
      <meta property="og:type" content="video.other" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={row?.title ?? 'Booster video'} />

      {row?.playbackUrl && (
        <>
          <meta property="og:video" content={row.playbackUrl} />
          <meta property="og:video:secure_url" content={row.playbackUrl} />
          <meta property="og:video:type" content="video/mp4" />
        </>
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="player" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={row?.title ?? 'Booster video'} />
      {row?.playbackUrl && (
        <>
          <meta name="twitter:player" content={row.playbackUrl} />
          <meta name="twitter:player:width" content="1280" />
          <meta name="twitter:player:height" content="720" />
        </>
      )}

      {/* JSON-LD VideoObject */}
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
    </>
  )
}
