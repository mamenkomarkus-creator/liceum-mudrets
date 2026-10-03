function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export function YoutubeEmbed({ url, title }: { url: string; title?: string }) {
  const id = extractYoutubeId(url);
  if (!id) return null;
  return (
    <figure className="my-8">
      <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          title={title ?? "YouTube video"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {title ? <figcaption className="mt-2 text-sm text-muted-foreground">{title}</figcaption> : null}
    </figure>
  );
}
