"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ title }: { title: string }) {
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Посилання скопійовано");
    } catch {
      toast.error("Не вдалося скопіювати посилання");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground/75 transition-colors duration-150 ease-out hover:bg-muted hover:text-primary active:scale-95"
    >
      <Share2 size={17} aria-hidden />
      Поділитися
    </button>
  );
}
