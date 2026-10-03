"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

const cache = new Map<string, string>();

function preloadImages(html: string) {
  for (const m of html.matchAll(/<img[^>]*\ssrc="([^"]+)"/g)) {
    const img = new Image();
    img.src = m[1];
  }
}

async function loadSlide(base: string, n: number, v: string): Promise<string> {
  const key = `${base}${n}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const res = await fetch(`${base}slide-${String(n).padStart(2, "0")}.html?v=${v}`);
  if (!res.ok) throw new Error(`slide ${n}: ${res.status}`);
  const html = await res.text();
  cache.set(key, html);
  preloadImages(html);
  return html;
}

/** A slide deck exported as one HTML fragment per slide (see public/decks). */
export function DeckViewer({
  base,
  count,
  label,
  version = "1",
}: {
  base: string;
  count: number;
  label: string;
  /** Bump when the exported slides change, so browsers drop their cached copies. */
  version?: string;
}) {
  const [n, setN] = useState(1);
  const [html, setHtml] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const go = useCallback((to: number) => setN(Math.max(1, Math.min(count, to))), [count]);

  useEffect(() => {
    let alive = true;
    loadSlide(base, n, version)
      .then((h) => {
        if (!alive) return;
        setHtml(h);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    // warm the neighbours so turning a slide is instant
    for (const k of [n + 1, n + 2, n - 1]) if (k >= 1 && k <= count) loadSlide(base, k, version).catch(() => {});
    return () => {
      alive = false;
    };
  }, [base, n, count, version]);

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFull() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frame.current?.requestFullscreen?.();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "PageDown") { e.preventDefault(); go(n + 1); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(n - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(1); }
    else if (e.key === "End") { e.preventDefault(); go(count); }
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(n + (dx < 0 ? 1 : -1));
  }

  const btn =
    "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <figure className="my-10">
      <div
        ref={frame}
        role="group"
        aria-roledescription="слайд-шоу"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="deck-frame rounded-xl outline-offset-4"
      >
        <div
          className="deck-stage"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={onTouchEnd}
        >
          {html !== null ? (
            <div key={n} className="deck-slide" aria-live="polite" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="deck-loading">{failed ? "Не вдалося завантажити слайд" : "Завантаження…"}</div>
          )}
          {failed && html !== null ? <div className="deck-loading deck-error">Не вдалося завантажити слайд</div> : null}
        </div>

        <div className="deck-bar">
          <button type="button" className={btn} onClick={() => go(n - 1)} disabled={n === 1} aria-label="Попередній слайд">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <label className="deck-range">
            <span className="sr-only">Слайд {n} з {count}</span>
            <input
              type="range"
              min={1}
              max={count}
              value={n}
              onChange={(e) => go(Number(e.target.value))}
              aria-valuetext={`Слайд ${n} з ${count}`}
            />
          </label>
          <span className="deck-count" aria-hidden>
            {n} / {count}
          </span>
          <button type="button" className={btn} onClick={() => go(n + 1)} disabled={n === count} aria-label="Наступний слайд">
            <ChevronRight size={20} aria-hidden />
          </button>
          <button
            type="button"
            className={btn}
            onClick={toggleFull}
            aria-label={full ? "Вийти з повного екрана" : "На весь екран"}
          >
            {full ? <Minimize2 size={18} aria-hidden /> : <Maximize2 size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </figure>
  );
}
