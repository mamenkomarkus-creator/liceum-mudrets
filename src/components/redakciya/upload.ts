"use client";

import { upload, uploadPresigned } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/redakciya/upload-paths";

/** Mirrors uploadFlow() on the server: which way the browser sends files to the drafts storage. */
export type UploadFlow = "token" | "presigned" | "local";

/** Puts one file into the drafts storage: straight to Vercel Blob in production, through our API locally. */
export async function uploadToDrafts(file: File, pathname: string, flow: UploadFlow, onProgress?: (percent: number) => void) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error(`«${file.name}» більший за 50 МБ`);
  if (flow !== "local") {
    const send = flow === "presigned" ? uploadPresigned : upload;
    await send(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/redakciya/upload",
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: onProgress ? (e) => onProgress(e.percentage) : undefined,
    });
    return;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("pathname", pathname);
  const response = await fetch("/api/redakciya/upload", { method: "POST", body: form });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Не вдалося завантажити «${file.name}»`);
  }
  onProgress?.(100);
}
