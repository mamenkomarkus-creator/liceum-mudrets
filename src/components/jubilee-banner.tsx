import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Notice on the home page: the jubilee issue is a whole newspaper to leaf through. */
export function JubileeBanner({ issue, href, dateLabel }: { issue: number; href: string; dateLabel: string }) {
  return (
    <Link
      href={href}
      className="jubilee group relative grid items-center gap-6 overflow-hidden rounded-2xl bg-navy px-6 py-7 text-white sm:grid-cols-[auto_1fr] sm:gap-10 sm:px-10 sm:py-9"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(245_197_66/0.28),transparent)]"
      />
      <span className="jubilee-paper relative mx-auto block w-28 shadow-[0_18px_40px_-10px_rgb(0_0_0/0.6)] sm:w-[7.5rem]">
        <Image src={`/gazeta/${issue}/page-1.webp`} alt="" width={1240} height={1754} sizes="160px" className="h-auto w-full" />
      </span>
      <span className="relative block">
        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-[#f5c542]">
          Ювілейний випуск №{issue} · {dateLabel}
        </span>
        <span className="mt-3 block font-display text-3xl font-bold leading-tight sm:text-4xl">Нам 30 років</span>
        <span className="mt-3 block max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
          До Дня ліцею й першого року електронного «Ліцейського мудреця» — справжня газета на чотири сторінки. Гортайте її, як у
          руках, і відкривайте будь-яку сторінку на весь екран.
        </span>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f5c542] px-5 py-2.5 text-sm font-semibold text-[#16233b] transition-[filter] duration-150 group-hover:brightness-105">
          Гортати газету
          <ArrowRight size={16} aria-hidden className="transition-transform duration-200 ease-out group-hover:translate-x-1" />
        </span>
      </span>
    </Link>
  );
}
