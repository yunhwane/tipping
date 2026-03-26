import { api, HydrateClient } from "~/trpc/server";
import { CategoryContent } from "./category-content";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  await Promise.all([
    api.category.getBySlug.prefetch({ slug }),
    api.tip.getAll.prefetchInfinite(
      { limit: 12, categorySlug: slug },
      { getNextPageParam: (lastPage) => lastPage.nextCursor, pages: 1 },
    ),
  ]).catch(() => {});

  return (
    <HydrateClient>
      <CategoryContent slug={slug} />
    </HydrateClient>
  );
}
