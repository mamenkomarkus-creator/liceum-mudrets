import { requireEditorPage } from "@/lib/redakciya/auth";
import { nextIssueNumber } from "@/lib/redakciya/store";
import { NewIssueForm } from "@/components/redakciya/new-issue-form";

export const metadata = { title: "Новий випуск" };

const MONTHS = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

export default async function NewIssuePage() {
  await requireEditorPage();
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Kyiv" }));
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl font-bold text-[#111]">Новий випуск</h1>
      <p className="mt-1 text-sm text-muted-foreground">Після створення ви зможете додавати статті у випуск.</p>
      <NewIssueForm number={await nextIssueNumber()} dateLabel={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`} />
    </div>
  );
}
