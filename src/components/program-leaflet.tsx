"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, Download, FoldHorizontal, UnfoldHorizontal } from "lucide-react";
import { useRevealOnce } from "@/lib/use-reveal-once";
import { ScheduleBoard } from "./schedule-board";

const DIR = "/images/issue8/program/";
const STEP_MS = 1900;

function Panel({ file, alt, sizes = "260px" }: { file: string; alt: string; sizes?: string }) {
  return <Image src={`${DIR}${file}.webp`} alt={alt} fill sizes={sizes} className="object-cover" />;
}

/** The printed tri-fold programme: opens like the real leaflet, then points at the timetable. */
export function ProgramLeaflet() {
  const [f, setF] = useState(0); // 0 closed · 1 cover opened · 2 fully opened
  const [outside, setOutside] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const stop = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  useEffect(() => stop, [stop]);

  useRevealOnce(ref, () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setF(2);
      return;
    }
    timers.current.push(window.setTimeout(() => setF(1), 700));
    timers.current.push(window.setTimeout(() => setF(2), 700 + STEP_MS));
  });

  const toggle = () => {
    stop();
    setOutside(false);
    setF(f === 2 ? 0 : f === 0 ? 1 : 2);
  };

  const seg =
    "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-150";

  return (
    <div className="my-12">
      <figure>
        <div className="book-stage" ref={ref}>
          <div className="lf" data-f={f} data-outside={outside}>
            <span className="lf-shadow" aria-hidden />

            <span className="lf-shift" aria-hidden={outside}>
              <span className="lf-mid">
                <Panel file="in-m" alt="Програма пленарного засідання конференції 16 вересня 2026 року" />
              </span>

              <span className="lf-leaf lf-flap" data-open={f >= 2}>
                <span className="lf-face lf-front">
                  <Panel file="out-a" alt="Школа суспільних дисциплін: розклад занять" />
                </span>
                <span className={`lf-face lf-back ${f >= 2 ? "lf-glow" : ""}`}>
                  <Panel file="in-r" alt="Розклад навчальних занять: Природнича школа та Школа філології" />
                </span>
              </span>

              <span className="lf-leaf lf-cover" data-open={f >= 1}>
                <span className="lf-face lf-front">
                  <Panel file="out-c" alt="Обкладинка: програма установчої конференції учнів-членів МАН, 16.09.2026" />
                </span>
                <span className="lf-face lf-back">
                  <Panel file="in-l" alt="Вітальне слово начальника Управління освіти і науки Юрія Федоровича Петрика" />
                </span>
              </span>
            </span>

            <span className="lf-outside" aria-hidden={!outside}>
              <span className="lf-op">
                <Panel file="out-a" alt="Школа суспільних дисциплін: розклад занять" />
              </span>
              <span className="lf-op">
                <Panel file="out-b" alt="Школа математичних та фізичних дисциплін і адреса ліцею" />
              </span>
              <span className="lf-op">
                <Panel file="out-c" alt="Обкладинка програми" />
              </span>
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:brightness-110 active:scale-95"
          >
            {f === 2 ? <FoldHorizontal size={17} aria-hidden /> : <UnfoldHorizontal size={17} aria-hidden />}
            {f === 2 ? "Згорнути програму" : f === 0 ? "Розгорнути програму" : "Розгорнути до кінця"}
          </button>

          <div role="group" aria-label="Бік програми" className="inline-flex rounded-full border border-border bg-card p-1">
            <button
              type="button"
              aria-pressed={!outside}
              onClick={() => { stop(); setOutside(false); if (f === 0) setF(2); }}
              className={`${seg} ${!outside ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-primary"}`}
            >
              Внутрішній бік
            </button>
            <button
              type="button"
              aria-pressed={outside}
              onClick={() => { stop(); setOutside(true); }}
              className={`${seg} ${outside ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-primary"}`}
            >
              Зовнішній бік
            </button>
          </div>

          <a
            href="#man-schedule"
            className={`inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity duration-500 hover:underline ${
              f === 2 && !outside ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            tabIndex={f === 2 && !outside ? 0 : -1}
          >
            Розклад занять
            <ArrowDown size={15} aria-hidden />
          </a>
        </div>

        <figcaption className="mx-auto mt-3 max-w-[34rem] text-center text-sm leading-snug text-muted-foreground">
          Друкована програма установчої конференції. Розклад занять — нижче в зручному вигляді.{" "}
          <a
            href="/docs/man-program-2026.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <Download size={13} aria-hidden />
            PDF
          </a>
        </figcaption>
      </figure>

      <div className="mt-10">
        <ScheduleBoard />
      </div>
    </div>
  );
}
