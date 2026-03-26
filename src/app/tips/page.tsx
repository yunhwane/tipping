import { api, HydrateClient } from "~/trpc/server";
import { TipsContent } from "./tips-content";

export const revalidate = 60;

export default async function TipsPage() {
  // 서버에서 첫 페이지 prefetch → 클라이언트 useInfiniteQuery 캐시에 즉시 주입
  void api.tip.getAll.prefetchInfinite(
    { limit: 12, sortBy: "latest" },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      pages: 1,
    },
  );

  return (
    <HydrateClient>
      <TipsContent />
    </HydrateClient>
  );
}
