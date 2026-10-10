import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Shared shell for the privacy policy and terms of use: back link, title, update date, then sections. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-150 ease-out hover:-translate-x-0.5"
      >
        <ArrowLeft size={16} aria-hidden />
        Головна
      </Link>
      <h1 className="font-display mt-4 pb-3 text-3xl font-extrabold text-foreground heading-underline md:text-4xl">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">Остання редакція: {updated}</p>
      <p className="mt-4 leading-relaxed text-foreground/85">{intro}</p>
      <div className="mt-8 space-y-9">{children}</div>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
      <h2 id={`${id}-title`} className="font-display text-xl font-bold text-foreground md:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
