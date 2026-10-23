"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, Plus } from "lucide-react";

const LINKS = [
  { href: "/redakciya", label: "Випуски", icon: Newspaper },
  { href: "/redakciya/novyi", label: "Новий випуск", icon: Plus },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Меню редакції" className="flex items-center gap-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/redakciya" ? pathname === href || pathname.startsWith("/redakciya/vypusk") : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
              active ? "bg-white/15 text-white" : "text-navy-foreground hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon size={15} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
