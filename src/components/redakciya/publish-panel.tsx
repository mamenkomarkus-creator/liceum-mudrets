"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteIssueAction, publishIssueAction } from "@/app/redakciya/actions";
import { PrimaryButton, SecondaryButton } from "./ui";

export function PublishPanel({
  issue,
  isChief,
  published,
  total,
  ready,
  checked,
}: {
  issue: number;
  isChief: boolean;
  published: boolean;
  total: number;
  ready: number;
  checked: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();
  const canPublish = total > 0 && ready === total;

  const publish = () => {
    const unchecked = total - checked;
    const question = [
      published ? `Оновити випуск №${issue} на сайті? Поточні статті випуску буде замінено.` : `Опублікувати випуск №${issue} на сайті?`,
      unchecked ? `Ще не позначено як «Перевірено»: ${unchecked} з ${total}.` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!confirm(question)) return;
    start(async () => {
      const result = await publishIssueAction(issue);
      if (result.ok) toast.success(result.message ?? "Опубліковано", { duration: 10_000 });
      else toast.error(result.error, { duration: 15_000 });
      router.refresh();
    });
  };

  return (
    <section className="mt-10 rounded-xl border border-border bg-white p-5 shadow-sm" aria-labelledby="publish-heading">
      <h2 id="publish-heading" className="font-display text-xl font-bold text-[#111]">
        {published ? "Оновити випуск на сайті" : "Публікація"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Статей: {total} · оброблено: {ready} · перевірено: {checked}.{" "}
        {!total ? "Додайте хоча б одну статтю." : ready < total ? "Обробіть усі статті, щоб опублікувати випуск." : "Усе готово до публікації."}
      </p>
      {isChief ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrimaryButton type="button" onClick={publish} pending={pending} disabled={!canPublish}>
            <Send size={15} aria-hidden />
            {pending ? "Публікуємо…" : published ? `Оновити випуск №${issue}` : `Опублікувати випуск №${issue}`}
          </PrimaryButton>
          <SecondaryButton
            type="button"
            pending={deleting}
            className="ml-auto text-red-700 hover:text-red-800"
            onClick={() => {
              if (!confirm(`Видалити випуск №${issue} з редакції разом з усіма завантаженими файлами? На сайті нічого не зміниться.`)) return;
              startDelete(async () => {
                const result = await deleteIssueAction(issue);
                if (result && !result.ok) toast.error(result.error);
              });
            }}
          >
            <Trash2 size={14} aria-hidden /> Видалити з редакції
          </SecondaryButton>
        </div>
      ) : (
        <p className="mt-3 text-sm">Опублікувати випуск може головний редактор.</p>
      )}
    </section>
  );
}
