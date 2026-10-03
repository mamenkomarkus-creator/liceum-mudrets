import { Mail } from "lucide-react";
import { EDITORIAL_EMAIL } from "@/lib/site";

const SUBJECT = "Стаття до газети «Ліцейський мудрець»";
const BODY = [
  "Ім'я / ПІБ:",
  "Клас:",
  "Рубрика:",
  "Заголовок:",
  "",
  "Текст статті — у вкладенні (TXT, DOC, DOCX). Фото — окремими файлами (JPG, PNG).",
].join("\n");

export function SubmitArticleCard() {
  const href = `mailto:${EDITORIAL_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(BODY)}`;
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-6">
      <h3 className="font-display text-xl font-bold text-foreground">Надіслати статтю</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Хочете, щоб ваш матеріал з’явився в газеті? Надішліть статтю, репортаж, вірш чи есе редакції електронною
        поштою.
      </p>
      <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
        <li>• у листі вкажіть ім’я, клас, рубрику й заголовок;</li>
        <li>• текст — у вкладенні (TXT, DOC, DOCX);</li>
        <li>• фото — JPG або PNG, бажано від 1200 пікселів.</li>
      </ul>
      <a
        href={href}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 pt-2.5 text-sm font-semibold text-primary-foreground transition-all duration-150 ease-out hover:brightness-110 active:scale-[0.98]"
      >
        <Mail size={16} aria-hidden />
        Написати до редакції
      </a>
      <p className="mt-3 text-center text-xs text-muted-foreground">{EDITORIAL_EMAIL}</p>
    </div>
  );
}
