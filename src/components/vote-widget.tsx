"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CATEGORIES } from "@/lib/data";

const STORAGE_KEY = "lm-vote-choice";

export function VoteWidget() {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        queueMicrotask(() => {
          setSelected(saved);
          setSubmitted(true);
        });
      }
    } catch {
      // ignore unavailable storage (private mode, etc.)
    }
  }, []);

  function handleVote() {
    if (!selected) return;
    try {
      localStorage.setItem(STORAGE_KEY, selected);
    } catch {
      // ignore
    }
    setSubmitted(true);
    toast.success("Дякуємо за голос!", { description: `Ви обрали: ${selected}` });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-display text-xl font-bold text-foreground">Яка рубрика тобі цікавіша?</h3>
      <div className="mt-4 flex flex-col gap-2">
        {CATEGORIES.map((cat) => (
          <label
            key={cat}
            className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm cursor-pointer transition-colors duration-150 ease-out ${
              selected === cat ? "border-primary bg-primary/5" : "border-border hover:bg-muted"
            }`}
          >
            <input
              type="radio"
              name="vote"
              className="accent-[var(--primary)]"
              checked={selected === cat}
              onChange={() => setSelected(cat)}
            />
            <span className="text-foreground">{cat}</span>
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={handleVote}
        disabled={!selected}
        className="mt-5 w-full rounded-lg bg-primary text-primary-foreground font-semibold py-2.5 text-sm transition-all duration-150 ease-out active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
      >
        Голосувати
      </button>
      <AnimatePresence>
        {submitted && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="mt-3 text-xs text-muted-foreground overflow-hidden"
          >
            Ваш голос враховано локально в цьому браузері.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
