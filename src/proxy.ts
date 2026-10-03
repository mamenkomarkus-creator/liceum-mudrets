import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Malformed percent-encoding in a URL (e.g. /author/%E0%A4%A) would otherwise surface as a 500; answer 404 instead.
export function proxy(request: NextRequest) {
  try {
    decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return NextResponse.rewrite(new URL("/_not-found-bad-url", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/author/:path*", "/article/:path*"],
};
