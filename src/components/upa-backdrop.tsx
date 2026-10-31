"use client";

import { useEffect, useRef } from "react";

/**
 * As the reader nears the end of the text, the page behind the article turns red and black.
 * The article and the comments sit on white "paper" (.upa-paper), so the text stays readable.
 * `--upa-p` (0…1) drives both the backdrop and the paper's shadow.
 */
export function UpaBackdrop() {
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const body = document.querySelector<HTMLElement>(".prose-article");
    const root = document.documentElement;
    if (!body) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = body.getBoundingClientRect();
      // 0 until 60% of the text has scrolled into view, 1 once its end reaches the bottom of the screen
      const seen = (innerHeight - r.top) / r.height;
      const t = Math.min(1, Math.max(0, (seen - 0.6) / 0.4));
      root.style.setProperty("--upa-p", (t * t * (3 - 2 * t)).toFixed(3));
    };
    const request = () => (frame ||= requestAnimationFrame(update));
    update();
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    return () => {
      removeEventListener("scroll", request);
      removeEventListener("resize", request);
      cancelAnimationFrame(frame);
      root.style.removeProperty("--upa-p");
    };
  }, []);

  return <div ref={layer} aria-hidden className="upa-backdrop" />;
}
