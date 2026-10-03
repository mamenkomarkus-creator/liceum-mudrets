"use client";

import { useId, useState, type FormEvent } from "react";
import { CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { useLocalJson } from "@/lib/local-store";
import { initials } from "./author-avatar";

export interface StoredComment {
  id: string;
  name: string;
  text: string;
  at: number;
  parentId?: string;
}

const NONE: StoredComment[] = [];

function formatTime(at: number): string {
  return new Date(at).toLocaleString("uk-UA", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

function CommentForm({
  onSubmit,
  submitLabel,
  autoFocus = false,
  onCancel,
}: {
  onSubmit: (name: string, text: string) => void;
  submitLabel: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const uid = useId();
  const [name, setName] = useState("");
  const [text, setText] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(name.trim() || "Читач", text.trim());
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={`${uid}-name`} className="sr-only">
          Ім’я
        </label>
        <input
          id={`${uid}-name`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Ваше ім’я"
          autoComplete="nickname"
          className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:max-w-xs"
        />
      </div>
      <div>
        <label htmlFor={`${uid}-text`} className="sr-only">
          Коментар
        </label>
        <textarea
          id={`${uid}-text`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          rows={3}
          maxLength={2000}
          autoFocus={autoFocus}
          placeholder="Напишіть коментар…"
          className="w-full resize-y rounded-lg border border-border bg-card px-4 py-3 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all duration-150 ease-out hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Скасувати
          </button>
        ) : null}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  onReply,
  replying,
  children,
}: {
  comment: StoredComment;
  onReply?: () => void;
  replying?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3.5">
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8eefc] text-sm font-bold text-primary"
      >
        {initials(comment.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className="break-words font-semibold text-foreground">{comment.name}</span>
          <time dateTime={new Date(comment.at).toISOString()} className="text-xs text-muted-foreground">
            {formatTime(comment.at)}
          </time>
        </p>
        <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-[#222]">{comment.text}</p>
        {onReply ? (
          <button
            type="button"
            onClick={onReply}
            aria-expanded={replying}
            className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-75"
          >
            <CornerDownRight size={14} aria-hidden />
            Відповісти
          </button>
        ) : null}
        {children}
      </div>
    </li>
  );
}

export function CommentsSection({ articleId }: { articleId: number }) {
  const [comments, setComments] = useLocalJson<StoredComment[]>(`lm-comments-${articleId}`, NONE);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  function add(name: string, text: string, parentId?: string) {
    const next: StoredComment = { id: crypto.randomUUID(), name, text, at: Date.now(), parentId };
    setComments([...comments, next]);
    setReplyTo(null);
    toast.success("Коментар додано");
  }

  const roots = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-32">
      <h2 id="comments-title" className="font-display text-2xl font-bold text-[#111]">
        Коментарі <span className="text-muted-foreground tabular-nums">({comments.length})</span>
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Демонстраційна версія: коментарі зберігаються лише у вашому браузері й іншим читачам не видні.
      </p>

      <div className="mt-6">
        <CommentForm onSubmit={(name, text) => add(name, text)} submitLabel="Додати коментар" />
      </div>

      {roots.length ? (
        <ul className="mt-10 space-y-8">
          {roots.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={() => setReplyTo(replyTo === c.id ? null : c.id)} replying={replyTo === c.id}>
              {repliesOf(c.id).length ? (
                <ul className="mt-5 space-y-6 border-l-2 border-border pl-4">
                  {repliesOf(c.id).map((r) => (
                    <CommentItem key={r.id} comment={r} />
                  ))}
                </ul>
              ) : null}
              {replyTo === c.id ? (
                <div className="mt-4">
                  <CommentForm
                    autoFocus
                    submitLabel="Відповісти"
                    onSubmit={(name, text) => add(name, text, c.id)}
                    onCancel={() => setReplyTo(null)}
                  />
                </div>
              ) : null}
            </CommentItem>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-xl border border-dashed border-border px-5 py-8 text-center text-muted-foreground">
          Поки що коментарів немає — будьте першими.
        </p>
      )}
    </section>
  );
}
