"use client";

import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useLocalJson } from "@/lib/local-store";

const NONE: number[] = [];

export function BookmarkButton({ articleId }: { articleId: number }) {
  const [saved, setSaved] = useLocalJson<number[]>("lm-bookmarks", NONE);
  const active = saved.includes(articleId);

  function toggle() {
    setSaved(active ? saved.filter((id) => id !== articleId) : [...saved, articleId]);
    toast.success(active ? "Прибрано із закладок" : "Збережено в закладки цього браузера");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ease-out hover:bg-muted active:scale-95 ${
        active ? "text-primary" : "text-foreground/75 hover:text-primary"
      }`}
    >
      <Bookmark size={17} aria-hidden fill={active ? "currentColor" : "none"} />
      {active ? "У закладках" : "Зберегти"}
    </button>
  );
}
