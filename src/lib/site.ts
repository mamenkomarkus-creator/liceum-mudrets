// Set NEXT_PUBLIC_SITE_URL at deploy time; the fallback is a placeholder, not a registered domain.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://liceum-mudrets.vercel.app").replace(/\/$/, "");

// Where readers' articles are sent. Taken from the school's printed programme; override with NEXT_PUBLIC_EDITORIAL_EMAIL.
export const EDITORIAL_EMAIL = process.env.NEXT_PUBLIC_EDITORIAL_EMAIL ?? "statelic@ukr.net";
