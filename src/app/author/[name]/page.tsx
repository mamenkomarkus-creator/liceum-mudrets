import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticlesByAuthor, getAuthors } from "@/lib/data";
import { ArticleCard } from "@/components/article-card";
import { AuthorAvatar } from "@/components/author-avatar";
import { BackButton } from "@/components/back-button";

function decodeName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function generateStaticParams() {
  return getAuthors().map((name) => ({ name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const name = decodeName((await params).name);
  return { title: name, description: `Матеріали автора ${name} у газеті «Ліцейський мудрець».` };
}

export default async function AuthorPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeName((await params).name);
  const items = getArticlesByAuthor(name);
  if (!items.length) notFound();

  const profile = items.find((a) => a.authorProfile)?.authorProfile;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 md:py-14">
      <BackButton label="Назад" />

      <header className="rule-masthead mt-6 flex flex-col items-center text-center">
        <AuthorAvatar name={name} photo={profile?.photo} position={profile?.photoPosition} size={96} />
        <h1 className="heading-underline heading-underline-center mt-4 pb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
          {name}
        </h1>
        {profile?.description ? (
          <p className="mx-auto -mt-1 mb-4 max-w-2xl text-muted-foreground">{profile.description}</p>
        ) : null}
      </header>

      <div className="mt-10 grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
