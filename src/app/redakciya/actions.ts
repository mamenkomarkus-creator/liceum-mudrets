"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ISSUES } from "@/lib/data";
import { logIn, logOut, requireChief, requireEditor } from "@/lib/redakciya/auth";
import { processArticle } from "@/lib/redakciya/process";
import { publishIssue } from "@/lib/redakciya/publish";
import { removeFiles } from "@/lib/redakciya/storage";
import { audit } from "@/lib/redakciya/security";
import {
  assertId,
  deleteArticle,
  deleteIssue,
  dropPhotoMarkers,
  getArticle,
  getIssue,
  listArticles,
  nextIssueNumber,
  saveArticle,
  saveIssue,
  type ArticleFields,
  type DraftArticle,
} from "@/lib/redakciya/store";
import { fileExtension, isAllowedUploadPath, sourcePath, photoPath } from "@/lib/redakciya/upload-paths";
import { articleFields, captions as checkCaptions, issueNumber, text } from "@/lib/redakciya/validate";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function attempt(work: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await work();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

const issuePath = (n: number) => `/redakciya/vypusk/${n}`;

async function loadArticle(issue: number, id: string): Promise<DraftArticle> {
  const article = await getArticle(issueNumber(issue), assertId(text(id, 32, "id")));
  if (!article) throw new Error("Статтю не знайдено — можливо, її вже видалили");
  return article;
}

export async function loginAction(_prev: string | null, form: FormData): Promise<string | null> {
  const result = await logIn(String(form.get("login") ?? "").slice(0, 100), String(form.get("password") ?? "").slice(0, 200));
  if (!result.ok) return result.error;
  redirect("/redakciya");
}

export async function logoutAction() {
  await logOut();
  redirect("/redakciya/vhid");
}

export async function createIssueAction(_prev: string | null, form: FormData): Promise<string | null> {
  const editor = await requireEditor();
  const number = Number(form.get("number"));
  const dateLabel = String(form.get("dateLabel") ?? "").trim().slice(0, 60);
  const tagline = String(form.get("tagline") ?? "").trim().slice(0, 500);
  if (!Number.isInteger(number) || number < 1 || number > 9999) return "Вкажіть номер випуску";
  if (!dateLabel) return "Вкажіть місяць випуску, наприклад «Листопад 2026»";
  if (await getIssue(number)) return `Випуск №${number} уже є в редакції`;
  // Publishing replaces all articles of that number, so an issue made by hand must not be overwritten by accident.
  if (ISSUES.some((i) => i.number === number)) return `Випуск №${number} уже є на сайті. Наступний вільний — №${await nextIssueNumber()}`;
  await saveIssue({
    number,
    dateLabel,
    ...(tagline ? { tagline } : {}),
    createdBy: editor.name,
    createdAt: new Date().toISOString(),
  });
  redirect(issuePath(number));
}

export async function updateIssueAction(n: number, values: { dateLabel: string; tagline: string }) {
  return attempt(async () => {
    await requireEditor();
    n = issueNumber(n);
    const dateLabel = text(values?.dateLabel, 60, "Місяць").trim();
    const tagline = text(values?.tagline ?? "", 500, "Опис випуску").trim();
    const issue = await getIssue(n);
    if (!issue) throw new Error("Випуск не знайдено");
    if (!dateLabel) throw new Error("Місяць випуску не може бути порожнім");
    await saveIssue({ ...issue, dateLabel, tagline: tagline || undefined });
    revalidatePath(issuePath(n));
    return "Збережено";
  });
}

export async function deleteIssueAction(n: number) {
  const result = await attempt(async () => {
    const editor = await requireChief();
    n = issueNumber(n);
    await deleteIssue(n);
    audit("issue_deleted", { issue: n, login: editor.login });
  });
  if (result.ok) redirect("/redakciya");
  return result;
}

export async function registerArticleAction(n: number, upload: { id: string; name: string; size: number }) {
  return attempt(async () => {
    const editor = await requireEditor();
    n = issueNumber(n);
    text(upload?.name, 255, "Назва файлу");
    if (typeof upload.size !== "number" || upload.size < 0) throw new Error("Невірний розмір файлу");
    if (!(await getIssue(n))) throw new Error("Випуск не знайдено");
    const ext = fileExtension(upload.name);
    if (ext !== "docx" && ext !== "pdf") throw new Error("Підтримуються лише файли .docx і .pdf");
    const path = sourcePath(n, assertId(upload.id), ext);
    const existing = await listArticles(n);
    await saveArticle({
      id: upload.id,
      issue: n,
      order: Math.max(0, ...existing.map((a) => a.order)) + 1,
      source: { path, name: upload.name, kind: ext, size: upload.size },
      photos: [],
      notes: "",
      uploadedBy: editor.name,
      uploadedAt: new Date().toISOString(),
      status: "new",
    });
    revalidatePath(issuePath(n));
  });
}

export async function addPhotosAction(n: number, id: string, photos: { id: string; name: string }[]) {
  return attempt(async () => {
    const editor = await requireEditor();
    if (!Array.isArray(photos) || photos.length > 50) throw new Error("Забагато фото за раз");
    photos.forEach((p) => text(p?.name, 255, "Назва фото"));
    const article = await loadArticle(n, id);
    const added = photos.map((p) => {
      const path = photoPath(n, article.id, assertId(p.id), fileExtension(p.name));
      if (!isAllowedUploadPath(path)) throw new Error(`«${p.name}» — не фото`);
      return { id: p.id, path, name: p.name, origin: "upload" as const };
    });
    await saveArticle({ ...article, photos: [...article.photos, ...added], updatedBy: editor.name, updatedAt: new Date().toISOString() });
    revalidatePath(issuePath(n));
  });
}

export async function deletePhotoAction(n: number, id: string, photoId: string) {
  return attempt(async () => {
    const editor = await requireEditor();
    text(photoId, 32, "id фото");
    const article = await loadArticle(n, id);
    const photo = article.photos.find((p) => p.id === photoId);
    if (!photo) return;
    await removeFiles([photo.path]);
    const fields = article.fields
      ? {
          ...article.fields,
          content: dropPhotoMarkers(article.fields.content, [photoId]),
          coverPhotoId: article.fields.coverPhotoId === photoId ? "" : article.fields.coverPhotoId,
        }
      : undefined;
    await saveArticle({
      ...article,
      photos: article.photos.filter((p) => p.id !== photoId),
      fields,
      updatedBy: editor.name,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath(issuePath(n));
  });
}

export async function deleteArticleAction(n: number, id: string) {
  return attempt(async () => {
    await requireEditor();
    n = issueNumber(n);
    assertId(text(id, 32, "id"));
    await deleteArticle(n, id);
    revalidatePath(issuePath(n));
  });
}

export async function moveArticleAction(n: number, id: string, direction: -1 | 1) {
  return attempt(async () => {
    await requireEditor();
    n = issueNumber(n);
    if (direction !== -1 && direction !== 1) throw new Error("Невірний напрямок");
    const list = await listArticles(n);
    const index = list.findIndex((a) => a.id === id);
    const other = list[index + direction];
    if (index < 0 || !other) return;
    const current = list[index];
    // Renumber everything so equal or missing orders never get stuck.
    const reordered = [...list];
    reordered[index] = other;
    reordered[index + direction] = current;
    await Promise.all(reordered.map((a, k) => (a.order === k + 1 ? null : saveArticle({ ...a, order: k + 1 }))));
    revalidatePath(issuePath(n));
  });
}

export async function processArticleAction(n: number, id: string) {
  return attempt(async () => {
    const editor = await requireEditor();
    await loadArticle(n, id);
    const result = await processArticle(n, id, editor.name);
    revalidatePath(issuePath(n));
    if (result.status === "error") throw new Error(result.error ?? "Не вдалося обробити статтю");
    return result.processedWith === "claude" ? "Claude підготував статтю" : "Чернетку статті підготовлено";
  });
}

export async function saveNotesAction(n: number, id: string, notes: string) {
  return attempt(async () => {
    await requireEditor();
    text(notes, 2000, "Примітка");
    const article = await loadArticle(n, id);
    await saveArticle({ ...article, notes: notes.slice(0, 2000) });
    revalidatePath(issuePath(n));
  });
}

export async function setCheckedAction(n: number, id: string, checked: boolean) {
  return attempt(async () => {
    const editor = await requireEditor();
    if (typeof checked !== "boolean") throw new Error("Невірне значення");
    const article = await loadArticle(n, id);
    if (checked && article.status !== "ready") throw new Error("Спершу обробіть статтю");
    await saveArticle({ ...article, checkedBy: checked ? editor.name : undefined });
    revalidatePath(issuePath(n));
  });
}

export async function saveArticleAction(
  n: number,
  id: string,
  fields: ArticleFields,
  captions: Record<string, string>
) {
  return attempt(async () => {
    const editor = await requireEditor();
    const article = await loadArticle(n, id);
    fields = articleFields(fields);
    captions = checkCaptions(captions);
    if (!fields.title.trim()) throw new Error("Заголовок не може бути порожнім");
    const clean: ArticleFields = {
      title: fields.title.trim(),
      description: fields.description.trim(),
      category: fields.category,
      subcategory: fields.subcategory.trim(),
      author: fields.author.trim(),
      authorLabel: fields.authorLabel.trim(),
      authorDescription: fields.authorDescription.trim(),
      content: fields.content.replace(/\r\n/g, "\n").trim(),
      coverPhotoId: article.photos.some((p) => p.id === fields.coverPhotoId) ? fields.coverPhotoId : "",
    };
    await saveArticle({
      ...article,
      fields: clean,
      status: "ready",
      error: undefined,
      photos: article.photos.map((p) => ({ ...p, caption: captions[p.id]?.trim() || undefined })),
      updatedBy: editor.name,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath(issuePath(n));
    revalidatePath(`${issuePath(n)}/stattia/${id}`);
    return "Збережено";
  });
}

/** Lets an article be written by hand when there is nothing to process (or processing keeps failing). */
export async function startManuallyAction(n: number, id: string) {
  return attempt(async () => {
    const editor = await requireEditor();
    const article = await loadArticle(n, id);
    if (article.fields) return;
    await saveArticle({
      ...article,
      status: "ready",
      error: undefined,
      fields: {
        title: article.source.name.replace(/\.(docx|pdf)$/i, ""),
        description: "",
        category: "ЛІЦЕЙ",
        subcategory: "",
        author: "",
        authorLabel: "",
        authorDescription: "",
        content: "",
        coverPhotoId: article.photos[0]?.id ?? "",
      },
      updatedBy: editor.name,
      updatedAt: new Date().toISOString(),
    });
    revalidatePath(issuePath(n));
  });
}

export async function publishIssueAction(n: number) {
  return attempt(async () => {
    const editor = await requireChief();
    n = issueNumber(n);
    const issue = await publishIssue(n, editor);
    audit("issue_published", { issue: n, login: editor.login, ref: issue.publishedRef });
    revalidatePath(issuePath(n));
    revalidatePath("/redakciya");
    return issue.publishedRef === "local"
      ? "Випуск записано у файли проєкту (локальний режим)"
      : "Випуск відправлено на сайт. Vercel оновить його за 1–2 хвилини.";
  });
}
