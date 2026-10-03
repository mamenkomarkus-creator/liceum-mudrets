"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { articles } from "@/lib/data";
import { useDialogFocus } from "@/lib/use-dialog-focus";

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocus(dialogRef, open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles
      .filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Пошук статей"
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-xl rounded-xl bg-card border border-border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={18} className="text-muted-foreground shrink-0" />
              <input
                type="search"
                aria-label="Пошуковий запит"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Пошук статей за назвою чи описом…"
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors duration-150"
                aria-label="Закрити пошук"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {query.trim() && results.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center text-muted-foreground">Нічого не знайдено</p>
              ) : (
                results.map((a) => (
                  <Link
                    key={a.id}
                    href={`/article/${a.id}`}
                    onClick={onClose}
                    className="block px-4 py-3 border-b border-border last:border-0 hover:bg-muted transition-colors duration-150"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{a.category}</p>
                    <p className="font-display font-semibold text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{a.description}</p>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
