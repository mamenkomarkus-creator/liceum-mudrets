import { articles } from "@/lib/data";
import type { Article, AuthorProfile } from "@/lib/types";
import type { DraftArticle, DraftIssue, DraftPhoto } from "./store";

export interface BuiltArticle {
  article: Article;
  /** Photos the article uses, in the order of `article.images`, plus the cover if it is separate. */
  files: { photo: DraftPhoto; src: string }[];
}

/** Site id of the n-th article of an issue: issue 9 -> 901, 902… */
export const siteArticleId = (issue: number, index: number) => issue * 100 + index + 1;

/** Photo URL inside the preview (served from the drafts storage). */
export const previewPhotoSrc = (photo: DraftPhoto) => `/api/redakciya/file/${photo.path}`;

function existingProfile(author: string): AuthorProfile | undefined {
  const name = author.trim();
  return [...articles].reverse().find((a) => a.author?.trim() === name && a.authorProfile)?.authorProfile;
}

/**
 * Converts a processed draft into the entry that goes to src/data/articles.json.
 * `photoSrc` decides where pictures live: drafts storage for preview, /images/issueN/… when publishing.
 */
export function buildSiteArticle(
  draft: DraftArticle,
  issue: Pick<DraftIssue, "number" | "dateLabel">,
  index: number,
  photoSrc: (photo: DraftPhoto, position: number) => string
): BuiltArticle {
  const fields = draft.fields;
  if (!fields) throw new Error(`Стаття «${draft.source.name}» ще не оброблена`);
  const id = siteArticleId(issue.number, index);

  const referenced = new Set([...fields.content.matchAll(/\[фото:([A-Za-z0-9]+)\]/g)].map((m) => m[1]));
  const cover = draft.photos.find((p) => p.id === fields.coverPhotoId);
  // A cover that is not placed in the text only shows on the card, not again in the end-of-article gallery.
  const inArticle = draft.photos.filter((p) => p.id !== cover?.id || referenced.has(p.id));

  const files = inArticle.map((photo, k) => ({ photo, src: photoSrc(photo, k + 1) }));
  const coverFile = cover ? files.find((f) => f.photo.id === cover.id) ?? { photo: cover, src: photoSrc(cover, 0) } : undefined;
  if (coverFile && !files.includes(coverFile)) files.push(coverFile);

  const content = fields.content.replace(/\[фото:([A-Za-z0-9]+)\]/g, (m, photoId: string) => {
    const k = inArticle.findIndex((p) => p.id === photoId);
    return k >= 0 ? `[images:${k}]` : "";
  });

  const author = fields.author.trim();
  const known = author ? existingProfile(author) : undefined;
  const description = fields.authorDescription.trim();
  const authorProfile: AuthorProfile | undefined = known
    ? { ...known, description: description || known.description }
    : author
      ? { name: author, ...(description ? { description } : {}) }
      : undefined;

  const imageSrcs = inArticle.map((photo) => files.find((f) => f.photo.id === photo.id)!.src);
  const article: Article = {
    id,
    category: fields.category,
    ...(fields.subcategory.trim() ? { subcategory: fields.subcategory.trim() } : {}),
    title: fields.title.trim(),
    description: fields.description.trim(),
    ...(coverFile ? { image: coverFile.src } : {}),
    ...(author ? { author } : {}),
    ...(author && fields.authorLabel.trim() ? { authorLabel: fields.authorLabel.trim() } : {}),
    date: issue.dateLabel,
    issue: issue.number,
    ...(authorProfile ? { authorProfile } : {}),
    content: content.replace(/\n{3,}/g, "\n\n").trim(),
    ...(imageSrcs.length
      ? {
          images: imageSrcs,
          imagesWithCaptions: inArticle.map((photo, k) => ({
            src: imageSrcs[k],
            ...(photo.caption?.trim() ? { caption: photo.caption.trim() } : {}),
          })),
        }
      : {}),
  };
  return { article, files };
}
