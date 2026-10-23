import { NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import { handleUpload, handleUploadPresigned, type HandleUploadBody, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { currentEditor } from "@/lib/redakciya/auth";
import { uploadFlow, writeFile } from "@/lib/redakciya/storage";
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
 * hands out a short-lived token or presigned URL for an allowed path. Locally the file itself is posted here.
 */
export async function POST(request: Request) {
  if (!(await currentEditor())) return NextResponse.json({ error: "Потрібно увійти в редакцію" }, { status: 401 });
  const flow = uploadFlow();

  if (flow === "local") {
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

  try {
    if (flow === "presigned") {
      const body = (await request.json()) as HandleUploadPresignedBody;
      const result = await handleUploadPresigned({
        body,
        request,
        getSignedToken: async (pathname) => {
          if (!isAllowedUploadPath(pathname)) throw new Error("Недопустимий шлях");
          const token = await issueSignedToken({
            pathname,
            operations: ["put"],
            allowedContentTypes: ALLOWED_TYPES,
            maximumSizeInBytes: MAX_UPLOAD_BYTES,
            validUntil: Date.now() + 15 * 60_000,
          });
          return {
            token,
            urlOptions: { allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: MAX_UPLOAD_BYTES, addRandomSuffix: false, allowOverwrite: true },
          };
        },
      });
      return NextResponse.json(result);
    }

    const body = (await request.json()) as HandleUploadBody;
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
