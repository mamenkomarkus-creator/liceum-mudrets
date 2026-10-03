"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SearchModal } from "./search-modal";

const NAV_LINKS = [
  { href: "/", label: "Головна" },
  { href: "/archive", label: "Архів випусків" },
  { href: "/contacts", label: "Редакція" },
];

/** Soft light-blue impulses radiating from behind a logo (decorative; see .pulse-* in globals.css). */
function Pulses({ className = "", delay = false }: { className?: string; delay?: boolean }) {
  return (
    <span className={`pulse-emitter ${className}`} aria-hidden>
      <i className="pulse-glow" style={delay ? { animationDelay: "3s" } : undefined} />
      <i className="pulse-ring" style={{ animationDelay: delay ? "1.5s" : "0s" }} />
      <i className="pulse-ring" style={{ animationDelay: delay ? "4.5s" : "3s" }} />
      <i className="pulse-ring" style={{ animationDelay: delay ? "7.5s" : "6s" }} />
    </span>
  );
}

export function SiteHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const pathname = usePathname();

  // The header shrinks when you scroll down. Shrinking changes the page height and the browser then nudges the
  // scroll position, so a single threshold flips back and forth ("jitter"). Hence two thresholds (hysteresis)
  // that are further apart than the height change, plus a short lock right after every switch.
  useEffect(() => {
    const SHRINK_AT = 160;
    const EXPAND_AT = 24;
    const LOCK_MS = 450;
    let isCompact = false;
    let locked = false;
    let lockTimer = 0;
    let frame = 0;

    const evaluate = () => {
      frame = 0;
      if (locked) return;
      const y = window.scrollY;
      const next = isCompact ? y > EXPAND_AT : y > SHRINK_AT;
      if (next === isCompact) return;
      isCompact = next;
      setCompact(next);
      locked = true;
      lockTimer = window.setTimeout(() => {
        locked = false;
        evaluate();
      }, LOCK_MS);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(lockTimer);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 overflow-clip bg-card border-b border-border transition-shadow duration-200 ${
        compact ? "shadow-sm" : ""
      }`}
    >
      <span className="hdr-wave" aria-hidden />
      <span className="hdr-wave hdr-wave-2" aria-hidden />
      <span className="hdr-beam" aria-hidden />

      <div
        className={`relative mx-auto max-w-[1400px] px-4 flex items-center justify-between gap-4 transition-all duration-300 ease-out ${
          compact ? "py-2" : "py-5 md:py-6"
        }`}
      >
        <Link
          href="/"
          className="relative flex w-[72px] shrink-0 justify-start sm:w-[124px] md:w-[190px]"
          aria-label="Ліцейський мудрець — на головну"
        >
          <Pulses className="left-8 sm:left-[3.1rem] md:left-[3.4rem]" />
          <Image
            src="/images/logo-lm-left-VS6TsaPJ.png"
            alt=""
            width={112}
            height={112}
            className={`relative z-10 transition-all duration-300 ease-out hover:scale-105 ${
              compact ? "w-12 h-12 md:w-14 md:h-14" : "w-16 h-16 md:w-26 md:h-26"
            }`}
            priority
          />
        </Link>

        <Link href="/" className="relative z-10 text-center flex-1 min-w-0">
          <p
            className={`font-display font-bold text-primary leading-tight transition-all duration-300 ease-out ${
              compact ? "text-lg sm:text-2xl md:text-3xl" : "text-2xl sm:text-4xl md:text-5xl"
            }`}
          >
            Ліцейський мудрець
          </p>
          <p
            className={`text-muted-foreground transition-all duration-300 ease-out overflow-hidden ${
              compact
                ? "max-h-0 opacity-0"
                : "mt-0.5 max-h-10 opacity-100 text-[11px] sm:text-sm md:text-base"
            }`}
          >
            Орган Ліцейського братства Білоцерківського академічного ліцею «МАН»
          </p>
        </Link>

        <div className="flex w-[72px] shrink-0 items-center justify-end gap-3 sm:w-[124px] md:w-[190px] md:gap-6">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full text-foreground/60 transition-colors duration-150 ease-out hover:bg-muted hover:text-primary active:scale-90"
            aria-label="Пошук"
          >
            <Search size={22} />
          </button>

          <span className="relative hidden sm:block">
            <Pulses className="left-1/2 top-1/2" delay />
            <Image
              src="/images/logo-lm-DxK6dwQ4.png"
              alt=""
              width={72}
              height={108}
              className={`relative z-10 transition-all duration-300 ease-out ${
                compact ? "w-8 h-12" : "w-10 h-15 md:w-[64px] md:h-[96px]"
              }`}
            />
          </span>
        </div>
      </div>

      <nav aria-label="Основна навігація" className="relative z-10 border-t border-border">
        <ul className="mx-auto grid max-w-xl grid-cols-3 px-4 text-center">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-block py-3 text-[13px] sm:text-sm md:text-[15px] font-medium transition-colors duration-150 ease-out hover:text-primary ${
                    active ? "text-primary" : "text-foreground/70"
                  }`}
                >
                  {link.label}
                  {active && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
