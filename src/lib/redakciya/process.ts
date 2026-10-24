import { CATEGORIES, articles } from "@/lib/data";
import { docxToMarkup, pdfToText } from "./convert";
import { claudeEnabled, describeClaudeError, layoutWithClaude } from "./claude";
import { applyLayout, splitParagraphs, type Layout } from "./layout";
import { readFile, removeFiles, writeFile } from "./storage";
import { articleDir, getArticle, newId, saveArticle, type ArticleFields, type DraftArticle, type DraftPhoto } from "./store";

const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/**
 * Turns an uploaded Word/PDF file into editable article fields: pulls out the text and pictures, then lets
 * Claude fill title, author, category and markup (or makes a plain first draft when no API key is set).
 */
export async function processArticle(issue: number, id: string, editorName: string): Promise<DraftArticle> {
  const article = await getArticle(issue, id);
  if (!article) throw new Error("Статтю не знайдено");
  await saveArticle({ ...article, status: "processing", error: undefined });

  try {
    const source = await readFile(article.source.path);
    if (!source) throw new Error("Файл статті зник зі сховища — завантажте його ще раз");

    let photos = article.photos.filter((p) => p.origin === "upload");
    const staleDocxPhotos = article.photos.filter((p) => p.origin === "docx").map((p) => p.path);
    let markup: string | null = null;

    if (article.source.kind === "docx") {
      const converted = await docxToMarkup(source.data);
      markup = converted.markup;
      const extracted: DraftPhoto[] = [];
      for (const image of converted.images) {
        const ext = PHOTO_TYPES[image.contentType];
        if (!ext) {
          // EMF/WMF drawings and the like cannot be shown on the web.
          markup = markup.replace(`[фото:${image.marker}]`, "");
          continue;
        }
        const photoId = newId();
        const path = `${articleDir(issue, id)}/photos/${photoId}.${ext}`;
        await writeFile(path, image.data, image.contentType);
        extracted.push({ id: photoId, path, name: `Фото ${extracted.length + 1} з Word`, origin: "docx" });
        markup = markup.replace(`[фото:${image.marker}]`, `[фото:${photoId}]`);
      }
      photos = [...extracted, ...photos];
    }
    await removeFiles(staleDocxPhotos);

    let fields: ArticleFields;
    let processedWith: DraftArticle["processedWith"];
    if (claudeEnabled()) {
      const photoData = await Promise.all(
        photos.map(async (p) => ({ id: p.id, name: p.name, data: (await readFile(p.path))?.data }))
      );
      // Claude never returns text: it only says which paragraphs are headings, quotes, captions or service
      // lines, and applyLayout() rebuilds the article from the author's own words (and checks that).
      const paragraphs = splitParagraphs(markup ?? (await pdfToText(source.data)));
      let layout: Layout;
      try {
        layout = await layoutWithClaude({
          paragraphs,
          pdf: article.source.kind === "pdf" ? source.data : null,
          fileName: article.source.name,
          photos: photoData.filter((p): p is { id: string; name: string; data: Buffer } => !!p.data),
          notes: article.notes,
          uploadedBy: article.uploadedBy,
        });
      } catch (error) {
        throw new Error(describeClaudeError(error));
      }
      const applied = applyLayout(paragraphs, layout);
      fields = {
        title: layout.title,
        description: layout.description,
        category: layout.category,
        subcategory: layout.subcategory,
        author: layout.author,
        authorLabel: layout.authorLabel,
        authorDescription: layout.authorDescription,
        content: applied.content,
        coverPhotoId: layout.coverPhotoId,
      };
      photos = photos.map((p) => (applied.captions[p.id] && !p.caption ? { ...p, caption: applied.captions[p.id] } : p));
      processedWith = "claude";
    } else {
      const text = markup ?? (await pdfToText(source.data));
      fields = basicFields(text, article);
      processedWith = "basic";
    }

    fields.content = keepKnownPhotoMarkers(fields.content, photos);
    if (fields.coverPhotoId && !photos.some((p) => p.id === fields.coverPhotoId)) fields.coverPhotoId = "";
    if (!fields.coverPhotoId && photos.length) fields.coverPhotoId = photos[0].id;
    if (!fields.authorDescription) fields.authorDescription = knownAuthorDescription(fields.author);

    const done: DraftArticle = {
      ...article,
      photos,
      fields,
      status: "ready",
      error: undefined,
      processedWith,
      processedAt: new Date().toISOString(),
      checkedBy: undefined,
      updatedBy: editorName,
      updatedAt: new Date().toISOString(),
    };
    await saveArticle(done);
    return done;
  } catch (error) {
    const failed: DraftArticle = { ...article, status: "error", error: error instanceof Error ? error.message : String(error) };
    await saveArticle(failed);
    return failed;
  }
}

function keepKnownPhotoMarkers(content: string, photos: DraftPhoto[]): string {
  const ids = new Set(photos.map((p) => p.id));
  return content
    .replace(/\[фото:([A-Za-z0-9]+)\]/g, (m, photoId: string) => (ids.has(photoId) ? m : ""))
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function knownAuthorDescription(author: string): string {
  const name = author.trim();
  if (!name) return "";
  const latest = [...articles].reverse().find((a) => a.author?.trim() === name && a.authorProfile?.description);
  return latest?.authorProfile?.description ?? "";
}

/** First draft without Claude: the first heading or short line becomes the title, the rest is the text. */
function basicFields(text: string, article: DraftArticle): ArticleFields {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  // Authors often start with the rubric name ("ОБРІЇ") before the title.
  const plain = (p: string) => p.replace(/^#+\s*/, "").replace(/\*+/g, "").trim().toUpperCase();
  const rubricIndex = paragraphs.slice(0, 3).findIndex((p) => (CATEGORIES as string[]).includes(plain(p)));
  const category = rubricIndex >= 0 ? plain(paragraphs.splice(rubricIndex, 1)[0]) : "ЛІЦЕЙ";
  const titleIndex = paragraphs.findIndex((p) => !p.startsWith("[фото:"));
  let title = article.source.name.replace(/\.(docx|pdf)$/i, "");
  if (titleIndex >= 0 && paragraphs[titleIndex].replace(/^#+\s*/, "").length <= 140) {
    title = paragraphs[titleIndex].replace(/^#+\s*/, "").replace(/\*+/g, "").trim();
    paragraphs.splice(titleIndex, 1);
  }
  const knownAuthors = [...new Set(articles.map((a) => a.author?.trim()).filter((a): a is string => !!a))];
  const author = knownAuthors.find((name) => text.includes(name)) ?? "";
  const firstText = paragraphs.find((p) => !/^(#|\[фото:|[-*>]|\d+\.)/.test(p))?.replace(/\*+/g, "") ?? "";
  const description = firstText.length > 200 ? `${firstText.slice(0, 197).replace(/\s+\S*$/, "")}…` : firstText;
  return {
    title,
    description,
    category,
    subcategory: "",
    author,
    authorLabel: author ? "Автор статті" : "",
    authorDescription: "",
    content: paragraphs.join("\n\n"),
    coverPhotoId: "",
  };
}
