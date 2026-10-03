"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-display text-5xl font-extrabold text-primary">Ой</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Щось пішло не так</h1>
      <p className="mt-2 text-muted-foreground">Спробуйте оновити сторінку. Якщо помилка повторюється — повідомте редакцію.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-150 ease-out hover:brightness-110 active:scale-95"
      >
        Спробувати ще раз
      </button>
    </div>
  );
}
