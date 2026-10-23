"use client";

import { usePathname } from "next/navigation";

/** The editorial panel (/redakciya) has its own header, so the public header, footer and cookie notice step aside. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/redakciya" || pathname.startsWith("/redakciya/")) return null;
  return <>{children}</>;
}
