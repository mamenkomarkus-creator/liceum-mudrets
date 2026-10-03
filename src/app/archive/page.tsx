import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import { ISSUES, getArticlesByIssue, getIssueMeta } from "@/lib/data";
import { nbsp } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Архів випусків",
  description: "Усі випуски газети «Ліцейський мудрець» — від найновіших до історичних.",
};

function pluralizeStatti(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "стаття";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "статті";
  return "статей";
}

const ORDINALS = ["Перший", "Другий", "Третій", "Четвертий", "П'ятий", "Шостий", "Сьомий", "Восьмий", "Дев'ятий", "Десятий"];

export default function ArchivePage() {
  const issuesDesc = [...ISSUES].sort((a, b) => b.number - a.number);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-150 ease-out hover:-translate-x-0.5"
      >
        <ArrowLeft size={16} />
        Головна
      </Link>

      <header className="rule-masthead mt-6 text-center">
        <h1 className="heading-underline heading-underline-center pb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
          Архів випусків
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Усі випуски газети «Ліцейський мудрець» — від найновіших до історичних.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {issuesDesc.map((issue) => {
          const issueArticles = getArticlesByIssue(issue.number);
          const ordinal = ORDINALS[issue.number - 1] ?? `${issue.number}-й`;
          const preview = issueArticles.slice(0, 4);

          return (
            <div key={issue.number} className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="bg-primary text-primary-foreground px-5 py-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-display text-xl font-bold">
                  <CalendarDays size={18} />
                  №{issue.number}
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Опубліковано</span>
              </div>
              <div className="px-5 py-4">
                <p className="font-display text-lg font-bold text-foreground">{getIssueMeta(issue.number).dateLabel}</p>
                <p className="text-sm text-muted-foreground">
                  {ordinal} випуск — {issueArticles.length} {pluralizeStatti(issueArticles.length)}
                </p>
              </div>
              <div className="flex-1 flex flex-col">
                {preview.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.id}`}
                    className="flex items-start gap-3 px-5 py-3 border-t border-border hover:bg-muted transition-colors duration-150"
                  >
                    <FileText size={16} className="mt-0.5 shrink-0 text-primary" />
                    <span>
                      <span className="block text-sm font-medium text-foreground leading-snug break-words">{nbsp(article.title)}</span>
                      <span className="block text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                        {article.category}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
              <Link
                href={`/?issue=${issue.number}#read`}
                className="px-5 py-3 border-t border-border text-sm font-semibold text-primary hover:bg-muted transition-colors duration-150"
              >
                Переглянути всі {issueArticles.length} {pluralizeStatti(issueArticles.length)} →
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-16 border-t border-border pt-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-2">Історія газети</h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Газета «Ліцейський мудрець» була заснована у листопаді 1998 року. З 2025 року газета відновлена в
          електронному форматі.
        </p>
      </div>
    </div>
  );
}
