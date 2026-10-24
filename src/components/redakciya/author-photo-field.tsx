"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { removeAuthorPhotoAction, setAuthorPhotoAction } from "@/app/redakciya/actions";
import type { DraftPhoto } from "@/lib/redakciya/store";
import { authorPhotoPath, fileExtension, PHOTO_EXTENSIONS, randomId } from "@/lib/redakciya/upload-paths";
import { Dropzone } from "./dropzone";
import { uploadToDrafts, type UploadFlow } from "./upload";

/** Portrait for the author card of one article: drop or pick a picture, or remove it. */
export function AuthorPhotoField({
  issue,
  articleId,
  photo,
  storage,
}: {
  issue: number;
  articleId: string;
  photo?: DraftPhoto;
  storage: UploadFlow;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const upload = async (files: File[]) => {
    const file = files.find((f) => (PHOTO_EXTENSIONS as readonly string[]).includes(fileExtension(f.name)));
    if (!file) {
      toast.error("Фото автора — це JPG, PNG, WebP або GIF");
      return;
    }
    setBusy(true);
    try {
      const id = randomId();
      await uploadToDrafts(file, authorPhotoPath(issue, articleId, id, fileExtension(file.name)), storage);
      const result = await setAuthorPhotoAction(issue, articleId, { id, name: file.name });
      if (!result.ok) throw new Error(result.error);
      toast.success(result.message ?? "Фото автора додано");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
    setBusy(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm("Прибрати фото автора?")) return;
    setBusy(true);
    const result = await removeAuthorPhotoAction(issue, articleId);
    if (!result.ok) toast.error(result.error);
    setBusy(false);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-[84px] w-[74px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {busy ? (
          <Loader2 size={18} className="animate-spin text-primary" aria-hidden />
        ) : photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- private draft file, not optimisable
          <img src={`/api/redakciya/file/${photo.path}`} alt="Фото автора" className="h-full w-full object-cover object-[center_20%]" />
        ) : (
          <UserRound size={26} className="text-muted-foreground" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <Dropzone
          compact
          accept="image/jpeg,image/png,image/webp,image/gif"
          onFiles={upload}
          title={photo ? "Замінити фото автора" : "Фото автора"}
          hint="для картки автора; перетягніть або натисніть"
          disabled={busy}
        />
        {photo ? (
          <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-700">
            <Trash2 size={12} aria-hidden /> Прибрати
          </button>
        ) : null}
      </div>
    </div>
  );
}
