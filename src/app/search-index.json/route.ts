import { articles } from "@/lib/data";
import type { SearchEntry } from "@/lib/issues";

// Built once at deploy time; the search box downloads it only when it is opened.
export const dynamic = "force-static";

export function GET() {
  const index: SearchEntry[] = articles.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    category: a.category,
    ...(a.author ? { author: a.author } : {}),
  }));
  return Response.json(index);
}
