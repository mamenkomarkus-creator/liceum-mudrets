"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, ImagePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { saveArticleAction } from "@/app/redakciya/actions";
import type { ArticleFields, DraftPhoto } from "@/lib/redakciya/store";
import { Field, inputClass, PrimaryButton } from "./ui";

const LABELS = ["Автор статті", "Авторка статті", "Автори статті", "Авторка репортажу", "Автор рубрики", "Авторка рубрики"];

export function ArticleEditor({
  issue,
  id,
  initial,
  photos,
  categories,
  authors,
}: {
  issue: number;
  id: string;
  initial: ArticleFields;
  photos: DraftPhoto[];
  categories: string[];
  authors: string[];
}) {
  const router = useRouter();
  const [fields, setFields] = useState(initial);
  const [captions, setCaptions] = useState<Record<string, string>>(Object.fromEntries(photos.map((p) => [p.id, p.caption ?? ""])));
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const content = useRef<HTMLTextAreaElement>(null);
  const previewHref = `/redakciya/vypusk/${issue}/stattia/${id}/pereglyad`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ArticleFields>(key: K, value: ArticleFields[K]) => {
    setFields((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const insertPhoto = (photoId: string) => {
    const area = content.current;
    const marker = `[фото:${photoId}]`;
    const at = area ? area.selectionStart : fields.content.length;
    const before = fields.content.slice(0, at).replace(/\s*$/, "");
    const after = fields.content.slice(at).replace(/^\s*/, "");
    set("content", `${before}${before ? "\n\n" : ""}${marker}${after ? "\n\n" : ""}${after}`);
    toast.success("Фото вставлено в текст там, де стояв курсор");
  };

  const save = (then?: () => void) =>
    start(async () => {
      const result = await saveArticleAction(issue, id, fields, captions);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setDirty(false);
      toast.success("Збережено");
      router.refresh();
      then?.();
    });

  return (
    <form
      className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
        <Field label="Заголовок">
          <input value={fields.title} onChange={(e) => set("title", e.target.value)} required className={`${inputClass} font-display text-lg font-bold`} />
        </Field>
        <Field label="Короткий опис" hint="1–2 речення для картки на головній сторінці">
          <textarea value={fields.description} onChange={(e) => set("description", e.target.value)} rows={2} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Рубрика">
            <select value={fields.category} onChange={(e) => set("category", e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Підрубрика (необов'язково)">
            <input value={fields.subcategory} onChange={(e) => set("subcategory", e.target.value)} className={inputClass} placeholder="Події" />
          </Field>
          <Field label="Автор" hint="Ім'я та прізвище; кількох — через кому">
            <input value={fields.author} onChange={(e) => set("author", e.target.value)} list="known-authors" className={inputClass} />
          </Field>
          <Field label="Підпис над автором">
            <input value={fields.authorLabel} onChange={(e) => set("authorLabel", e.target.value)} list="author-labels" className={inputClass} />
          </Field>
        </div>
        <Field label="Про автора" hint="Клас або місце навчання — показується в картці автора">
          <input value={fields.authorDescription} onChange={(e) => set("authorDescription", e.target.value)} className={inputClass} />
        </Field>
        <datalist id="known-authors">
          {authors.map((a) => (
            <option key={a} value={a} />
          ))}
        </datalist>
        <datalist id="author-labels">
          {LABELS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
        <Field label="Текст статті">
          <textarea
            ref={content}
            value={fields.content}
            onChange={(e) => set("content", e.target.value)}
            rows={26}
            className={`${inputClass} font-mono text-[13.5px] leading-relaxed`}
          />
        </Field>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer font-semibold text-foreground">Як оформлювати текст</summary>
          <ul className="mt-2 space-y-1 leading-relaxed">
            <li>Порожній рядок — новий абзац. <code>## Підзаголовок</code>, <code>### Менший підзаголовок</code>.</li>
            <li>
              <code>**жирний**</code>, <code>*курсив*</code>, списки <code>- пункт</code> і <code>1. пункт</code>, розділювач <code>---</code>.
            </li>
            <li>
              <code>&gt; цитата</code>, <code>!&gt; примітка</code>, <code>^^ Звернення</code> на початку, <code>%% Підпис</code> наприкінці.
            </li>
            <li>
              Інтерв&apos;ю: <code>Q&gt; питання</code> і <code>A&gt; відповідь</code> окремими абзацами.
            </li>
            <li>
              <code>[фото:…]</code> — фото в тексті. Фото, яких немає в тексті, з&apos;являться галереєю в кінці статті.
            </li>
          </ul>
        </details>
      </div>

      <aside className="space-y-4">
        <div className="sticky top-4 space-y-4">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4 shadow-sm">
            <PrimaryButton type="submit" pending={pending}>
              <Save size={15} aria-hidden /> {dirty ? "Зберегти зміни" : "Збережено"}
            </PrimaryButton>
            <Link
              href={previewHref}
              onClick={(e) => {
                if (!dirty) return;
                e.preventDefault();
                save(() => router.push(previewHref));
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary"
            >
              <Eye size={14} aria-hidden /> Переглянути як на сайті
            </Link>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Фото ({photos.length})</h2>
            {photos.length ? (
              <ul className="mt-3 space-y-4">
                {photos.map((photo) => {
                  const inText = fields.content.includes(`[фото:${photo.id}]`);
                  return (
                    <li key={photo.id} className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element -- private draft files, not optimisable */}
                      <img src={`/api/redakciya/file/${photo.path}`} alt={photo.name} className="aspect-[16/10] w-full rounded-md bg-muted object-cover" />
                      <input
                        value={captions[photo.id] ?? ""}
                        onChange={(e) => {
                          setCaptions((c) => ({ ...c, [photo.id]: e.target.value }));
                          setDirty(true);
                        }}
                        placeholder="Підпис до фото"
                        aria-label={`Підпис до фото ${photo.name}`}
                        className={`${inputClass} text-sm`}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <label className="inline-flex items-center gap-1.5">
                          <input
                            type="radio"
                            name="cover"
                            checked={fields.coverPhotoId === photo.id}
                            onChange={() => set("coverPhotoId", photo.id)}
                          />
                          Обкладинка
                        </label>
                        {inText ? (
                          <span className="text-xs text-muted-foreground">є в тексті</span>
                        ) : (
                          <button type="button" onClick={() => insertPhoto(photo.id)} className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ImagePlus size={14} aria-hidden /> Вставити в текст
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
                <li>
                  <label className="inline-flex items-center gap-1.5 text-sm">
                    <input type="radio" name="cover" checked={!fields.coverPhotoId} onChange={() => set("coverPhotoId", "")} />
                    Без обкладинки
                  </label>
                </li>
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Фото можна додати в картці статті на сторінці випуску.</p>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}
