"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRevealOnce } from "@/lib/use-reveal-once";

interface Spread {
  chapter: string;
  lines: [string, string];
  src: string;
  alt: string;
}

// Chapter openers and watercolour-coffee plates from «Позиція. Поезія звідти».
const SPREADS: Spread[] = [
  {
    chapter: "III",
    lines: ["Уламки", "старого життя"],
    src: "/images/issue8/ill-ruins.webp",
    alt: "Малюнок кавою: напівзруйнований багатоповерховий будинок, на передньому плані — гілки рослини",
  },
  {
    chapter: "IV",
    lines: ["Один накат", "окопного гумору"],
    src: "/images/issue8/ill-shovels.webp",
    alt: "Малюнок кавою: дві лопати біля стіни окопу",
  },
  {
    chapter: "VII",
    lines: ["Смерть співає", "колискову"],
    src: "/images/issue8/ill-trees.webp",
    alt: "Малюнок кавою: голі дерева, поле й стовпи на обрії",
  },
];

const STEP_MS = 3800;

// Oswald has no stencil cut, so the characteristic bridges are painted in per letter (see .st-* in globals.css).
const BRIDGE: Record<string, string> = { О: "o", С: "o", Є: "o", З: "o", Р: "p", Я: "ya", Т: "t", К: "k", У: "u" };

function Stencil({ text }: { text: string }) {
  return (
    <span className="fb-stencil">
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {text
          .toUpperCase()
          .split(" ")
          .map((word, w) => (
            <span key={w} className="st-word">
              {[...word].map((ch, i) => (
                <span key={i} className={`st ${BRIDGE[ch] ? `st-${BRIDGE[ch]}` : ""}`}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
      </span>
    </span>
  );
}

function TitlePage({ label, lines }: { label: string; lines: [string, string] }) {
  return (
    <span className="fb-title">
      <span className="fb-label">{label}</span>
      <Stencil text={lines[0]} />
      <Stencil text={lines[1]} />
    </span>
  );
}

export function BookIllustrations() {
  const total = SPREADS.length;
  const [f, setF] = useState(0); // 0 = closed, n = spread n is open
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
    for (let n = 1; n <= total; n++) {
      timers.current.push(window.setTimeout(() => setF(n), 500 + (n - 1) * STEP_MS));
    }
  });

  const go = (n: number) => {
    stopAuto();
    setF(Math.max(0, Math.min(total, n)));
  };

  // Leaf i: front = right-hand page, back = left-hand page once turned.
  const leaves = [
    {
      front: <TitlePage label="Позиція" lines={["Малюнки", "Федора Рудого"]} />,
      back: SPREADS[0],
    },
    { front: <TitlePage label={`Розділ ${SPREADS[0].chapter}`} lines={SPREADS[0].lines} />, back: SPREADS[1] },
    { front: <TitlePage label={`Розділ ${SPREADS[1].chapter}`} lines={SPREADS[1].lines} />, back: SPREADS[2] },
    { front: <TitlePage label={`Розділ ${SPREADS[2].chapter}`} lines={SPREADS[2].lines} />, back: null },
  ];

  return (
    <figure className="my-10">
      <div className="book-stage" ref={ref}>
        <div className="fb" data-f={f}>
          <span className="fb-shadow" aria-hidden />
          <span className="fb-shift">
            <span className="fb-base fb-base-right" aria-hidden />
            <span className="fb-base fb-base-left" aria-hidden />
            {leaves.map((leaf, i) => {
              const flipped = i < f;
              return (
                <span
                  key={i}
                  className="fb-leaf"
                  data-flipped={flipped}
                  style={{ ["--z" as string]: flipped ? i + 1 : leaves.length - i }}
                >
                  <span className="fb-face fb-front">{leaf.front}</span>
                  <span className="fb-face fb-back">
                    {leaf.back ? (
                      <span className="fb-ill">
                        <Image
                          src={leaf.back.src}
                          alt={flipped ? leaf.back.alt : ""}
                          fill
                          sizes="300px"
                          className="object-cover"
                        />
                      </span>
                    ) : null}
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
          aria-label="Попередній розворот"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={20} aria-hidden />
        </button>
        <ul className="flex items-center gap-2.5" aria-label="Розвороти">
          {SPREADS.map((s, i) => (
            <li key={s.chapter}>
              <button
                type="button"
                onClick={() => go(i + 1)}
                aria-label={`Розворот ${i + 1}: розділ ${s.chapter}`}
                aria-current={f === i + 1 ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all duration-200 ease-out ${
                  f === i + 1 ? "w-6 bg-primary" : "w-2.5 bg-border hover:bg-primary/50"
                }`}
              />
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => go(f + 1)}
          disabled={f === total}
          aria-label="Наступний розворот"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/75 transition-colors hover:border-primary hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <figcaption className="mx-auto mt-4 max-w-[34rem] text-center text-sm leading-snug text-muted-foreground" aria-live="polite">
        {f === 0
          ? "Малюнки Федора Рудого, створені за допомогою кави, у збірці «Позиція. Поезія звідти»."
          : `Розділ ${SPREADS[f - 1].chapter} — «${SPREADS[f - 1].lines.join(" ")}». Розворот ${f} з ${total}.`}
      </figcaption>
    </figure>
  );
}
