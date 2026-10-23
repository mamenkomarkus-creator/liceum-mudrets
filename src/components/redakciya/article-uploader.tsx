"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { registerArticleAction } from "@/app/redakciya/actions";
import { fileExtension, randomId, sourcePath } from "@/lib/redakciya/upload-paths";
import { Dropzone } from "./dropzone";
import { uploadToDrafts, type StorageMode } from "./upload";

interface Job {
  key: string;
  name: string;
  percent: number;
  state: "uploading" | "done" | "error";
  error?: string;
}

/** Every Word or PDF file dropped here becomes a separate article of the issue. */
export function ArticleUploader({ issue, storage }: { issue: number; storage: StorageMode }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const busy = jobs.some((j) => j.state === "uploading");

  const update = (key: string, patch: Partial<Job>) => setJobs((all) => all.map((j) => (j.key === key ? { ...j, ...patch } : j)));

  const handle = async (files: File[]) => {
    const accepted: File[] = [];
    for (const file of files) {
      const ext = fileExtension(file.name);
      if (ext === "docx" || ext === "pdf") accepted.push(file);
      else if (ext === "doc") toast.error(`«${file.name}»: старий формат .doc — збережіть файл у Word як .docx`);
      else if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) toast.error("Фото додавайте до конкретної статті — кнопкою «Додати фото» в її картці");
      else toast.error(`«${file.name}»: підтримуються лише .docx і .pdf`);
    }
    const queued = accepted.map((file) => ({ file, key: randomId() }));
    setJobs((all) => [...all.filter((j) => j.state !== "done"), ...queued.map(({ file, key }) => ({ key, name: file.name, percent: 0, state: "uploading" as const }))]);

    for (const { file, key } of queued) {
      try {
        const id = randomId();
        await uploadToDrafts(file, sourcePath(issue, id, fileExtension(file.name)), storage, (percent) => update(key, { percent }));
        const result = await registerArticleAction(issue, { id, name: file.name, size: file.size });
        if (!result.ok) throw new Error(result.error);
        update(key, { state: "done", percent: 100 });
      } catch (error) {
        update(key, { state: "error", error: error instanceof Error ? error.message : String(error) });
      }
    }
    router.refresh();
  };

  return (
    <div>
      <Dropzone
        accept=".docx,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onFiles={handle}
        title="Перетягніть сюди статті"
        hint="Word (.docx) або PDF — можна кілька одразу. Або натисніть, щоб вибрати на комп'ютері."
        disabled={busy}
      />
      {jobs.length ? (
        <ul className="mt-3 space-y-1.5 text-sm">
          {jobs.map((job) => (
            <li key={job.key} className="flex items-center gap-2">
              {job.state === "uploading" ? (
                <Loader2 size={15} className="animate-spin text-primary" aria-hidden />
              ) : job.state === "done" ? (
                <CheckCircle2 size={15} className="text-emerald-600" aria-hidden />
              ) : (
                <XCircle size={15} className="text-red-600" aria-hidden />
              )}
              <span className="min-w-0 truncate">{job.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {job.state === "uploading" ? `${Math.round(job.percent)}%` : job.state === "done" ? "додано" : job.error}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
