import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentEditor } from "@/lib/redakciya/auth";
import { storageMode, writeFile } from "@/lib/redakciya/storage";
import { MAX_UPLOAD_BYTES, isAllowedUploadPath } from "@/lib/redakciya/upload-paths";

const ALLOWED_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * On Vercel the browser uploads straight to Blob storage (no 4.5 MB function body limit); this route only
 * hands out a short-lived token for an allowed path. Locally the file itself is posted here.
 */
export async function POST(request: Request) {
  if (!(await currentEditor())) return NextResponse.json({ error: "Потрібно увійти в редакцію" }, { status: 401 });

  if (storageMode() === "local") {
    const form = await request.formData();
    const file = form.get("file");
    const pathname = String(form.get("pathname") ?? "");
    if (!(file instanceof File) || !isAllowedUploadPath(pathname)) {
      return NextResponse.json({ error: "Недопустимий файл" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Файл завеликий" }, { status: 413 });
    await writeFile(pathname, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ pathname });
  }

  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isAllowedUploadPath(pathname)) throw new Error("Недопустимий шлях");
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
      // The client registers the file itself right after the upload, so nothing to do here.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Помилка завантаження" }, { status: 400 });
  }
}
