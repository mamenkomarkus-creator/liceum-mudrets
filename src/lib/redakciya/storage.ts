import fs from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

/**
 * Where uploaded articles and drafts live. On Vercel: a private Blob store (BLOB_READ_WRITE_TOKEN).
 * Without the token (local development) everything goes to the git-ignored `.redakciya/` folder.
 */
export type StorageMode = "blob" | "local";

export function storageMode(): StorageMode {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "local";
}

const LOCAL_ROOT = path.join(process.cwd(), ".redakciya");

/** Rejects `..`, absolute paths and anything outside the drafts area. */
export function assertSafePath(pathname: string): string {
  const clean = path.posix.normalize(pathname);
  if (clean !== pathname || clean.startsWith("/") || clean.includes("..") || !clean.startsWith("drafts/")) {
    throw new Error(`Недопустимий шлях: ${pathname}`);
  }
  return clean;
}

function localPath(pathname: string) {
  return path.join(LOCAL_ROOT, assertSafePath(pathname));
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  return Buffer.from(await new Response(stream).arrayBuffer());
}

export async function readFile(pathname: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (storageMode() === "local") {
    try {
      return { data: await fs.readFile(localPath(pathname)), contentType: contentTypeFor(pathname) };
    } catch {
      return null;
    }
  }
  const result = await get(assertSafePath(pathname), { access: "private", useCache: false });
  if (!result || !result.stream) return null;
  return { data: await streamToBuffer(result.stream), contentType: result.blob.contentType ?? contentTypeFor(pathname) };
}

export async function writeFile(pathname: string, data: Buffer | string, contentType = contentTypeFor(pathname)) {
  if (storageMode() === "local") {
    const target = localPath(pathname);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return;
  }
  await put(assertSafePath(pathname), data, { access: "private", addRandomSuffix: false, allowOverwrite: true, contentType });
}

export async function readJson<T>(pathname: string): Promise<T | null> {
  const file = await readFile(pathname);
  return file ? (JSON.parse(file.data.toString("utf8")) as T) : null;
}

export async function writeJson(pathname: string, value: unknown) {
  await writeFile(pathname, JSON.stringify(value, null, 2), "application/json");
}

/** All file paths under a prefix (recursively). */
export async function listFiles(prefix: string): Promise<string[]> {
  if (storageMode() === "local") {
    const root = localPath(prefix.replace(/\/$/, ""));
    try {
      const entries = await fs.readdir(root, { recursive: true, withFileTypes: true });
      return entries
        .filter((e) => e.isFile())
        .map((e) => path.relative(LOCAL_ROOT, path.join(e.parentPath, e.name)).split(path.sep).join("/"));
    } catch {
      return [];
    }
  }
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    paths.push(...page.blobs.map((b) => b.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

export async function removeFiles(paths: string[]) {
  if (!paths.length) return;
  if (storageMode() === "local") {
    await Promise.all(paths.map((p) => fs.rm(localPath(p), { force: true })));
    return;
  }
  await del(paths.map(assertSafePath));
}

export async function removePrefix(prefix: string) {
  await removeFiles(await listFiles(prefix));
}

const TYPES: Record<string, string> = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  json: "application/json",
};

export function extensionOf(name: string): string {
  return (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? "").toLowerCase();
}

export function contentTypeFor(name: string): string {
  return TYPES[extensionOf(name)] ?? "application/octet-stream";
}
