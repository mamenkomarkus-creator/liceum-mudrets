"use client";

import { useState } from "react";
import { CalendarClock, MapPin } from "lucide-react";
import { DAYS, LESSONS, SCHOOLS, minutes, type Lesson, type School } from "@/data/man-schedule";

function LessonCard({ lesson, showSchool, showDay }: { lesson: Lesson; showSchool?: boolean; showDay?: boolean }) {
  const school = SCHOOLS[lesson.school];
  return (
    <li className="flex gap-3.5 rounded-xl border border-border bg-card p-4">
      <span
        className="flex h-fit shrink-0 items-center rounded-lg px-2.5 py-1.5 font-display text-lg font-bold tabular-nums text-white"
        style={{ background: school.color }}
      >
        {lesson.time.replace(".", ":").padStart(5, "0")}
      </span>
      <span className="min-w-0">
        {showDay ? (
          <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wide text-primary">{lesson.day}</span>
        ) : null}
        <span className="block break-words font-display text-[1.0625rem] font-bold leading-snug text-[#111]">
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-sm text-[#333]">{lesson.teacher}</span>
        <span className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-muted-foreground">
          <MapPin size={14} className="mt-px shrink-0" aria-hidden />
          {lesson.place}
        </span>
        {showSchool ? (
          <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: school.color }} aria-hidden />
            {school.name}
          </span>
        ) : null}
      </span>
    </li>
  );
}

/** Weekly timetable of the out-of-school unit, by day or by school. */
export function ScheduleBoard() {
  const [view, setView] = useState<"days" | "schools">("days");
  const byDay = DAYS.map((day) => ({
    day,
    items: LESSONS.filter((l) => l.day === day).sort((a, b) => minutes(a.time) - minutes(b.time)),
  })).filter((d) => d.items.length);
  const schools = Object.keys(SCHOOLS) as School[];

  const tab = (id: "days" | "schools", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === id}
      onClick={() => setView(id)}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-150 ${
        view === id ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-primary"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section id="man-schedule" aria-labelledby="man-schedule-title" className="scroll-mt-32">
      <div className="rounded-2xl border border-[#d8e2f7] bg-[#f6f8fd] p-5 sm:p-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <CalendarClock size={15} aria-hidden />
            Розклад навчальних занять
          </span>
          <h3 id="man-schedule-title" className="font-display text-2xl font-bold leading-tight text-[#111] sm:text-3xl">
            Коли й де вчитися в «Малій академії наук»
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Розклад позашкільного підрозділу з друкованої програми конференції. Заняття відбуваються у БАЛ «МАН»,
            якщо не вказано інше.
          </p>
          <div role="tablist" aria-label="Вигляд розкладу" className="mt-1 inline-flex rounded-full border border-border bg-card p-1">
            {tab("days", "За днями")}
            {tab("schools", "За школами")}
          </div>
        </div>

        {view === "days" ? (
          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-2">
            {byDay.map(({ day, items }) => (
              <section key={day} aria-label={day} className="flex flex-col gap-3">
                <h4 className="flex items-center justify-between border-b-2 border-primary pb-1.5 font-display text-lg font-bold text-[#111]">
                  {day}
                  <span className="text-xs font-semibold text-muted-foreground">{items.length}</span>
                </h4>
                <ul className="flex flex-col gap-3">
                  {items.map((l) => (
                    <LessonCard key={`${l.title}-${l.time}`} lesson={l} showSchool />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-2">
            {schools.map((id) => (
              <section key={id} aria-label={SCHOOLS[id].name} className="flex flex-col gap-3">
                <h4
                  className="flex items-center gap-2.5 border-b-2 pb-1.5 font-display text-lg font-bold text-[#111]"
                  style={{ borderColor: SCHOOLS[id].color }}
                >
                  <i className="inline-block h-3 w-3 rounded-full" style={{ background: SCHOOLS[id].color }} aria-hidden />
                  {SCHOOLS[id].name}
                </h4>
                <ul className="flex flex-col gap-3">
                  {LESSONS.filter((l) => l.school === id)
                    .sort((x, y) => DAYS.indexOf(x.day) - DAYS.indexOf(y.day) || minutes(x.time) - minutes(y.time))
                    .map((l) => (
                      <LessonCard key={`${l.title}-${l.day}`} lesson={l} showDay />
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
