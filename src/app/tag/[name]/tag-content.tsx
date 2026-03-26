"use client";

import { api } from "~/trpc/react";
import { TipCard } from "~/components/tip-card";
import { Button } from "~/components/ui/button";

export function TagContent({ tagName }: { tagName: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.tip.getAll.useInfiniteQuery(
      { limit: 12, tagName },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const tips = data?.pages.flatMap((page) => page.items);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">#{tagName}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tips?.map((tip) => <TipCard key={tip.id} tip={tip} />)}
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

      {tips?.length === 0 && (
        <p className="text-center text-muted-foreground">
          이 태그로 작성된 팁이 없습니다.
        </p>
      )}
    </div>
  );
}
