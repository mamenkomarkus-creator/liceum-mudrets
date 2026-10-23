import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { readingMinutes } from "@/lib/data";
import { nbsp } from "@/lib/typography";
import { extractImagePlaceholderIndices, parseContentBlocks } from "@/lib/content";
import { requireEditorPage } from "@/lib/redakciya/auth";
import { getIssue, listArticles } from "@/lib/redakciya/store";
import { buildSiteArticle, previewPhotoSrc } from "@/lib/redakciya/build-article";
import { mergeArticleImages } from "@/lib/data";
import { ArticleImage } from "@/components/article-image";
import { AuthorCard } from "@/components/author-card";

export const metadata = { title: "Перегляд статті" };

/** The article as it will look on the site, built from the current draft (pictures come from the drafts storage). */
export default async function PreviewPage({ params }: { params: Promise<{ n: string; id: string }> }) {
  await requireEditorPage();
  const { n, id } = await params;
  const issue = await getIssue(Number(n));
  if (!issue) notFound();
  const drafts = await listArticles(issue.number);
  const index = drafts.findIndex((d) => d.id === id);
  const draft = drafts[index];
  if (!draft) notFound();
  if (!draft.fields) redirect(`/redakciya/vypusk/${issue.number}`);

  const { article } = buildSiteArticle(draft, issue, index, previewPhotoSrc);
  const images = mergeArticleImages(article);
  const used = extractImagePlaceholderIndices(article.content);
  const leftover = images.filter((_, i) => !used.has(i));
  const profile = article.authorProfile;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm">
        <Link href={`/redakciya/vypusk/${issue.number}`} className="inline-flex items-center gap-1.5 hover:text-primary">
          <ArrowLeft size={14} aria-hidden /> Випуск №{issue.number}
        </Link>
        <span className="text-muted-foreground">Попередній перегляд — читачі цього ще не бачать.</span>
        <Link href={`/redakciya/vypusk/${issue.number}/stattia/${id}`} className="ml-auto inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
          <Pencil size={14} aria-hidden /> Редагувати
        </Link>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="rounded-xl bg-white px-4 py-8 shadow-sm sm:px-8 md:py-12">
          <div className="mx-auto max-w-[760px]">
            <header>
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{article.category}</span>
                {article.subcategory ? <span className="text-sm text-muted-foreground">/ {article.subcategory}</span> : null}
              </p>
              <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.2] text-[#111] md:text-[2.5rem]">{nbsp(article.title)}</h1>
              <p className="mt-5 text-sm text-muted-foreground">
                {article.date} · {readingMinutes(article)}&nbsp;хв читання · Випуск&nbsp;{article.issue}
              </p>
              {profile ? (
                <div className="mt-5">
                  <AuthorCard profiles={[profile]} label={article.authorLabel} />
                </div>
              ) : (
                <p className="mt-3 font-semibold text-[#111]">Редакція</p>
              )}
            </header>

            <div className="prose-article mt-10">
              {parseContentBlocks(article.content, images, (image) => (
                <ArticleImage src={image.src} caption={image.caption} alt={image.alt ?? image.caption ?? ""} fit={image.fit} unoptimized />
              ))}
            </div>

            {leftover.length ? (
              <section className="mt-10 border-t border-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Галерея в кінці статті</p>
                {leftover.map((image) => (
                  <ArticleImage key={image.src} src={image.src} caption={image.caption} alt={image.caption ?? ""} unoptimized />
                ))}
              </section>
            ) : null}
          </div>
        </article>

        <aside>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Картка на головній</p>
          <div className="mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            {article.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- private draft file
              <img src={article.image} alt="" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-muted text-sm text-muted-foreground">Без фото</div>
            )}
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{article.category}</p>
              <p className="mt-1 font-display text-lg font-bold leading-snug text-[#111]">{article.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{article.description}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
