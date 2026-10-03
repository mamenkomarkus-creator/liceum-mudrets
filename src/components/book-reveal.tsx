"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRevealOnce } from "@/lib/use-reveal-once";

function TreesWatermark() {
  // Ghost of the illustration printed on the other side of the leaf: canopy at the top, trunks below.
  return (
    <svg viewBox="0 0 100 153" className="absolute inset-0 h-full w-full" aria-hidden preserveAspectRatio="none">
      <g fill="none" stroke="#8b8892" strokeLinecap="round" opacity="0.3">
        <g strokeWidth="1.3">
          <path d="M14 0 q4 10 2 22 q-3 12 -10 18" />
          <path d="M34 0 q-2 12 3 24 q5 12 2 26" />
          <path d="M56 0 q3 10 -1 20 q-5 12 -2 24" />
          <path d="M78 0 q-4 12 1 26 q4 10 14 20" />
          <path d="M94 4 q-8 8 -12 20 q-3 10 -12 14" />
        </g>
        <g strokeWidth="0.7">
          <path d="M16 22 q-8 -4 -12 -12 M16 22 q8 -2 12 -10 M37 24 q8 -4 12 -12 M37 24 q-8 0 -14 -8 M55 20 q8 -2 14 -10 M55 20 q-7 0 -11 -9 M79 26 q-8 -2 -14 -12 M79 26 q8 -4 14 -12" />
          <path d="M6 40 q8 -4 14 -2 M39 50 q8 -2 14 2 M52 44 q-8 -2 -14 2 M93 46 q-6 -4 -12 -2 M70 38 q8 2 14 -2" />
        </g>
        <g strokeWidth="2.4" opacity="0.8">
          <path d="M20 153 q2 -34 -1 -62 q-2 -14 -8 -26" />
          <path d="M52 153 q1 -30 -1 -56 q-2 -14 4 -26" />
          <path d="M86 153 q-2 -32 1 -60 q2 -16 8 -28" />
        </g>
        <g strokeWidth="0.9" opacity="0.8">
          <path d="M19 92 q-8 -6 -12 -16 M19 78 q8 -4 12 -14 M51 97 q-8 -6 -10 -18 M52 82 q8 -4 10 -14 M87 93 q-8 -6 -10 -18 M89 80 q8 -4 10 -14" />
        </g>
      </g>
    </svg>
  );
}

export function BookReveal() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useRevealOnce(ref, () => setOpen(true));

  return (
    <figure className="my-10">
      <div className="book-stage">
        <button
          ref={ref}
          type="button"
          className="book"
          data-open={open}
          aria-expanded={open}
          aria-label={open ? "Закрити книгу «Позиція»" : "Розгорнути книгу «Позиція»"}
          onClick={() => {
            setOpen((v) => !v);
          }}
        >
          <span className="book-shadow" aria-hidden />
          <span className="book-shift">
            <span className="bk-page bk-right">
              <TreesWatermark />
              <span className="bk-dedic">
                <span>Присвячується захисникам і захисницям України.</span>
                <span>Усім, хто тримав і тримає свої позиції.</span>
                <span>Честь.</span>
              </span>
            </span>

            <span className="bk-cover">
              <span className="bk-face bk-front">
                <Image
                  src="/images/issue8/book-cover.webp"
                  alt="Обкладинка збірки Федора Рудого «Позиція. Поезія звідти»"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </span>
              <span className="bk-face bk-back" aria-hidden>
                <span className="bk-t bk-udc1">УДК 821.161.2’06-1:355.48(477)’’2022/…’’</span>
                <span className="bk-t bk-p88a">P88</span>
                <span className="bk-t bk-p88b">P88</span>
                <span className="bk-t bk-author">Федір Рудий</span>
                <span className="bk-t bk-biblio">
                  <span>Позиція. Поезія звідти; Федір Рудий — Львів: Видавництво 333,</span>
                  <span className="bk-flush">2026. — 176 с.</span>
                </span>
                <span className="bk-t bk-isbn1">ISBN 978-617-8056-68-1</span>
                <span className="bk-t bk-annot">
                  <span className="bk-indent">«Позиція» Федора Рудого — це гранично чесна й прониклива збірка</span>
                  <span>поезій про будні українського військового, про те, що їх наповнює, без</span>
                  <span>прикрас і пафосу. Тут смерть, яка зовсім поруч, і Дім — саме з великої</span>
                  <span>літери — про який мріється або згадується в короткі миті затишшя. А це —</span>
                  <span>це втілена у слова пам’ять про місця, що попри всі зусилля таки потрапи-</span>
                  <span>ли під окупацію, і побратимів, які поклали свої життя на захист цієї землі.</span>
                </span>
                <span className="bk-t bk-udc2">УДК 821.161.2’06-1:355.48(477)’’2022/…’’</span>
                <span className="bk-t bk-rights">
                  <span>© Федір Рудий, текст, ілюстрації, 2025</span>
                  <span>© Дмитро Подолянчук, макет,</span>
                  <span className="bk-indent">дизайн обкладинки, 2025</span>
                  <span>© Видавництво 333, 2026</span>
                </span>
                <span className="bk-t bk-reserved">Усі права застережено.</span>
                <span className="bk-t bk-isbn2">ISBN 978-617-8056-68-1</span>
              </span>
            </span>
          </span>
        </button>
      </div>
      <figcaption className="mx-auto max-w-[34rem] text-center text-sm leading-snug text-muted-foreground">
        Присвята у збірці «Позиція. Поезія звідти». Натисніть на книгу, щоб {open ? "закрити" : "розгорнути"} її.
      </figcaption>
    </figure>
  );
}
