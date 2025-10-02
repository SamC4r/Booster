// components/BunnyEmbed.tsx
export function BunnyEmbed({
  libraryId,
  videoId,
  autoplay = false,
  muted = false,
  token,
  expires,
}: {
  libraryId: string | null;
  videoId: string | null;
  autoplay?: boolean;
  muted?: boolean;
  token?: string;
  expires?: number;
}) {
  const params = new URLSearchParams({ autoplay: String(autoplay), muted: String(muted) });
  if (token && expires) { params.set("token", token); params.set("expires", String(expires)); }
  const src = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?${params}`;

  return (
    // <div style={{ position: "relative", paddingTop: "56.25%" }} className="h-full w-full">
      <iframe
        src={src}
        style={{ border: 0, position: "absolute", inset: 0, width: "100%", height: "100%" }}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"

      />
    // </div>
  );
}
