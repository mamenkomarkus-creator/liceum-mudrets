import { redirect } from "next/navigation";
import { currentEditor, isConfigured } from "@/lib/redakciya/auth";
import { LoginForm } from "@/components/redakciya/login-form";

export const metadata = { title: "Вхід" };

export default async function LoginPage() {
  if (await currentEditor()) redirect("/redakciya");

  return (
    <div className="mx-auto max-w-sm pt-6 md:pt-12">
      <h1 className="font-display text-3xl font-bold text-[#111]">Вхід до редакції</h1>
      <p className="mt-2 text-sm text-muted-foreground">Тут редакція збирає статті для нового випуску газети.</p>
      {isConfigured() ? (
        <LoginForm />
      ) : (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          Вхід ще не налаштовано. Додайте змінні <code>REDAKCIYA_USERS</code> і <code>REDAKCIYA_SECRET</code> (див. README,
          розділ «Редакційна панель»).
        </div>
      )}
    </div>
  );
}
