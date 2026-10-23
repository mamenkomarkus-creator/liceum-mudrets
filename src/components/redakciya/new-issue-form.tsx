"use client";

import { useActionState } from "react";
import { createIssueAction } from "@/app/redakciya/actions";
import { Field, inputClass, PrimaryButton } from "./ui";

export function NewIssueForm({ number, dateLabel }: { number: number; dateLabel: string }) {
  const [error, action, pending] = useActionState(createIssueAction, null);
  return (
    <form action={action} className="mt-6 space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="grid grid-cols-[110px_1fr] gap-4">
        <Field label="Номер">
          <input name="number" type="number" min={1} defaultValue={number} required className={inputClass} />
        </Field>
        <Field label="Місяць" hint="Як на сайті: «Листопад 2026» або «Травень – Червень 2027»">
          <input name="dateLabel" defaultValue={dateLabel} required className={inputClass} />
        </Field>
      </div>
      <Field label="Короткий опис випуску (необов'язково)" hint="Показується у прев'ю посилання в соцмережах">
        <textarea name="tagline" rows={2} className={inputClass} />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <PrimaryButton type="submit" pending={pending}>
        Створити випуск
      </PrimaryButton>
    </form>
  );
}
