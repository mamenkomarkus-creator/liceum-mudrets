"use client";

import { MessageSquare } from "lucide-react";
import { useLocalJson } from "@/lib/local-store";
import type { StoredComment } from "./comments-section";

const NONE: StoredComment[] = [];

export function CommentCount({ articleId }: { articleId: number }) {
  const [comments] = useLocalJson<StoredComment[]>(`lm-comments-${articleId}`, NONE);
  return (
    <a
      href="#comments"
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-foreground/75 transition-colors duration-150 ease-out hover:bg-muted hover:text-primary"
    >
      <MessageSquare size={17} aria-hidden />
      <span>
        Коментарі <span className="tabular-nums">{comments.length}</span>
      </span>
    </a>
  );
}
