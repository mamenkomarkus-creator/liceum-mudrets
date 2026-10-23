import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type EditorRole = "chief" | "editor";

export interface Editor {
  login: string;
  name: string;
  role: EditorRole;
}

interface EditorAccount extends Editor {
  /** `scrypt:<salt>:<hash>`, made by `npm run redakciya:password`. */
  password: string;
}

const COOKIE = "rd_session";
const SESSION_DAYS = 30;

/** Editors come from the REDAKCIYA_USERS env variable (JSON array), so access is managed in Vercel settings. */
function accounts(): EditorAccount[] {
  const raw = process.env.REDAKCIYA_USERS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as EditorAccount[];
    return parsed.filter((a) => a && a.login && a.password).map((a) => ({ ...a, role: a.role === "chief" ? "chief" : "editor" }));
  } catch {
    console.error("REDAKCIYA_USERS is not valid JSON");
    return [];
  }
}

function secret(): string {
  const value = process.env.REDAKCIYA_SECRET;
  if (!value || value.length < 16) throw new Error("REDAKCIYA_SECRET is not set (at least 16 characters)");
  return value;
}

export function isConfigured(): boolean {
  return accounts().length > 0 && (process.env.REDAKCIYA_SECRET?.length ?? 0) >= 16;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(password, salt, 32).toString("base64url");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function logIn(login: string, password: string): Promise<Editor | null> {
  const account = accounts().find((a) => a.login.toLowerCase() === login.trim().toLowerCase());
  // Run scrypt even for unknown logins so the response time does not reveal which logins exist.
  const ok = verifyPassword(password, account?.password ?? hashPassword("dummy")) && !!account;
  if (!ok || !account) return null;

  const payload = Buffer.from(JSON.stringify({ login: account.login, exp: Date.now() + SESSION_DAYS * 86_400_000 })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return { login: account.login, name: account.name, role: account.role };
}

export async function logOut() {
  (await cookies()).delete(COOKIE);
}

/** Reads the session cookie. An editor removed from REDAKCIYA_USERS loses access at once. */
export async function currentEditor(): Promise<Editor | null> {
  if (!isConfigured()) return null;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const { login, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { login: string; exp: number };
    if (Date.now() > exp) return null;
    const account = accounts().find((a) => a.login === login);
    return account ? { login: account.login, name: account.name, role: account.role } : null;
  } catch {
    return null;
  }
}

/** For pages: sends visitors without a session to the login form. */
export async function requireEditorPage(): Promise<Editor> {
  const editor = await currentEditor();
  if (!editor) redirect("/redakciya/vhid");
  return editor;
}

/** For server actions and API routes: throws instead of redirecting. */
export async function requireEditor(): Promise<Editor> {
  const editor = await currentEditor();
  if (!editor) throw new Error("Потрібно увійти в редакцію");
  return editor;
}

export async function requireChief(): Promise<Editor> {
  const editor = await requireEditor();
  if (editor.role !== "chief") throw new Error("Це може зробити лише головний редактор");
  return editor;
}
