import { api, HydrateClient } from "~/trpc/server";
import { ProjectsContent } from "./projects-content";

export default async function ProjectsPage() {
  await api.project.getAll
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
