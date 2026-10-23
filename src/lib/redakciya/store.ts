import crypto from "node:crypto";
import { ISSUES } from "@/lib/data";
import { listFiles, readJson, removePrefix, writeJson } from "./storage";

/** An issue being put together in /redakciya. Published issues stay here too, so they can be fixed and re-published. */
export interface DraftIssue {
  number: number;
  dateLabel: string;
  tagline?: string;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  publishedBy?: string;
  /** Link to the commit (or "local") of the last publication. */
  publishedRef?: string;
}

export interface DraftPhoto {
  id: string;
  path: string;
  name: string;
  /** "docx": pulled out of the Word file during processing (replaced when it is processed again). */
  origin: "upload" | "docx";
  caption?: string;
}

/** What ends up on the site; filled by processing and then edited by hand. */
export interface ArticleFields {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  author: string;
  authorLabel: string;
  authorDescription: string;
  /** Site markup; photos are referenced as [фото:<id>]. */
  content: string;
  coverPhotoId: string;
}

export type ArticleStatus = "new" | "processing" | "ready" | "error";

export interface DraftArticle {
  id: string;
  issue: number;
  order: number;
  source: { path: string; name: string; kind: "docx" | "pdf"; size: number };
  photos: DraftPhoto[];
  notes: string;
  uploadedBy: string;
  uploadedAt: string;
  status: ArticleStatus;
  error?: string;
  fields?: ArticleFields;
  processedWith?: "claude" | "basic";
  processedAt?: string;
  /** Someone in the editorial team read it and marked it as ready. */
  checkedBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export const issueDir = (n: number) => `drafts/issues/${n}`;
const issueFile = (n: number) => `${issueDir(n)}/issue.json`;
export const articleDir = (n: number, id: string) => `${issueDir(n)}/articles/${id}`;
const articleFile = (n: number, id: string) => `${articleDir(n, id)}/meta.json`;

export function newId(): string {
  return crypto.randomBytes(6).toString("base64url").replace(/[-_]/g, "x");
}

export function assertId(id: string): string {
  if (!/^[A-Za-z0-9]{4,32}$/.test(id)) throw new Error("Невірний ідентифікатор");
  return id;
}

export async function listIssues(): Promise<DraftIssue[]> {
  const files = (await listFiles("drafts/issues/")).filter((p) => /^drafts\/issues\/\d+\/issue\.json$/.test(p));
  const issues = await Promise.all(files.map((p) => readJson<DraftIssue>(p)));
  return issues.filter((i): i is DraftIssue => !!i).sort((a, b) => b.number - a.number);
}

export async function getIssue(n: number): Promise<DraftIssue | null> {
  if (!Number.isInteger(n) || n < 1) return null;
  return readJson<DraftIssue>(issueFile(n));
}

export async function saveIssue(issue: DraftIssue) {
  await writeJson(issueFile(issue.number), issue);
}

export async function deleteIssue(n: number) {
  await removePrefix(`${issueDir(n)}/`);
}

/** Next free number: after everything on the site and everything in the works. */
export async function nextIssueNumber(): Promise<number> {
  const drafts = await listIssues();
  return Math.max(0, ...ISSUES.map((i) => i.number), ...drafts.map((i) => i.number)) + 1;
}

export async function listArticles(n: number): Promise<DraftArticle[]> {
  const files = (await listFiles(`${issueDir(n)}/articles/`)).filter((p) => p.endsWith("/meta.json"));
  const articles = await Promise.all(files.map((p) => readJson<DraftArticle>(p)));
  return articles.filter((a): a is DraftArticle => !!a).sort((a, b) => a.order - b.order || a.uploadedAt.localeCompare(b.uploadedAt));
}

export async function getArticle(n: number, id: string): Promise<DraftArticle | null> {
  return readJson<DraftArticle>(articleFile(n, assertId(id)));
}

export async function saveArticle(article: DraftArticle) {
  await writeJson(articleFile(article.issue, article.id), article);
}

export async function deleteArticle(n: number, id: string) {
  await removePrefix(`${articleDir(n, assertId(id))}/`);
}

/** Replaces [фото:id] markers of the given photos, e.g. after a photo is deleted. */
export function dropPhotoMarkers(content: string, photoIds: string[]): string {
  let next = content;
  for (const id of photoIds) next = next.replace(new RegExp(`\\n*\\[фото:${id}\\]\\n*`, "g"), "\n\n");
  return next.trim();
}
