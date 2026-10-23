import { CATEGORIES } from "@/lib/issues";
import type { ArticleFields } from "./store";

// Server actions receive whatever the browser sends, whatever their TypeScript signature says.
// These checks run first in every action so bad input fails early with a clear message.

export function issueNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 9999) throw new Error("Невірний номер випуску");
  return value;
}

export function text(value: unknown, max: number, label: string): string {
  if (typeof value !== "string") throw new Error(`Поле «${label}» має бути текстом`);
  if (value.length > max) throw new Error(`Поле «${label}» задовге (більше ${max} символів)`);
  return value;
}

export function articleFields(value: unknown): ArticleFields {
  if (!value || typeof value !== "object") throw new Error("Невірні дані статті");
  const f = value as Record<string, unknown>;
  const category = text(f.category, 60, "Рубрика");
  if (!(CATEGORIES as string[]).includes(category)) throw new Error("Оберіть рубрику зі списку");
  return {
    title: text(f.title, 300, "Заголовок"),
    description: text(f.description, 600, "Короткий опис"),
    category,
    subcategory: text(f.subcategory, 120, "Підрубрика"),
    author: text(f.author, 300, "Автор"),
    authorLabel: text(f.authorLabel, 80, "Підпис над автором"),
    authorDescription: text(f.authorDescription, 400, "Про автора"),
    content: text(f.content, 300_000, "Текст статті"),
    coverPhotoId: text(f.coverPhotoId, 32, "Обкладинка"),
  };
}

export function captions(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).slice(0, 200);
  return Object.fromEntries(entries.map(([id, caption]) => [id, text(caption, 500, "Підпис до фото")]));
}
