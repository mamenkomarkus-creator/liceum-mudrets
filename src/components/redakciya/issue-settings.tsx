"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateIssueAction } from "@/app/redakciya/actions";
import { Field, inputClass, PrimaryButton, SecondaryButton } from "./ui";

export function IssueSettings({ number, dateLabel, tagline }: { number: number; dateLabel: string; tagline: string }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ dateLabel, tagline });
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 text-muted-foreground">
        <span>{dateLabel}</span>
        {tagline ? <span className="text-sm italic">{tagline}</span> : null}
        <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <Pencil size={12} aria-hidden /> змінити
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-3 max-w-xl space-y-3 rounded-xl border border-border bg-white p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const result = await updateIssueAction(number, values);
          if (result.ok) {
            toast.success("Збережено");
            setEditing(false);
          } else toast.error(result.error);
        });
      }}
    >
      <Field label="Місяць">
        <input value={values.dateLabel} onChange={(e) => setValues({ ...values, dateLabel: e.target.value })} className={inputClass} required />
      </Field>
      <Field label="Короткий опис випуску">
        <textarea value={values.tagline} onChange={(e) => setValues({ ...values, tagline: e.target.value })} rows={2} className={inputClass} />
      </Field>
      <div className="flex gap-2">
        <PrimaryButton type="submit" pending={pending}>
          Зберегти
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => setEditing(false)}>
          Скасувати
        </SecondaryButton>
      </div>
    </form>
  );
}
