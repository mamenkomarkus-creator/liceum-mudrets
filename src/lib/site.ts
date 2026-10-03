// Public address of the site. Override with NEXT_PUBLIC_SITE_URL (e.g. for a preview deployment).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://liceum-mudrets.com.ua").replace(/\/$/, "");

// Where readers' articles are sent. Taken from the school's printed programme; override with NEXT_PUBLIC_EDITORIAL_EMAIL.
export const EDITORIAL_EMAIL = process.env.NEXT_PUBLIC_EDITORIAL_EMAIL ?? "statelic@ukr.net";
