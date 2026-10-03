import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import {
  articles,
  authorHref,
  getAdjacentArticles,
  getArticleById,
  mergeArticleImages,
  readingMinutes,
} from "@/lib/data";
import { nbsp } from "@/lib/typography";
import { extractImagePlaceholderIndices, parseContentBlocks } from "@/lib/content";
import { BookReveal } from "@/components/book-reveal";
import { BookIllustrations } from "@/components/book-illustrations";
import { BookBack } from "@/components/book-back";
import { DeckViewer } from "@/components/deck-viewer";
import { ProgramLeaflet } from "@/components/program-leaflet";
import { ArticleImage } from "@/components/article-image";
import { ImageGallery } from "@/components/image-gallery";
import { AuthorCard } from "@/components/author-card";
import { AuthorAvatar } from "@/components/author-avatar";
import { YoutubeEmbed } from "@/components/youtube-embed";
import { PdfLinks } from "@/components/pdf-links";
import { ShareButton } from "@/components/share-button";
import { BookmarkButton } from "@/components/bookmark-button";
import { CommentCount } from "@/components/comment-count";
import { CommentsSection } from "@/components/comments-section";
import { QuizList } from "@/components/quiz-block";
import { TridentWatermark } from "@/components/trident-watermark";
import { BackButton } from "@/components/back-button";
import Image from "next/image";

const hasFile = (publicPath: string) => fs.existsSync(path.join(process.cwd(), "public", publicPath));

export function generateStaticParams() {
  return articles.map((a) => ({ id: String(a.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = getArticleById(Number(id));
  if (!article) return {};
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: `/article/${article.id}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      authors: article.author ? [article.author] : undefined,
      images: article.image ? [{ url: article.image }] : undefined,
    },
  };
}

const TAG_CLASS =
  "inline-flex items-center rounded-full bg-muted px-3.5 py-1.5 text-sm text-foreground/80 transition-colors duration-150 ease-out";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = getArticleById(Number(id));
  if (!article) notFound();

  const mergedImages = mergeArticleImages(article);
  const usedIndices = extractImagePlaceholderIndices(article.content);
  const leftoverImages = mergedImages.filter((_, i) => !usedIndices.has(i));
  const { prev, next } = getAdjacentArticles(article);
  const minutes = readingMinutes(article);
  const profile = article.authorProfile;
  const authorName = article.author?.trim();

  const youtubeItems = [
    ...(article.youtubeLink ? [{ url: article.youtubeLink, title: undefined }] : []),
    ...(article.youtubeLinks ?? []),
  ];
  const pdfItems = [...(article.pdfLink ? [article.pdfLink] : []), ...(article.pdfLinks ?? [])];

  const categoryHref = `/?issue=${article.issue}&category=${encodeURIComponent(article.category)}#read`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    inLanguage: "uk",
    url: `${SITE_URL}/article/${article.id}`,
    image: article.image ? [`${SITE_URL}${article.image}`] : undefined,
    author: authorName ? { "@type": "Person", name: authorName } : { "@type": "Organization", name: "Ліцейський мудрець" },
    publisher: { "@type": "Organization", name: "Ліцейський мудрець" },
  };

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <article className="mx-auto max-w-[760px]">
        <BackButton />

        <header className="mt-6">
          <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <Link
              href={categoryHref}
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary transition-opacity hover:opacity-75"
            >
              {article.category}
            </Link>
            {article.subcategory ? (
              <span className="text-sm text-muted-foreground">/ {article.subcategory}</span>
            ) : null}
          </p>

          <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.2] text-[#111] md:text-[2.5rem]">
            {nbsp(article.title)}
          </h1>

          <p className="mt-5 text-sm text-muted-foreground">
            <time>{article.date}</time>
            <span aria-hidden> · </span>
            {minutes}&nbsp;хв читання
            <span aria-hidden> · </span>
            Випуск&nbsp;{article.issue}
          </p>

          {profile || article.authorProfiles ? (
            <div className="mt-5">
              <AuthorCard
                profiles={article.authorProfiles ?? [profile!]}
                label={article.authorLabel}
                href={authorName ? authorHref(authorName) : undefined}
              />
            </div>
          ) : authorName ? (
            <div className="mt-5 flex items-center gap-3">
              <AuthorAvatar name={authorName} size={44} />
              <p className="min-w-0 leading-tight">
                <span className="block text-xs font-semibold uppercase tracking-wider text-primary">
                  {article.authorLabel ?? "Автор статті"}
                </span>
                <Link href={authorHref(authorName)} className="break-words font-display text-lg font-bold text-[#111] hover:text-primary">
                  {authorName}
                </Link>
              </p>
            </div>
          ) : (
            <p className="mt-3 font-semibold text-[#111]">Редакція</p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-y border-border py-1.5">
            <CommentCount articleId={article.id} />
            <div className="flex flex-wrap items-center">
              <BookmarkButton articleId={article.id} />
              <ShareButton title={article.title} />
            </div>
          </div>
        </header>

        {article.showTridentAnimation ? <TridentWatermark /> : null}

        {article.infocardImage ? (
          <div className="relative mx-auto mt-8 aspect-[4/3] w-full max-w-xs overflow-hidden rounded-xl border border-border">
            <Image src={article.infocardImage} alt={article.title} fill sizes="320px" className="object-cover" />
          </div>
        ) : null}

        <div className="prose-article mt-10">
          {parseContentBlocks(article.content, mergedImages, (image) => (
            <ArticleImage src={image.src} caption={image.caption} alt={image.alt} fit={image.fit} />
          ), { hasFile, speakers: article.speakers, embeds: { "book-dedication": <BookReveal />, "book-illustrations": <BookIllustrations />, "book-back": <BookBack />,
          "man-program": <ProgramLeaflet />,
          "deck-ns2026": (
            <DeckViewer
              base="/decks/ns2026/"
              count={32}
              version="3"
              label="Презентація «Основи учнівської науково-дослідницької діяльності»"
            />
          ) } })}
        </div>

        {article.quizzes?.length ? <QuizList quizzes={article.quizzes} /> : null}

        {youtubeItems.map((item, i) => (
          <YoutubeEmbed key={i} url={item.url} title={item.title} />
        ))}

        {pdfItems.length ? <PdfLinks links={pdfItems} /> : null}

        {leftoverImages.length ? (
          <ImageGallery images={leftoverImages} sharedCaption={article.imagesCaption} />
        ) : null}

        <footer className="mt-12 space-y-10 border-t border-border pt-8">
          <nav aria-label="Теги статті">
            <ul className="flex flex-wrap gap-2.5">
              <li>
                <Link href={categoryHref} className={`${TAG_CLASS} hover:bg-border hover:text-primary`}>
                  #{article.category.toLowerCase()}
                </Link>
              </li>
              {article.subcategory ? (
                <li>
                  <span className={TAG_CLASS}>#{article.subcategory.toLowerCase()}</span>
                </li>
              ) : null}
              <li>
                <Link
                  href={`/?issue=${article.issue}#read`}
                  className={`${TAG_CLASS} hover:bg-border hover:text-primary`}
                >
                  #випуск_{article.issue}
                </Link>
              </li>
            </ul>
          </nav>

          {prev || next ? (
            <nav aria-label="Сусідні статті" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/article/${prev.id}`}
                  className="group rounded-lg border border-border bg-card p-4 transition-colors duration-150 ease-out hover:border-primary/40"
                >
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ArrowLeft size={13} aria-hidden />
                    Попередня стаття
                  </p>
                  <p className="mt-1.5 line-clamp-2 font-display font-semibold text-foreground transition-colors duration-150 group-hover:text-primary">
                    {prev.title}
                  </p>
                </Link>
              ) : (
                <div />
              )}
              {next ? (
                <Link
                  href={`/article/${next.id}`}
                  className="group rounded-lg border border-border bg-card p-4 text-right transition-colors duration-150 ease-out hover:border-primary/40"
                >
                  <p className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Наступна стаття
                    <ArrowRight size={13} aria-hidden />
                  </p>
                  <p className="mt-1.5 line-clamp-2 font-display font-semibold text-foreground transition-colors duration-150 group-hover:text-primary">
                    {next.title}
                  </p>
                </Link>
              ) : null}
            </nav>
          ) : null}
        </footer>
      </article>

      <div className="mx-auto mt-16 max-w-[760px] border-t border-border pt-10">
        <CommentsSection articleId={article.id} />
      </div>
    </div>
  );
}
