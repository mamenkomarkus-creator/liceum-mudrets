"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import type { Quiz } from "@/lib/types";
import { renderInline } from "@/lib/inline";

function MultipleChoiceQuiz({ quiz }: { quiz: Quiz }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{quiz.title}</p>
      <p className="mt-2 font-medium text-foreground leading-relaxed">{renderInline(quiz.question, "q")}</p>
      <div className="mt-4 flex flex-col gap-2">
        {quiz.options.map((opt) => {
          const isSelected = selected === opt.label;
          const isCorrect = opt.label === quiz.correctLabel;
          const showState = selected !== null;
          return (
            <button
              key={opt.label}
              type="button"
              disabled={selected !== null}
              onClick={() => setSelected(opt.label)}
              className={`flex items-start gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors duration-150 ease-out ${
                showState && isCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : showState && isSelected && !isCorrect
                  ? "border-red-500 bg-red-500/10"
                  : "border-border hover:bg-muted"
              } ${selected === null ? "cursor-pointer" : "cursor-default"}`}
            >
              <span className="font-semibold text-foreground">{opt.label}.</span>
              <span className="text-foreground/90">{renderInline(opt.text, `o-${opt.label}`)}</span>
              {showState && isCorrect && <Check size={16} className="ml-auto mt-0.5 shrink-0 text-emerald-600" />}
              {showState && isSelected && !isCorrect && <X size={16} className="ml-auto mt-0.5 shrink-0 text-red-600" />}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {selected && quiz.explanation && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mt-4 overflow-hidden text-sm text-muted-foreground leading-relaxed border-t border-border pt-4"
          >
            {renderInline(quiz.explanation, "e")}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function MatchingQuiz({ quiz }: { quiz: Quiz }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{quiz.title}</p>
      <p className="mt-2 font-medium text-foreground leading-relaxed">{renderInline(quiz.question, "q")}</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {quiz.leftColumn?.map((item) => (
            <div key={item.label} className="rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-semibold">{item.label}.</span> {renderInline(item.text, `i-${item.label}`)}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {quiz.rightColumn?.map((item) => (
            <div key={item.label} className="rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-semibold">{item.label}.</span> {renderInline(item.text, `i-${item.label}`)}
            </div>
          ))}
        </div>
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-4 w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2 text-sm transition-all duration-150 ease-out active:scale-[0.98] hover:brightness-110"
        >
          Показати відповідь
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="mt-4 overflow-hidden border-t border-border pt-4"
        >
          <ul className="space-y-1.5 text-sm">
            {quiz.matchingPairs?.map((pair) => (
              <li key={pair.left} className="flex items-center gap-2">
                <span className="font-semibold text-primary">{pair.left}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-semibold text-primary">{pair.right}</span>
                <span className="text-muted-foreground">({renderInline(pair.rightText, `r-${pair.right}`)})</span>
              </li>
            ))}
          </ul>
          {quiz.explanation && <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{renderInline(quiz.explanation, "ex")}</p>}
        </motion.div>
      )}
    </div>
  );
}

export function QuizBlock({ quiz }: { quiz: Quiz }) {
  return quiz.type === "matching" ? <MatchingQuiz quiz={quiz} /> : <MultipleChoiceQuiz quiz={quiz} />;
}

export function QuizList({ quizzes }: { quizzes: Quiz[] }) {
  return (
    <div className="my-10">
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">Тестові завдання</h3>
      <div className="flex flex-col gap-4">
        {quizzes.map((quiz) => (
          <QuizBlock key={quiz.id} quiz={quiz} />
        ))}
      </div>
    </div>
  );
}
