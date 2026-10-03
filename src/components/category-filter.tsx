"use client";

import { motion } from "framer-motion";

export function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}) {
  return (
    <div role="group" aria-label="Фільтр за рубриками" className="flex flex-wrap justify-center gap-2">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(cat)}
            className={`relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-150 ease-out active:scale-95 md:text-sm ${
              isActive ? "text-primary-foreground" : "text-foreground/75 hover:text-foreground"
            }`}
          >
            {isActive ? (
              <motion.span
                layoutId="category-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              />
            ) : (
              <span className="absolute inset-0 rounded-full border border-border" aria-hidden />
            )}
            <span className="relative z-10">{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
