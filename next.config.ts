import type { NextConfig } from "next";

const SECURITY_HEADERS = [
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
