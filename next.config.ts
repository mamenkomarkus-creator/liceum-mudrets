import type { NextConfig } from "next";

// Report-Only for now: browsers log what would be blocked to /api/csp-report (Vercel logs) without breaking
// anything. Once the logs stay quiet, rename the header to Content-Security-Policy to enforce it.
// 'unsafe-inline' for scripts is needed by Next's inline bootstrap scripts without per-request nonces.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // Editorial uploads go straight from the browser to Vercel Blob.
  "connect-src 'self' https://vercel.com https://*.blob.vercel-storage.com",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy-Report-Only", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Files in /public keep their name when replaced, so cache them for a day and let CDNs revalidate.
const ASSET_CACHE = { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    // Safari aggressively caches dev assets, which makes style changes look like they never applied.
    if (process.env.NODE_ENV === "development") {
      return [{ source: "/:path*", headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }] }];
    }
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      { source: "/images/:path*", headers: [ASSET_CACHE] },
      { source: "/decks/:path*", headers: [ASSET_CACHE] },
      { source: "/docs/:path*", headers: [ASSET_CACHE] },
    ];
  },
};

export default nextConfig;
