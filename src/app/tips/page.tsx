import { api, HydrateClient } from "~/trpc/server";
import { TipsContent } from "./tips-content";

export default async function TipsPage() {
  // await하면 Next.js가 headers() 호출을 감지하여 자동으로 dynamic 페이지로 처리
  await api.tip.getAll
    .prefetchInfinite(
      { limit: 12, sortBy: "latest" },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        pages: 1,
      },
    )
    .catch(() => {});

  return (
    <HydrateClient>
      <TipsContent />
    </HydrateClient>
  );
}
