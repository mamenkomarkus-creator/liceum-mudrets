import rawArticles from "@/data/articles.json";
import type { Article, Category } from "./types";

export const articles = rawArticles as Article[];

export const CATEGORIES: Category[] = [
  "КОЛОНКА РЕДАКТОРА",
  "ЛІЦЕЙ",
  "ОБРІЇ",
  "ДІАЛОГИ ПРО НЕСКОРЕНИХ",
  "ВИПУСКНИКИ",
  "ВСТУПНИКАМ",
  "РАДИМО ПРОЧИТАТИ",
];

export interface IssueMeta {
  number: number;
  dateLabel: string;
  tagline?: string;
}

export const ISSUES: IssueMeta[] = [
  { number: 1, dateLabel: "Листопад 2025", tagline: "Перший випуск оновленого електронного видання" },
  { number: 2, dateLabel: "Грудень 2025" },
  { number: 3, dateLabel: "Січень 2026" },
  { number: 4, dateLabel: "Лютий 2026" },
  { number: 5, dateLabel: "Березень 2026" },
  { number: 6, dateLabel: "Квітень 2026" },
  { number: 7, dateLabel: "Травень – Червень 2026" },
  { number: 8, dateLabel: "Вересень 2026" },
];

export const LATEST_ISSUE = Math.max(...ISSUES.map((i) => i.number));

export function getIssueMeta(issue: number): IssueMeta {
  return ISSUES.find((i) => i.number === issue) ?? { number: issue, dateLabel: "" };
}

export function issueTitle(issue: number): string {
  const meta = getIssueMeta(issue);
  return `Випуск №${meta.number}${meta.dateLabel ? ` (${meta.dateLabel})` : ""}`;
}

/** First month of the issue's date range, for compact issue-switcher tabs. */
export function issueShortMonth(issue: number): string {
  return getIssueMeta(issue).dateLabel.split(/[\s–-]/)[0];
}

export function getArticlesByIssue(issue: number): Article[] {
  return articles.filter((a) => a.issue === issue).sort((a, b) => a.id - b.id);
}

export function getArticleById(id: number): Article | undefined {
  return articles.find((a) => a.id === id);
}

export function getAllArticlesSorted(): Article[] {
  return [...articles].sort((a, b) => (b.issue - a.issue) || (a.id - b.id));
}

export function getArticlesByCategory(category: string | "Усі"): Article[] {
  const all = getAllArticlesSorted();
  if (category === "Усі") return all;
  return all.filter((a) => a.category === category);
}

export function getAdjacentArticles(article: Article): { prev?: Article; next?: Article } {
  const issueArticles = getArticlesByIssue(article.issue);
  const index = issueArticles.findIndex((a) => a.id === article.id);
  return { prev: issueArticles[index - 1], next: issueArticles[index + 1] };
}

const WORDS_PER_MINUTE = 180;

export function readingMinutes(article: Article): number {
  const words = article.content.replace(/\[images:\d+\]/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function formatCategoryPath(article: Article): string {
  return article.subcategory ? `${article.category} / ${article.subcategory}` : article.category;
}

export interface MergedImage {
  src: string;
  alt?: string;
  caption?: string;
  fit?: "cover" | "contain" | "natural" | "small" | "plain" | "portrait";
}

/** Combines `images` + `imagesWithCaptions` (parallel arrays keyed by index) into one list. */
export function mergeArticleImages(article: Article): MergedImage[] {
  if (article.images && article.images.length) {
    return article.images.map((src, i) => {
      const meta = article.imagesWithCaptions?.[i];
      const caption = meta?.caption?.trim();
      return { src, alt: meta?.alt, caption: caption || undefined, fit: meta?.fit };
    });
  }
  if (article.imagesWithCaptions) {
    return article.imagesWithCaptions.map((img) => ({
      src: img.src,
      alt: img.alt,
      caption: img.caption?.trim() || undefined,
      fit: img.fit,
    }));
  }
  return [];
}

export function authorHref(name: string): string {
  return `/author/${encodeURIComponent(name)}`;
}

export function getAuthors(): string[] {
  return [...new Set(articles.map((a) => a.author?.trim()).filter((a): a is string => !!a))];
}

export function getArticlesByAuthor(name: string): Article[] {
  return getAllArticlesSorted().filter((a) => a.author?.trim() === name);
}
