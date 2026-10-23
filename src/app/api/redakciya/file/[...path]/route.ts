import { currentEditor } from "@/lib/redakciya/auth";
import { readFile } from "@/lib/redakciya/storage";

/** Serves uploaded drafts (originals, photos) to signed-in editors only. */
export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!(await currentEditor())) return new Response("Потрібно увійти в редакцію", { status: 401 });
  const { path } = await params;
  const pathname = path.map(decodeURIComponent).join("/");

  let file;
  try {
    file = await readFile(pathname);
  } catch {
    return new Response("Невірний шлях", { status: 400 });
  }
  if (!file) return new Response("Файл не знайдено", { status: 404 });

  const download = new URL(request.url).searchParams.get("name");
  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      ...(download ? { "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(download)}` } : {}),
    },
  });
}
