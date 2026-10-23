import crypto from "node:crypto";
import { headers } from "next/headers";
import { readJson, writeJson } from "./storage";

// Login throttling, session revocation and an audit trail for the editorial panel. State lives in the same
// drafts storage as everything else, under drafts/_security/, so it survives deploys without a database.

const WINDOW_MS = 15 * 60_000;
const LOCK_MS = 15 * 60_000;
/** Wrong passwords for one login before it is locked. */
const LOGIN_LIMIT = 5;
/** Wrong passwords from one address (any logins) before it is locked. */
const IP_LIMIT = 20;

interface Attempts {
  failures: number[];
  lockedUntil?: number;
}

const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);
const attemptsFile = (key: string) => `drafts/_security/attempts/${key}.json`;
const sessionsFile = (login: string) => `drafts/_security/sessions/${digest(login.toLowerCase())}.json`;

export async function clientIp(): Promise<string> {
  const h = await headers();
  // On Vercel x-forwarded-for is set by the platform, so its first entry is the real client address.
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function throttleKeys(login: string, ip: string) {
  return [
    { key: digest(`login:${login.trim().toLowerCase()}`), limit: LOGIN_LIMIT },
    { key: digest(`ip:${ip}`), limit: IP_LIMIT },
  ];
}

/** Minutes until the login or the address may try again, or 0 when not locked. */
export async function lockedForMinutes(login: string, ip: string): Promise<number> {
  const now = Date.now();
  let until = 0;
  for (const { key } of throttleKeys(login, ip)) {
    const state = await readJson<Attempts>(attemptsFile(key));
    if (state?.lockedUntil && state.lockedUntil > now) until = Math.max(until, state.lockedUntil);
  }
  return until ? Math.ceil((until - now) / 60_000) : 0;
}

/** Counts a wrong password; returns true when this attempt locked the login or the address. */
export async function recordFailure(login: string, ip: string): Promise<boolean> {
  const now = Date.now();
  let locked = false;
  for (const { key, limit } of throttleKeys(login, ip)) {
    const state = (await readJson<Attempts>(attemptsFile(key))) ?? { failures: [] };
    const failures = [...state.failures.filter((t) => now - t < WINDOW_MS), now];
    const lock = failures.length >= limit;
    locked ||= lock;
    await writeJson(attemptsFile(key), lock ? { failures: [], lockedUntil: now + LOCK_MS } : { failures });
  }
  return locked;
}

export async function clearFailures(login: string) {
  const [loginKey] = throttleKeys(login, "");
  await writeJson(attemptsFile(loginKey.key), { failures: [] });
}

/** Sessions of this login issued before the returned moment are no longer valid. */
export async function sessionsRevokedBefore(login: string): Promise<number> {
  return (await readJson<{ revokedBefore: number }>(sessionsFile(login)))?.revokedBefore ?? 0;
}

/** Signs this login out everywhere (used on logout). */
export async function revokeSessions(login: string) {
  await writeJson(sessionsFile(login), { revokedBefore: Date.now() });
}

/** One JSON line per event in the Vercel function logs: logins, lockouts, publications. */
export function audit(event: string, details: Record<string, unknown>) {
  console.info(JSON.stringify({ scope: "redakciya", event, at: new Date().toISOString(), ...details }));
}
