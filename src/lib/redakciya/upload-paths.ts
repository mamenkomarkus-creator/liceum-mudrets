// Shared by the browser (to build paths) and the server (to check them).

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export const ARTICLE_EXTENSIONS = ["docx", "pdf"] as const;
export const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const;

export function sourcePath(issue: number, articleId: string, ext: string) {
  return `drafts/issues/${issue}/articles/${articleId}/source.${ext}`;
}

export function photoPath(issue: number, articleId: string, photoId: string, ext: string) {
  return `drafts/issues/${issue}/articles/${articleId}/photos/${photoId}.${ext}`;
}

export function authorPhotoPath(issue: number, articleId: string, photoId: string, ext: string) {
  return `drafts/issues/${issue}/articles/${articleId}/author/${photoId}.${ext}`;
}

const SOURCE_RE = /^drafts\/issues\/\d{1,4}\/articles\/[A-Za-z0-9]{4,32}\/source\.(docx|pdf)$/;
const PHOTO_RE = /^drafts\/issues\/\d{1,4}\/articles\/[A-Za-z0-9]{4,32}\/(photos|author)\/[A-Za-z0-9]{4,32}\.(jpg|jpeg|png|webp|gif)$/;

export function isAllowedUploadPath(pathname: string): boolean {
  return SOURCE_RE.test(pathname) || PHOTO_RE.test(pathname);
}

export function randomId(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export function fileExtension(name: string): string {
  return (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? "").toLowerCase();
}
