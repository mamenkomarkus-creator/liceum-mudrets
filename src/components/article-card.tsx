import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock } from "lucide-react";
import type { Article } from "@/lib/types";
import { readingMinutes } from "@/lib/data";
import { nbsp } from "@/lib/typography";

export function ArticleCard({ article, priority = false }: { article: Article; priority?: boolean }) {
  return (
    <Link
      href={`/article/${article.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden bg-muted">
        {article.image ? (
          <Image
            src={article.image}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectPosition: article.imagePosition ?? "center" }}
            className={`transition-transform duration-500 ease-out group-hover:scale-105 ${
              article.imageFit === "contain" ? "object-contain p-3" : "object-cover"
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Image src="/images/logo-lm-left-VS6TsaPJ.png" alt="" width={96} height={96} className="opacity-40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-primary px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
            {article.category}
          </span>
          {article.subcategory ? (
            <span className="text-sm text-muted-foreground">/ {article.subcategory}</span>
          ) : null}
        </div>

        <h3 className="mt-3 line-clamp-3 font-display text-lg font-bold leading-snug text-foreground transition-colors duration-150 group-hover:text-primary">
          <span className="link-sweep">{nbsp(article.title)}</span>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground break-words">
          {article.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden />
              {article.date}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden />
              {readingMinutes(article)}&nbsp;хв
            </span>
          </span>
          <span className="shrink-0 font-medium text-primary transition-transform duration-200 ease-out group-hover:translate-x-0.5">
            Читати далі →
          </span>
        </div>
      </div>
    </Link>
  );
}
