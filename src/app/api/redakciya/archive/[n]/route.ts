import JSZip from "jszip";
import { audit } from "@/lib/redakciya/security";
import { currentEditor } from "@/lib/redakciya/auth";
import { listFiles, readFile } from "@/lib/redakciya/storage";
import { getIssue, issueDir } from "@/lib/redakciya/store";

export const maxDuration = 60;

/** A zip of everything uploaded for an issue (originals, photos, drafts) — the backup of the Blob drafts. */
export async function GET(_request: Request, { params }: { params: Promise<{ n: string }> }) {
  const editor = await currentEditor();
  if (!editor) return new Response("Потрібно увійти в редакцію", { status: 401 });
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 1 || n > 9999 || !(await getIssue(n))) return new Response("Випуск не знайдено", { status: 404 });

  const prefix = `${issueDir(n)}/`;
  const zip = new JSZip();
  for (const path of await listFiles(prefix)) {
    const file = await readFile(path);
    if (file) zip.file(path.slice(prefix.length), file.data);
  }
  const data = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  audit("issue_archive_downloaded", { issue: n, login: editor.login });
  return new Response(data, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="vypusk-${n}-redakciya.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
