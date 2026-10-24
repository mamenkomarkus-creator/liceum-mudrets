// Builds the article markup from the author's own paragraphs and a layout description (from Claude).
// The layout can only drop leading/trailing service lines, move a caption next to its photo, and add
// markup prefixes; the words are copied from the original, and assertSameWords() checks that.

export const STYLE_KINDS = ["heading", "subheading", "quote", "note", "greeting", "signature", "question", "answer", "paragraph"] as const;
export type StyleKind = (typeof STYLE_KINDS)[number];

export interface Layout {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  author: string;
  authorLabel: string;
  authorDescription: string;
  coverPhotoId: string;
  /** 1-based paragraph numbers of service lines (rubric, title, byline…) to leave out of the text. */
  remove: number[];
  styles: { p: number; kind: StyleKind }[];
  /** Paragraphs that are captions of a neighbouring photo: they move to that photo's caption. */
  captions: { p: number; photoId: string }[];
}

const PHOTO = /^\[фото:([A-Za-z0-9]+)\]$/;
/** Only lines this close to the start or the end can be service lines. */
const HEAD = 6;
const TAIL = 4;
const MAX_SERVICE_LENGTH = 400;

export function splitParagraphs(markup: string): string[] {
  return markup.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

const stripHeading = (p: string) => p.replace(/^#+\s*/, "");
const stripEmphasis = (p: string) => p.replace(/^\*+|\*+$/g, "").trim();

function styled(p: string, kind: StyleKind | undefined): string {
  if (/^\s*([-*]|\d+\.)\s/.test(p) && kind !== "quote") return p; // lists keep their own markup
  const plain = stripHeading(p);
  switch (kind) {
    case "heading":
      return `## ${stripEmphasis(plain)}`;
    case "subheading":
      return `### ${stripEmphasis(plain)}`;
    case "quote":
      return p
        .split("\n")
        .map((line) => (line.startsWith(">") ? line : `> ${line}`))
        .join("\n");
    case "note":
      return `!> ${plain}`;
    case "greeting":
      return `^^ ${plain}`;
    case "signature":
      return `%% ${plain}`;
    case "question":
      return `Q> ${plain}`;
    case "answer":
      return `A> ${plain}`;
    case "paragraph":
      // A short bold line the Word converter took for a subheading goes back to being bold text.
      return p.startsWith("### ") ? `**${plain}**` : plain;
    default:
      return p;
  }
}

export interface Applied {
  content: string;
  captions: Record<string, string>;
  removed: string[];
}

export function applyLayout(paragraphs: string[], layout: Pick<Layout, "remove" | "styles" | "captions">): Applied {
  const last = paragraphs.length;
  const isPhoto = (i: number) => PHOTO.test(paragraphs[i - 1] ?? "");
  const remove = new Set(
    layout.remove.filter(
      (i) => Number.isInteger(i) && i >= 1 && i <= last && (i <= HEAD || i > last - TAIL) && !isPhoto(i) && paragraphs[i - 1].length <= MAX_SERVICE_LENGTH
    )
  );

  const captions: Record<string, string> = {};
  const captionParagraphs = new Set<number>();
  for (const { p, photoId } of layout.captions) {
    if (!Number.isInteger(p) || p < 1 || p > last || isPhoto(p) || remove.has(p) || captions[photoId]) continue;
    // Only a paragraph right next to that photo's marker can be its caption.
    const marker = `[фото:${photoId}]`;
    if (paragraphs[p - 2] !== marker && paragraphs[p] !== marker) continue;
    captions[photoId] = stripEmphasis(paragraphs[p - 1]);
    captionParagraphs.add(p);
  }

  const kinds = new Map(layout.styles.filter((s) => (STYLE_KINDS as readonly string[]).includes(s.kind)).map((s) => [s.p, s.kind]));
  const kept: string[] = [];
  paragraphs.forEach((p, k) => {
    const i = k + 1;
    if (remove.has(i) || captionParagraphs.has(i)) return;
    kept.push(isPhoto(i) ? p : styled(p, kinds.get(i)));
  });

  const result = {
    content: kept.join("\n\n"),
    captions,
    removed: paragraphs.filter((_, k) => remove.has(k + 1)),
  };
  const untouched = paragraphs.filter((_, k) => !remove.has(k + 1) && !captionParagraphs.has(k + 1));
  assertSameWords(untouched.join("\n\n"), result.content);
  return result;
}

/** Words of the text, ignoring markup characters: what a reader sees. */
function words(text: string): string {
  return text
    .replace(/\[фото:[A-Za-z0-9]+\]/g, " ")
    .replace(/^(#+|>|!>|\^\^|%%|Q>|A>)\s/gm, " ")
    .replace(/\*+/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

/** Safety net: markup may be added around the author's paragraphs, but not a single word may differ. */
export function assertSameWords(original: string, content: string) {
  if (words(original) !== words(content)) {
    throw new Error("Перевірка не пройшла: текст статті відрізняється від оригіналу. Обробку зупинено, нічого не змінено.");
  }
}
