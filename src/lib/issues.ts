import rawIssues from "@/data/issues.json";
import type { Category } from "./types";

// Issue list and rubrics without the article texts, so client components can import them
// without pulling the whole src/data/articles.json into the browser bundle.

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
  /** Issue made as a whole newspaper to leaf through (no separate articles): path of its page. */
  paper?: string;
}

// Kept in JSON so that publishing an issue from /redakciya can append to it with a plain commit.
export const ISSUES: IssueMeta[] = rawIssues;

export const LATEST_ISSUE = Math.max(...ISSUES.map((i) => i.number));

/** Latest issue made of articles: what the home page lists by default. */
export const LATEST_ARTICLE_ISSUE = Math.max(...ISSUES.filter((i) => !i.paper).map((i) => i.number));

/** Where an issue is read: its newspaper page, or its articles on the home page. */
export function issueHref(issue: number): string {
  return getIssueMeta(issue).paper ?? `/?issue=${issue}#read`;
}

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

/** What the search box needs to know about an article; served as /search-index.json. */
export interface SearchEntry {
  id: number;
  title: string;
  description: string;
  category: string;
  author?: string;
}
