import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CATEGORIES, getAuthors } from "@/lib/data";
import { requireEditorPage } from "@/lib/redakciya/auth";
import { getArticle, getIssue } from "@/lib/redakciya/store";
import { ArticleEditor } from "@/components/redakciya/article-editor";

export const maxDuration = 60;
export const metadata = { title: "Редагування статті" };

export default async function EditArticlePage({ params }: { params: Promise<{ n: string; id: string }> }) {
  await requireEditorPage();
  const { n, id } = await params;
  const issue = await getIssue(Number(n));
  const article = issue && /^[A-Za-z0-9]{4,32}$/.test(id) ? await getArticle(issue.number, id) : null;
  if (!issue || !article) notFound();
  if (!article.fields) redirect(`/redakciya/vypusk/${issue.number}`);

  return (
    <div>
      <Link href={`/redakciya/vypusk/${issue.number}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft size={14} aria-hidden /> Випуск №{issue.number}
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold text-[#111]">Редагування статті</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Файл «{article.source.name}» · {article.processedWith === "claude" ? "підготовлено Claude" : "чернетка без Claude"}
      </p>
      <ArticleEditor
        issue={issue.number}
        id={article.id}
        initial={article.fields}
        photos={article.photos}
        categories={CATEGORIES}
        authors={getAuthors()}
      />
    </div>
  );
}
