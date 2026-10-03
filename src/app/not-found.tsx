import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-6xl font-extrabold text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Сторінку не знайдено</h1>
      <p className="mt-2 text-muted-foreground">Можливо, статтю перенесено або вона ще не опублікована.</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold transition-all duration-150 ease-out hover:brightness-110 active:scale-95"
      >
        На головну
      </Link>
    </div>
  );
}
