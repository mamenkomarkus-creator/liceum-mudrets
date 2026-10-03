import { CATEGORIES, ISSUES, LATEST_ISSUE, getArticlesByIssue } from "@/lib/data";
import { IssueExplorer } from "@/components/issue-explorer";
import { VoteWidget } from "@/components/vote-widget";
import { SubmitArticleCard } from "@/components/submit-article-card";
import { Reveal } from "@/components/reveal";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ issue?: string; category?: string }>;
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
