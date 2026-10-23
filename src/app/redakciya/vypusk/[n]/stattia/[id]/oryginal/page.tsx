import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { requireEditorPage } from "@/lib/redakciya/auth";
import { readFile } from "@/lib/redakciya/storage";
import { getArticle, getIssue } from "@/lib/redakciya/store";
import { docxToMarkup } from "@/lib/redakciya/convert";
import { parseContentBlocks } from "@/lib/content";

export const metadata = { title: "Оригінал статті" };

export default async function OriginalPage({ params }: { params: Promise<{ n: string; id: string }> }) {
  await requireEditorPage();
  const { n, id } = await params;
  const issue = await getIssue(Number(n));
  const article = issue && /^[A-Za-z0-9]{4,32}$/.test(id) ? await getArticle(issue.number, id) : null;
  if (!issue || !article) notFound();

  const fileUrl = `/api/redakciya/file/${article.source.path}`;
  let text: string | null = null;
  if (article.source.kind === "docx") {
    const file = await readFile(article.source.path);
    // Pictures stay out of this quick read; they are shown with the article after processing.
    if (file) text = (await docxToMarkup(file.data)).markup.replace(/\[фото:[^\]]+\]/g, "[малюнок]");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/redakciya/vypusk/${issue.number}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft size={14} aria-hidden /> Випуск №{issue.number}
        </Link>
        <a
          href={`${fileUrl}?name=${encodeURIComponent(article.source.name)}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-semibold hover:text-primary"
        >
          <Download size={14} aria-hidden /> Завантажити файл
        </a>
      </div>
      <h1 className="mt-4 break-words font-display text-2xl font-bold text-[#111]">{article.source.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Оригінал, як його надіслав автор. Завантажив(ла): {article.uploadedBy}.</p>

      {article.source.kind === "pdf" ? (
        <iframe src={fileUrl} title={article.source.name} className="mt-6 h-[80vh] w-full rounded-xl border border-border bg-white" />
      ) : text !== null ? (
        <div className="prose-article mt-6 rounded-xl border border-border bg-white px-5 py-8 shadow-sm sm:px-10">
          {parseContentBlocks(text, [], () => null)}
        </div>
      ) : (
        <p className="mt-6 text-sm text-red-700">Файл не знайдено у сховищі.</p>
      )}
    </div>
  );
}
