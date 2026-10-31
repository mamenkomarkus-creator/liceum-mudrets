"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Pause, Play } from "lucide-react";

const SLIDE_MS = 5000;

interface Member {
  name: string;
  role: string;
  photo: string;
  position?: string;
  article?: { title: string; href: string };
}

// Team of issue 9 (11-А), in the order of their articles.
const TEAM: Member[] = [
  { name: "Анастасія Кутова", role: "Редакторка випуску", photo: "/images/issue9/kutova-lake.webp", position: "center 30%" },
  {
    name: "Вікторія Геращенко",
    role: "Авторка статті",
    photo: "/images/issue9/author-herashchenko.webp",
    position: "center 18%",
    article: { title: "Код успіху на НМТ-2027", href: "/article/902" },
  },
  {
    name: "Артем Земляк",
    role: "Співавтор статті",
    photo: "/images/issue9/author-zemliak.webp",
    position: "center 25%",
    article: { title: "Один предмет на вибір", href: "/article/905" },
  },
  {
    name: "Тимофій Кошмак",
    role: "Співавтор статті",
    photo: "/images/issue9/author-koshmak.webp",
    position: "center 35%",
    article: { title: "Один предмет на вибір", href: "/article/905" },
  },
  {
    name: "Карина Бондаренко",
    role: "Авторка інтерв’ю",
    photo: "/images/issue9/author-bondarenko.webp",
    position: "center 16%",
    article: { title: "Військові завжди спрямовані на перемогу", href: "/article/906" },
  },
  {
    name: "Дарина Ямбуренко",
    role: "Авторка статті",
    photo: "/images/issue9/author-yamburenko.webp",
    position: "center 45%",
    article: { title: "«Грай, [Марку]»", href: "/article/908" },
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The editorial team as a story-style slideshow: portraits change on their own every few seconds,
 * with a progress bar per person, avatars to jump to anyone, and a pause button.
 * It stops while hovered, focused or off screen, and never runs on its own with reduced motion.
 */
export function TeamCarousel() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [held, setHeld] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const autoplay = playing && !reduceMotion;
  const running = autoplay && !held && onScreen;
  const member = TEAM[index];

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setOnScreen(true);
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = (next: number) => setIndex((next + TEAM.length) % TEAM.length);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") go(index + 1);
    else if (e.key === "ArrowLeft") go(index - 1);
    else return;
    e.preventDefault();
  }

  return (
    <section
      ref={ref}
      aria-roledescription="карусель"
      aria-label="Команда випуску"
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      // Only keyboard focus holds the slide: a mouse click also focuses the avatar in Chrome,
      // and the slideshow would then stay paused until the reader clicked somewhere else.
      onFocus={(e) => e.target.matches(":focus-visible") && setHeld(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}
      className="team-carousel my-10 overflow-hidden rounded-2xl border border-[#d8e2f7] bg-[#f6f8fc]"
    >
      <div className="grid sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="relative aspect-square overflow-hidden bg-[#dfe6f5] sm:aspect-auto sm:min-h-[440px]">
          {TEAM.map((m, i) => (
            <Image
              key={m.photo}
              src={m.photo}
              alt={i === index ? m.name : ""}
              aria-hidden={i !== index}
              fill
              quality={90}
              sizes="(max-width: 640px) 100vw, 340px"
              style={{ objectPosition: m.position }}
              className={`object-cover transition-[opacity,transform] duration-700 ease-out ${
                i === index ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
              }`}
            />
          ))}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/50 to-transparent" />

          <div className="absolute inset-x-3 top-3 flex gap-1.5" aria-hidden>
            {TEAM.map((m, i) => (
              <span key={m.name} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/40">
                <span
                  key={i === index ? `run-${index}` : "idle"}
                  className={`block h-full origin-left rounded-full bg-white ${
                    i < index ? "scale-x-100" : i === index ? (reduceMotion ? "scale-x-100" : "team-progress") : "scale-x-0"
                  }`}
                  style={
                    i === index && !reduceMotion
                      ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }
                      : undefined
                  }
                  onAnimationEnd={() => i === index && go(index + 1)}
                />
              </span>
            ))}
          </div>

          <span className="absolute bottom-3 left-4 font-display text-lg font-bold tabular-nums text-white">
            {pad(index + 1)} <span className="text-white/60">/ {pad(TEAM.length)}</span>
          </span>
          {!reduceMotion ? (
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Зупинити автоматичну зміну фото" : "Увімкнути автоматичну зміну фото"}
              className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55"
            >
              {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col p-6 sm:p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Команда випуску · 11-А</span>

          <div aria-live={running ? "off" : "polite"} className="mt-5 min-h-[9.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="block text-sm font-medium text-muted-foreground">{member.role}</span>
                <span className="mt-1 block font-display text-3xl font-bold leading-tight text-[#111] sm:text-[2.1rem]">
                  {member.name}
                </span>
                {member.article ? (
                  <Link
                    href={member.article.href}
                    style={{ textDecoration: "none" }}
                    className="group mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-primary"
                  >
                    {member.article.title}
                    <ArrowRight size={16} aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <span className="mt-4 block text-[15px] text-foreground/75">Колонка редактора — ви саме її читаєте</span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
            {TEAM.map((m, i) => (
              <button
                key={m.name}
                type="button"
                onClick={() => go(i)}
                aria-label={`${m.name}, ${m.role.toLowerCase()}`}
                aria-current={i === index}
                className={`relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-[#f6f8fc] transition-[box-shadow,transform,opacity] duration-200 ${
                  i === index ? "ring-primary" : "opacity-70 ring-transparent hover:opacity-100 hover:-translate-y-0.5"
                }`}
              >
                <Image src={m.photo} alt="" fill sizes="48px" style={{ objectPosition: m.position }} className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
