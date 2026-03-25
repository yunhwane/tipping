"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "~/trpc/react";
import { TipCard } from "~/components/tip-card";
import { CategoryNav } from "~/components/category-nav";
import { Button } from "~/components/ui/button";
import { TrendingUp, Clock, Loader2, AlertCircle } from "lucide-react";
import { cn } from "~/lib/utils";

function TipsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? undefined;
  const sortParam = searchParams.get("sort");
  const [sortBy, setSortBy] = useState<"latest" | "popular">(
    sortParam === "popular" ? "popular" : "latest",
  );

  const { data: searchResults } = api.tip.search.useQuery(
    { query: q! },
    { enabled: !!q },
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.tip.getAll.useInfiniteQuery(
      { limit: 12, sortBy },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: !q,
      },
    );

  const tips = q
    ? searchResults
    : data?.pages.flatMap((page) => page.items);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {q ? `"${q}" 검색 결과` : "팁"}
          </h1>
          {!q && (
            <p className="mt-1 text-muted-foreground">
              개발자들이 공유하는 실무 팁을 둘러보세요
            </p>
          )}
        </div>
        {!q && (
          <div className="flex rounded-lg border bg-muted/30 p-1">
            <button
              onClick={() => setSortBy("latest")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                sortBy === "latest"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              최신순
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                sortBy === "popular"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              인기순
            </button>
          </div>
        )}
      </div>

      {/* 카테고리 */}
      <CategoryNav />

      {/* 팁 그리드 */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tips?.map((tip) => <TipCard key={tip.id} tip={tip} />)}
      </div>

      {/* 더보기 */}
      {!q && hasNextPage && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="gap-2"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                로딩 중...
              </>
            ) : (
              "더 보기"
            )}
          </Button>
        </div>
      )}

      {/* 빈 상태 */}
      {tips?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">
            {q ? "검색 결과가 없습니다" : "아직 팁이 없습니다"}
          </p>
          {q && (
            <p className="text-sm text-muted-foreground">
              다른 키워드로 검색해보세요
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TipsPage() {
  return (
    <Suspense>
      <TipsContent />
    </Suspense>
  );
}
