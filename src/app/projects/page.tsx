"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { ProjectCard } from "~/components/project-card";
import { Button } from "~/components/ui/button";
import { buttonVariants } from "~/components/ui/button";

export default function ProjectsPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.project.getAll.useInfiniteQuery(
      { limit: 12 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const projects = data?.pages.flatMap((page) => page.items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">프로젝트 모음</h1>
        <Link href="/projects/new" className={buttonVariants()}>
          프로젝트 등록
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "로딩 중..." : "더 보기"}
          </Button>
        </div>
      )}

      {projects?.length === 0 && (
        <p className="text-center text-muted-foreground">
          아직 등록된 프로젝트가 없습니다.
        </p>
      )}
    </div>
  );
}
