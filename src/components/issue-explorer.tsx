"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { Article } from "@/lib/types";
import { issueTitle } from "@/lib/data";
import { ArticleCard } from "./article-card";
import { CategoryFilter } from "./category-filter";

export function IssueExplorer({
  articles,
  issue,
  categories,
  initialCategory,
}: {
  articles: Article[];
  issue: number;
  categories: string[];
  initialCategory: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState(initialCategory);

  const filtered = category === "Усі" ? articles : articles.filter((a) => a.category === category);

  function handleCategoryChange(next: string) {
    setCategory(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "Усі") params.delete("category");
    else params.set("category", next);
    const qs = params.toString();
    router.replace(qs ? `/?${qs}#read` : "/#read", { scroll: false });
  }

  return (
    <div>
      <header className="rule-masthead text-center">
        <h1 className="heading-underline heading-underline-center pb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
          {issueTitle(issue)}
        </h1>
      </header>

      <div className="mt-6">
        <CategoryFilter categories={["Усі", ...categories]} active={category} onChange={handleCategoryChange} />
      </div>

      <p className="sr-only" aria-live="polite">
        Показано матеріалів: {filtered.length}
      </p>

      <div className="mt-8 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            filtered.map((article, index) => (
              <motion.div
                key={article.id}
                layout
                className="h-full"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1], delay: index * 0.03 }}
              >
                <ArticleCard article={article} priority={index < 3} />
              </motion.div>
            ))
          ) : (
            <p className="col-span-full text-center py-12 text-muted-foreground">Немає статей у цій рубриці</p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
