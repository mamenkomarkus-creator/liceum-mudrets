"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useDialogFocus } from "@/lib/use-dialog-focus";

export interface PaperPage {
  /** Page image for leafing (about 1240 px wide). */
  src: string;
  /** The same page for reading on the full screen (about 2480 px wide). */
  full: string;
  alt: string;
}

/**
 * A printed newspaper to leaf through: the front page lies alone, a turn opens the spreads, the last
 * turn closes it on the back page. Click a page, swipe, or use the arrows; any page opens full screen to read.
 * Pages go in pairs on leaves: leaf i carries page 2i on its front and page 2i+1 on its back.
 */
export function PaperFlipbook({ pages }: { pages: PaperPage[] }) {
  const leaves = Array.from({ length: Math.floor(pages.length / 2) }, (_, i) => ({ front: pages[2 * i], back: pages[2 * i + 1] }));
  const total = leaves.length;
  const [f, setF] = useState(0); // 0 = closed on the front page, total = closed on the back page
  const [touched, setTouched] = useState(false);
  const [zoom, setZoom] = useState<number | null>(null);
  const go = useCallback(
    (n: number) => {
      setTouched(true);
      setF(Math.max(0, Math.min(total, n)));
    },
    [total]
  );
  const visible = f === 0 ? [0] : f === total ? [pages.length - 1] : [2 * f - 1, 2 * f];
  const label = visible.length === 1 ? `Сторінка ${visible[0] + 1} з ${pages.length}` : `Сторінки ${visible[0] + 1}–${visible[1] + 1} з ${pages.length}`;
  const pageState = (p: number) => Math.min(total, Math.floor((p + 1) / 2));

  // arrows turn the pages (or switch pages in the reader)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (zoom !== null) {
        if (e.key === "Escape") setZoom(null);
        else if (e.key === "ArrowRight") setZoom((z) => (z === null ? z : Math.min(pages.length - 1, z + 1)));
        else if (e.key === "ArrowLeft") setZoom((z) => (z === null ? z : Math.max(0, z - 1)));
        return;
      }
      if (e.key === "ArrowRight") go(f + 1);
      else if (e.key === "ArrowLeft") go(f - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [f, go, zoom, pages.length]);

  // a swipe turns a page; a tap without movement is handled by the page's own click
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  function onPointerDown(e: PointerEvent) {
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  }
  function onPointerUp(e: PointerEvent) {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
      swiped.current = true;
      go(dx < 0 ? f + 1 : f - 1);
    }
  }

  return (
    <div className="np-desk">
      <div className="np-stage">
        <div
          className="np"
          data-f={f}
          data-end={f === total}
          data-teasing={!touched && f === 0}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <span className="np-shadow" aria-hidden />
          <span className="np-shift">
            <span className="np-base np-base-right" aria-hidden />
            <span className="np-base np-base-left" aria-hidden />
            {leaves.map((leaf, i) => {
              const flipped = i < f;
              return (
                <span
                  key={leaf.front.src}
                  className="np-leaf"
                  data-flipped={flipped}
                  style={{ ["--z" as string]: flipped ? i + 1 : total - i }}
                  onClick={() => {
                    if (swiped.current) return;
                    go(flipped ? i : i + 1);
                  }}
                >
                  {([
                    ["front", leaf.front, 2 * i],
                    ["back", leaf.back, 2 * i + 1],
                  ] as const).map(([side, p, n]) => (
                    <span key={side} className={`np-face np-${side}`}>
                      <Image
                        src={p.src}
                        alt={visible.includes(n) ? p.alt : ""}
                        fill
                        quality={90}
                        priority={n === 0}
                        sizes="(max-width: 768px) 50vw, 560px"
                        className="object-cover"
                        draggable={false}
                      />
                      <span className="np-gloss" aria-hidden />
                      <button
                        type="button"
                        className="np-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoom(n);
                        }}
                        aria-label={`Читати сторінку ${n + 1} на весь екран`}
                        tabIndex={visible.includes(n) ? 0 : -1}
                      >
                        <Maximize2 size={16} aria-hidden />
                      </button>
                    </span>
                  ))}
                </span>
              );
            })}
          </span>
        </div>
      </div>

      <div className="np-controls">
        <button type="button" onClick={() => go(f - 1)} disabled={f === 0} aria-label="Попередня сторінка" className="np-btn">
          <ChevronLeft size={22} aria-hidden />
        </button>
        <span className="np-label" aria-live="polite">
          {label}
        </span>
        <button type="button" onClick={() => go(f + 1)} disabled={f === total} aria-label="Наступна сторінка" className="np-btn">
          <ChevronRight size={22} aria-hidden />
        </button>
      </div>
      <p className="np-hint">Натисніть на сторінку, щоб перегорнути, або на значок у куті, щоб читати на весь екран.</p>

      <ul className="np-thumbs" aria-label="Сторінки газети">
        {pages.map((p, n) => (
          <li key={p.src}>
            <button
              type="button"
              onClick={() => go(pageState(n))}
              aria-current={visible.includes(n) ? "true" : undefined}
              aria-label={`Сторінка ${n + 1}`}
            >
              <Image src={p.src} alt="" width={124} height={175} sizes="96px" />
              <span>{n + 1}</span>
            </button>
          </li>
        ))}
      </ul>

      {zoom !== null ? <PaperReader pages={pages} index={zoom} onIndex={setZoom} onClose={() => setZoom(null)} /> : null}
    </div>
  );
}

/** One page on the full screen, wide enough to read; a tap on the page toggles between fit-to-width and actual size. */
function PaperReader({
  pages,
  index,
  onIndex,
  onClose,
}: {
  pages: PaperPage[];
  index: number;
  onIndex: (n: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [big, setBig] = useState(false);
  useDialogFocus(ref, true);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [index]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const page = pages[index];
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={`Сторінка ${index + 1} з ${pages.length}`} className="np-reader">
      <div className="np-reader-bar">
        <span className="np-reader-title">
          Сторінка {index + 1} з {pages.length}
        </span>
        <span className="np-reader-tools">
          <button type="button" onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Попередня сторінка">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" onClick={() => onIndex(index + 1)} disabled={index === pages.length - 1} aria-label="Наступна сторінка">
            <ChevronRight size={20} aria-hidden />
          </button>
          <button type="button" onClick={() => setBig((b) => !b)} aria-label={big ? "Зменшити" : "Збільшити"}>
            {big ? <ZoomOut size={20} aria-hidden /> : <ZoomIn size={20} aria-hidden />}
          </button>
          <button type="button" onClick={onClose} aria-label="Закрити">
            <X size={20} aria-hidden />
          </button>
        </span>
      </div>
      <div ref={scroller} className="np-reader-scroll">
        <Image
          key={page.full}
          src={page.full}
          alt={page.alt}
          width={2480}
          height={3507}
          unoptimized
          onClick={() => setBig((b) => !b)}
          className={`np-reader-page ${big ? "np-reader-page-big" : ""}`}
        />
      </div>
    </div>
  );
}
