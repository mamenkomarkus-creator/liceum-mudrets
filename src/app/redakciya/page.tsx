import Link from "next/link";
import { Plus } from "lucide-react";
import { requireEditorPage } from "@/lib/redakciya/auth";
import { listArticles, listIssues } from "@/lib/redakciya/store";
import { claudeEnabled } from "@/lib/redakciya/claude";
import { storageMode } from "@/lib/redakciya/storage";
import { publishMode } from "@/lib/redakciya/publish";
import { Badge, formatDate, plural } from "@/components/redakciya/ui";

export const metadata = { title: "Випуски" };

export default async function IssuesPage() {
  await requireEditorPage();
  const issues = await listIssues();
  const counts = await Promise.all(issues.map((i) => listArticles(i.number)));

  const warnings = [
    storageMode() === "local" && process.env.VERCEL ? "Не підключено сховище Vercel Blob (BLOB_READ_WRITE_TOKEN) — файли не збережуться." : null,
    !claudeEnabled() ? "Не вказано ANTHROPIC_API_KEY — статті оброблятимуться без Claude: лише текст, назву й рубрику доведеться виправити вручну." : null,
    publishMode() === "local" && process.env.VERCEL ? "Не вказано GITHUB_TOKEN — публікація випуску не працюватиме." : null,
  ].filter(Boolean);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#111]">Випуски</h1>
          <p className="mt-1 text-sm text-muted-foreground">Створіть випуск, додайте туди статті, перегляньте їх разом і опублікуйте.</p>
        </div>
        <Link
          href="/redakciya/novyi"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d43a8]"
        >
          <Plus size={16} aria-hidden /> Новий випуск
        </Link>
      </div>

      {warnings.length ? (
        <ul className="mt-6 space-y-2">
          {warnings.map((w) => (
            <li key={w} className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {w}
            </li>
          ))}
        </ul>
      ) : null}

      {issues.length ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue, k) => {
            const articles = counts[k];
            const ready = articles.filter((a) => a.status === "ready").length;
            return (
              <li key={issue.number}>
                <Link
                  href={`/redakciya/vypusk/${issue.number}`}
                  className="block h-full rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-xl font-bold text-[#111]">Випуск №{issue.number}</p>
                    {issue.publishedAt ? <Badge tone="green">Опубліковано</Badge> : <Badge tone="amber">Готується</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{issue.dateLabel}</p>
                  <p className="mt-4 text-sm">
                    {articles.length ? `${articles.length} ${plural(articles.length, "стаття", "статті", "статей")}, оброблено ${ready}` : "Статей ще немає"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {issue.publishedAt ? `Опубліковано ${formatDate(issue.publishedAt)}` : `Створено ${formatDate(issue.createdAt)} · ${issue.createdBy}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="font-display text-xl font-bold text-[#111]">Ще жодного випуску</p>
          <p className="mt-2 text-sm text-muted-foreground">Почніть з кнопки «Новий випуск» — потім туди можна буде перетягнути статті.</p>
        </div>
      )}
    </div>
  );
}

