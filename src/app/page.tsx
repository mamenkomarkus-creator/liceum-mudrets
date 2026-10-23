import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { CATEGORIES, ISSUES, LATEST_ISSUE, getArticlesByIssue, getIssueMeta } from "@/lib/data";
import { IssueExplorer } from "@/components/issue-explorer";
import { VoteWidget } from "@/components/vote-widget";
import { SubmitArticleCard } from "@/components/submit-article-card";
import { Reveal } from "@/components/reveal";

type HomeSearchParams = Promise<{ issue?: string; category?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: HomeSearchParams }): Promise<Metadata> {
  const { issue } = await searchParams;
  const number = Number(issue);
  if (!ISSUES.some((i) => i.number === number)) return {};
  const meta = getIssueMeta(number);
  // The root layout's title template does not apply to the page of the same segment, so spell it out.
  const title = `Випуск №${number} (${meta.dateLabel}) — Ліцейський мудрець`;
  const description =
    meta.tagline ?? `Читайте випуск №${number} електронної газети «Ліцейський мудрець» Білоцерківського академічного ліцею «МАН».`;
  const cover = `/og/issue-${number}.jpg`;
  const images = fs.existsSync(path.join(process.cwd(), "public", cover)) ? [{ url: cover, width: 1200, height: 630, alt: title }] : undefined;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/?issue=${number}` },
    openGraph: { title, description, url: `/?issue=${number}`, images },
    twitter: { card: "summary_large_image", title, description, images: images?.map((i) => i.url) },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: HomeSearchParams;
}) {
  const { issue, category } = await searchParams;
  const requestedIssue = Number(issue);
  const activeIssue = ISSUES.some((i) => i.number === requestedIssue) ? requestedIssue : LATEST_ISSUE;
  const initialCategory = category && CATEGORIES.includes(category as (typeof CATEGORIES)[number]) ? category : "Усі";
  const issueArticles = getArticlesByIssue(activeIssue);

  return (
    <div>
      <section id="read" className="mx-auto max-w-[1400px] px-4 py-8 md:py-10 scroll-mt-40">
        <IssueExplorer
          articles={issueArticles}
          issue={activeIssue}
          categories={CATEGORIES}
          initialCategory={initialCategory}
        />
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-16">
        <Reveal>
          <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-6">
            Яка рубрика тобі цікавіша?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <VoteWidget />
            <SubmitArticleCard />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
