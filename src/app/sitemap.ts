import type { MetadataRoute } from "next";
import { articles, authorHref, getAuthors, ISSUES } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/archive`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const issues: MetadataRoute.Sitemap = ISSUES.map((issue) => ({
    url: `${SITE_URL}/?issue=${issue.number}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const posts: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/article/${article.id}`,
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const authors: MetadataRoute.Sitemap = getAuthors().map((name) => ({
    url: `${SITE_URL}${authorHref(name)}`,
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  return [...pages, ...issues, ...posts, ...authors];
}
