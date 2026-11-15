import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaperFlipbook } from "@/components/paper-flipbook";
import { PAPER_10 } from "@/data/paper-10";

const TITLE = "Випуск №10 (Листопад 2026) — ювілейна газета — Ліцейський мудрець";
const DESCRIPTION =
  "Ювілейний випуск до 30-річчя Білоцерківського академічного ліцею «МАН» і першого року електронної газети: чотири сторінки справжньої газети, яку можна гортати.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/gazeta/10" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/gazeta/10", images: [{ url: "/og/issue-10.jpg", width: 1200, height: 630, alt: TITLE }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og/issue-10.jpg"] },
};

export default function JubileePaperPage() {
  return (
    <div className="mx-auto max-w-[1300px] px-4 py-8 md:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-150 ease-out hover:-translate-x-0.5"
      >
        <ArrowLeft size={16} aria-hidden />
        Головна
      </Link>
      <header className="mt-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Ювілейний випуск №10 · Листопад 2026</p>
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">Нам 30 років</h1>
      </header>
      <PaperFlipbook pages={PAPER_10} />
    </div>
  );
}
