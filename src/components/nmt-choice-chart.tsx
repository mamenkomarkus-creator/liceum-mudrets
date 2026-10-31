"use client";

import { useRef, useState } from "react";
import { useRevealOnce } from "@/lib/use-reveal-once";

const TOTAL = 75;
// Survey of three classes (article 905). `ua`: share of all NMT-2026 participants, from the same article;
// the article gives no national figure for Ukrainian literature.
const DATA: { name: string; n: number; ua: number | null }[] = [
  { name: "Іноземна мова", n: 28, ua: (116_600 / 355_371) * 100 },
  { name: "Географія", n: 23, ua: (110_800 / 355_371) * 100 },
  { name: "Біологія", n: 12, ua: (75_100 / 355_371) * 100 },
  { name: "Українська література", n: 7, ua: null },
  { name: "Фізика", n: 3, ua: (11_222 / 355_371) * 100 },
  { name: "Хімія", n: 2, ua: (3_015 / 355_371) * 100 },
];
const MAX = 40; // % at the right edge of the plot
const TICKS = [0, 10, 20, 30, 40];

const pct = (v: number) => (v < 1 ? "менше 1%" : `${Math.round(v)}%`);
const pupils = (n: number) =>
  `${n} ${n % 10 === 1 && n % 100 !== 11 ? "учень" : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? "учні" : "учнів"}`;

/** Interactive version of the survey chart: bars grow in, hover/tap explains a bar, a toggle adds national shares. */
export function NmtChoiceChart() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [compare, setCompare] = useState(false);
  useRevealOnce(ref, () => setShown(true), 0.35);

  return (
    <figure ref={ref} className="nmt-chart my-10 rounded-2xl border border-[#d8e2f7] bg-[#f6f8fc] p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="block font-display text-lg font-bold leading-snug text-[#111] sm:text-xl">
            Який предмет обирають на НМТ
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">75 учнів, три класи по 25</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={compare}
          onClick={() => setCompare((v) => !v)}
          className="inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50"
        >
          <span
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${compare ? "bg-primary" : "bg-[#cfd7e6]"}`}
          >
            <span
              className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${compare ? "translate-x-[18px]" : "translate-x-0.5"}`}
            />
          </span>
          Порівняти з Україною
        </button>
      </div>

      {compare ? (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-muted-foreground" aria-hidden>
          <span className="inline-flex items-center gap-2">
            <i className="inline-block h-2.5 w-4 rounded-sm bg-primary" /> наш ліцей
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="inline-block h-3.5 w-[3px] rounded-full bg-[#16233b]" /> по Україні, НМТ-2026
          </span>
        </div>
      ) : null}

      <div className="relative mt-6" aria-hidden>
        {/* recessive grid */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-[5.5rem] sm:left-[12rem]">
          {TICKS.map((t) => (
            <span
              key={t}
              className="absolute inset-y-0 border-l border-[#dde4f0]"
              style={{ left: `${(t / MAX) * 100}%` }}
            />
          ))}
        </div>

        <ul className="relative space-y-3 sm:space-y-2.5">
          {DATA.map((d, i) => {
            const share = (d.n / TOTAL) * 100;
            // the value label goes after the national marker when that marker lies past the bar
            const labelAt = compare && d.ua !== null ? Math.max(share, d.ua) : share;
            const dim = active !== null && active !== i;
            return (
              <li key={d.name}>
                <button
                  type="button"
                  onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                  onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive((a) => (a === i ? null : i))}
                  className={`group grid w-full grid-cols-1 items-center gap-1 text-left transition-opacity duration-200 sm:grid-cols-[11rem_1fr] sm:gap-4 ${dim ? "opacity-45" : "opacity-100"}`}
                >
                  <span className="text-sm font-medium text-foreground sm:text-right">{d.name}</span>
                  {/* the track leaves 5.5rem on the right for the value label of the longest bar */}
                  <span className="relative mr-[5.5rem] flex h-7 items-center">
                    <span
                      className="nmt-bar h-full rounded-r-[4px] bg-primary"
                      style={{ width: shown ? `${(share / MAX) * 100}%` : "0%", transitionDelay: `${i * 70}ms` }}
                    />
                    <span
                      className="absolute ml-2 whitespace-nowrap text-[13px] font-semibold tabular-nums text-foreground nmt-bar-label"
                      style={{ left: shown ? `${(labelAt / MAX) * 100}%` : "0%", transitionDelay: `${i * 70}ms` }}
                    >
                      {d.n} <span className="font-normal text-muted-foreground">· {Math.round(share)}%</span>
                    </span>
                    {compare && d.ua !== null ? (
                      <span
                        className="absolute -inset-y-1 w-[3px] -translate-x-1/2 rounded-full bg-[#16233b] ring-2 ring-[#f6f8fc]"
                        style={{ left: `${(d.ua / MAX) * 100}%` }}
                      />
                    ) : null}
                    {active === i ? (
                      <span
                        role="tooltip"
                        className="absolute left-0 top-full z-10 mt-2 w-max max-w-[17rem] rounded-lg bg-[#16233b] px-3 py-2 text-[13px] leading-snug text-white shadow-lg"
                      >
                        <b className="font-semibold">{d.name}</b>
                        <br />
                        {pupils(d.n)} із {TOTAL} — {Math.round(share)}%
                        <br />
                        <span className="text-white/75">
                          По Україні: {d.ua === null ? "у статті немає даних" : pct(d.ua)}
                        </span>
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="relative mr-[5.5rem] mt-2 h-5 text-[11px] tabular-nums text-muted-foreground sm:ml-[12rem]">
          {TICKS.map((t) => (
            <span
              key={t}
              className={`absolute ${t === 0 ? "" : "-translate-x-1/2"}`}
              style={{ left: `${(t / MAX) * 100}%` }}
            >
              {t}%
            </span>
          ))}
        </div>
      </div>

      {/* a table ignores the 1px width of sr-only, so the wrapper hides it */}
      <div className="sr-only">
        <table>
          <caption>Предмет за вибором на НМТ: опитування 75 учнів ліцею і частка по Україні на НМТ-2026</caption>
          <thead>
            <tr>
              <th scope="col">Предмет</th>
              <th scope="col">Учнів ліцею</th>
              <th scope="col">Частка в ліцеї</th>
              <th scope="col">Частка по Україні</th>
            </tr>
          </thead>
          <tbody>
            {DATA.map((d) => (
              <tr key={d.name}>
                <th scope="row">{d.name}</th>
                <td>{d.n}</td>
                <td>{Math.round((d.n / TOTAL) * 100)}%</td>
                <td>{d.ua === null ? "немає даних" : pct(d.ua)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <figcaption className="mt-4 text-sm text-muted-foreground">
        Наведіть курсор або торкніться стовпчика, щоб побачити подробиці.
      </figcaption>
    </figure>
  );
}
