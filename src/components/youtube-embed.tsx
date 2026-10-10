"use client";

import { useState } from "react";
import { Play } from "lucide-react";

function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

/** The player is only requested after a click, so YouTube gets no data from visitors who just read the page. */
export function YoutubeEmbed({ url, title }: { url: string; title?: string }) {
  const id = extractYoutubeId(url);
  const [loaded, setLoaded] = useState(false);
  if (!id) return null;
  return (
    <figure className="my-8">
      <div className="relative w-full overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "16 / 9" }}>
        {loaded ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
            title={title ?? "Відео YouTube"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center">
            <button
              type="button"
              onClick={() => setLoaded(true)}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-[filter] duration-150 ease-out hover:brightness-110"
            >
              <Play size={16} aria-hidden />
              Завантажити й відтворити відео{title ? `: ${title}` : ""}
            </button>
            <p className="max-w-md text-sm text-muted-foreground">
              Відео розміщене на YouTube. Доки ви не натиснете кнопку, жодних даних на YouTube не передається.
            </p>
          </div>
        )}
      </div>
      {title ? <figcaption className="mt-2 text-sm text-muted-foreground">{title}</figcaption> : null}
    </figure>
  );
}
