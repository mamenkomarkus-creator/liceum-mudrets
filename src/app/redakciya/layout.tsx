import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { currentEditor } from "@/lib/redakciya/auth";
import { logoutAction } from "./actions";
import { AdminNav } from "@/components/redakciya/admin-nav";

export const metadata: Metadata = {
  title: { default: "Редакція", template: "%s — Редакція" },
  robots: { index: false, follow: false },
};

export default async function RedakciyaLayout({ children }: { children: React.ReactNode }) {
  const editor = await currentEditor();
  return (
    <div className="min-h-dvh bg-[#f7f5ef]">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/redakciya" className="flex items-baseline gap-2.5">
            <span className="font-display text-lg font-bold">Ліцейський мудрець</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-navy-foreground">Редакція</span>
          </Link>
          {editor ? <AdminNav /> : null}
          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 text-navy-foreground hover:text-white" target="_blank">
              Сайт <ExternalLink size={13} aria-hidden />
            </Link>
            {editor ? (
              <>
                <span className="hidden text-navy-foreground sm:inline">
                  {editor.name}
                  {editor.role === "chief" ? " · головний редактор" : ""}
                </span>
                <form action={logoutAction}>
                  <button type="submit" className="inline-flex items-center gap-1.5 text-navy-foreground hover:text-white">
                    <LogOut size={14} aria-hidden /> Вийти
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:py-10">{children}</div>
    </div>
  );
}
