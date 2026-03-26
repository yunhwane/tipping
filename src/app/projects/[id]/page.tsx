import { api, HydrateClient } from "~/trpc/server";
import { ProjectDetailContent } from "./project-detail-content";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await api.project.getById.prefetch({ id }).catch(() => {});

  return (
    <HydrateClient>
      <ProjectDetailContent id={id} />
    </HydrateClient>
  );
}
