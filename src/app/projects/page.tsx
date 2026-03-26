import { api, HydrateClient } from "~/trpc/server";
import { ProjectsContent } from "./projects-content";

export const revalidate = 60;

export default async function ProjectsPage() {
  // 서버에서 첫 페이지 prefetch → 클라이언트 useInfiniteQuery 캐시에 즉시 주입
  // .catch: 빌드 시 DB 미접속 환경에서 prerender 실패 방지 (클라이언트에서 재요청)
  void api.project.getAll
    .prefetchInfinite(
      { limit: 12 },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        pages: 1,
      },
    )
    .catch(() => {});

  return (
    <HydrateClient>
      <ProjectsContent />
    </HydrateClient>
  );
}
