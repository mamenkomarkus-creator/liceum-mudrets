import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CATEGORIES, LATEST_ISSUE, getIssueMeta } from "@/lib/data";
import { ScrollToTop } from "./scroll-to-top";

const LINKS = [
  { href: "/", label: "Головна" },
  { href: "/archive", label: "Архів випусків" },
  { href: "/contacts", label: "Контакти / Редакція" },
];

const COLUMN_TITLE = "text-xs font-semibold uppercase tracking-[0.2em] text-white";
const COLUMN_LINK =
  "inline-block text-[15px] text-white/75 transition-colors duration-150 ease-out hover:text-white focus-visible:text-white";

export function SiteFooter() {
  const latest = getIssueMeta(LATEST_ISSUE);

  return (
    <footer className="mt-20 bg-navy text-navy-foreground">
      <div className="mx-auto max-w-[1400px] px-6 pt-4 pb-10">
        <div className="border-t-4 border-double border-white/30" />

        <div className="mt-12 grid grid-cols-1 gap-12 text-center lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-white/15">
          <section className="flex flex-col items-center lg:px-10">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
              <Image src="/images/logo-lm-left-VS6TsaPJ.png" alt="" width={44} height={44} />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-white">Ліцейський мудрець</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
              Орган Ліцейського братства Білоцерківського академічного ліцею «Мала академія наук»
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Заснована у листопаді 1998&nbsp;року. З&nbsp;2025&nbsp;року — в електронному форматі.
            </p>
            <Link
              href={`/?issue=${LATEST_ISSUE}#read`}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-[filter] duration-150 ease-out hover:brightness-110"
            >
              Випуск №{LATEST_ISSUE}&nbsp;— {latest.dateLabel}
              <ArrowRight size={16} aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </Link>
          </section>

          <nav aria-label="Рубрики" className="lg:px-10">
            <p className={COLUMN_TITLE}>Рубрики</p>
            <span className="mx-auto mt-3 block h-px w-10 bg-white/30" aria-hidden />
            <ul className="mt-6 flex flex-col items-center gap-3">
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link href={`/?category=${encodeURIComponent(cat)}#read`} className={COLUMN_LINK}>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Посилання" className="lg:px-10">
            <p className={COLUMN_TITLE}>Посилання</p>
            <span className="mx-auto mt-3 block h-px w-10 bg-white/30" aria-hidden />
            <ul className="mt-6 flex flex-col items-center gap-3">
              {LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={COLUMN_LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 border-t border-white/15 pt-6 text-center text-sm text-white/60">
          © {new Date().getFullYear()} «Ліцейський мудрець» <span aria-hidden>•</span> Біла Церква, Київська область{" "}
          <span aria-hidden>•</span> Усі права захищено
        </div>
      </div>

      <ScrollToTop />
    </footer>
  );
}
