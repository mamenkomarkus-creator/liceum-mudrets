import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { EDITORIAL_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Редакція",
  description: "Редакційна колегія газети «Ліцейський мудрець».",
};

const TEAM: { role: string; names: string[]; note?: string }[] = [
  { role: "Редактори", names: ["Марк Маменко", "Данило Школяр"] },
  { role: "Технічний директор", names: ["Марк Маменко"], note: "розробка й підтримка сайту" },
  { role: "Журналісти", names: ["за рубриками"] },
  { role: "Куратор проєкту", names: ["Ольга Терехова"], note: "керівниця гуртка «Основи журналістики»" },
];

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-transform duration-150 ease-out hover:-translate-x-0.5"
      >
        <ArrowLeft size={16} />
        Головна
      </Link>

      <h1 className="font-display mt-4 text-3xl md:text-4xl font-extrabold text-foreground heading-underline pb-3">
        Контакти / Редакція
      </h1>
      <p className="mt-4 text-muted-foreground">Редакційна колегія газети «Ліцейський мудрець»</p>

      <div className="mt-10">
        <h2 className="font-display text-xl font-bold text-foreground mb-5">Редакційна колегія</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TEAM.map((member) => (
            <div key={member.role} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{member.role}</p>
              {member.names.map((name) => (
                <p key={name} className="mt-1 font-display font-bold text-foreground">
                  {name}
                </p>
              ))}
              {member.note ? <p className="mt-1 text-sm text-muted-foreground">{member.note}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Контакти ліцею</h2>
        <ul className="space-y-3 text-foreground/85">
          <li className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <span>Білоцерківський академічний ліцей «Мала академія наук»: 09107, Київська обл., м. Біла Церква, вул. Павліченко, 30</span>
          </li>
          <li className="flex items-center gap-3">
            <Phone size={18} className="shrink-0 text-primary" aria-hidden />
            <a href="tel:+380456394131" className="hover:text-primary">(0456) 39-41-31</a>
          </li>
          <li className="flex items-center gap-3">
            <Mail size={18} className="shrink-0 text-primary" aria-hidden />
            <a href={`mailto:${EDITORIAL_EMAIL}`} className="hover:text-primary">{EDITORIAL_EMAIL}</a>
          </li>
        </ul>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-3">Стати автором</h2>
        <p className="text-muted-foreground leading-relaxed">
          Хочете долучитися до створення газети? Ми завжди раді новим авторам! Надсилайте свої статті, репортажі,
          вірші та есе електронною поштою.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Матеріали приймаються у форматах: TXT, DOC, DOCX. Фото — JPG, PNG (мінімум 1200px).
        </p>
      </div>
    </div>
  );
}
