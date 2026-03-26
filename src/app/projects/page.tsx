import { api, HydrateClient } from "~/trpc/server";
import { ProjectsContent } from "./projects-content";

export const revalidate = 60;

export default async function ProjectsPage() {
  // 서버에서 첫 페이지 prefetch → 클라이언트 useInfiniteQuery 캐시에 즉시 주입
  void api.project.getAll.prefetchInfinite(
    { limit: 12 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      pages: 1,
    },
  );

  return (
    <HydrateClient>
      <ProjectsContent />
    </HydrateClient>
  );
}
