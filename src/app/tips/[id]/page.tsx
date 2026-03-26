import { api, HydrateClient } from "~/trpc/server";
import { TipDetailContent } from "./tip-detail-content";

export default async function TipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await Promise.all([
    api.tip.getById.prefetch({ id }),
    api.like.getCount.prefetch({ tipId: id }),
    api.comment.getByTipId
      .prefetchInfinite(
        { tipId: id, limit: 20 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor, pages: 1 },
      ),
  ]).catch(() => {});

  return (
    <HydrateClient>
      <TipDetailContent id={id} />
    </HydrateClient>
  );
}
