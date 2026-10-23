import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Article } from "@/lib/types";
import type { IssueMeta } from "@/lib/data";
import { buildSiteArticle } from "./build-article";
import { readFile } from "./storage";
import { getIssue, listArticles, saveIssue, type DraftIssue } from "./store";
import type { Editor } from "./auth";

const ARTICLES_FILE = "src/data/articles.json";
const ISSUES_FILE = "src/data/issues.json";

interface FileChange {
  path: string;
  data: Buffer;
}

/** GitHub mode commits to the repository (Vercel rebuilds the site); without a token files are written locally. */
export function publishMode(): "github" | "local" {
  return process.env.GITHUB_TOKEN ? "github" : "local";
}

/** Builds every article of the issue, adds it to articles.json/issues.json and ships it. */
export async function publishIssue(number: number, editor: Editor): Promise<DraftIssue> {
  const issue = await getIssue(number);
  if (!issue) throw new Error("Випуск не знайдено");
  const drafts = await listArticles(number);
  if (!drafts.length) throw new Error("У випуску ще немає статей");
  const unready = drafts.filter((d) => d.status !== "ready" || !d.fields);
  if (unready.length) throw new Error(`Спершу обробіть усі статті: ${unready.map((d) => `«${d.source.name}»`).join(", ")}`);

  // Photos become 1600px WebP files named after their draft id, so a re-publication never reuses a cached name.
  const images = new Map<string, FileChange & { src: string }>();
  const built: Article[] = drafts.map((draft, index) =>
    buildSiteArticle(draft, issue, index, (photo) => `/images/issue${number}/${photo.id}.webp`).article
  );
  for (const draft of drafts) {
    for (const photo of draft.photos) {
      const src = `/images/issue${number}/${photo.id}.webp`;
      if (!built.some((a) => a.image === src || a.images?.includes(src))) continue;
      const file = await readFile(photo.path);
      if (!file) throw new Error(`Фото «${photo.name}» зникло зі сховища`);
      const webp = await sharp(file.data).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      images.set(photo.id, { path: `public${src}`, data: webp, src });
    }
  }

  const meta: IssueMeta = { number, dateLabel: issue.dateLabel, ...(issue.tagline?.trim() ? { tagline: issue.tagline.trim() } : {}) };
  const message = `Випуск №${number} (${issue.dateLabel}): ${built.length} статей — опублікував(ла) ${editor.name}`;

  const ref =
    publishMode() === "github"
      ? await commitToGitHub(message, (current) => merge(current, built, meta), [...images.values()])
      : await writeLocally((current) => merge(current, built, meta), [...images.values()]);

  const published: DraftIssue = { ...issue, publishedAt: new Date().toISOString(), publishedBy: editor.name, publishedRef: ref };
  await saveIssue(published);
  return published;
}

type JsonFiles = { articles: string; issues: string };

/** Replaces the issue's articles (if it was published before) and its entry in the list of issues. */
function merge(current: JsonFiles, built: Article[], meta: IssueMeta): JsonFiles {
  const articles = (JSON.parse(current.articles) as Article[]).filter((a) => a.issue !== meta.number);
  articles.push(...built);
  const issues = (JSON.parse(current.issues) as IssueMeta[]).filter((i) => i.number !== meta.number);
  issues.push(meta);
  issues.sort((a, b) => a.number - b.number);
  return { articles: `${JSON.stringify(articles, null, 2)}\n`, issues: `${JSON.stringify(issues, null, 2)}\n` };
}

async function writeLocally(update: (current: JsonFiles) => JsonFiles, images: FileChange[]): Promise<string> {
  const root = process.cwd();
  const next = update({
    articles: await fs.readFile(path.join(root, ARTICLES_FILE), "utf8"),
    issues: await fs.readFile(path.join(root, ISSUES_FILE), "utf8"),
  });
  for (const image of images) {
    await fs.mkdir(path.dirname(path.join(root, image.path)), { recursive: true });
    await fs.writeFile(path.join(root, image.path), image.data);
  }
  await fs.writeFile(path.join(root, ARTICLES_FILE), next.articles);
  await fs.writeFile(path.join(root, ISSUES_FILE), next.issues);
  return "local";
}

/** One commit with all files through the Git Data API; fails instead of overwriting if main moved meanwhile. */
async function commitToGitHub(message: string, update: (current: JsonFiles) => JsonFiles, images: FileChange[]): Promise<string> {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!repo) throw new Error("Не вказано GITHUB_REPO (наприклад, mamenkomarkus-creator/liceum-mudrets)");

  const api = async <T>(route: string, init?: { method?: string; body?: unknown; raw?: boolean }): Promise<T> => {
    const response = await fetch(`https://api.github.com/repos/${repo}${route}`, {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: init?.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 401) throw new Error("GitHub не прийняв GITHUB_TOKEN — перевірте токен");
      if (response.status === 403 || response.status === 404) throw new Error(`GitHub: немає доступу до ${repo} (${response.status}). Токену потрібен дозвіл Contents: write.`);
      if (response.status === 422) throw new Error(`GitHub відхилив коміт: ${detail.slice(0, 200)}`);
      throw new Error(`GitHub ${response.status}: ${detail.slice(0, 200)}`);
    }
    return (init?.raw ? await response.text() : await response.json()) as T;
  };

  const head = await api<{ object: { sha: string } }>(`/git/ref/heads/${branch}`);
  const commit = await api<{ tree: { sha: string } }>(`/git/commits/${head.object.sha}`);
  const read = (file: string) => api<string>(`/contents/${file}?ref=${head.object.sha}`, { raw: true });
  const next = update({ articles: await read(ARTICLES_FILE), issues: await read(ISSUES_FILE) });

  const blob = async (data: Buffer) =>
    (await api<{ sha: string }>("/git/blobs", { method: "POST", body: { content: data.toString("base64"), encoding: "base64" } })).sha;
  const files: FileChange[] = [
    ...images,
    { path: ARTICLES_FILE, data: Buffer.from(next.articles) },
    { path: ISSUES_FILE, data: Buffer.from(next.issues) },
  ];
  const tree = await api<{ sha: string }>("/git/trees", {
    method: "POST",
    body: {
      base_tree: commit.tree.sha,
      tree: await Promise.all(files.map(async (f) => ({ path: f.path, mode: "100644", type: "blob", sha: await blob(f.data) }))),
    },
  });
  const created = await api<{ sha: string }>("/git/commits", {
    method: "POST",
    body: { message, tree: tree.sha, parents: [head.object.sha] },
  });
  await api(`/git/refs/heads/${branch}`, { method: "PATCH", body: { sha: created.sha, force: false } });
  return `https://github.com/${repo}/commit/${created.sha}`;
}
