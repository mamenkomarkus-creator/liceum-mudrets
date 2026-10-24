"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Eye, FileText, Pencil, Sparkles, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import {
  addPhotosAction,
  deleteArticleAction,
  deletePhotoAction,
  moveArticleAction,
  processArticleAction,
  saveNotesAction,
  setCheckedAction,
  startManuallyAction,
  type ActionResult,
} from "@/app/redakciya/actions";
import type { DraftArticle } from "@/lib/redakciya/store";
import { fileExtension, photoPath, PHOTO_EXTENSIONS, randomId } from "@/lib/redakciya/upload-paths";
import { Badge, formatDate, SecondaryButton, PrimaryButton } from "./ui";
import { Dropzone } from "./dropzone";
import { AuthorPhotoField } from "./author-photo-field";
import { uploadToDrafts, type UploadFlow } from "./upload";

export function ArticleCard({
  article,
  position,
  isFirst,
  isLast,
  storage,
  claude,
}: {
  article: DraftArticle;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  storage: UploadFlow;
  claude: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [, start] = useTransition();
  const [notes, setNotes] = useState(article.notes);
  const base = `/redakciya/vypusk/${article.issue}/stattia/${article.id}`;
  const fields = article.fields;

  const run = (label: string, action: () => Promise<ActionResult>, success?: string) => {
    setBusy(label);
    start(async () => {
      const result = await action();
      setBusy(null);
      if (!result.ok) toast.error(result.error);
      else if (result.message || success) toast.success(result.message ?? success);
      router.refresh();
    });
  };

  const process = () => {
    if (fields && !confirm("Обробити ще раз? Ручні правки цієї статті буде замінено новою версією.")) return;
    run("process", () => processArticleAction(article.issue, article.id));
  };

  const addPhotos = async (files: File[]) => {
    const photos = files.filter((f) => (PHOTO_EXTENSIONS as readonly string[]).includes(fileExtension(f.name)));
    if (photos.length < files.length) toast.error("Додавати можна лише фото: JPG, PNG, WebP або GIF");
    if (!photos.length) return;
    setBusy("photos");
    try {
      const uploaded: { id: string; name: string }[] = [];
      for (const file of photos) {
        const id = randomId();
        await uploadToDrafts(file, photoPath(article.issue, article.id, id, fileExtension(file.name)), storage);
        uploaded.push({ id, name: file.name });
      }
      const result = await addPhotosAction(article.issue, article.id, uploaded);
      if (!result.ok) throw new Error(result.error);
      toast.success(uploaded.length === 1 ? "Фото додано" : `Додано фото: ${uploaded.length}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
    setBusy(null);
    router.refresh();
  };

  const processing = busy === "process" || article.status === "processing";

  return (
    <article className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
          {position}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {fields ? <span className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{fields.category}</span> : null}
            <StatusBadge article={article} processing={processing} />
            {article.checkedBy ? (
              <Badge tone="green">
                <Check size={12} aria-hidden /> Перевірено · {article.checkedBy}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-1 break-words font-display text-lg font-bold leading-snug text-[#111]">
            {fields?.title || article.source.name}
          </h3>
          {fields?.author ? <p className="text-sm text-foreground/80">{fields.author}</p> : null}
          {fields?.description ? <p className="mt-1.5 text-sm text-muted-foreground">{fields.description}</p> : null}
          {article.status === "error" && article.error ? (
            <p role="alert" className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {article.error}
            </p>
          ) : null}

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Link href={`${base}/oryginal`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <FileText size={13} aria-hidden /> {article.source.name}
            </Link>
            <span>
              завантажив(ла) {article.uploadedBy}, {formatDate(article.uploadedAt)}
            </span>
            {article.updatedBy && article.updatedAt ? <span>· змінено: {article.updatedBy}</span> : null}
          </p>

          {article.photos.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {article.photos.map((photo) => (
                <li key={photo.id} className="group relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private draft files, not optimisable */}
                  <img
                    src={`/api/redakciya/file/${photo.path}`}
                    alt={photo.caption ?? photo.name}
                    title={photo.name}
                    className={`h-16 w-16 rounded-md object-cover ${fields?.coverPhotoId === photo.id ? "ring-2 ring-primary ring-offset-1" : ""}`}
                  />
                  <button
                    type="button"
                    aria-label={`Видалити фото ${photo.name}`}
                    onClick={() => confirm(`Видалити фото «${photo.name}»?`) && run("photo", () => deletePhotoAction(article.issue, article.id, photo.id))}
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-navy text-white group-hover:flex focus:flex"
                  >
                    <X size={12} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 grid max-w-3xl gap-3 md:grid-cols-2">
            <Dropzone
              compact
              accept="image/jpeg,image/png,image/webp,image/gif"
              onFiles={addPhotos}
              title={busy === "photos" ? "Завантаження фото…" : "Додати фото до статті"}
              hint="перетягніть або натисніть"
              disabled={busy === "photos"}
            />
            <AuthorPhotoField issue={article.issue} articleId={article.id} photo={article.authorPhoto} storage={storage} />
          </div>

          {!fields ? (
            <label className="mt-3 block max-w-xl">
              <span className="text-xs font-semibold text-muted-foreground">Примітка для обробки (необов&apos;язково)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => notes !== article.notes && run("notes", () => saveNotesAction(article.issue, article.id, notes))}
                rows={2}
                placeholder="Напр.: автор — Олена Коваль, 10-Б; рубрика ВИПУСКНИКИ"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </label>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PrimaryButton type="button" onClick={process} pending={processing} disabled={!!busy && !processing}>
              {claude ? <Sparkles size={15} aria-hidden /> : <Wand2 size={15} aria-hidden />}
              {processing ? (claude ? "Claude обробляє… (до 2 хв)" : "Обробка…") : fields ? "Обробити ще раз" : claude ? "Обробити через Claude" : "Обробити"}
            </PrimaryButton>
            {fields ? (
              <>
                <Link href={base} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary">
                  <Pencil size={14} aria-hidden /> Редагувати
                </Link>
                <Link href={`${base}/pereglyad`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold hover:border-primary/40 hover:text-primary">
                  <Eye size={14} aria-hidden /> Як на сайті
                </Link>
                <SecondaryButton
                  type="button"
                  pending={busy === "check"}
                  onClick={() => run("check", () => setCheckedAction(article.issue, article.id, !article.checkedBy))}
                >
                  <Check size={14} aria-hidden /> {article.checkedBy ? "Зняти позначку" : "Перевірено"}
                </SecondaryButton>
              </>
            ) : article.status === "error" ? (
              <SecondaryButton type="button" onClick={() => run("manual", () => startManuallyAction(article.issue, article.id))}>
                Заповнити вручну
              </SecondaryButton>
            ) : null}

            <div className="ml-auto flex items-center gap-1">
              <IconButton label="Вище" disabled={isFirst || !!busy} onClick={() => run("move", () => moveArticleAction(article.issue, article.id, -1))}>
                <ArrowUp size={16} />
              </IconButton>
              <IconButton label="Нижче" disabled={isLast || !!busy} onClick={() => run("move", () => moveArticleAction(article.issue, article.id, 1))}>
                <ArrowDown size={16} />
              </IconButton>
              <IconButton
                label="Видалити статтю"
                disabled={!!busy}
                onClick={() =>
                  confirm(`Видалити статтю «${fields?.title || article.source.name}» разом з файлами?`) &&
                  run("delete", () => deleteArticleAction(article.issue, article.id), "Статтю видалено")
                }
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ article, processing }: { article: DraftArticle; processing: boolean }) {
  if (processing) return <Badge tone="blue">Обробляється</Badge>;
  if (article.status === "error") return <Badge tone="red">Помилка обробки</Badge>;
  if (article.status === "ready") return <Badge tone="gray">{article.processedWith === "claude" ? "Оброблено Claude" : "Чернетка готова"}</Badge>;
  return <Badge tone="amber">Не оброблено</Badge>;
}

function IconButton({ label, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
