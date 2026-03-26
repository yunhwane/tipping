import { api, HydrateClient } from "~/trpc/server";
import { TagContent } from "./tag-content";

export default async function TagPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const tagName = decodeURIComponent(name);

  await api.tip.getAll
    .prefetchInfinite(
      { limit: 12, tagName },
      { getNextPageParam: (lastPage) => lastPage.nextCursor, pages: 1 },
    )
    .catch(() => {});

  return (
    <HydrateClient>
      <TagContent tagName={tagName} />
    </HydrateClient>
  );
}
