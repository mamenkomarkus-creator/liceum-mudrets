import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireEditorPage } from "@/lib/redakciya/auth";
import { getIssue, listArticles } from "@/lib/redakciya/store";
import { uploadFlow } from "@/lib/redakciya/storage";
import { claudeEnabled } from "@/lib/redakciya/claude";
import { Badge, formatDate } from "@/components/redakciya/ui";
import { IssueSettings } from "@/components/redakciya/issue-settings";
import { ArticleUploader } from "@/components/redakciya/article-uploader";
import { ArticleCard } from "@/components/redakciya/article-card";
import { PublishPanel } from "@/components/redakciya/publish-panel";

// Processing an article with Claude and publishing run as server actions of this page.
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  return { title: `Випуск №${n}` };
}

export default async function IssuePage({ params }: { params: Promise<{ n: string }> }) {
  const editor = await requireEditorPage();
  const { n } = await params;
  const issue = await getIssue(Number(n));
  if (!issue) notFound();
  const articles = await listArticles(issue.number);

  return (
    <div>
      <Link href="/redakciya" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft size={14} aria-hidden /> Усі випуски
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-[#111]">Випуск №{issue.number}</h1>
        {issue.publishedAt ? <Badge tone="green">Опубліковано</Badge> : <Badge tone="amber">Готується</Badge>}
      </div>
      <IssueSettings number={issue.number} dateLabel={issue.dateLabel} tagline={issue.tagline ?? ""} />
      {issue.publishedAt ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Опубліковано {formatDate(issue.publishedAt)} ({issue.publishedBy}).{" "}
          <Link href={`/?issue=${issue.number}`} target="_blank" className="inline-flex items-center gap-1 text-primary hover:underline">
            Відкрити на сайті <ExternalLink size={12} aria-hidden />
          </Link>
          {issue.publishedRef?.startsWith("https://") ? (
            <>
              {" · "}
              <a href={issue.publishedRef} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                коміт у GitHub
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <section className="mt-8" aria-labelledby="upload-heading">
        <h2 id="upload-heading" className="sr-only">
          Додати статті
        </h2>
        <ArticleUploader issue={issue.number} storage={uploadFlow()} />
      </section>

      <section className="mt-8" aria-labelledby="articles-heading">
        <h2 id="articles-heading" className="font-display text-xl font-bold text-[#111]">
          Статті випуску
        </h2>
        {articles.length ? (
          <ol className="mt-4 space-y-4">
            {articles.map((article, index) => (
              <li key={article.id}>
                <ArticleCard
                  article={article}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === articles.length - 1}
                  storage={uploadFlow()}
                  claude={claudeEnabled()}
                />
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Поки порожньо — перетягніть сюди файли зі статтями.</p>
        )}
      </section>

      <PublishPanel
        issue={issue.number}
        isChief={editor.role === "chief"}
        published={!!issue.publishedAt}
        total={articles.length}
        ready={articles.filter((a) => a.status === "ready").length}
        checked={articles.filter((a) => a.checkedBy).length}
      />
    </div>
  );
}
