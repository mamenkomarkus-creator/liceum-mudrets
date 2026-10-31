"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRevealOnce } from "@/lib/use-reveal-once";

interface Page {
  src: string;
  alt: string;
}

const IMG = "/images/issue9/";
const COVER: Page = { src: `${IMG}heminhvei-cover.webp`, alt: "Обкладинка книжки Артура Дроня «Гемінґвей нічого не знає»" };
const BACK: Page = {
  src: `${IMG}heminhvei-back.webp`,
  alt: "Задня обкладинка: фото Артура Дроня, коротко про автора й про книжку",
};
// Leaf i: front = right-hand page, back = left-hand page once turned.
const LEAVES: { front: Page; back: Page }[] = [
  { front: COVER, back: { src: `${IMG}heminhvei-p13.webp`, alt: "Сторінка 13: початок есею «Господь Окопний»" } },
  {
    front: { src: `${IMG}heminhvei-p14.webp`, alt: "Сторінка 14 книжки" },
    back: { src: `${IMG}heminhvei-p15.webp`, alt: "Сторінка 15 книжки" },
  },
  { front: { src: `${IMG}heminhvei-p17.webp`, alt: "Сторінка 17 книжки" }, back: BACK },
];
const CAPTIONS = [
  "Артур Дронь, «Гемінґвей нічого не знає». Видавництво Старого Лева.",
  "Есей «Господь Окопний», сторінки 13–14.",
  "«Господь Окопний», сторінки 15 і 17.",
  "Задня обкладинка: про автора й про книжку.",
];
const STEP_MS = 4200;

/**
 * The book of article 909 opens by itself when it scrolls into view: cover → two spreads of the essay
 * «Господь Окопний» → it closes on the back cover. Arrows and dots turn the pages by hand.
 */
export function BookHeminhvei() {
  const total = LEAVES.length;
  const [f, setF] = useState(0); // 0 = closed on the cover, total = closed on the back cover
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const stopAuto = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);

  useEffect(() => stopAuto, [stopAuto]);

  useRevealOnce(ref, () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setF(1);
      return;
    }
    for (let n = 1; n <= total; n++) timers.current.push(window.setTimeout(() => setF(n), 600 + (n - 1) * STEP_MS));
  });

  const go = (n: number) => {
    stopAuto();
    setF(Math.max(0, Math.min(total, n)));
  };

  return (
    <figure className="my-10">
      <div className="book-stage" ref={ref}>
        <div className="fb fb-photo" data-f={f} data-end={f === total} style={{ "--h": "calc(var(--w) * 1.535)" } as CSSProperties}>
          <span className="fb-shadow" aria-hidden />
          <span className="fb-shift">
            <span className="fb-base fb-base-right" aria-hidden />
            <span className="fb-base fb-base-left" aria-hidden />
            {LEAVES.map((leaf, i) => {
              const flipped = i < f;
              return (
                <span
                  key={leaf.front.src}
                  className={`fb-leaf${i === 0 ? " fb-leaf-cover" : ""}`}
                  data-flipped={flipped}
                  style={{ ["--z" as string]: flipped ? i + 1 : LEAVES.length - i }}
                >
                  <span className="fb-face fb-front">
                    <Image src={leaf.front.src} alt={flipped ? "" : leaf.front.alt} fill sizes="320px" className="object-cover" />
                    <span className="fb-gloss fb-gloss-right" aria-hidden />
                  </span>
                  <span className="fb-face fb-back">
                    <Image src={leaf.back.src} alt={flipped ? leaf.back.alt : ""} fill sizes="320px" className="object-cover" />
                    <span className="fb-gloss fb-gloss-left" aria-hidden />
                  </span>
                </span>
              );
            })}
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(f - 1)}
          disabled={f === 0}
          aria-label="Перегорнути назад"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <ul className="flex items-center gap-2.5" aria-label="Сторінки книжки">
          {CAPTIONS.map((c, i) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={c}
                aria-current={f === i ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all duration-200 ease-out ${
                  f === i ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-primary/50"
                }`}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => go(f + 1)}
          disabled={f === total}
          aria-label="Перегорнути далі"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <figcaption className="mx-auto mt-4 max-w-[34rem] text-center text-sm leading-snug text-muted-foreground" aria-live="polite">
        {CAPTIONS[f]}
      </figcaption>
    </figure>
  );
}
