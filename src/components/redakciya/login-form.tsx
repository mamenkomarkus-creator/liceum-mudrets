"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/redakciya/actions";
import { Field, inputClass, PrimaryButton } from "./ui";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-6 space-y-4 rounded-xl border border-border bg-white p-5 shadow-sm">
      <Field label="Логін">
        <input name="login" autoComplete="username" required autoFocus className={inputClass} />
      </Field>
      <Field label="Пароль">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <PrimaryButton type="submit" pending={pending} className="w-full">
        Увійти
      </PrimaryButton>
    </form>
  );
}
